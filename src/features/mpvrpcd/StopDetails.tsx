import { FulfillmentMeter } from "./ReplayReadouts";
import { cargoDetails, cargoTotal, nodeName, products, run, type ReplaySnapshot } from "./replay";

interface StopEvent {
  minute: number;
  vehicle: number;
  label: string;
  cargo: readonly number[];
}

export default function StopDetails({ node, snapshot, onSeek }: { node: number; snapshot: ReplaySnapshot; onSeek: (minute: number) => void }) {
  const dock = node === 0;
  const supplier = run.suppliers.includes(node);
  const events: StopEvent[] = dock
    ? run.transfers.map((event) => ({
      ...event,
      label: event.action === "unload" ? "Dropped off goods" : "Picked up goods",
    }))
    : run.visits.filter((visit) => visit.node === node).map((visit) => ({
      ...visit,
      label: visit.phase === "pickup" ? "Pickup" : "Delivery",
    })).sort((a, b) => a.minute - b.minute);
  const vehicleCount = new Set(events.filter((event) => cargoTotal(event.cargo) > 0).map((event) => event.vehicle)).size;
  const split = !dock && vehicleCount > 1;
  const stock = dock ? snapshot.dock : snapshot.suppliers[node];
  const ordered = snapshot.demand[node];
  const delivered = snapshot.delivered[node];

  return (
    <aside className="routing-section routing-inspector" aria-labelledby="routing-stop-title">
      <h2 id="routing-stop-title">{nodeName(node)}</h2>
      <p>{dock ? "Trucks drop off goods here so another truck can take them onward." : split
        ? `${vehicleCount} trucks shared this ${supplier ? "pickup" : "delivery"}.`
        : supplier ? "See what was picked up here." : "See what was delivered here."}</p>
      {ordered ? <>
        <FulfillmentMeter label={`${nodeName(node)} demand fulfillment`} delivered={cargoTotal(delivered)} ordered={cargoTotal(ordered)} />
        <table className="routing-data-table">
          <caption>Demand by product</caption>
          <thead><tr><th scope="col">Product</th><th scope="col">Delivered</th><th scope="col">Remaining</th></tr></thead>
          <tbody>{products.filter((product) => ordered[product] > 0).map((product) => (
            <tr key={product}><th scope="row">Product {product}</th><td>{delivered[product]}</td><td>{ordered[product] - delivered[product]}</td></tr>
          ))}</tbody>
        </table>
      </> : <p><strong>{dock ? "Current stock" : "Awaiting pickup"}</strong><br />{cargoDetails(stock) || "0 units"}</p>}
      <details className="formulation-equations routing-stop-events">
        <summary>{dock ? "Dock transfers" : "Stop events"}</summary>
        <ul className="routing-events">
          {events.map((event) => (
            <li key={`${event.minute}-${event.vehicle}-${event.label}`}>
              <div>
                <strong>Truck V{event.vehicle} · {event.label}</strong>
                <span>{cargoTotal(event.cargo) ? `${cargoTotal(event.cargo)} units total` : "0 units transferred"}</span>
                {cargoTotal(event.cargo) > 0 && <span>{cargoDetails(event.cargo)}</span>}
              </div>
              <button className="routing-text-action" type="button" onClick={() => onSeek(event.minute)} aria-label={`Jump to vehicle ${event.vehicle}, minute ${event.minute}`}>
                Jump to {event.minute} min
              </button>
            </li>
          ))}
        </ul>
      </details>
    </aside>
  );
}
