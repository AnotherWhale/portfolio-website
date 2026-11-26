import archivedRun from "./archivedRun.json";

export const run = archivedRun;
export const vehicles = [...new Set(run.legs.map((leg) => leg.vehicle))];
export type Leg = typeof run.legs[number];

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
