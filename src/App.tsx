import { lazy, Suspense, useEffect, useState } from "react";
import Portfolio from "./Portfolio";
import { routingLabRoute, visualizerRoute } from "./projectRoutes";

const projectPages = new Map([
  [visualizerRoute, lazy(() => import("./features/pso-sa/Visualizer"))],
  [routingLabRoute, lazy(() => import("./features/mpvrpcd/RoutingLab"))],
]);

export default function App() {
  const [route, setRoute] = useState(window.location.hash);
  const ProjectPage = projectPages.get(route);

  useEffect(() => {
    const update = () => setRoute(window.location.hash);
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);

  useEffect(() => {
    if (ProjectPage || route === "#/") {
      window.scrollTo(0, 0);
    } else if (route.startsWith("#")) {
      document.getElementById(route.slice(1))?.scrollIntoView();
    }
  }, [ProjectPage, route]);

  return ProjectPage ? (
    <Suspense fallback={<p className="p-8">Loading the project…</p>}>
      <ProjectPage />
    </Suspense>
  ) : (
    <Portfolio />
  );
}
