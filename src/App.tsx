import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Parallax, ParallaxLayer, IParallax } from "@react-spring/parallax";
import Navbar from "./components/Navbar";
import Wave from "./components/Wave";
import wave2 from "./assets/wave2.json";
import wave3 from "./assets/wave3.json";
import wave4 from "./assets/wave4.json";

import Card from "./components/Card";
import { animated } from "react-spring";

const AboutContent = () => (
  <>
    <h2 className="text-3xl font-semibold mb-6">A little about me</h2>
    <div className="space-y-5 text-base md:text-lg leading-relaxed max-w-3xl">
      <p>
        I'm an industrial engineer with a master's degree from Universitas Indonesia. I work on logistics and operations problems using simulation, optimization, and software development.
      </p>
      <p>
        I've built models of container depots and port operations in AnyLogic to study vehicle movements, resource use, and different operating scenarios. My experience also includes process mining and technology implementation.
      </p>
      <p>
        I use Python, SQL, and Gurobi for problems such as vehicle routing, cross-docking, and facility location. I also build software to make these models easier to use in day-to-day work.
      </p>
    </div>
  </>
);

const Visualizer = lazy(() => import("./features/pso-sa/Visualizer"));

const App = () => {
  const [route, setRoute] = useState(window.location.hash);
  useEffect(() => {
    const update = () => setRoute(window.location.hash);
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);
  return route === "#/projects/pso-sa"
    ? <Suspense fallback={<p className="p-8">Loading the visualizer…</p>}><Visualizer /></Suspense>
    : <Portfolio />;
};

const Portfolio = () => {
  const parallax = useRef<IParallax>(null!);
  const navRef = useRef<HTMLDivElement>(null);
  const mobileHeroRef = useRef<HTMLElement>(null);
  const desktopGreetingRef = useRef<HTMLDivElement>(null);
  const [invisibleNav, setInvisibleNav] = useState(true);
  const [mobile, setMobile] = useState(() => window.matchMedia("(max-width: 767px)").matches);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 767px)");
    const update = () => setMobile(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!mobile || !mobileHeroRef.current) return;
    const hero = mobileHeroRef.current;
    const greeting = hero.querySelector("h1");
    const layers = hero.querySelectorAll<SVGSVGElement>(".wave-art");
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;

    const update = () => {
      frame = 0;
      const distance = motionPreference.matches
        ? 0
        : Math.min(hero.offsetHeight, Math.max(0, -hero.getBoundingClientRect().top));
      layers.forEach((layer, index) => {
        layer.style.transform = `translate3d(0, ${-distance * [0.15, 0.35, 0.55][index]}px, 0)`;
      });
      if (greeting) greeting.style.transform = `translate3d(0, ${distance * 1.25}px, 0)`;
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    motionPreference.addEventListener("change", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      motionPreference.removeEventListener("change", schedule);
      window.cancelAnimationFrame(frame);
    };
  }, [mobile]);

  useEffect(() => {
    if (mobile) return;
    const container = parallax.current?.container.current as HTMLDivElement | undefined;
    if (!container) return;
    const update = () => {
      const greeting = desktopGreetingRef.current;
      if (!greeting) return;
      const progress = container.scrollTop / Math.max(1, container.clientHeight);
      // Negative parallax speed sends the greeting toward later pages; retire it
      // during the home transition so it cannot reappear behind their content.
      greeting.style.opacity = String(Math.max(0, Math.min(1, (0.55 - progress) / 0.3)));
      greeting.style.visibility = progress >= 0.55 ? "hidden" : "visible";
    };
    update();
    container.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      container.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [mobile]);

  useEffect(() => {
    if (!navRef.current) return;

    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      setInvisibleNav(entry.isIntersecting);
    });

    observer.observe(navRef.current);
    return () => observer.disconnect();
  }, [mobile]);

  if (mobile) {
    const goTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    return (
      <div className="mobile-layout">
        <header className="mobile-nav">
          <Navbar invisibleNav={false} onClickHome={() => goTo("home")} onClickAbout={() => goTo("about")} onClickProjects={() => goTo("projects")} onClickContact={() => goTo("contact")} />
        </header>
        <main>
          <section id="home" ref={mobileHeroRef} className="mobile-hero">
            <h1>Hello, my name is <span className="text-primary font-semibold">Mustafa Turner</span></h1>
            <div className="mobile-waves" aria-hidden="true">
              <Wave waves={wave2} color="#10576D" animationTime={19000} />
              <Wave waves={wave3} color="#DB924B" animationTime={18500} />
              <Wave waves={wave4} color="#20161F" animationTime={19500} extendFill />
            </div>
          </section>
          <section id="about" className="mobile-section"><AboutContent /></section>
          <section id="projects" className="mobile-section">
            <h2 className="mb-6">Projects</h2>
            <div className="grid grid-cols-1 min-[600px]:grid-cols-2 gap-4"><Card /></div>
          </section>
          <section id="contact" className="mobile-section"><h2>Contact</h2></section>
        </main>
      </div>
    );
  }

  return (
    <>
      <Parallax ref={parallax} pages={4}>
        <ParallaxLayer sticky={{ start: 0, end: 3 }} style={{ pointerEvents: "none", zIndex: 100 }}>
          <animated.div style={{ pointerEvents: "auto" }}>
            <Navbar
              invisibleNav={invisibleNav}
              onClickHome={() => parallax.current.scrollTo(0)}
              onClickAbout={() => parallax.current.scrollTo(1)}
              onClickProjects={() => parallax.current.scrollTo(2)}
              onClickContact={() => parallax.current.scrollTo(3)}
            />
          </animated.div>
        </ParallaxLayer>
        <ParallaxLayer className="-mt-96 pointer-events-none" speed={0.25} offset={0}>
          {/* <Wave waves={wave1} color="#263E3F" animationTime={20000} /> */}
        </ParallaxLayer>
        <ParallaxLayer className="-mt-96 pointer-events-none" speed={1} offset={0.1}>
          <Wave waves={wave2} color="#10576D" animationTime={19000} />
        </ParallaxLayer>
        <ParallaxLayer
          speed={-1.25}
          className="flex w-full h-full justify-center items-center text-6xl -mt-40 pointer-events-none"
        >
          <div ref={desktopGreetingRef} className="font-medium mx-4 text-center">
            Hello, my name is{" "}
            <span className="text-primary font-semibold">Mustafa Turner</span>
            <br />
          </div>
        </ParallaxLayer>
        <ParallaxLayer className="-mt-96 pointer-events-none" speed={2} offset={0.2}>
          <Wave waves={wave3} color="#DB924B" animationTime={18500} />
        </ParallaxLayer>
        <ParallaxLayer className="-mt-96 pointer-events-none" speed={3} offset={0.3}>
          <div>
            <div ref={navRef}>
              <Wave waves={wave4} color={"#20161F"} animationTime={19500} />
            </div>
            <div className="w-screen bg-base-100 h-screen"></div>
          </div>
        </ParallaxLayer>
        {/* Content */}
        <ParallaxLayer speed={2} offset={1}>
          <section className="pt-28 px-6 w-full max-w-4xl mx-auto"><AboutContent /></section>
        </ParallaxLayer>
        <ParallaxLayer speed={2} offset={2}>
          <div className="pt-28 grid sm:grid-cols-2 md:grid-cols-3 gap-4 w-full max-w-5xl justify-center mx-auto px-4">
            <Card />
          </div>
        </ParallaxLayer>
        <ParallaxLayer speed={2} offset={3}>
          <div className="pt-28">Contact</div>
        </ParallaxLayer>
      </Parallax>
    </>
  );
};

export default App;
