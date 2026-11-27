import archivedRun from "./archivedRun.json";

export const run = archivedRun;
export const vehicles = [...new Set(run.legs.map((leg) => leg.vehicle))];
export type Leg = typeof run.legs[number];
export type ReplaySnapshot = ReturnType<typeof replaySnapshot>;
export const products = run.legs[0].cargo.map((_, index) => index);

const emptyCargo = () => products.map(() => 0);
const cargoAt = (ids: readonly number[]) => Object.fromEntries(ids.map((id) => [id, emptyCargo()]));

function addCargo(stock: number[], cargo: readonly number[], direction = 1) {
  cargo.forEach((amount, product) => { stock[product] += amount * direction; });
}

const demand = cargoAt(run.customers);
const scheduledSupply = cargoAt(run.suppliers);
const totalDemand = emptyCargo();
for (const visit of run.visits) {
  if (visit.phase === "pickup") {
    addCargo(scheduledSupply[visit.node], visit.cargo);
  } else {
    // The exporter validates each customer's archived deliveries against the instance demand.
    addCargo(demand[visit.node], visit.cargo, -1);
    addCargo(totalDemand, visit.cargo, -1);
  }
}

export function replaySnapshot(minute: number) {
  const delivered = cargoAt(run.customers);
  const suppliers = Object.fromEntries(run.suppliers.map((node) => [node, [...scheduledSupply[node]]]));
  const dock = emptyCargo();
  const trucks = cargoAt(vehicles);
  const totalDelivered = emptyCargo();

  for (const visit of run.visits) {
    if (visit.minute > minute) continue;
    addCargo(trucks[visit.vehicle], visit.cargo);
    if (visit.phase === "pickup") {
      addCargo(suppliers[visit.node], visit.cargo, -1);
    } else {
      addCargo(delivered[visit.node], visit.cargo, -1);
      addCargo(totalDelivered, visit.cargo, -1);
    }
  }

  for (const transfer of run.transfers) {
    if (transfer.minute > minute) continue;
    const direction = transfer.action === "unload" ? 1 : -1;
    addCargo(dock, transfer.cargo, direction);
    addCargo(trucks[transfer.vehicle], transfer.cargo, -direction);
  }

  return { demand, delivered, suppliers, dock, trucks, totalDemand, totalDelivered };
}

export function cargoTotal(cargo: readonly number[]) {
  return cargo.reduce((total, amount) => total + Math.abs(amount), 0);
}

export function nodeName(node: number) {
  if (node === 0) return "Cross-dock";
  return run.suppliers.includes(node) ? `Supplier ${node}` : `Customer ${node}`;
}

export function cargoDetails(cargo: readonly number[]) {
  return cargo.flatMap((amount, product) => amount ? [`Product ${product}: ${Math.abs(amount)}`] : []).join(" · ");
}
