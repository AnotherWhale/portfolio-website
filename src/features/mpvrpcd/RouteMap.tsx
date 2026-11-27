import MapIcon from "./MapIcon";
import { cargoDetails, nodeName, products, run, vehicles, type Leg, type ReplaySnapshot } from "./replay";

type Point = readonly [number, number];
const layout: Record<number, Point> = {
  0: [280, 172],
  1: [74, 100],
  2: [171, 111],
  3: [112, 194],
  4: [66, 270],
  5: [515, 270],
  6: [419, 243],
  7: [511, 109],
  8: [394, 82],
  9: [420, 167],
  10: [515, 186],
};
const nodes = [0, ...run.suppliers, ...run.customers];
const colors = ["var(--portfolio-highlight)", "var(--portfolio-gold)", "#bdacf6", "#87b4f4", "#e99eb3"];
const mapWidth = 580;
const mapHeight = 342;
function cargoLevels(cargo: readonly number[], scale: readonly number[]) {
  return cargo.map((units, product) => scale[product] ? Math.min(1, units / scale[product]) : 0);
}

function stopCargo(snapshot: ReplaySnapshot, node: number) {
  const demand = snapshot.demand[node];
  const cargo = node === 0 ? snapshot.dock : demand ? snapshot.delivered[node] : snapshot.suppliers[node];
  return { demand, cargo };
}

function truckPosition(track: typeof tracks[number], minute: number) {
  const { from, to, control, start, end } = track;
  const progress = (minute - start) / (end - start);
  const remaining = 1 - progress;
  const point = (axis: 0 | 1) => remaining ** 2 * from[axis] + 2 * remaining * progress * control[axis] + progress ** 2 * to[axis];
  const tangent = (axis: 0 | 1) => remaining * (control[axis] - from[axis]) + progress * (to[axis] - control[axis]);
  return { x: point(0), y: point(1), heading: Math.atan2(tangent(1), tangent(0)) * 180 / Math.PI };
}

function routeGeometry(leg: Leg) {
  const from = layout[leg.from];
  const to = layout[leg.to];
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const distance = Math.hypot(dx, dy);
  const offset = 10 + leg.vehicle * 4;
  const control = [(from[0] + to[0]) / 2 - dy * offset / distance, (from[1] + to[1]) / 2 + dx * offset / distance] as const;
  return { from, to, control, path: `M${from.join(" ")} Q${control.join(" ")} ${to.join(" ")}` };
}

const tracks = run.legs.map((leg) => ({ ...leg, ...routeGeometry(leg) }));

export default function RouteMap({ minute, snapshot, selectedNode, onSelect }: {
  minute: number;
  snapshot: ReplaySnapshot;
  selectedNode: number;
  onSelect: (node: number) => void;
}) {
  const activeTrucks = tracks.filter(({ start, end }) => minute >= start && minute < end).map((track) => ({
    vehicle: track.vehicle,
    ...truckPosition(track, minute),
  }));
  const selected = stopCargo(snapshot, selectedNode);
  const selectedProducts = products.filter((product) => selected.demand
    ? selected.demand[product] > 0 : selected.cargo[product] > 0);
  return (
    <>
      <svg className="routing-map" viewBox={`0 0 ${mapWidth} ${mapHeight}`} aria-label="Route map. Product levels fill the suppliers, cross-dock, trucks, and customer icons.">
        <g aria-hidden="true" className="routing-map-regions">
          <text x="118" y="34">Suppliers</text>
          <text x="280" y="34">Cross-dock</text>
          <text x="467" y="34">Customers</text>
        </g>
        <g aria-hidden="true" fill="none">
          {tracks.map((track) => {
            const { vehicle, path, start, end } = track;
            const progress = Math.max(0, Math.min(1, (minute - start) / (end - start)));
            return (
              <g key={`${vehicle}-${start}`} stroke={colors[vehicle]}>
                <path d={path} className="routing-track" />
                {progress > 0 && <path d={path} pathLength={1} strokeDasharray={`${progress} 1`} className={progress === 1 ? "routing-trail" : "routing-active-leg"} />}
              </g>
            );
          })}
        </g>
        {nodes.map((node) => {
          const [x, y] = layout[node];
          const { demand, cargo } = stopCargo(snapshot, node);
          const label = demand
            ? products.filter((product) => demand[product]).map((product) =>
              `Product ${product}: ${cargo[product]} of ${demand[product]} delivered`).join(", ")
            : cargoDetails(cargo) || "0 units";
          return (
            <g
              key={node}
              role="button"
              tabIndex={0}
              aria-label={`${nodeName(node)}, ${label}`}
              aria-pressed={selectedNode === node}
              className="routing-node"
              transform={`translate(${x} ${y})`}
              onClick={() => onSelect(node)}
              onKeyDown={(event) => {
                if (event.key !== "Enter" && event.key !== " ") return;
                event.preventDefault();
                onSelect(node);
              }}
            >
              <rect className="routing-node-hit" x="-28" y="-24" width="56" height="57" rx="6" />
              <MapIcon kind={node === 0 ? "depot" : run.suppliers.includes(node) ? "supplier" : "customer"}
                size={node === 0 ? 50 : 44} color="currentColor" cargoLevels={cargoLevels(cargo, demand ?? snapshot.totalDemand)} />
              {node !== 0 && <text className="routing-node-number" y="29" aria-hidden="true">{node}</text>}
            </g>
          );
        })}
        <g aria-hidden="true" className="routing-moving-trucks">
          {activeTrucks.map(({ vehicle, ...position }) => (
            <MapIcon key={vehicle} kind="truck" {...position} size={39} color={colors[vehicle]}
              cargoLevels={cargoLevels(snapshot.trucks[vehicle], snapshot.totalDemand)} />
          ))}
        </g>
      </svg>
      <ul className="routing-cargo-key" aria-label="Product colors and fill order">
        {products.map((product) => <li key={product}><span data-product={product} aria-hidden="true" />P{product}</li>)}
      </ul>
      <p className="routing-map-caption">Each slot fills from the bottom. For customers, a full slot means that product’s demand is met.</p>
      <label className="routing-stop-picker">
        Inspect a stop
        <select value={selectedNode} onChange={(event) => onSelect(Number(event.currentTarget.value))}>
          {nodes.map((node) => <option key={node} value={node}>{nodeName(node)}</option>)}
        </select>
      </label>
      <div className="routing-map-selection">
        <div>
          <strong>{nodeName(selectedNode)}</strong>
          <span>{selected.demand ? "Delivered / ordered" : selectedNode === 0 ? "Units in stock" : "Units awaiting pickup"}</span>
        </div>
        {selectedProducts.length ? <dl>
          {selectedProducts.map((product) => (
            <div key={product}>
              <dt>P{product}</dt>
              <dd>{selected.cargo[product]}{selected.demand && `/${selected.demand[product]}`}</dd>
            </div>
          ))}
        </dl> : <span>0 units</span>}
      </div>
      <ul className="routing-legend routing-truck-cargo" aria-label="All truck loads">
        {vehicles.map((vehicle) => (
          <li key={vehicle}>
            <svg className="routing-truck-key" viewBox="0 0 24 24" role="img"
              aria-label={`Truck V${vehicle} onboard: ${cargoDetails(snapshot.trucks[vehicle]) || "0 units"}`}>
              <MapIcon kind="truck" x={12} y={12} size={23} color={colors[vehicle]}
                cargoLevels={cargoLevels(snapshot.trucks[vehicle], snapshot.totalDemand)} />
            </svg>
            <span>V{vehicle}</span>
          </li>
        ))}
      </ul>
    </>
  );
}
