import { lazy, Suspense, useId, useState } from "react";
import { routingThesisTitle } from "../../projectRoutes";
import MapIcon, { type MapIconKind } from "./MapIcon";
import { createLessonPlan, inspectDeparture, lessonFleet, lessonOrders, lessonProducts, lessonStops, lessonUnits, type Cargo, type LessonStop } from "./lessonScenario";
import "./routingLesson.css";

const TopicEquations = lazy(() => import("./ModelEquations").then(({ TopicEquations }) => ({ default: TopicEquations })));

const together = createLessonPlan({ crossDock: true });
const split = createLessonPlan({ crossDock: true, splits: true, waves: true });
const splitTogether = createLessonPlan({ crossDock: true, splits: true });
const order = lessonOrders.customer3;
const total = lessonUnits(order);
const [smallTruck] = lessonFleet;
const [firstPickup, lastPickup] = together.inbound;
const pickupTravel = firstPickup.minute + lastPickup.minute;
const cost = (plan: typeof together) => pickupTravel + plan.deliveryTravel + 12 + 24;
const deliveryWindow = Math.ceil(Math.max(splitTogether.end, split.end) / 20) * 20;
const timelineTicks = Array.from({ length: deliveryWindow / 20 + 1 }, (_, index) => index * 20);
const emptyLoad: Cargo = { A: 0, B: 0 };

const routeOptions = [
  { label: "2, 1, then 3", stops: ["hub", "customer2", "customer1", "customer3", "hub"] },
  { label: "1, 2, then 3", stops: ["hub", "customer1", "customer2", "customer3", "hub"] },
] as const;
const routeLengths = routeOptions.map(({ stops }) => Math.round(stops.slice(1).reduce((distance, stop, index) => {
  const [x, y] = lessonStops[stop].position;
  const [previousX, previousY] = lessonStops[stops[index]].position;
  return distance + Math.hypot(x - previousX, y - previousY) / 10;
}, 0)));

function routePoint(stop: LessonStop) {
  const [x, y] = lessonStops[stop].position;
  return [x - 205, y - 28];
}

function LessonIcon({ kind }: { kind: MapIconKind }) {
  return (
    <svg className="routing-lesson-icon" viewBox="0 0 24 24" aria-hidden="true">
      <MapIcon kind={kind} x={12} y={12} size={24} color="currentColor" />
    </svg>
  );
}

function RouteComparison() {
  const [choice, setChoice] = useState(0);
  const [stopIndex, setStopIndex] = useState(0);
  const directionId = useId();
  const { stops } = routeOptions[choice];
  const points = stops.map(routePoint);
  const [truckX, truckY] = points[stopIndex];
  const routeLine = points.flatMap(([x, y], index) => {
    if (index === 0) return [`${x},${y}`];
    const [previousX, previousY] = points[index - 1];
    return [`${(x + previousX) / 2},${(y + previousY) / 2}`, `${x},${y}`];
  }).join(" ");
  return (
    <div className="routing-demo">
      <div className="routing-options" role="group" aria-label="Visit order">
        {routeOptions.map(({ label }, index) => (
          <button type="button" key={label} aria-pressed={choice === index} onClick={() => {
            setChoice(index);
            setStopIndex(0);
          }}>{label}</button>
        ))}
      </div>
      <svg className="routing-demo-map" viewBox="0 0 280 178" role="img"
        aria-label={`Route from ${stops.map((stop) => lessonStops[stop].label).join(" to ")}`}>
        <defs>
          <marker id={directionId} viewBox="0 0 8 8" refX="4" refY="4" markerWidth="4" markerHeight="4" orient="auto">
            <path d="M0 0 8 4 0 8Z" fill="var(--portfolio-highlight)" />
          </marker>
        </defs>
        <polyline points={routeLine} markerMid={`url(#${directionId})`} />
        {([...new Set(stops)]).map((stop) => {
          const [x, y] = routePoint(stop);
          return (
            <g key={stop}>
              <MapIcon kind={stop === "hub" ? "depot" : "customer"} x={x} y={y} size={27}
                color={stop === "hub" ? "var(--portfolio-gold)" : undefined} />
              <text x={x} y={y + 24} textAnchor="middle">{lessonStops[stop].label}</text>
              {stop !== "hub" && <g className="routing-stop-number">
                <circle cx={x + 13} cy={y - 11} r="8" />
                <text x={x + 13} y={y - 11} textAnchor="middle" dominantBaseline="central">{stops.indexOf(stop)}</text>
              </g>}
            </g>
          );
        })}
        <MapIcon kind="truck" x={truckX - 22} y={truckY - 13} size={20} color="var(--portfolio-gold)" />
      </svg>
      <div className="routing-demo-controls">
        <div className="routing-options">
          <button type="button" onClick={() => setStopIndex((stopIndex + 1) % stops.length)}>
            {stopIndex === stops.length - 1 ? "Reset truck" : "Next stop"}
          </button>
        </div>
        <span role="status">{stopIndex === 0 ? "Start at the depot"
          : stopIndex === stops.length - 1 ? "Return to the depot" : `Stop ${stopIndex} · ${lessonStops[stops[stopIndex]].label}`}</span>
      </div>
      <p className="routing-demo-result" role="status"><strong>{routeLengths[choice]} distance units</strong>
        {choice === 1 ? ` · ${routeLengths[0] - routeLengths[1]} fewer than the other route` : ""}</p>
    </div>
  );
}

