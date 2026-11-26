import MapIcon from "./MapIcon";
import { lessonColors, lessonStops, lessonTravelMinutes } from "./lessonScenario";
import type { LessonPlan, LessonStop } from "./lessonScenario";

const stopIds = Object.keys(lessonStops) as LessonStop[];
const isSupplier = (stop: LessonStop) => stop === "supplier1" || stop === "supplier2";

const labelPlacement: Record<LessonStop, { dx: number; dy: number; anchor: "start" | "middle" | "end" }> = {
  hub: { dx: 0, dy: 29, anchor: "middle" },
  supplier1: { dx: -16, dy: -22, anchor: "end" },
  supplier2: { dx: 0, dy: 29, anchor: "middle" },
  customerA: { dx: 0, dy: -22, anchor: "middle" },
  customerB: { dx: -8, dy: 29, anchor: "middle" },
  customer9: { dx: 0, dy: -19, anchor: "middle" },
};

function controlPoint(from: LessonStop, to: LessonStop, offset: number) {
  const [fromX, fromY] = lessonStops[from].position;
  const [x, y] = lessonStops[to].position;
  const dx = x - fromX;
  const dy = y - fromY;
  const length = Math.hypot(dx, dy);
  return [(x + fromX) / 2 - dy * offset / length, (y + fromY) / 2 + dx * offset / length];
}

function drawRoute(stops: readonly LessonStop[], offset: number) {
  return stops.map((stop, index) => {
    const [x, y] = lessonStops[stop].position;
    if (index === 0) return `M${x} ${y}`;
    return `Q${controlPoint(stops[index - 1], stop, offset).join(" ")} ${x} ${y}`;
  }).join(" ");
}

function truckPosition(stops: readonly LessonStop[], depart: number, minute: number, offset: number) {
  let elapsed = minute - depart;
  if (elapsed < 0) return;
  for (let i = 1; i < stops.length; i++) {
    const from = stops[i - 1];
    const to = stops[i];
    const duration = lessonTravelMinutes(from, to);
    if (elapsed < duration) {
      const progress = elapsed / duration;
      const remaining = 1 - progress;
      const control = controlPoint(from, to, offset);
      const coordinate = (axis: 0 | 1) => remaining ** 2 * lessonStops[from].position[axis]
        + 2 * remaining * progress * control[axis] + progress ** 2 * lessonStops[to].position[axis];
      return { x: coordinate(0), y: coordinate(1) };
    }
    elapsed -= duration;
  }
}

export default function LessonMap({ plan, crossDock, focus, splitChapter, minute, focusOrder = false }: {
  plan: LessonPlan;
  crossDock: boolean;
  focus: "pickup" | "delivery";
  splitChapter: boolean;
  minute?: number;
  focusOrder?: boolean;
}) {
  return (
    <figure className="lesson-map">
      <svg viewBox="0 0 500 230" role="img" aria-label={focusOrder
        ? "Routes for Customer 9. Truck 1 carries Product A and Truck 2 carries Product B."
        : crossDock
        ? `Same network, showing ${focus === "pickup" ? "pickups into the cross-dock" : "delivery routes out of the cross-dock"}`
        : "Two routes from the depot to three customers"}>
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          {crossDock && plan.inbound.map(({ stop, truck }) => (
            <path key={stop} d={drawRoute(["hub", stop, "hub"], 0)} stroke={lessonColors[truck]}
              className="lesson-map-path lesson-map-pickup" data-muted={focus !== "pickup"} />
          ))}
          {plan.routes.map(({ truck, stops }) => focusOrder ? (
            <g key={truck} stroke={lessonColors[truck]}>
              {stops.slice(1).map((to, index) => {
                const from = stops[index];
                return <path key={`${from}-${to}`} d={drawRoute([from, to], truck === 1 ? 11 : 19)}
                  className="lesson-map-path" data-muted={from !== "customer9" && to !== "customer9"} />;
              })}
            </g>
          ) : (
            <path key={truck} d={drawRoute(stops, truck === 1 ? 11 : 19)} stroke={lessonColors[truck]}
              className="lesson-map-path" data-muted={focus === "pickup"} />
          ))}
        </g>
        {stopIds.map((stop) => {
          const [x, y] = lessonStops[stop].position;
          const { dx, dy, anchor } = labelPlacement[stop];
          const contextStop = focusOrder && (stop === "customerA" || stop === "customerB");
          return (
            <g key={stop} opacity={contextStop ? .38 : undefined}>
              <MapIcon x={x} y={y} size={31}
                kind={stop === "hub" ? "depot" : isSupplier(stop) ? "supplier" : "customer"}
                color={stop === "hub" || (stop === "customer9" && splitChapter)
                  ? "var(--portfolio-gold)"
                  : isSupplier(stop) && !crossDock ? "var(--portfolio-control)" : undefined} />
              {!contextStop && <text x={x + dx} y={y + dy} textAnchor={anchor}>{stop === "hub" && crossDock ? "Cross-dock" : lessonStops[stop].label}</text>}
            </g>
          );
        })}
        {minute !== undefined && plan.routes.map(({ truck, depart, stops }) => {
          const inbound = plan.inbound.find((entry) => entry.truck === truck);
          const position = crossDock && inbound && minute < inbound.minute
            ? truckPosition(["hub", inbound.stop, "hub"], 0, minute, 0)
            : truckPosition(stops, depart, minute, truck === 1 ? 11 : 19);
          return position && <MapIcon key={truck} kind="truck" {...position} size={23} color={lessonColors[truck]} />;
        })}
      </svg>
      <figcaption>
        {plan.routes.map(({ truck, depart }) => (
          <span key={truck}>
            <svg className="routing-truck-key" viewBox="0 0 24 24" aria-hidden="true">
              <MapIcon kind="truck" x={12} y={12} size={21} color={lessonColors[truck]} />
            </svg>
            Truck {truck}{focusOrder ? ` · Product ${truck === 1 ? "A" : "B"}` : splitChapter && ` · leaves at ${depart} min`}
          </span>
        ))}
        {crossDock && !focusOrder && <span><i aria-hidden="true" className="lesson-map-dashed" />Pickup leg</span>}
      </figcaption>
    </figure>
  );
}
