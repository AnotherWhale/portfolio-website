import { lazy, Suspense, useEffect, useState } from "react";
import Portfolio from "./Portfolio";

const visualizerRoute = "#/projects/pso-sa";
const Visualizer = lazy(() => import("./features/pso-sa/Visualizer"));

export default function App() {
  const [route, setRoute] = useState(window.location.hash);

  useEffect(() => {
    const update = () => setRoute(window.location.hash);
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);

  useEffect(() => {
    if (route === visualizerRoute || route === "#/") {
      window.scrollTo(0, 0);
    } else if (route.startsWith("#")) {
      document.getElementById(route.slice(1))?.scrollIntoView();
    }
  }, [route]);

  return route === visualizerRoute ? (
    <Suspense fallback={<p className="p-8">Loading the visualizer…</p>}>
      <Visualizer />
    </Suspense>
  ) : (
    <Portfolio visualizerHref={visualizerRoute} />
  );
}
