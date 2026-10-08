import { FC } from "react";
import { animated, useSpring } from "react-spring";
import { useState, useEffect } from "react";

interface WaveProps {
  waves: string[];
  color: string;
  animationTime: number;
  extendFill?: boolean;
}

const Wave: FC<WaveProps> = ({ waves, color, animationTime, extendFill = false }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const animationProps = useSpring({
    wave: waves[activeIndex],
    config: { duration: animationTime },
  });

  useEffect(() => {
    const intervalId = setInterval(() => {
      setActiveIndex((prevActiveIndex) => {
        if (prevActiveIndex === 0) return 1;
        if (prevActiveIndex === 1) return 2;
        return 0;
      });
    }, animationTime);

    // Call the callback function once before starting the interval
    setActiveIndex((prevActiveIndex) => {
      if (prevActiveIndex === 0) return 1;
      if (prevActiveIndex === 1) return 2;
      return 0;
    });

    return () => clearInterval(intervalId);
  }, []);

  return (
    <svg
      className="wave-art"
      style={extendFill ? { overflow: "visible" } : undefined}
      aria-hidden="true"
      preserveAspectRatio="none"
      viewBox="0 0 1920 1080"
      width="1920"
      height="1080"
      xmlns="http://www.w3.org/2000/svg"
      version="1.1"
    >
      <animated.path
        d={animationProps.wave}
        fill={color}
        strokeLinecap="round"
        strokeLinejoin="miter"
      ></animated.path>
      {extendFill && <rect x="0" y="1079" width="1920" height="10800" fill={color} />}
    </svg>
  );
};

export default Wave;
