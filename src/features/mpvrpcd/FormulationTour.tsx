import { lazy, Suspense, useState } from "react";
import LessonMap from "./LessonMap";
import { createLessonPlan, inspectDeparture, lessonColors, lessonFleet, lessonOrders, lessonProducts, lessonSupply, lessonUnits } from "./lessonScenario";
import "./routingLesson.css";

const TopicEquations = lazy(() => import("./ModelEquations").then(({ TopicEquations }) => ({ default: TopicEquations })));
const whole = createLessonPlan({ crossDock: true });
const split = createLessonPlan({ crossDock: true, splits: true, waves: true });
const splitSingleWave = createLessonPlan({ crossDock: true, splits: true });
const order = lessonOrders.customer9;
const small = lessonFleet[0];
const large = lessonFleet[1];
const customerTotal = lessonUnits(order);
const early = split.groups[0].minute;
const late = whole.groups[0].minute;
const timelineEnd = Math.ceil(Math.max(split.end, splitSingleWave.end) / 10) * 10;
const pickupTravel = whole.inbound.reduce((total, { minute }) => total + minute, 0);
const hiringCost = 12 + 24;
const wholeCost = pickupTravel + whole.deliveryTravel + hiringCost;
const splitCost = pickupTravel + split.deliveryTravel + hiringCost;
const objectiveEquation = [1];

const sections = [
  {
    id: "routes", title: "Vehicle routing", label: "Routes",
    copy: "A vehicle routing problem (VRP) asks which stops each truck should visit and in what order. In this model, trucks collect goods from suppliers and return to the cross-dock before heading out to customers.",
    role: "A leg is the drive from one stop to the next. Each leg adds to a truck’s travel time and driving cost.",
    equations: [2, 3, 4, 5, 6, 7],
    Visual: RouteChoice,
  },
  {
    id: "fleet", title: "Fleet and capacity", label: "Fleet and capacity",
    copy: "The fleet is the set of trucks available for the job. Trucks can differ in rental cost and capacity, which is the space available for goods. A truck’s load changes at each stop, so it has to fit on every leg.",
    role: "The example compares the same order with the space available in each truck.",
    equations: [8, 9],
    Visual: FleetChoice,
  },
  {
    id: "splits", title: "Split pickups and deliveries", label: "Split pickups and deliveries",
    copy: "In a split pickup, more than one truck collects goods from the same supplier. In a split delivery, more than one truck delivers part of an order to the same customer.",
    role: "The model tracks how much of each product each truck carries. Together the trucks can pick up only what the supplier has, and they must deliver everything the customer ordered.",
    equations: [10, 11, 12, 13, 14, 15, 16, 17],
    Visual: SplitChoice,
  },
  {
    id: "timing", title: "Travel and arrival times", label: "Travel times",
    copy: "A truck’s arrival time is its departure time plus the time it spends driving. The model carries that arrival time forward to the next leg and requires the truck to finish within the time available.",
    role: "In the example, both trucks start their pickup routes at minute zero. Their routes take different amounts of time.",
    equations: [18, 19, 20, 21, 22],
    Visual: PickupTiming,
  },
  {
    id: "inventory", title: "Cross-dock inventory", label: "Cross-dock inventory",
    copy: "Inventory is the stock of goods on hand. The model counts each product separately. For each group of trucks, it adds incoming goods to the stock left by the previous group and subtracts what goes out for delivery.",
    role: "The cross-dock needs enough of each product to load all the deliveries in a group. In the example, Product A arrives before Product B.",
    equations: [23, 24, 25, 26, 27, 28],
    Visual: InventoryChoice,
  },
  {
    id: "waves", title: "Delivery periods", label: "Delivery periods",
    copy: "A delivery wave is a group of trucks leaving the cross-dock together. The paper calls each wave a delivery period. Before a group can go, all its trucks must be back from pickups and the cross-dock must have enough of each product for their deliveries.",
    role: "The trucks follow the same routes in both versions of the example. With two waves, the first truck can deliver part of the order sooner.",
    equations: [29, 30, 31, 32, 33, 34, 35],
    Visual: WaveChoice,
  },
] as const;

