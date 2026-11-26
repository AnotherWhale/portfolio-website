import { useEffect, useState } from "react";
import { animated, useSpring } from "react-spring";

interface WaveProps {
  frames: readonly string[];
  fill: string;
  duration: number;
  offset: number;
  animate: boolean;
}

export default function Wave({ frames, fill, duration, offset, animate }: WaveProps) {
  const [frame, setFrame] = useState(0);
  const { path } = useSpring({
    path: frames[animate ? frame : 0],
    config: { duration },
    immediate: !animate,
  });

  useEffect(() => {
    if (!animate) return;
    const advance = () => setFrame((previous) => (previous + 1) % frames.length);
    advance();
    const timer = window.setInterval(advance, duration);
    return () => window.clearInterval(timer);
  }, [animate, duration, frames.length]);

  return (
    <g transform={`translate(0 ${offset})`} fill={fill}>
      <animated.path d={path} />
      <rect y="1080" width="1920" height="145" />
    </g>
  );
}