const dockSteps = [
  { label: "Truck 1 returns", minute: firstPickup.minute },
  { label: "Truck 2 returns", minute: lastPickup.minute },
  { label: "After loading", minute: lastPickup.minute + 1 },
] as const;

function Carton({ x, y, product }: { x: number; y: number; product: keyof Cargo }) {
  return (
    <g className="routing-carton" data-product={product} transform={`translate(${x} ${y})`}>
      <path d="M1 4 3 1h8l2 3v9H1ZM1 4h12" />
      <path className="routing-carton-tape" d="M5.5 1 5 4v3h4V4l-.5-3" />
    </g>
  );
}

function CartonStack({ cargo }: { cargo: Cargo }) {
  const cartons = lessonProducts.flatMap((product) => Array<keyof Cargo>(cargo[product]).fill(product));
  return (
    <svg className="routing-carton-stack" viewBox="0 0 98 63" aria-hidden="true">
      <path className="routing-pallet" d="M1 56h96v3H1Zm6 3v3m42-3v3m42-3v3" />
      {cartons.map((product, index) => (
        <Carton key={index} product={product} x={index % 7 * 14} y={42 - Math.floor(index / 7) * 14} />
      ))}
    </svg>
  );
}

function CartonKey() {
  return (
    <p className="routing-carton-key">
      {lessonProducts.map((product) => <span key={product}>
        <svg viewBox="0 0 14 14" aria-hidden="true"><Carton x={0} y={0} product={product} /></svg> Product {product}
      </span>)}
      <span>One carton represents one unit.</span>
    </p>
  );
}

function DockHandoff() {
  const [step, setStep] = useState(0);
  const { available } = inspectDeparture(together, dockSteps[step].minute);
  return (
    <div className="routing-demo">
      <div className="routing-options" role="group" aria-label="Cross-dock stage">
        {dockSteps.map(({ label }, index) => (
          <button type="button" key={label} aria-pressed={step === index} onClick={() => setStep(index)}>{label}</button>
        ))}
      </div>
      <ol className="routing-dock-flow">
        <li><LessonIcon kind="truck" /><strong>In transit</strong>
          <span>{step === 0 ? `${lastPickup.cargo.B} B` : "0 units"}</span>
          <CartonStack cargo={step === 0 ? lastPickup.cargo : emptyLoad} />
        </li>
        <li><LessonIcon kind="depot" /><strong>Cross-dock</strong>
          <span>{available.A} A · {available.B} B</span>
          <CartonStack cargo={available} />
        </li>
        <li><LessonIcon kind="customer" /><strong>Customer 3</strong>
          <span>{step === 2 ? `${order.A} A · ${order.B} B` : "0 units"}</span>
          <CartonStack cargo={step === 2 ? order : emptyLoad} />
        </li>
      </ol>
      <CartonKey />
      <p className="routing-demo-result" role="status"><strong>Minute {dockSteps[step].minute}</strong>
        {step === 0 ? ` · Truck 1 unloads ${firstPickup.cargo.A} units of A. Truck 2 is returning with B.`
          : step === 1 ? " · Both products are in stock and ready to load."
          : " · Truck 2 loads Customer 3’s order. The remaining stock goes to the other customers."}</p>
    </div>
  );
}

function TruckLoad({ capacity, cargo }: { capacity: number; cargo: Cargo }) {
  const columns = Math.ceil(capacity / 2);
  const cab = 6 + columns * 15;
  const loaded = lessonUnits(cargo);
  return (
    <svg className="routing-truck-diagram" viewBox="0 3 207 51" role="img"
      aria-label={`${loaded} of ${capacity} slots filled for Customer 3: ${cargo.A} units of Product A and ${cargo.B} units of Product B`}>
      <path className="routing-truck-body" d={`M3 6h${cab - 3}v37H3ZM${cab} 17h17l13 13v13h-30Z`} />
      <path className="routing-truck-window" d={`M${cab + 5} 22h10l8 8h-18Z`} />
      {Array.from({ length: capacity }, (_, index) => {
        const x = 6 + index % columns * 15;
        const y = index < columns ? 25 : 10;
        return index < loaded
          ? <Carton key={index} x={x} y={y} product={index < cargo.A ? "A" : "B"} />
          : <rect className="routing-empty-slot" key={index} x={x + 1} y={y + 1} width="12" height="12" rx="1" />;
      })}
      <circle className="routing-truck-wheel" cx="24" cy="45" r="6" />
      <circle className="routing-truck-wheel" cx={cab + 16} cy="45" r="6" />
    </svg>
  );
}

