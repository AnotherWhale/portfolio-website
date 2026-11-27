import { lazy, Suspense, useEffect, useRef, useState } from "react";
import PeriodPlayback from "./PeriodPlayback";
import RouteMap from "./RouteMap";
import FormulationTour, { FormulationAppendix } from "./FormulationTour";
import StopDetails from "./StopDetails";
import { ReplayFulfillment, ReplayInventory } from "./ReplayReadouts";
import { replaySnapshot, run } from "./replay";
import "./routingLab.css";

const replaySpeed = 20;
const paper = "https://ieomsociety.org/proceedings/2022orlando/423.pdf";
const notebook = "https://github.com/AnotherWhale/VRPCD/blob/main/VRPCD.ipynb";
const ReplayObjective = lazy(() => import("./ModelEquations").then(({ ReplayObjective }) => ({ default: ReplayObjective })));
const exampleCustomer = 9;
const firstDelivery = Math.min(...run.visits.filter(({ node }) => node === exampleCustomer).map(({ minute }) => minute));

export default function RoutingLab() {
  const [minute, setMinute] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [selectedNode, setSelectedNode] = useState(exampleCustomer);
  const replayHeadingRef = useRef<HTMLHeadingElement>(null);
  const isPlaying = playing && minute < run.duration;
  const snapshot = replaySnapshot(minute);

  useEffect(() => {
    if (!isPlaying) return;
    let previous = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now();
      const elapsed = (now - previous) / 1000;
      previous = now;
      setMinute((value) => Math.min(run.duration, value + elapsed * replaySpeed));
    }, 50);
    return () => window.clearInterval(timer);
  }, [isPlaying]);

  const seek = (value: number) => {
    setPlaying(false);
    setMinute(value);
  };

  const togglePlayback = () => {
    if (minute === run.duration) setMinute(0);
    setPlaying(!isPlaying);
  };

  const showFirstDelivery = () => {
    setSelectedNode(exampleCustomer);
    seek(firstDelivery);
  };

  const showEquations = () => {
    const heading = document.getElementById("formulation-index-title");
    heading?.scrollIntoView({ block: "start" });
    heading?.focus({ preventScroll: true });
  };

  const showLesson = () => {
    const lesson = document.getElementById("routing-lesson-title");
    lesson?.scrollIntoView({ block: "start" });
    lesson?.focus({ preventScroll: true });
  };

  const showReplay = () => {
    replayHeadingRef.current?.scrollIntoView({ block: "start" });
    replayHeadingRef.current?.focus({ preventScroll: true });
  };

  return (
    <main className="routing-lab">
      <header className="routing-header">
        <p className="routing-kicker">Vehicle routing research · IEOM 2022</p>
        <h1>Vehicle routing with cross-docking</h1>
        <div className="routing-intro">
          <section aria-labelledby="vrp-definition">
            <h2 id="vrp-definition">What is a vehicle routing problem?</h2>
            <p>A vehicle routing problem (VRP) assigns customers to vehicles and puts each vehicle’s stops in order. A common goal is to minimize total distance while respecting limits such as vehicle capacity.</p>
          </section>
          <section aria-labelledby="vrp-model">
            <h2 id="vrp-model">What does the thesis model?</h2>
            <p>Trucks transfer goods at a cross-dock, where pickups are sorted and reloaded for delivery. The model minimizes travel and truck hire costs while allowing split loads, different truck sizes, and staggered departures.</p>
          </section>
        </div>
        <div className="routing-intro-actions">
          <button className="portfolio-button routing-primary-action" type="button" onClick={showLesson}>Worked example</button>
          <button className="routing-text-action" type="button" onClick={showReplay}>Replay</button>
          <button className="routing-text-action" type="button" onClick={showEquations}>Model equations</button>
          <a href={paper} target="_blank" rel="noreferrer">Read the paper</a>
        </div>
      </header>

      <FormulationTour paperHref={paper} />

      <section className="routing-replay" aria-labelledby="routing-example-title">
        <div className="routing-section routing-example">
          <h2 id="routing-example-title" ref={replayHeadingRef} tabIndex={-1}>Benchmark replay</h2>
          <p>This saved benchmark run uses five trucks. Two of them deliver portions of Customer 9’s order. The notebook’s objective is to minimize the time at which the last truck returns. The published model uses a cost objective.</p>
        </div>

        <div className="routing-layout">
          <div className="routing-section">
            <ReplayFulfillment snapshot={snapshot} />
            <PeriodPlayback minute={minute} playing={isPlaying} onToggle={togglePlayback} onSeek={seek}
              onFirstDelivery={showFirstDelivery}>
              <RouteMap minute={minute} snapshot={snapshot} selectedNode={selectedNode} onSelect={setSelectedNode} />
            </PeriodPlayback>
            <ReplayInventory snapshot={snapshot} />
          </div>
          <div className="routing-replay-sidebar">
            <StopDetails node={selectedNode} snapshot={snapshot} onSeek={seek} />
          </div>
        </div>
        <details className="routing-section routing-run formulation-equations">
          <summary>Notebook run details</summary>
          <dl>
            <div><dt>Test case</dt><dd>10-{run.instance}</dd></div>
            <div><dt>Last truck return</dt><dd>{Math.round(run.objective)} min</dd></div>
            <div><dt>Optimality gap</dt><dd>{run.gap.toFixed(1)}%</dd></div>
          </dl>
          <p>Gurobi calculated a lower bound on the best possible return time. The optimality gap expresses the difference between the return time of the computed solution and that bound as a percentage of the computed return time.</p>
          <a href={notebook} target="_blank" rel="noreferrer">View the notebook</a>
          <details className="formulation-equations">
            <summary>View the replay objective</summary>
            <Suspense fallback={<p>Loading the replay objective…</p>}>
              <ReplayObjective />
            </Suspense>
          </details>
        </details>
      </section>
      <FormulationAppendix />
    </main>
  );
}