function Meter({ label, value, maximum, variant = "stock" }: {
  label: string;
  value: number;
  maximum: number;
  variant?: "stock" | "load";
}) {
  return (
    <div className="formulation-meter">
      <span>{label}</span><strong>{value}</strong>
      <div aria-hidden="true"><i data-variant={variant} style={{ width: `${value / maximum * 100}%` }} /></div>
    </div>
  );
}

function RouteChoice() {
  const [pickup, setPickup] = useState(true);
  return (
    <div className="formulation-visual">
      <div className="formulation-controls" role="group" aria-label="Route phase">
        <button type="button" aria-pressed={pickup} onClick={() => setPickup(true)}>Pickup routes</button>
        <button type="button" aria-pressed={!pickup} onClick={() => setPickup(false)}>Delivery routes</button>
      </div>
      <LessonMap plan={split} crossDock focus={pickup ? "pickup" : "delivery"} splitChapter={false} />
      <p>{pickup ? "Each truck starts at the cross-dock, visits a supplier, and returns with goods."
        : "Each truck leaves the cross-dock, visits its assigned customers, and returns."}</p>
    </div>
  );
}

function FleetChoice() {
  const [truck, setTruck] = useState<number>(small.id);
  const chosen = truck === small.id ? small : large;
  return (
    <div className="formulation-visual">
      <label className="lesson-assignment">Try Customer 9’s whole order on
        <select value={truck} onChange={(event) => setTruck(Number(event.currentTarget.value))}>
          {lessonFleet.map(({ id }) => <option value={id} key={id}>Truck {id}</option>)}
        </select>
      </label>
      <Meter label="Order volume" value={customerTotal} maximum={large.capacity} variant="load" />
      <Meter label={`Truck ${truck} capacity`} value={chosen.capacity} maximum={large.capacity} />
      <p role="status">{customerTotal > chosen.capacity
        ? `Truck ${truck} needs room for ${customerTotal - chosen.capacity} more units to carry the whole order.`
        : `The order fits with ${chosen.capacity - customerTotal} units of space left.`}</p>
    </div>
  );
}

function SplitChoice() {
  const [pickup, setPickup] = useState(true);
  const [share, setShare] = useState(7);
  const [shared, setShared] = useState(false);
  const supplier = lessonSupply[0].cargo.A;
  const parts = pickup ? [share, supplier - share] : shared ? [order.A, order.B] : [0, customerTotal];
  return (
    <div className="formulation-visual">
      <div className="formulation-controls" role="group" aria-label="Split example">
        <button type="button" aria-pressed={pickup} onClick={() => setPickup(true)}>Split a pickup</button>
        <button type="button" aria-pressed={!pickup} onClick={() => setPickup(false)}>Split a delivery</button>
      </div>
      {pickup ? (
        <label className="formulation-range">Supplier 1 has {supplier} units of Product A. Assign {share} to Truck 1.
          <input type="range" min={1} max={supplier} value={share} onChange={(event) => setShare(Number(event.currentTarget.value))} />
        </label>
      ) : (
        <label className="formulation-check"><input type="checkbox" checked={shared} onChange={(event) => setShared(event.currentTarget.checked)} />Share Customer 9’s order</label>
      )}
      <Meter label="Truck 1" value={parts[0]} maximum={pickup ? supplier : customerTotal} />
      <Meter label="Truck 2" value={parts[1]} maximum={pickup ? supplier : customerTotal} variant="load" />
      <p role="status">{pickup
        ? `Together they collect all ${supplier} units of Product A from this supplier.`
        : shared ? `Truck 1 delivers ${order.A} of A, and Truck 2 delivers ${order.B} of B.`
          : `Truck 2 delivers all ${customerTotal} units to Customer 9.`}</p>
    </div>
  );
}

function InventoryChoice() {
  const [minute, setMinute] = useState(early);
  const { available, needed, short } = inspectDeparture(whole, minute);
  const capacity = Math.max(...lessonProducts.map((product) => lessonSupply.reduce((sum, { cargo }) => sum + cargo[product], 0)));
  return (
    <div className="formulation-visual">
      <div className="formulation-controls" role="group" aria-label="Inventory checkpoint">
        {[early, late, late + 1].map((point) => (
          <button type="button" key={point} aria-pressed={minute === point} onClick={() => setMinute(point)}>
            {point === early ? "First truck returns" : point === late ? "Both trucks back" : "After loading"}
          </button>
        ))}
      </div>
      <p>Minute {minute} · One planned departure</p>
      <div className="formulation-products">
        {lessonProducts.map((product) => (
          <div key={product}>
            <h4>Product {product}</h4>
            <Meter label="At the dock" value={available[product]} maximum={capacity} />
            {minute <= late && <Meter label="Group needs" value={needed[product]} maximum={capacity} variant="load" />}
          </div>
        ))}
      </div>
      <p role="status">{minute === early ? `The group is still short ${short.B} units of Product B.`
        : minute === late ? `Both products are ready. Truck 2 can take ${order.A} units of A that Truck 1 brought in.`
          : "The trucks have loaded everything. There’s none of either product left at the cross-dock."}</p>
    </div>
  );
}