function SplitOrder() {
  const [share, setShare] = useState(false);
  const truckLoads = share ? [{ A: order.A, B: 0 }, { A: 0, B: order.B }] : [emptyLoad, order];
  return (
    <div className="routing-demo">
      <div className="routing-options" role="group" aria-label="Customer 3 order assignment">
        <button type="button" aria-pressed={!share} onClick={() => setShare(false)}>One truck delivers</button>
        <button type="button" aria-pressed={share} onClick={() => setShare(true)}>Two trucks share</button>
      </div>
      <dl className="routing-truck-loads">
        {lessonFleet.map(({ id, capacity }, index) => <div key={id}>
          <dt><strong>Truck {id}</strong> · {lessonUnits(truckLoads[index])}/{capacity} spaces used</dt>
          <dd>
            <TruckLoad capacity={capacity} cargo={truckLoads[index]} />
            <span>{truckLoads[index].A} A · {truckLoads[index].B} B</span>
          </dd>
        </div>)}
      </dl>
      <CartonKey />
      <p className="routing-demo-result" role="status">{share
        ? <><strong>{total} of {total} units assigned.</strong> Each truck carries the product it picked up.</>
        : <><strong>Truck 2 can carry all {total} units.</strong> The full order exceeds Truck 1’s capacity by {total - smallTruck.capacity} units.</>}</p>
    </div>
  );
}

function DeliveryWaves() {
  const [separate, setSeparate] = useState(false);
  const plan = separate ? split : splitTogether;
  const [first, last] = plan.customer3;
  return (
    <div className="routing-demo">
      <div className="routing-options" role="group" aria-label="Departure schedule">
        <button type="button" aria-pressed={!separate} onClick={() => setSeparate(false)}>Depart together</button>
        <button type="button" aria-pressed={separate} onClick={() => setSeparate(true)}>Depart separately</button>
      </div>
      <div className="routing-wave-chart">
        {plan.routes.map(({ truck, depart, returnAt }) => {
          const arrival = first.truck === truck ? first.minute : last.minute;
          return (
            <div className="routing-wave-row" key={truck}>
              <strong className="routing-wave-vehicle"><LessonIcon kind="truck" /> Truck {truck} · Product {truck === smallTruck.id ? "A" : "B"}</strong>
              <span>Departs at {depart} · Reaches Customer 3 at {arrival} · Returns at {returnAt}</span>
              <div className="routing-wave-track" aria-hidden="true">
                <i style={{ left: `${depart / deliveryWindow * 100}%`, width: `${(returnAt - depart) / deliveryWindow * 100}%` }} />
                <span className="routing-wave-arrival" style={{ left: `${depart / deliveryWindow * 100}%` }}><LessonIcon kind="truck" /></span>
                <span className="routing-wave-arrival" style={{ left: `${arrival / deliveryWindow * 100}%` }}><LessonIcon kind="customer" /></span>
                <span className="routing-wave-arrival" style={{ left: `${returnAt / deliveryWindow * 100}%` }}><LessonIcon kind="depot" /></span>
              </div>
            </div>
          );
        })}
        <div className="routing-time-axis" aria-hidden="true">{timelineTicks.map((minute) => <span key={minute}>{minute}</span>)}</div>
        <p>Time in minutes. The truck marks departure, the house marks delivery, and the depot marks return.</p>
      </div>
      <p className="routing-demo-result" role="status"><strong>All {total} units delivered by minute {last.minute}.</strong>
        {separate ? ` Product A arrives ${lastPickup.minute - firstPickup.minute} minutes earlier with the same driving time.`
          : " Truck 1 waits for Product B to return with Truck 2."}</p>
    </div>
  );
}

