export type FormulaTranslation = string | readonly string[];
type Equation = readonly [number: number, explanation: string, latex: string, translation: FormulaTranslation, condition?: string];

interface EquationGroup {
  title: string;
  equations: readonly Equation[];
  note?: string;
}

const tex = String.raw;

const drivingCost = tex`\sum_{k\in K}\sum_{i\in N}\sum_{j\in N}tc_{ij}x_{kij}`;
const truckHireCost = tex`\sum_{k\in K}c_kz_k`;
const objectiveTranslation = [
  `$${drivingCost}$ is the total driving cost. For each truck, add the cost of every drive it makes between stops. If two trucks make the same drive, both trips count.`,
  `$${truckHireCost}$ is the total hiring cost of all trucks used. Add each truck’s fee once, regardless of how many stops it visits.`,
];

export const formulation: readonly EquationGroup[] = [
  {
    title: "Objective function",
    equations: [
      [1, "Minimize costs.", tex`\min\; ${drivingCost}+${truckHireCost}`, objectiveTranslation],
    ],
  },
  {
    title: "Routing Constraints",
    equations: [
      [2, "Consecutive movement of vehicles.", tex`\sum_{\ell\in N}x_{kj\ell}=\sum_{i\in N}x_{kij}`, tex`At each stop $j$, count the legs truck $k$ takes out of the stop and the legs it takes into the stop. The counts must match, so a truck that enters a stop also leaves it.`, tex`k\in K,\ j\in N`],
      [3, "Eliminate routes in the same place.", tex`x_{kii}=0`, tex`Set $x_{kii}$ to zero for every truck and stop. A truck cannot drive from a stop back to that same stop in a single leg.`, tex`k\in K,\ i\in N`],
      [4, "Vehicles can only use available routes.", tex`x_{kij}\le R_{ij}`, tex`If the drive from $i$ to $j$ is unavailable ($R_{ij}=0$), every truck must have $x_{kij}=0$. If the drive is available, taking it is allowed.`, tex`k\in K,\ i,j\in N`],
      [5, "A truck visits each pickup stop at most once.", tex`\sum_{i\in S_0}x_{kij}\le 1`, tex`For each truck and each pickup stop $j$, add up the legs into $j$ from suppliers and the cross-dock ($S_0$). A truck can use at most one of those incoming legs.`, tex`k\in K,\ j\in S_0`],
      [6, "A truck visits each delivery stop at most once.", tex`\sum_{i\in D_0}x_{kij}\le 1`, tex`For each truck and each delivery stop $j$, add up the legs into $j$ from customers and the cross-dock ($D_0$). A truck can use at most one of those incoming legs.`, tex`k\in K,\ j\in D_0`],
      [7, "Differentiate between pickup and delivery routes.", tex`x_{kij}=0`, tex`Set $x_{kij}$ to zero for a direct leg from a supplier to a customer or from a customer to a supplier. Pickup and delivery routes meet at the cross-dock.`, tex`k\in K,\ (i,j)\in(S\times D)\cup(D\times S)`],
    ],
  },
  {
    title: "Vehicle Constraints",
    equations: [
      [8, "Mark trucks that are assigned a route.", tex`\sum_{i\in N}\sum_{j\in N}x_{kij}\le Mz_k`, tex`The left side counts the legs truck $k$ drives. When $z_k=0$, the limit is zero and the truck can take no legs. When $z_k=1$, the large number $M$ allows the truck to take legs.`, tex`k\in K`],
      [9, "Vehicle capacity.", tex`\sum_{p\in P}y_{kijp}V_p\le Q_k`, tex`On every leg, multiply the units of each product on the truck ($y_{kijp}$) by the space one unit takes ($V_p$). Add those amounts and check that the load fits within truck capacity $Q_k$.`, tex`k\in K,\ i,j\in N`],
    ],
  },
  {
    title: "Flow Constraints",
    equations: [
      [10, "All products must be picked up.", tex`\sum_{k\in K}\sum_{i\in S}y_{ki0p}\ge\sum_{i\in S}s_{ip}`, tex`For each product, add what all trucks bring from suppliers to the cross-dock, shown by $y_{ki0p}$. That total must cover the sum of the quantities available at the suppliers ($s_{ip}$).`, tex`p\in P`],
      [11, "Total supply must cover the goods sent for delivery.", tex`\sum_{k\in K}\sum_{i\in S}y_{ki0p}\ge\sum_{k\in K}\sum_{j\in D}y_{k0jp}`, tex`For each product, compare the total brought to the cross-dock ($y_{ki0p}$) with the total sent out for delivery ($y_{k0jp}$). The trucks can send out only as much as they bring in.`, tex`p\in P`],
    ],
  },
  {
    title: "Products picked up and delivered",
    note: "Equation (12) includes the zero equality used in the notebook code. The printed paper leaves the equality implicit.",
    equations: [
      [12, "Trucks start their pickup routes empty.", tex`\sum_{k\in K}y_{k0jp}=0`, tex`For every product and every possible pickup leg leaving the cross-dock, the total carried by all trucks ($y_{k0jp}$) is zero. They start their pickups empty.`, tex`p\in P,\ j\in S_0`],
      [13, "Pickups cannot exceed the supplier’s stock.", tex`\sum_{k\in K}\sum_{\ell\in S_0}y_{kj\ell p}-\sum_{k\in K}\sum_{i\in S_0}y_{kijp}\le s_{jp}`, tex`For each supplier and product, add what all trucks carry out and subtract what they carried in ($y_{kj\ell p}$ and $y_{kijp}$). The total pickup cannot exceed what the supplier has available ($s_{jp}$).`, tex`p\in P,\ j\in S`],
      [14, "Deliveries across all trucks must cover the customer’s order.", tex`\sum_{k\in K}\sum_{i\in D_0}y_{kijp}-\sum_{k\in K}\sum_{\ell\in D_0}y_{kj\ell p}\ge d_{jp}`, tex`For each customer and product, add what all trucks carry in and subtract what they carry out ($y_{kijp}$ and $y_{kj\ell p}$). The total delivered must cover what the customer ordered ($d_{jp}$).`, tex`p\in P,\ j\in D`],
      [15, "Cannot unload in supply nodes.", tex`\sum_{j\in S_0}y_{kijp}\ge\sum_{j\in S_0}y_{kjip}`, tex`For each truck and product at a supplier, compare the load leaving the stop ($y_{kijp}$) with the load arriving there ($y_{kjip}$). The load can stay the same or increase.`, tex`k\in K,\ p\in P,\ i\in S`],
      [16, "Cannot take from demand nodes.", tex`\sum_{j\in D_0}y_{kijp}\le\sum_{j\in D_0}y_{kjip}`, tex`For each truck and product at a customer, compare the load leaving the stop ($y_{kijp}$) with the load arriving there ($y_{kjip}$). The load can stay the same or decrease.`, tex`k\in K,\ p\in P,\ i\in D`],
      [17, "Inventory can only be updated in used routes.", tex`Mx_{kij}\ge\sum_{p\in P}y_{kijp}`, tex`Add the units of every product carried on a leg ($y_{kijp}$). If the truck skips that leg ($x_{kij}=0$), the allowed load is zero. On a leg it uses, $M$ is a large upper limit and the truck capacity rule still applies.`, tex`k\in K,\ i,j\in N`],
    ],
  },
  {
    title: "Time constraints",
    equations: [
      [18, "Arrive before the end of the planning horizon.", tex`DT_{kij}+et_{ij}\le T`, tex`Add the departure time ($DT_{kij}$) and the drive time ($et_{ij}$) for the leg. The result must be at or before $T$, the end of the planning window.`, tex`k\in K,\ i,j\in N`],
      [19, "Departure times can only be updated in used routes.", tex`DT_{kij}\le Mx_{kij}`, tex`If truck $k$ skips a leg ($x_{kij}=0$), its departure time $DT_{kij}$ for that leg is forced to zero. For a leg it drives, $M$ is a large upper limit.`, tex`k\in K,\ i,j\in N`],
      [20, "Pickups from the cross-dock start at time zero.", tex`DT_{k0j}=0`, tex`Set $DT_{k0j}$ to zero for each pickup leg from the cross-dock to a supplier. Pickup routes start at the beginning of the planning window.`, tex`k\in K,\ j\in S_0`],
      [21, "Give each outgoing leg an upper bound based on arrival time.", tex`DT_{kj\ell}\le\sum_{i\in N}(et_{ij}x_{kij}+DT_{kij})`, tex`At a supplier or customer, add the departure time and drive time of the incoming leg to find when the truck arrives. Each potential outgoing leg has a departure time $DT_{kj\ell}$ no later than that arrival time. Equation (22) supplies the other half of the rule.`, tex`k\in K,\ j\in S\cup D,\ \ell\in N`],
      [22, "Together with (21), make the used leg depart at the arrival time.", tex`\sum_{\ell\in N}DT_{kj\ell}\ge\sum_{i\in N}(et_{ij}x_{kij}+DT_{kij})`, tex`At a supplier or customer, the sum of the outgoing departure times ($DT_{kj\ell}$) must be at least the truck’s arrival time. Unused legs have departure time zero, so together with (21), the used leg’s departure time equals the arrival time.`, tex`k\in K,\ j\in S\cup D`],
    ],
  },
  {
    title: "Inventory flow at Cross Dock",
    equations: [
      [23, "A truck can unload up to what it brought to the cross-dock.", tex`\sum_{t\in TP}IA_{kpt}\le\sum_{i\in S}y_{ki0p}`, tex`For one truck and product, add the amounts unloaded at the cross-dock across all waves ($IA_{kpt}$). It can unload only as much as it carried back from suppliers ($y_{ki0p}$).`, tex`k\in K,\ p\in P`],
      [24, "Account for the goods each truck takes out for delivery.", tex`\sum_{t\in TP}ID_{kpt}\ge\sum_{j\in D}y_{k0jp}`, tex`For one truck and product, add the amounts loaded for delivery across all waves ($ID_{kpt}$). That total must cover what the truck carries out from the cross-dock to customers ($y_{k0jp}$).`, tex`k\in K,\ p\in P`],
      [25, "Unload only in the truck’s assigned wave.", tex`\sum_{p\in P}IA_{kpt}\le MCD_{kt}`, tex`Add all products truck $k$ unloads in wave $t$. If it is outside that wave ($CD_{kt}=0$), the total $IA_{kpt}$ across products must be zero.`, tex`k\in K,\ t\in TP`],
      [26, "Load only in the truck’s assigned wave.", tex`\sum_{p\in P}ID_{kpt}\le MCD_{kt}`, tex`Add all products truck $k$ loads in wave $t$. If it is outside that wave ($CD_{kt}=0$), the total $ID_{kpt}$ across products must be zero.`, tex`k\in K,\ t\in TP`],
      [27, "First wave inventory is what came in minus what went out.", tex`I_{p0}=\sum_{k\in K}IA_{kp0}-\sum_{k\in K}ID_{kp0}`, tex`To find the stock after the first wave ($I_{p0}$), add what all trucks unload ($IA_{kp0}$) and subtract what they take out for delivery ($ID_{kp0}$). Repeat for each product.`, tex`p\in P`],
      [28, "Later waves also count stock left over from the previous wave.", tex`I_{pt}=I_{p,t-1}+\sum_{k\in K}IA_{kpt}-\sum_{k\in K}ID_{kpt}`, tex`To find the stock after a later wave ($I_{pt}$), carry forward the stock from the previous wave ($I_{p,t-1}$), add what arrives ($IA_{kpt}$), and subtract what goes out ($ID_{kpt}$). Repeat for each product.`, tex`p\in P,\ t\in TP,\ t>0`],
      [29, "A truck in use needs a wave assignment.", tex`\sum_{t\in TP}CD_{kt}\ge 1-M(1-z_k)`, tex`Count the waves assigned to truck $k$ by adding $CD_{kt}$ across waves. If the truck is used ($z_k=1$), the count must be at least one. The large number $M$ removes the requirement for an unused truck.`, tex`k\in K`],
      [30, "A truck can be assigned to at most one wave.", tex`\sum_{t\in TP}CD_{kt}\le 1`, tex`Add up a truck’s wave assignments ($CD_{kt}$). The count can be at most one, so a truck cannot belong to two waves.`, tex`k\in K`],
    ],
  },
  {
    title: "Arrival and departure at the cross-dock",
    note: "In the paper, the big-M terms in (33) and (34) have minus and plus signs, respectively. The equations here use the signs in the notebook code, which relax the bounds for waves a truck isn’t assigned to.",
    equations: [
      [31, "Arrival time ordering.", tex`AT_t\ge AT_{t-1}`, tex`A later wave’s departure time ($AT_t$) must be at least as late as the previous wave’s time ($AT_{t-1}$). Waves can leave at the same time.`, tex`t\in TP,\ t>0`],
      [32, "Find latest arrival time at cross-dock.", tex`AT_t\ge\sum_{i\in S}(et_{i0}x_{ki0}+DT_{ki0})-M(1-CD_{kt})`, tex`For each truck assigned to wave $t$, add the departure time and drive time of its return leg to find when it gets back. The wave time ($AT_t$) must be at least that late for every truck in the wave. The $M$ term loosens the rule for trucks outside the wave.`, tex`k\in K,\ t\in TP`],
      [33, "Set the upper bound on departure for the assigned wave.", tex`\sum_{j\in D}DT_{k0j}\le AT_t+M(1-CD_{kt})`, tex`When a truck is assigned to wave $t$ ($CD_{kt}=1$), the sum of its delivery departure times from the cross-dock cannot exceed the wave time ($AT_t$). The $M$ term loosens the limit for other waves.`, tex`k\in K,\ t\in TP`],
      [34, "Set the lower bound to the same time for the assigned wave.", tex`\sum_{j\in D}DT_{k0j}\ge AT_t-M(1-CD_{kt})`, tex`When a truck is assigned to wave $t$ ($CD_{kt}=1$), the sum of its delivery departure times from the cross-dock must be at least the wave time ($AT_t$). Together with (33), this makes the truck leave at the wave time.`, tex`k\in K,\ t\in TP`],
    ],
  },
  {
    title: "Binary variables",
    equations: [
      [35, "Each of these decisions is either zero or one.", tex`z_k,\ x_{kij},\ CD_{kt}\in\{0,1\}`, tex`The model uses three yes-or-no decisions. $z_k$ says whether a truck is used, $x_{kij}$ says whether it drives a leg, and $CD_{kt}$ says whether it belongs to a wave. In each case, 1 means yes and 0 means no.`, tex`k\in K,\ i,j\in N,\ t\in TP`],
    ],
  },
];

