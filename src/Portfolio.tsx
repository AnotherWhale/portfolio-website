import FeaturedProject from "./components/FeaturedProject";
import WaveBand from "./components/WaveBand";
import RoutingPreview from "./features/mpvrpcd/RoutingPreview";
import ProjectPreview from "./features/pso-sa/ProjectPreview";
import berdayaBooking from "./assets/berdaya-booking.webp";
import ruangTanpaNamaHomepage from "./assets/ruang-tanpa-nama-homepage.webp";
import { fieldSystemCategories, fieldSystemsRoute, routingLabRoute, visualizerRoute, webProjectsSection } from "./projectRoutes";

const contactEmail = "mustafaturner@me.com";

const fieldSystemPreviews = {
  "fleet-tracking": {
    description: "Trailer positions and device history",
    path: "M3 8h17v13H3z M20 12h5l4 4v5h-9 M9 25a2 2 0 1 0 0-4 2 2 0 0 0 0 4z M24 25a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  },
  "crane-positioning": {
    description: "Local ranging and operator displays",
    path: "M4 28h12 M8 28V5l20 6H4l4-6 M12 11v17 M8 16l4 4-4 4 M25 11v9a2 2 0 0 1-4 0",
  },
  "gnss-corrections": {
    description: "Base stations, rovers, and RTCM streams",
    path: "M12 12l8 8 M9 15l6-6 8 8-6 6z M7 17l-4 4 4 4 4-4 M21 11l4-4 4 4-4 4 M20 4a8 8 0 0 1 8 8 M14 24a6 6 0 0 1-6 6",
  },
  "environmental-monitoring": {
    description: "Weather stations and tide loggers",
    path: "M9 19H7a4 4 0 0 1 0-8 6 6 0 0 1 11-2 5 5 0 1 1 3 10h-2 M4 25q3-3 6 0t6 0 6 0 6 0 M4 29q3-3 6 0t6 0 6 0 6 0",
  },
};

const webProjects = [
  {
    name: "Ruang Tanpa Nama",
    href: "https://ruangtanpanama.com/",
    summary: "A community publishing and ticketing site with an editor dashboard and Midtrans checkout for paid events.",
    preview: ruangTanpaNamaHomepage,
    previewAlt: "Ruang Tanpa Nama homepage with navigation for events, books, and videos",
    stack: [
      ["Next.js, React, and TypeScript", "Public website and editor dashboard"],
      ["Content API", "Supplies event records and editorial content"],
      ["Midtrans", "Ticket checkout and payment notifications"],
    ],
    features: [
      "Browse events, archives, books, and videos.",
      "Register and pay for ticketed events.",
      "Manage events, venues, tickets, videos, quotes, and topics in the editor dashboard.",
    ],
  },
  {
    name: "Berdaya",
    href: "https://berdaya.life/",
    summary: "A psychology clinic platform with online booking, Midtrans payments, and a back office for psychologists and clinic staff.",
    preview: berdayaBooking,
    previewAlt: "Berdaya appointment booking page with a link to choose a psychologist",
    stack: [
      ["Next.js, React, and TypeScript", "Public website and clinic back office"],
      ["Laravel API", "Booking, scheduling, and clinic records"],
      ["Midtrans", "Online payments for individual bookings"],
    ],
    features: [
      "Browse psychologist profiles and book individual or corporate appointments.",
      "Manage availability and appointments in the back office.",
      "Maintain clinical notes and handle billing and psychologist payments.",
    ],
  },
] as const;

export default function Portfolio() {
  return (
    <main className="portfolio-home">
      <section className="portfolio-hero" aria-labelledby="portfolio-name">
        <div className="portfolio-wrap portfolio-intro">
          <p className="portfolio-role">Industrial engineer</p>
          <h1 id="portfolio-name">Mustafa Turner</h1>
          <p className="portfolio-description">Optimization models for logistics and field systems for tracking, positioning, and environmental measurement.</p>
          <div className="portfolio-actions">
            <a className="portfolio-button portfolio-button-primary" href="#projects">Research</a>
            <a className="portfolio-button portfolio-button-secondary" href={fieldSystemsRoute}>Field systems</a>
          </div>
        </div>
        <WaveBand />
      </section>

      <section className="portfolio-wrap portfolio-section" id="projects" aria-labelledby="projects-heading">
        <h2 className="portfolio-heading" id="projects-heading">Research</h2>
        <div className="portfolio-projects">
          <FeaturedProject
            title="Vehicle routing with cross-docking"
            description="Published thesis on routes, cross-dock inventory, and split deliveries. Includes a worked example and a benchmark replay."
            preview={<RoutingPreview />}
            demoHref={routingLabRoute}
            demoLabel="Open routing lab"
            sourceHref="https://github.com/AnotherWhale/VRPCD"
          />
          <FeaturedProject
            title="PSO–SA optimization"
            description="Interactive comparison of particle swarm optimization with and without simulated annealing."
            preview={<ProjectPreview />}
            demoHref={visualizerRoute}
            demoLabel="Open visualizer"
            sourceHref="https://github.com/AnotherWhale/PSO-SA"
          />
        </div>
      </section>

      <section className="portfolio-wrap portfolio-section portfolio-work-summary" id="work" aria-labelledby="work-heading">
        <div>
          <h2 className="portfolio-heading" id="work-heading">Field systems</h2>
          <p>System diagrams and technical notes for field hardware, data collection, and monitoring dashboards.</p>
          <a className="portfolio-button portfolio-button-secondary" href={fieldSystemsRoute}>View field systems</a>
        </div>
        <ul className="portfolio-field-index">
          {fieldSystemCategories.map(({ id, title }) => (
            <li key={id}>
              <a className="portfolio-field-link" href={`${fieldSystemsRoute}/${id}`}>
                <svg className="portfolio-field-icon" viewBox="0 0 32 32" aria-hidden="true" fill="none" stroke="currentColor"
                  strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round">
                  <path d={fieldSystemPreviews[id].path} />
                </svg>
                <span className="portfolio-field-copy">
                  <strong>{title}</strong>
                  <span>{fieldSystemPreviews[id].description}</span>
                </span>
                <svg className="portfolio-field-chevron" viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor"
                  strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m6 4 4 4-4 4" />
                </svg>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="portfolio-wrap portfolio-section" id={webProjectsSection} aria-labelledby="web-projects-heading">
        <h2 className="portfolio-heading" id="web-projects-heading">Web projects</h2>
        <div className="portfolio-projects">
          {webProjects.map(({ name, href, preview, previewAlt, summary, stack, features }) => (
            <article className="portfolio-web-project" key={name}>
              <div className="portfolio-web-preview">
                <img src={preview} alt={previewAlt} width={1440} height={1000} loading="lazy" decoding="async" />
              </div>
              <div className="portfolio-web-copy">
                <h3><a href={href} aria-label={`Visit ${name}`}>{name}</a></h3>
                <p>{summary}</p>
                <details className="portfolio-web-details">
                  <summary>System architecture</summary>
                  <h4>Technology stack</h4>
                  <ul className="work-architecture-nodes">
                    {stack.map(([label, detail]) => (
                      <li key={label}><strong>{label}</strong><span>{detail}</span></li>
                    ))}
                  </ul>
                  <h4>Features</h4>
                  <ul className="portfolio-web-features">
                    {features.map((feature) => <li key={feature}>{feature}</li>)}
                  </ul>
                </details>
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className="portfolio-wrap portfolio-section portfolio-profile">
        <section className="portfolio-about" id="about" aria-labelledby="about-heading">
          <h2 className="portfolio-heading" id="about-heading">About</h2>
          <p>I’m an industrial engineer with a master’s degree from Universitas Indonesia. My background is in simulation and optimization, including models of port and container depot operations and research on vehicle routing, cross-docking, and facility location.</p>
          <p>I also build field systems for tracking, positioning, and environmental monitoring, and develop websites and web applications.</p>
          <p>I use this site as a project journal and portfolio. It’s a place to document what I’ve built and explain how it works.</p>
        </section>
        <section className="portfolio-contact" id="contact" aria-labelledby="contact-heading">
          <h2 className="portfolio-heading" id="contact-heading">Contact</h2>
          <a className="portfolio-contact-email" href={`mailto:${contactEmail}`}>{contactEmail}</a>
        </section>
      </div>
    </main>
  );
}
