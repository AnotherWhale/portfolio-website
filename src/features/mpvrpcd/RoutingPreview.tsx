import MapIcon from "./MapIcon";

export default function RoutingPreview() {
  return (
    <svg viewBox="0 0 420 200" role="img" aria-label="Two delivery routes converge at a customer through a cross-dock">
      <g fill="none" strokeWidth="3" strokeLinecap="round">
        <path d="M65 55Q102 44 136 85L203 100Q248 54 304 55L357 98" stroke="var(--portfolio-highlight)" />
        <path d="M65 145Q100 151 136 117L203 100Q248 147 304 144L357 98" stroke="var(--portfolio-gold)" />
      </g>
      <MapIcon kind="supplier" x={65} y={55} size={35} />
      <MapIcon kind="supplier" x={65} y={145} size={35} />
      <MapIcon kind="depot" x={203} y={100} size={43} />
      <MapIcon kind="truck" x={304} y={55} size={32} color="var(--portfolio-highlight)" />
      <MapIcon kind="truck" x={304} y={144} size={32} color="var(--portfolio-gold)" />
      <MapIcon kind="customer" x={357} y={98} size={39} />
    </svg>
  );
}
