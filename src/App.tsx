import { lazy, Suspense, useEffect, useState } from "react";
import Navbar from "./components/Navbar";
import Portfolio from "./Portfolio";
import { fieldSystemCategories, fieldSystemsRoute, legacyWorkRoute, routingLabRoute, visualizerRoute } from "./projectRoutes";
import "./portfolio.css";

const projectPages = new Map([
  [visualizerRoute, lazy(() => import("./features/pso-sa/Visualizer"))],
  [routingLabRoute, lazy(() => import("./features/mpvrpcd/RoutingLab"))],
]);

const FieldSystems = lazy(() => import("./components/FieldSystems"));

export default function App() {
  const [route, setRoute] = useState(window.location.hash);
  const fieldSection = fieldSystemCategories.find(({ id }) => route === `${fieldSystemsRoute}/${id}`)?.id;
  const currentRoute = route === legacyWorkRoute || fieldSection ? fieldSystemsRoute : route;
  const isFieldSystems = currentRoute === fieldSystemsRoute;
  const ProjectPage = projectPages.get(currentRoute);

  useEffect(() => {
    const update = () => setRoute(window.location.hash);
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);

  useEffect(() => {
    if (isFieldSystems) return;
    if (ProjectPage || route === "#/") {
      window.scrollTo(0, 0);
    } else if (route.startsWith("#")) {
      document.getElementById(route.slice(1))?.scrollIntoView();
    }
  }, [ProjectPage, route, isFieldSystems]);

  return (
    <div className="portfolio" id="home">
      <Navbar route={currentRoute} />
      {isFieldSystems || ProjectPage ? (
        <Suspense fallback={<main className="portfolio-wrap portfolio-loading">Loading…</main>}>
          {isFieldSystems ? <FieldSystems sectionId={fieldSection} /> : ProjectPage && <ProjectPage />}
        </Suspense>
      ) : <Portfolio />}
    </div>
  );
}
