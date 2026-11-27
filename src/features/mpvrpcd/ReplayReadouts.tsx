import { cargoTotal, nodeName, products, run, vehicles, type ReplaySnapshot } from "./replay";

export function FulfillmentMeter({ label, delivered, ordered }: { label: string; delivered: number; ordered: number }) {
  return (
    <div className="routing-fulfillment">
      <div className="routing-fulfillment-counts">
        <strong>{delivered} of {ordered} units delivered</strong>
        <span>{ordered - delivered} remaining</span>
      </div>
      <meter aria-label={label} min={0} max={ordered} value={delivered} />
    </div>
  );
}

export function ReplayFulfillment({ snapshot }: { snapshot: ReplaySnapshot }) {
  const completed = run.customers.filter((node) => cargoTotal(snapshot.delivered[node]) === cargoTotal(snapshot.demand[node])).length;
  return (
    <div className="routing-section routing-fulfillment-overview">
      <h3>Demand fulfillment</h3>
      <FulfillmentMeter label="Total demand fulfillment"
        delivered={cargoTotal(snapshot.totalDelivered)} ordered={cargoTotal(snapshot.totalDemand)} />
      <p>{completed} of {run.customers.length} customer orders complete</p>
    </div>
  );
}

export function ReplayInventory({ snapshot }: { snapshot: ReplaySnapshot }) {
  const locations = [
    ...run.suppliers.map((node) => [nodeName(node), snapshot.suppliers[node]] as const),
    ["Cross-dock", snapshot.dock] as const,
    ...vehicles.map((vehicle) => [`Truck V${vehicle}`, snapshot.trucks[vehicle]] as const),
    ["Delivered", snapshot.totalDelivered] as const,
  ];
  return (
    <details className="routing-section formulation-equations routing-inventory">
      <summary>Product inventory by location</summary>
      <table className="routing-data-table">
        <caption>Units of each product (P0–P3). Supplier rows count goods still scheduled for pickup.</caption>
        <thead><tr><th scope="col">Location</th>
          {products.map((product) => <th scope="col" key={product}><abbr title={`Product ${product}`}>P{product}</abbr></th>)}
        </tr></thead>
        <tbody>{locations.map(([location, cargo]) => (
          <tr key={location}><th scope="row">{location}</th>
            {cargo.map((units, product) => <td key={product} data-empty={units === 0}>{units}</td>)}
          </tr>
        ))}</tbody>
      </table>
    </details>
  );
}