export const replayObjective = tex`\begin{aligned}
  \min\ &H \\
  H &\ge\sum_{i\in D}(DT_{ki0}+et_{i0}x_{ki0}) \qquad k\in K
\end{aligned}`;

export const replayTranslation = [
  tex`$H$ is the return time of the last truck. The replay searches for the smallest possible value of $H$.`,
  tex`For each truck, the sum adds the time it leaves its final delivery stop ($DT_{ki0}$) and the drive time back to the cross-dock ($et_{i0}$). $H$ must be at least that late for every truck.`,
];

export const notation = {
  route: [tex`x_{kij}`, "1 if truck k drives from stop i to stop j, 0 otherwise."],
  used: [tex`z_k`, "1 if truck k is used, 0 otherwise."],
  assignment: [tex`CD_{kt}`, "1 if truck k is in delivery wave t, 0 otherwise."],
  load: [tex`y_{kijp}`, "Units of product p on truck k as it drives from i to j."],
  departure: [tex`DT_{kij}`, "When truck k leaves stop i for stop j."],
  stock: [tex`I_{pt}`, "Units of product p left at the cross-dock after wave t."],
  unload: [tex`IA_{kpt}`, "Units of product p that truck k unloads at the cross-dock in wave t."],
  reload: [tex`ID_{kpt}`, "Units of product p that truck k takes from the cross-dock in wave t."],
  arrival: [tex`AT_t`, "Departure time for wave t. It can be no earlier than the last pickup truck’s return to the cross-dock."],
  replayEnd: [tex`H`, "Time when the last truck returns in the replay."],
  travelCost: [tex`tc_{ij}`, "Cost of driving from stop i to stop j."],
  rental: [tex`c_k`, "Cost of hiring truck k."],
  road: [tex`R_{ij}`, "1 if trucks can drive from stop i to stop j, 0 otherwise."],
  volume: [tex`V_p`, "Space taken up by one unit of product p."],
  capacity: [tex`Q_k`, "Space available in truck k."],
  supply: [tex`s_{ip},\ s_{jp}`, "Units of product p available at the supplier indexed by i or j."],
  demand: [tex`d_{jp}`, "Units of product p ordered by customer j."],
  travelTime: [tex`et_{ij}`, "Time to drive from stop i to stop j."],
  horizon: [tex`T`, "End of the time available for the whole plan."],
  largeNumber: [tex`M`, "A large number used to turn a limit off when a choice doesn’t apply."],
  trucks: [tex`K`, "All trucks."],
  truck: [tex`k`, "One truck."],
  products: [tex`P`, "All products."],
  product: [tex`p`, "One product."],
  waves: [tex`TP`, "All delivery waves."],
  wave: [tex`t`, "One delivery wave. The first is wave 0, and t−1 means the previous wave."],
  stops: [tex`N,\ S,\ D`, "All stops, supplier stops, and customer stops, respectively."],
  stopsByType: [tex`S_0,\ D_0`, "Supplier stops plus the cross-dock, and customer stops plus the cross-dock."],
  stop: [tex`i,\ j,\ \ell`, "Labels for individual stops. In a route from i to j, i is the start and j is the next stop."],
  dock: [tex`0`, "As a stop label, 0 is the cross-dock."],
} as const;

export type NotationKey = keyof typeof notation;