export default function FormulationTour({ paperHref }: { paperHref: string }) {
  return (
    <div className="formulation-tour">
      <section className="routing-section routing-lesson" aria-labelledby="routing-lesson-title">
        <header>
          <h2 id="routing-lesson-title" tabIndex={-1}>A three-customer routing example</h2>
          <p>The routes, quantities, and costs are illustrative.</p>
        </header>
        <section className="routing-chapter" aria-labelledby="routing-chapter-routes">
          <div>
            <h3 id="routing-chapter-routes">Stop order and route distance</h3>
            <p>Compare two routes from the depot to customers 1, 2, and 3 and back.</p>
          </div>
          <RouteComparison />
        </section>
        <section className="routing-chapter" aria-labelledby="routing-chapter-dock">
          <div>
            <h3 id="routing-chapter-dock">Cross-dock inventory</h3>
            <p>Follow the stock from pickup to loading. Customer 3 needs {order.A} units of A and {order.B} units of B.</p>
          </div>
          <DockHandoff />
        </section>
        <section className="routing-chapter" aria-labelledby="routing-chapter-split">
          <div>
            <h3 id="routing-chapter-split">Split deliveries and vehicle capacity</h3>
            <p>In a split delivery, more than one vehicle serves the same customer. In a split pickup, more than one vehicle collects goods from the same supplier.</p>
            <p>Compare the portion of Customer 3’s order assigned to each truck with that truck’s capacity.</p>
          </div>
          <SplitOrder />
        </section>
        <section className="routing-chapter" aria-labelledby="routing-chapter-waves">
          <div>
            <h3 id="routing-chapter-waves">Delivery periods and arrival times</h3>
            <p>A delivery period begins when a group of trucks leaves the cross-dock. The group can depart once its trucks have returned from pickup and the dock has enough stock to load them.</p>
            <p>Both schedules use the same routes and divide the order in the same way. Compare the arrival times when the trucks depart together and when they depart separately.</p>
          </div>
          <DeliveryWaves />
        </section>
        <details className="formulation-equations routing-lesson-cost">
          <summary>Cost and timing by delivery plan</summary>
          <table className="routing-wave-table">
            <caption>Illustrative cost and delivery times for Customer 3</caption>
            <thead><tr><th scope="col">Plan</th><th scope="col">First delivery</th><th scope="col">Order complete</th><th scope="col">Total cost</th></tr></thead>
            <tbody>
              <tr><th scope="row">One truck delivers</th><td>{together.customer3[0].minute} min</td><td>{together.customer3[0].minute} min</td><td>{cost(together)} pts</td></tr>
              <tr><th scope="row">Split delivery with separate departures</th><td>{split.customer3[0].minute} min</td><td>{split.customer3[1].minute} min</td><td>{cost(split)} pts</td></tr>
            </tbody>
          </table>
          <p>Sharing the order costs {cost(split) - cost(together)} extra points in this example because both trucks visit Customer 3. Driving costs one point per minute, and hiring the two trucks costs 12 and 24 points respectively.</p>
        </details>
      </section>

      <section className="routing-section routing-findings" aria-labelledby="tour-findings">
        <div>
          <p className="routing-kicker">Published study</p>
          <h2 id="tour-findings">Benchmark results</h2>
        </div>
        <div>
          <p>At the highest tested supply and demand level, all ten instances had feasible solutions when split pickups and deliveries were allowed. With splits prohibited, none of the ten instances had a feasible solution.</p>
          <p>Using trucks of different sizes lowered modeled costs and generally increased solve time. The 30-node cases did not reach a proven optimum within the one-hour limit.</p>
          <p className="routing-citation">Mustafa Turner and Komarudin · IEOM 2022</p>
          <a href={paperHref} target="_blank" rel="noreferrer">{routingThesisTitle}</a>
        </div>
      </section>
    </div>
  );
}

const equationGroups = [
  { label: "Driving and truck hire costs", first: 1, last: 1 },
  { label: "Vehicle routing", first: 2, last: 7 },
  { label: "Truck capacity", first: 8, last: 9 },
  { label: "Split pickups and deliveries", first: 10, last: 17 },
  { label: "Travel and arrival times", first: 18, last: 22 },
  { label: "Cross-dock inventory", first: 23, last: 28 },
  { label: "Delivery periods", first: 29, last: 35 },
];

function EquationGroup({ label, first, last }: typeof equationGroups[number]) {
  const [opened, setOpened] = useState(false);
  return (
    <details className="formulation-equations" onToggle={(event) => {
      if (event.currentTarget.open) setOpened(true);
    }}>
      <summary>{label} ({first === last ? first : `${first}–${last}`})</summary>
      {opened && <Suspense fallback={<p>Loading equations…</p>}>
        <TopicEquations numbers={Array.from({ length: last - first + 1 }, (_, index) => first + index)} />
      </Suspense>}
    </details>
  );
}

export function FormulationAppendix() {
  return (
    <section className="routing-section routing-appendix" aria-labelledby="formulation-index-title">
      <h2 id="formulation-index-title" tabIndex={-1}>Model equations</h2>
      <p>The published model chooses routes, loads, and departure times to fill every order at the lowest combined driving and truck hire cost.</p>
      {equationGroups.map((group) => <EquationGroup key={group.first} {...group} />)}
    </section>
  );
}
