import type { ReactNode } from "react";
import { run } from "./replay";

export default function PeriodPlayback({ minute, playing, onToggle, onSeek, onFirstDelivery, children }: {
  minute: number;
  playing: boolean;
  onToggle: () => void;
  onSeek: (minute: number) => void;
  onFirstDelivery: () => void;
  children: ReactNode;
}) {
  return (
    <div className="routing-playback">
      <div className="routing-playback-row">
        <button className="portfolio-button routing-primary-action" type="button" onClick={onToggle}>
          {playing ? "Pause" : minute === run.duration ? "Replay" : "Play"}
        </button>
        <button className="routing-text-action" type="button" onClick={onFirstDelivery}>First delivery to Customer 9</button>
        <output htmlFor="routing-minute" aria-label="Replay minute" aria-live="off">{Math.floor(minute)} / {run.duration} min</output>
      </div>
      {children}
      <input
        id="routing-minute"
        aria-label="Minutes since start"
        type="range"
        min={0}
        max={run.duration}
        value={Math.floor(minute)}
        step={1}
        aria-valuetext={`${Math.floor(minute)} minutes`}
        onChange={(event) => onSeek(Number(event.currentTarget.value))}
      />
      <div className="routing-jumps" aria-label="Jump to delivery wave" role="group">
        <button className="routing-text-action" type="button" onClick={() => onSeek(0)}>Start</button>
        {run.periods.map(({ id, start }) => (
          <button className="routing-text-action" type="button" key={id} onClick={() => onSeek(start)}>Delivery wave {id} · {start} min</button>
        ))}
      </div>
    </div>
  );
}