function PickupTiming() {
  return (
    <div className="formulation-visual">
      <p>Minutes from departure to the cross-dock return</p>
      {whole.inbound.map(({ truck, minute }) => (
        <Meter key={truck} label={`Truck ${truck}`} value={minute} maximum={whole.allReady} />
      ))}
    </div>
  );
}

function WaveChoice() {
  const [multiple, setMultiple] = useState(true);
  const plan = multiple ? split : splitSingleWave;
  return (
    <div className="formulation-visual">
      <label className="formulation-check"><input type="checkbox" checked={multiple} onChange={(event) => setMultiple(event.currentTarget.checked)} />Let the trucks leave separately</label>
      <p>Bars show when each truck is out delivering. Diamonds mark when it reaches Customer 9.</p>
      {plan.routes.map(({ truck, depart, travel, deliveries }) => {
        const arrival = deliveries.find(({ stop }) => stop === "customer9")?.minute;
        return (
          <div className="formulation-meter" key={truck}>
            <strong>Truck {truck}</strong><span>Leaves {depart} min{arrival !== undefined && ` · Customer 9 at ${arrival} min`}</span>
            <div className="formulation-timeline" aria-hidden="true">
              <i style={{ marginLeft: `${depart / timelineEnd * 100}%`, width: `${travel / timelineEnd * 100}%`, background: lessonColors[truck] }} />
              {arrival !== undefined && <b style={{ left: `${arrival / timelineEnd * 100}%` }} />}
            </div>
          </div>
        );
      })}
      <p role="status">{multiple
        ? `Truck 1 can leave at minute ${early} with Product A. Truck 2 leaves at minute ${late} with Product B.`
        : `Both trucks wait until minute ${late} and leave together.`}</p>
    </div>
  );
}

function EquationDisclosure({ numbers }: { numbers: readonly number[] }) {
  const [opened, setOpened] = useState(false);
  return (
    <details className="formulation-equations" onToggle={(event) => {
      if (event.currentTarget.open) setOpened(true);
    }}>
      <summary>{`View equations ${numbers[0]}–${numbers[numbers.length - 1]}`}</summary>
      {opened && <Suspense fallback={<p>Loading equations…</p>}><TopicEquations numbers={numbers} /></Suspense>}
    </details>
  );
}

const exampleSteps = [
  { minute: early, action: "See the first delivery", explanation: "Truck 1 leaves with Product A while Truck 2 is still collecting Product B." },
  { minute: split.customer9[0].minute, action: "See the order completed", explanation: `Truck 1 delivers ${order.A} units of Product A to Customer 9.` },
  { minute: split.customer9[1].minute, action: "Restart the example", explanation: `Truck 2 delivers the remaining ${order.B} units of Product B.` },
] as const;

function showEquationGroup(id: string) {
  const heading = document.getElementById(id);
  const disclosure = heading?.closest("section")?.querySelector("details.formulation-equations");
  if (disclosure instanceof HTMLDetailsElement) disclosure.open = true;
  heading?.scrollIntoView({ block: "start" });
  heading?.focus({ preventScroll: true });
}

