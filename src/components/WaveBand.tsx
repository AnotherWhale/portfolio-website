import { useEffect, useState } from "react";
import teal from "../assets/wave2.json";
import gold from "../assets/wave3.json";
import plum from "../assets/wave4.json";
import Wave from "./Wave";

const layers = [
  { frames: teal, fill: "var(--portfolio-teal)", duration: 19000, offset: 0 },
  { frames: gold, fill: "var(--portfolio-gold)", duration: 18500, offset: 110 },
  { frames: plum, fill: "var(--portfolio-background)", duration: 19500, offset: 210 },
];

export default function WaveBand() {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setAnimate(!preference.matches);
    update();
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);

  return (
    <svg className="portfolio-wave-band" viewBox="0 600 1920 625" preserveAspectRatio="none" aria-hidden="true">
      {layers.map((layer) => <Wave key={layer.fill} {...layer} animate={animate} />)}
    </svg>
  );
}
