import { useEffect, useRef, useState } from "react";
import brandIcon from "../assets/icon.svg";
import { fieldSystemsRoute, routingLabRoute, visualizerRoute, webProjectsLink } from "../projectRoutes";

export default function Navbar({ route }: { route: string }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const header = useRef<HTMLElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const researchPage = route === routingLabRoute || route === visualizerRoute;
  const home = route === "" || route === "#/" || route === "#home";

  useEffect(() => {
    if (!menuOpen) return;

    const close = () => setMenuOpen(false);
    const dismissOutside = (event: Event) => {
      if (event.target instanceof Node && !header.current?.contains(event.target)) close();
    };

    document.addEventListener("pointerdown", dismissOutside);
    document.addEventListener("focusin", dismissOutside);
    window.addEventListener("hashchange", close);
    return () => {
      document.removeEventListener("pointerdown", dismissOutside);
      document.removeEventListener("focusin", dismissOutside);
      window.removeEventListener("hashchange", close);
    };
  }, [menuOpen]);

  return (
    <header
      className="portfolio-header"
      ref={header}
      onKeyDown={(event) => {
        if (!menuOpen || event.key !== "Escape") return;
        setMenuOpen(false);
        toggle.current?.focus();
      }}
    >
      <div className="portfolio-wrap portfolio-nav">
        <a className="portfolio-brand" href="#home" aria-current={home ? "page" : undefined} onClick={() => setMenuOpen(false)}>
          <img className="portfolio-brand-icon" src={brandIcon} alt="" width={24} height={24} />
          Mustafa Turner
        </a>
        <button
          className="portfolio-menu-toggle"
          type="button"
          ref={toggle}
          aria-label={menuOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={menuOpen}
          aria-controls="portfolio-navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d={menuOpen ? "m6 6 12 12M6 18 18 6" : "M4 6h16M4 12h16M4 18h16"} />
          </svg>
        </button>
        <nav id="portfolio-navigation" aria-label="Portfolio navigation" data-open={menuOpen} onClick={() => setMenuOpen(false)}>
          <a href="#projects" aria-current={researchPage || route === "#projects" ? "location" : undefined}>Research</a>
          <a href={fieldSystemsRoute} aria-current={route === fieldSystemsRoute ? "page" : undefined}>Field systems</a>
          <a href={webProjectsLink} aria-current={route === webProjectsLink ? "location" : undefined}>Web projects</a>
          <a href="#about" aria-current={route === "#about" ? "location" : undefined}>About</a>
          <a href="#contact" aria-current={route === "#contact" ? "location" : undefined}>Contact</a>
        </nav>
      </div>
    </header>
  );
}
