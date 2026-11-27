export const lessonProducts = ["A", "B"] as const;
export type Cargo = Readonly<Record<typeof lessonProducts[number], number>>;
const emptyCargo: Cargo = { A: 0, B: 0 };

export const lessonStops = {
  hub: { label: "Depot", position: [250, 136] },
  supplier1: { label: "Supplier 1", position: [185, 91] },
  supplier2: { label: "Supplier 2", position: [72, 175] },
  customer1: { label: "Customer 1", position: [350, 66] },
  customer2: { label: "Customer 2", position: [440, 168] },
  customer3: { label: "Customer 3", position: [375, 113] },
} as const;

export type LessonStop = keyof typeof lessonStops;

export const lessonSupply = [
  { stop: "supplier1", cargo: { A: 9, B: 0 } },
  { stop: "supplier2", cargo: { A: 0, B: 14 } },
] as const;

export const lessonOrders = {
  customer1: { A: 2, B: 0 },
  customer2: { A: 0, B: 2 },
  customer3: { A: 7, B: 12 },
} as const satisfies Record<string, Cargo>;

export const lessonFleet = [{ id: 1, capacity: 10 }, { id: 2, capacity: 22 }] as const;
export type LessonTruck = typeof lessonFleet[number]["id"];
type Delivery = { stop: keyof typeof lessonOrders; cargo: Cargo };

export const lessonUnits = (cargo: Cargo) => cargo.A + cargo.B;
const addCargo = (first: Cargo, second: Cargo): Cargo => ({ A: first.A + second.A, B: first.B + second.B });
const subtractCargo = (first: Cargo, second: Cargo): Cargo => ({ A: first.A - second.A, B: first.B - second.B });
const hasCargo = (stock: Cargo, load: Cargo) => lessonProducts.every((product) => stock[product] >= load[product]);

export function lessonTravelMinutes(from: LessonStop, to: LessonStop) {
  const [x1, y1] = lessonStops[from].position;
  const [x2, y2] = lessonStops[to].position;
  return Math.round(Math.hypot(x1 - x2, y1 - y2) / 8);
}

const wholeOrderPlan: Record<LessonTruck, readonly Delivery[]> = {
  1: [{ stop: "customer1", cargo: lessonOrders.customer1 }],
  2: [
    { stop: "customer3", cargo: lessonOrders.customer3 },
    { stop: "customer2", cargo: lessonOrders.customer2 },
  ],
};

const alternativePlan: typeof wholeOrderPlan = {
  1: [
    { stop: "customer1", cargo: lessonOrders.customer1 },
    { stop: "customer2", cargo: lessonOrders.customer2 },
  ],
  2: [{ stop: "customer3", cargo: lessonOrders.customer3 }],
};

const splitOrderPlan: typeof wholeOrderPlan = {
  1: [
    { stop: "customer1", cargo: lessonOrders.customer1 },
    { stop: "customer3", cargo: { A: lessonOrders.customer3.A, B: 0 } },
  ],
  2: [
    { stop: "customer3", cargo: { A: 0, B: lessonOrders.customer3.B } },
    { stop: "customer2", cargo: lessonOrders.customer2 },
  ],
};

export function createLessonPlan({ crossDock = false, alternative = false, splits = false, waves = false } = {}) {
  const assignments = splits ? splitOrderPlan : alternative ? alternativePlan : wholeOrderPlan;
  const inbound = lessonSupply.map(({ stop, cargo }, index) => ({
    stop, cargo, truck: lessonFleet[index].id, minute: crossDock ? lessonTravelMinutes("hub", stop) * 2 : 0,
  }));
  const allReady = Math.max(...inbound.map(({ minute }) => minute));
  const loads = lessonFleet.map((truck) => ({
    ...truck,
    cargo: assignments[truck.id].map(({ cargo }) => cargo).reduce(addCargo, emptyCargo),
  }));
  const groups: { minute: number; trucks: LessonTruck[]; cargo: Cargo }[] = [];
  let remaining = loads;
  let stock = emptyCargo;
  for (const minute of [...new Set(inbound.map((entry) => entry.minute))].sort((a, b) => a - b)) {
    const arrivals = inbound.filter((entry) => entry.minute === minute);
    stock = addCargo(stock, arrivals.map(({ cargo }) => cargo).reduce(addCargo, emptyCargo));
    if (!waves && minute < allReady) continue;

    const departing: LessonTruck[] = [];
    let loaded = emptyCargo;
    for (const truck of remaining) {
      const returned = inbound.some((entry) => entry.truck === truck.id && entry.minute <= minute);
      if (returned && hasCargo(stock, truck.cargo)) {
        departing.push(truck.id);
        loaded = addCargo(loaded, truck.cargo);
        stock = subtractCargo(stock, truck.cargo);
      }
    }
    if (departing.length > 0) groups.push({ minute, trucks: departing, cargo: loaded });
    remaining = remaining.filter(({ id }) => !departing.includes(id));
  }

  const routes = loads.flatMap(({ id, capacity, cargo }) => {
    const group = groups.find(({ trucks }) => trucks.includes(id));
    if (!group) return [];
    const depart = group.minute;
    let previous: LessonStop = "hub";
    let minute = depart;
    const deliveries = assignments[id].map((order) => {
      minute += lessonTravelMinutes(previous, order.stop);
      previous = order.stop;
      return { ...order, truck: id, minute };
    });
    const travel = minute - depart + lessonTravelMinutes(previous, "hub");
    const stops: LessonStop[] = ["hub", ...deliveries.map(({ stop }) => stop), "hub"];
    return [{ truck: id, capacity, cargo, depart, returnAt: depart + travel, travel, stops, deliveries }];
  });
  const customer3 = routes.flatMap(({ deliveries }) =>
    deliveries.filter(({ stop }) => stop === "customer3")).sort((a, b) => a.minute - b.minute);
  return {
    inbound, allReady, groups, routes, customer3,
    deliveryTravel: routes.reduce((total, { travel }) => total + travel, 0),
    end: Math.max(0, ...routes.map(({ returnAt }) => returnAt)),
  };
}

export type LessonPlan = ReturnType<typeof createLessonPlan>;

export function inspectDeparture(plan: LessonPlan, minute: number) {
  const group = plan.groups.find((entry) => entry.minute >= minute);
  const received = plan.inbound.filter((entry) => entry.minute <= minute).map(({ cargo }) => cargo).reduce(addCargo, emptyCargo);
  const dispatched = plan.groups.filter((entry) => entry.minute < minute).map(({ cargo }) => cargo).reduce(addCargo, emptyCargo);
  const available = subtractCargo(received, dispatched);
  const needed = group?.cargo ?? emptyCargo;
  const short = {
    A: Math.max(0, needed.A - available.A),
    B: Math.max(0, needed.B - available.B),
  };
  const waitingFor = plan.inbound.filter((entry) => entry.minute > minute && group?.trucks.includes(entry.truck));
  return { group, available, needed, short, waitingFor };
}
