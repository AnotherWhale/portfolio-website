import MapIcon from "./MapIcon";
import { nodeName, run, vehicles } from "./replay";
import type { Leg } from "./replay";

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

export default function RouteMap({ minute, selectedNode, onSelect }: {
  minute: number;
  selectedNode: number;
  onSelect: (node: number) => void;
}) {
  return (
    <>
      <svg className="routing-map" viewBox="0 0 580 334" aria-label="Schematic route map. Select a stop to see its shipments.">
        <g aria-hidden="true" className="routing-map-regions">
          <text x="118" y="34">Suppliers</text>
          <text x="280" y="34">Cross-dock</text>
          <text x="467" y="34">Customers</text>
        </g>
        <g aria-hidden="true" fill="none">
          {tracks.map((track) => {
            const { vehicle, from, to, control, path, start, end } = track;
            const progress = Math.max(0, Math.min(1, (minute - start) / (end - start)));
            const remaining = 1 - progress;
            const position = (axis: 0 | 1) => remaining ** 2 * from[axis] + 2 * remaining * progress * control[axis] + progress ** 2 * to[axis];
            return (
              <g key={`${vehicle}-${start}`} stroke={colors[vehicle]}>
                <path d={path} className="routing-track" />
                {progress > 0 && <path d={path} pathLength={1} strokeDasharray={`${progress} 1`} className={progress === 1 ? "routing-trail" : "routing-active-leg"} />}
                {minute >= start && minute < end && (
                  <MapIcon kind="truck" x={position(0)} y={position(1)} size={23} color={colors[vehicle]} />
                )}
              </g>
            );
          })}
        </g>
        {nodes.map((node) => {
          const [x, y] = layout[node];
          return (
            <g
              key={node}
              role="button"
              tabIndex={0}
              aria-label={nodeName(node)}
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
              <circle r="23" fill="transparent" stroke="none" />
              <MapIcon kind={node === 0 ? "depot" : run.suppliers.includes(node) ? "supplier" : "customer"}
                size={32} color="currentColor" />
              {node !== 0 && <text y="27" aria-hidden="true">{node}</text>}
            </g>
          );
        })}
      </svg>
      <label className="routing-stop-picker">
        Inspect a stop
        <select value={selectedNode} onChange={(event) => onSelect(Number(event.currentTarget.value))}>
          {nodes.map((node) => <option key={node} value={node}>{nodeName(node)}</option>)}
        </select>
      </label>
      <ul className="routing-legend" aria-label="Vehicle colors">
        {vehicles.map((vehicle) => (
          <li key={vehicle}>
            <svg className="routing-truck-key" viewBox="0 0 24 24" aria-hidden="true">
              <MapIcon kind="truck" x={12} y={12} size={21} color={colors[vehicle]} />
            </svg>
            Truck V{vehicle}
          </li>
        ))}
      </ul>
    </>
  );
}
