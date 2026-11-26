import { lazy, Suspense, useEffect, useRef, useState } from "react";
import PeriodPlayback from "./PeriodPlayback";
import RouteMap from "./RouteMap";
import FormulationTour from "./FormulationTour";
import { routingThesisTitle } from "../../projectRoutes";
import StopDetails from "./StopDetails";
import { run } from "./replay";
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
    const lesson = document.getElementById("formulation-example");
    lesson?.scrollIntoView({ block: "start" });
    lesson?.focus({ preventScroll: true });
  };

  const showReplay = () => {
    replayHeadingRef.current?.scrollIntoView({ block: "start" });
    replayHeadingRef.current?.focus({ preventScroll: true });
  };

  return (
    <div className="portfolio">
      <main className="routing-lab">
        <nav className="routing-nav" aria-label="Thesis project links">
          <a href="#projects">Back to work</a>
          <button className="routing-nav-action" type="button" onClick={showEquations}>Model equations</button>
          <a href={paper} target="_blank" rel="noreferrer">Read the paper</a>
        </nav>

        <div className="routing-story">
          <header className="routing-header">
            <p className="routing-kicker">By Mustafa Turner · Published with Komarudin at IEOM 2022</p>
            <h1>{routingThesisTitle}</h1>
          </header>

          <section className="routing-replay" aria-labelledby="routing-example-title">
            <div className="routing-section routing-example">
              <h2 id="routing-example-title" ref={replayHeadingRef} tabIndex={-1}>Full research replay</h2>
              <p>Watch five trucks collect and deliver goods in a saved notebook run. The replay’s goal was the earliest return of the last truck. In the paper, the goal is the lowest combined driving and truck hire cost.</p>
            </div>

            <div className="routing-layout">
              <div className="routing-section">
                <PeriodPlayback minute={minute} playing={isPlaying} onToggle={togglePlayback} onSeek={seek}
                  onFirstDelivery={showFirstDelivery}>
                  <RouteMap minute={minute} selectedNode={selectedNode} onSelect={setSelectedNode} />
                </PeriodPlayback>
              </div>
              <div className="routing-replay-sidebar">
                <StopDetails node={selectedNode} minute={minute} onSeek={seek} />
              </div>
            </div>
            <details className="routing-section routing-run formulation-equations">
              <summary>Notebook run details</summary>
              <dl>
                <div><dt>Test case</dt><dd>10-{run.instance}</dd></div>
                <div><dt>Last truck return</dt><dd>{Math.round(run.objective)} min</dd></div>
                <div><dt>Optimality gap</dt><dd>{run.gap.toFixed(1)}%</dd></div>
              </dl>
              <p>Gurobi, the software used to find the plan, also calculated a lower limit on how early the last truck could return. The gap is the difference between the plan’s return time and that limit, as a percentage of the plan’s return time.</p>
              <a href={notebook} target="_blank" rel="noreferrer">View the notebook</a>
              <details className="formulation-equations">
                <summary>View the replay objective</summary>
                <Suspense fallback={<p>Loading the replay objective…</p>}>
                  <ReplayObjective />
                </Suspense>
              </details>
            </details>
            <button className="routing-text-action" type="button" onClick={showLesson}>Learn how the model works</button>
          </section>
        </div>

        <FormulationTour paperHref={paper} onShowReplay={showReplay} />

      </main>
    </div>
  );
}
