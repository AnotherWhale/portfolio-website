import ContactForm from "./components/ContactForm";
import FeaturedProject from "./components/FeaturedProject";
import Navbar from "./components/Navbar";
import WaveBand from "./components/WaveBand";
import ProjectPreview from "./features/pso-sa/ProjectPreview";
import "./portfolio.css";

const contactEmail = "mustafaturner@me.com";

export default function Portfolio({ visualizerHref }: { visualizerHref: string }) {
  return (
    <div className="portfolio" id="home">
      <Navbar />
      <main>
        <section className="portfolio-hero" aria-labelledby="portfolio-name">
          <div className="portfolio-wrap portfolio-intro">
            <h1 id="portfolio-name">Mustafa Turner</h1>
            <p className="portfolio-role">Industrial engineer · Simulation &amp; optimization</p>
            <p className="portfolio-description">I build models and software for logistics and operations.</p>
            <div className="portfolio-actions">
              <a className="portfolio-button portfolio-button-primary" href="#projects">See featured project</a>
              <a className="portfolio-button portfolio-button-secondary" href="#contact">Get in touch</a>
            </div>
          </div>
          <WaveBand />
        </section>

        <section className="portfolio-wrap portfolio-section" id="projects" aria-labelledby="projects-heading">
          <h2 className="portfolio-section-label" id="projects-heading">Featured project</h2>
          <FeaturedProject
            title="PSO–SA optimization"
            description="Watch a particle swarm search for a minimum and see how simulated annealing changes its behavior."
            preview={<ProjectPreview />}
            demoHref={visualizerHref}
            demoLabel="Open visualizer"
            sourceHref="https://github.com/AnotherWhale/PSO-SA"
          />
        </section>

        <section className="portfolio-wrap portfolio-section portfolio-about" id="about" aria-labelledby="about-heading">
          <h2 className="portfolio-heading" id="about-heading">About me</h2>
          <p>I have a master’s degree from Universitas Indonesia. I’ve built AnyLogic models of port and container depot operations and used Python, SQL, and Gurobi to study vehicle routing, cross-docking, and facility location.</p>
        </section>

        <section className="portfolio-wrap portfolio-section portfolio-contact" id="contact" aria-labelledby="contact-heading">
          <div>
            <h2 className="portfolio-heading" id="contact-heading">Get in touch</h2>
            <p>Have a logistics problem or project in mind?</p>
            <a className="portfolio-contact-email" href={`mailto:${contactEmail}`}>{contactEmail}</a>
          </div>
          <ContactForm />
        </section>
      </main>
    </div>
  );
}
