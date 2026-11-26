import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const [checkout] = process.argv.slice(2);
assert(checkout, "Usage: node scripts/export-mpvrpcd-replay.mjs <VRPCD checkout>");

const raw = readFileSync(join(checkout, "VRPCD.ipynb"));
const notebook = JSON.parse(raw);
const source = (cell) => cell.source.join("");
const output = (cell) => cell.outputs.flatMap((item) => item.text ?? item.data?.["text/plain"] ?? []).join("");
const configuration = source(notebook.cells.find((cell) => source(cell).includes("# Instance number")));
assert.match(configuration, /^heteroVeh = False$/m);
assert.match(configuration, /^etMult = 0$/m);
const instance = Number(configuration.match(/^instance = (\d+)$/m)[1]);
const dataset = join(checkout, "Data", "10", String(instance));
const matrix = (file) => readFileSync(file, "utf8").trim().split(/\r?\n/).map((row) => row.split(",").map(Number));
const time = matrix(join(dataset, `10_${instance}_travelTime`));
const supply = matrix(join(dataset, `10_${instance}_supply`));
const demand = matrix(join(dataset, `10_${instance}_demand`));
const capacity = matrix(join(checkout, "Data", "homoVehicles"));
const suppliers = supply.flatMap((row, index) => row.some(Boolean) ? [index] : []);
const customers = demand.flatMap((row, index) => row.some(Boolean) ? [index] : []);
const products = demand[0].length;

const variables = output(notebook.cells.find((cell) => source(cell).includes('model.printAttr("x")')));
const log = output(notebook.cells.find((cell) => source(cell).trim() === "model.optimize()"));
const result = log.match(/Best objective ([\de+.-]+), best bound ([\de+.-]+), gap ([\d.]+)%/i);
assert(result && log.includes("Time limit reached"), "Expected the archived time-limited solve");

const values = new Map();
for (const [, name, key, value] of variables.matchAll(/^\s*(\w+)\[([\d,]+)\]\s+([\de+.-]+)\s*$/gim)) {
  values.set(`${name}:${key}`, Number(value));
}
const value = (name, ...indices) => values.get(`${name}:${indices.join(",")}`) ?? 0;
const periods = [...values].flatMap(([key, start]) => {
  if (!key.startsWith("AAT:")) return [];
  return [{ id: Number(key.split(":")[1]) + 1, start }];
});
const legs = [...values].flatMap(([key, active]) => {
  if (!key.startsWith("x:") || active < 0.5) return [];
  const [vehicle, from, to] = key.split(":")[1].split(",").map(Number);
  const start = Math.round(value("DT", vehicle, from, to));
  const period = periods.find(({ id }) => value("CD", vehicle, id - 1) > 0.5)?.id;
  assert(period, `Missing delivery period for vehicle ${vehicle}`);
  const cargo = Array.from({ length: products }, (_, product) => Math.round(value("y", vehicle, from, to, product)));
  assert(cargo.every((amount) => amount >= 0));
  assert(cargo.reduce((load, amount) => load + amount, 0) <= capacity[vehicle][0]);
  return [{
    vehicle, from, to, start, end: start + time[from][to], period,
    phase: suppliers.includes(from) || suppliers.includes(to) ? "pickup" : "delivery",
    capacity: capacity[vehicle][0], cargo,
  }];
}).sort((a, b) => a.vehicle - b.vehicle || a.start - b.start);

// The notebook's timeline omits two selected arcs with values just under one.
const publishedTimeline = output(notebook.cells.find((cell) => source(cell).includes("print(solution)")));
const publishedLegs = [...publishedTimeline.matchAll(/\[([\d]+),([\d]+)\]\(V(\d+)\)\s+(\d+)\s+(\d+)/g)];
assert.equal(publishedLegs.length, 26);
assert.equal(legs.length, 28);
for (const [, from, to, vehicle, start, end] of publishedLegs) {
  assert(legs.some((leg) => leg.vehicle === +vehicle && leg.from === +from && leg.to === +to &&
    leg.start === +start && leg.end === +end), `Timeline mismatch on V${vehicle} ${from} → ${to}`);
}