export default function FormulationTour({ paperHref, onShowReplay }: { paperHref: string; onShowReplay: () => void }) {
  const [step, setStep] = useState(0);
  const { minute, action, explanation } = exampleSteps[step];
  return (
    <div className="formulation-tour">
      <section id="formulation-example" tabIndex={-1} className="routing-section formulation-overview" aria-labelledby="formulation-example-title">
        <div className="formulation-copy">
          <h2 id="formulation-example-title">Two-truck teaching example</h2>
          <p>Customer 9 ordered {order.A} units of Product A and {order.B} of Product B. At minute {early}, one truck is back with Product A. The other is still collecting Product B.</p>
          <p>At the cross-dock, trucks unload and sort goods for delivery. This example compares sending part of an order early with delivering the whole order together.</p>
          <button className="portfolio-button routing-primary-action" type="button"
            onClick={() => setStep((index) => (index + 1) % exampleSteps.length)}>{action}</button>
          <div className="formulation-milestone" role="status">
            <strong>Minute {minute} · {split.customer9.filter((entry) => entry.minute <= minute)
              .reduce((count, { cargo }) => count + lessonUnits(cargo), 0)} of {customerTotal} units delivered</strong>
            <p>{explanation}</p>
          </div>
        </div>
        <LessonMap plan={split} crossDock focus="delivery" splitChapter minute={minute} focusOrder />
        <div className="formulation-comparison">
          <h3>Delivery timing and cost</h3>
          <table>
            <thead><tr><th scope="col">Plan</th><th scope="col">First delivery</th><th scope="col">Order complete</th><th scope="col">Total cost</th></tr></thead>
            <tbody>
              <tr><th scope="row">Together</th><td>{customerTotal} at {whole.customer9[0].minute} min</td><td>{whole.customer9[0].minute} min</td><td>{wholeCost} pts</td></tr>
              <tr><th scope="row">Split</th><td>{order.A} at {split.customer9[0].minute} min</td><td>{split.customer9[1].minute} min</td><td>{splitCost} pts</td></tr>
            </tbody>
          </table>
          <p>The split plan gets {order.A} units there {whole.customer9[0].minute - split.customer9[0].minute} minutes earlier for {splitCost - wholeCost} extra points. Both plans finish Customer 9’s order at the same time.</p>
          <details className="formulation-equations">
            <summary>How the example calculates costs</summary>
            <p>Driving costs 1 point per minute. Both plans use the same two trucks, which cost 12 and 24 points to hire. The split plan adds driving because both trucks visit Customer 9.</p>
          </details>
        </div>
      </section>

      <nav className="formulation-index" aria-labelledby="formulation-index-title">
        <h2 id="formulation-index-title" tabIndex={-1}>Model equations</h2>
        <ul>
          <li><button type="button" className="routing-text-action" onClick={() => showEquationGroup("formulation-objective-title")}>Objective (1)</button></li>
          {sections.map(({ id, label, equations }) => (
            <li key={id}>
              <button type="button" className="routing-text-action" onClick={() => showEquationGroup(`tour-${id}`)}>
                {label} ({equations[0]}–{equations[equations.length - 1]})
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <section className="routing-section formulation-objective" aria-labelledby="formulation-objective-title">
        <div className="formulation-copy">
          <h2 id="formulation-objective-title" tabIndex={-1}>Objective function</h2>
          <p className="formulation-objective-goal">Fill every order at the lowest total cost.</p>
          <p>In my thesis, I used one model to decide which trucks to use, what they carry, and when they leave. The equation below adds driving costs and truck hire costs.</p>
        </div>
        <Suspense fallback={<p>Loading the objective equation…</p>}>
          <TopicEquations numbers={objectiveEquation} />
        </Suspense>
      </section>

      {sections.map(({ id, title, copy, role, equations, Visual }) => (
        <section className="routing-section formulation-topic" key={id} aria-labelledby={`tour-${id}`}>
          <div className="formulation-copy">
            <h2 id={`tour-${id}`} tabIndex={-1}>{title}</h2>
            <p>{copy}</p>
            <p className="formulation-contribution">{role}</p>
          </div>
          <Visual />
          <EquationDisclosure numbers={equations} />
        </section>
      ))}

      <aside className="routing-section formulation-findings" aria-labelledby="tour-findings">
        <h2 id="tour-findings">What we found</h2>
        <blockquote cite={paperHref}>“Split pickups and deliveries can produce lower objective values and generate solutions previously infeasible.”</blockquote>
        <p>For the ten test cases with the most goods to move, the model found a plan that filled all orders in every case with splitting enabled and in zero cases with splitting disabled. Using trucks of different sizes also lowered costs in the tests and generally increased computing time.</p>
        <button type="button" className="routing-text-action" onClick={onShowReplay}>Back to the full research replay</button>
      </aside>
    </div>
  );
}
