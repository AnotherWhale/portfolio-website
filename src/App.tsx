import React, { useEffect, useRef, useState } from "react";
import { Parallax, ParallaxLayer, IParallax } from "@react-spring/parallax";
import Navbar from "./components/Navbar";
import Wave from "./components/Wave";
import wave1 from "./assets/wave1.json";
import wave2 from "./assets/wave2.json";
import wave3 from "./assets/wave3.json";
import wave4 from "./assets/wave4.json";

import Card from "./components/Card";
import { useScroll, animated, useSpring } from "react-spring";

const App = () => {
  const parallax = useRef<IParallax>(null!);
  const navRef = useRef<HTMLDivElement>(null);
  const [invisibleNav, setInvisibleNav] = useState(true);

  useEffect(() => {
    if (!navRef.current) return;

    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      console.log("entry", entry);
      setInvisibleNav(entry.isIntersecting);
    });

    observer.observe(navRef.current);
  }, [navRef.current]);

  return (
    <>
      <Parallax ref={parallax} pages={4}>
        <ParallaxLayer sticky={{ start: 0, end: 3 }}>
          <animated.div>
            <Navbar
              invisibleNav={invisibleNav}
              onClickHome={() => parallax.current.scrollTo(0)}
              onClickAbout={() => parallax.current.scrollTo(1)}
              onClickProjects={() => parallax.current.scrollTo(2)}
              onClickContact={() => parallax.current.scrollTo(3)}
            />
          </animated.div>
        </ParallaxLayer>
        <ParallaxLayer className="-mt-96" speed={0.25} offset={0}>
          {/* <Wave waves={wave1} color="#263E3F" animationTime={20000} /> */}
        </ParallaxLayer>
        <ParallaxLayer className="-mt-96" speed={1} offset={0.1}>
          <Wave waves={wave2} color="#10576D" animationTime={19000} />
        </ParallaxLayer>
        <ParallaxLayer
          speed={0.05}
          className="flex w-full h-full justify-center items-center text-6xl -mt-40"
        >
          <div className="font-medium mx-4 text-center">
            Hello, my name is{" "}
            <span className="text-primary font-semibold">Mustafa Turner</span>
            <br />
          </div>
        </ParallaxLayer>
        <ParallaxLayer className="-mt-96" speed={2} offset={0.2}>
          <Wave waves={wave3} color="#DB924B" animationTime={18500} />
        </ParallaxLayer>
        <ParallaxLayer className="-mt-96" speed={3} offset={0.3}>
          <div>
            <div ref={navRef}>
              <Wave waves={wave4} color={"#20161F"} animationTime={19500} />
            </div>
            <div className="w-screen bg-base-100 h-screen"></div>
          </div>
        </ParallaxLayer>
        {/* Content */}
        <ParallaxLayer speed={2} offset={1}>
          <div className="pt-28">About</div>
        </ParallaxLayer>
        <ParallaxLayer speed={2} offset={2}>
          <div className="pt-28 grid sm:grid-cols-2 md:grid-cols-3 gap-4 w-full max-w-5xl justify-center mx-auto px-4">
            <Card />
            <Card />
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
