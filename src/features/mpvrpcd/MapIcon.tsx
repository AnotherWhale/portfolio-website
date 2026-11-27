const outlines = {
  supplier: "M2 21V10l6 3V9l6 4V9l6 4v8ZM17 11V3h3v10M6 17h1m4 0h1m4 0h1",
  depot: "M3 21V9l9-6 9 6v12ZM7 21V11h10v10M7 15h10m-10 3h10",
  customer: "M3 11l9-7 9 7-2 0v10H5V11ZM10 21v-6h4v6",
  truck: "M1 5h13v13H1Zm13 5h4l5 4v4h-9Z",
  cargo: "M3 6h18v15H3ZM3 6l2-3h14l2 3M10 6v5h4V6m2 11h2",
} as const;

export type MapIconKind = keyof typeof outlines;

const cargoArea = {
  supplier: [2, 13, 18, 8],
  depot: [3, 9, 18, 12],
  customer: [5, 11, 14, 10],
  truck: [1, 5, 13, 13],
  cargo: [3, 6, 18, 15],
} as const satisfies Record<MapIconKind, readonly [number, number, number, number]>;

const cargoOutlines: Record<MapIconKind, string> = {
  supplier: "M2 21V10l6 3V9l6 4V9l3 2V3h3v18Z",
  depot: "M3 21V9l9-6 9 6v12Z",
  customer: "M5 21V11H3l9-7 9 7h-2v10Z",
  truck: outlines.truck,
  cargo: "M3 6l2-3h14l2 3v15H3Z",
};

export default function MapIcon({ kind, x = 0, y = 0, size = 28, color = "var(--portfolio-text)", heading, cargoLevels }: {
  kind: MapIconKind;
  x?: number;
  y?: number;
  size?: number;
  color?: string;
  heading?: number;
  cargoLevels?: readonly number[];
}) {
  const offset = size / 2;
  const facingLeft = heading !== undefined && Math.abs(heading) > 90;
  const orientation = heading === undefined ? "" : `rotate(${facingLeft ? heading + 180 : heading}) scale(${facingLeft ? -1 : 1} 1) `;
  const [left, top, width, height] = cargoArea[kind];
  const laneWidth = cargoLevels?.length ? width / cargoLevels.length : 0;
  const outline = cargoLevels ? cargoOutlines[kind] : outlines[kind];
  return (
    <g transform={`translate(${x} ${y}) ${orientation}translate(${-offset} ${-offset}) scale(${size / 24})`}
      data-map-icon={kind} aria-hidden="true" fill="var(--portfolio-background)" stroke={color}
      strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d={outline} stroke={cargoLevels ? "none" : undefined} />
      {cargoLevels && <>
        {cargoLevels.map((level, product) => {
          const x = left + product * laneWidth + .55;
          const lane = { x, y: top + .9, width: laneWidth - 1.1, height: height - 1.8, rx: .55 };
          return (
            <g key={product} stroke="none">
              <rect className="routing-icon-cargo-track" {...lane} />
              <rect className="routing-icon-cargo-fill" data-product={product} {...lane}
                style={{ transform: `scaleY(${level})` }} />
            </g>
          );
        })}
        <path d={outline} fill="none" />
      </>}
      {kind === "truck" && <><circle cx="6" cy="18" r="2.4" /><circle cx="18.5" cy="18" r="2.4" /></>}
    </g>
  );
}