const fleet = [...new Set(legs.map(({ vehicle }) => vehicle))];
for (const vehicle of fleet) {
  const route = legs.filter((leg) => leg.vehicle === vehicle);
  assert.equal(route[0].from, 0);
  assert.equal(route.at(-1).to, 0);
  for (let index = 1; index < route.length; index++) {
    assert.equal(route[index - 1].to, route[index].from);
    assert(route[index - 1].end <= route[index].start);
  }
}

const visits = legs.flatMap((leg) => {
  if (leg.to === 0) return [];
  const next = legs.find((candidate) => candidate.vehicle === leg.vehicle && candidate.from === leg.to);
  assert(next, `Missing departure from node ${leg.to}`);
  const cargo = leg.cargo.map((arrival, product) => next.cargo[product] - arrival);
  return [{ node: leg.to, vehicle: leg.vehicle, minute: leg.end, phase: leg.phase, cargo }];
});
for (const node of [...suppliers, ...customers]) {
  for (let product = 0; product < products; product++) {
    const changes = visits.filter((visit) => visit.node === node).map((visit) => visit.cargo[product]);
    const change = changes.reduce((total, amount) => total + amount, 0);
    if (customers.includes(node)) {
      assert(changes.every((amount) => amount <= 0));
      assert.equal(Math.abs(change), demand[node][product], `Demand at node ${node}, product ${product}`);
    } else {
      assert(changes.every((amount) => amount >= 0));
      assert(change <= supply[node][product], `Supply at node ${node}, product ${product}`);
    }
  }
}

const transfers = fleet.flatMap((vehicle) => {
  const inbound = legs.find((leg) => leg.vehicle === vehicle && leg.to === 0 && leg.phase === "pickup");
  const outbound = legs.find((leg) => leg.vehicle === vehicle && leg.from === 0 && leg.phase === "delivery");
  const amounts = (name, product) => periods.reduce((sum, { id }) => sum + value(name, vehicle, product, id - 1), 0);
  assert(inbound && outbound);
  const unload = Array.from({ length: products }, (_, product) => Math.round(amounts("IA", product)));
  const load = Array.from({ length: products }, (_, product) => Math.round(amounts("ID", product)));
  for (let product = 0; product < products; product++) {
    assert.equal(inbound.cargo[product] - unload[product] + load[product], outbound.cargo[product]);
  }
  return [
    { action: "unload", minute: inbound.end, vehicle, cargo: unload },
    { action: "load", minute: outbound.start, vehicle, cargo: load },
  ].filter((event) => event.cargo.some(Boolean));
}).sort((a, b) => a.minute - b.minute || Number(a.action === "load") - Number(b.action === "load"));

const dockInventory = Array(products).fill(0);
for (const event of transfers) {
  for (let product = 0; product < products; product++) {
    dockInventory[product] += event.cargo[product] * (event.action === "unload" ? 1 : -1);
    assert(dockInventory[product] >= 0, `Inventory at minute ${event.minute}, product ${product}`);
  }
}
assert(dockInventory.every((amount) => amount === 0));

const duration = Math.max(...legs.map((leg) => leg.end));
assert.equal(duration, Math.round(Number(result[1])));
assert.deepEqual(visits.filter(({ node }) => node === 9).map(({ vehicle, minute }) => [vehicle, minute]), [[1, 304], [2, 443]]);

const payload = {
  notebookBlob: createHash("sha1").update(`blob ${raw.length}\0`).update(raw).digest("hex"),
  instance, duration, objective: Number(result[1]), bound: Number(result[2]), gap: Number(result[3]),
  status: "time_limit",
  suppliers, customers, periods, legs, visits, transfers,
};
const json = JSON.stringify(payload, null, 2)
  .replace(/\[\n\s+([\d\s,\n-]+)\n\s+\]/g, (_match, contents) => `[${contents.split(",").map((part) => part.trim()).join(", ")}]`);
writeFileSync(new URL("../src/features/mpvrpcd/archivedRun.json", import.meta.url), `${json}\n`);
console.log(`Validated ${legs.length} route legs, ${visits.length} visits and ${transfers.length} dock events for benchmark 10-${instance}.`);
