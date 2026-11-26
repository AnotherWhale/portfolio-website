const outlines = {
  supplier: "M2 21V10l6 3V9l6 4V9l6 4v8ZM17 11V3h3v10M6 17h1m4 0h1m4 0h1",
  depot: "M3 21V9l9-6 9 6v12ZM7 21V11h10v10M7 15h10m-10 3h10",
  customer: "M3 11l9-7 9 7-2 0v10H5V11ZM10 21v-6h4v6",
  truck: "M1 5h13v13H1Zm13 5h4l5 4v4h-9Z",
} as const;

export type MapIconKind = keyof typeof outlines;

export default function MapIcon({ kind, x = 0, y = 0, size = 28, color = "var(--portfolio-text)" }: {
  kind: MapIconKind;
  x?: number;
  y?: number;
  size?: number;
  color?: string;
}) {
  const offset = size / 2;
  return (
    <g transform={`translate(${x - offset} ${y - offset}) scale(${size / 24})`}
      data-map-icon={kind} aria-hidden="true" fill="var(--portfolio-background)" stroke={color}
      strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d={outlines[kind]} />
      {kind === "truck" && <><circle cx="6" cy="18" r="2.4" /><circle cx="18.5" cy="18" r="2.4" /></>}
    </g>
  );
}
