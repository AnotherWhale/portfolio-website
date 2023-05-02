import React, { FC } from "react";
import { SpringValue, animated, useSpring } from "react-spring";
import { useState, useEffect } from "react";

const waves = [
  "M0 47L18.8 46.5C37.7 46 75.3 45 113 49.2C150.7 53.3 188.3 62.7 226 65.3C263.7 68 301.3 64 339 59.2C376.7 54.3 414.3 48.7 452 46.3C489.7 44 527.3 45 565 43.2C602.7 41.3 640.3 36.7 678 36.8C715.7 37 753.3 42 791 44.3C828.7 46.7 866.3 46.3 903.8 46.8C941.3 47.3 978.7 48.7 1016.2 51.8C1053.7 55 1091.3 60 1129 59.8C1166.7 59.7 1204.3 54.3 1242 53.2C1279.7 52 1317.3 55 1355 57.2C1392.7 59.3 1430.3 60.7 1468 61.5C1505.7 62.3 1543.3 62.7 1581 62.5C1618.7 62.3 1656.3 61.7 1694 57.2C1731.7 52.7 1769.3 44.3 1807 46.2C1844.7 48 1882.3 60 1901.2 66L1920 72L1920 0L1901.2 0C1882.3 0 1844.7 0 1807 0C1769.3 0 1731.7 0 1694 0C1656.3 0 1618.7 0 1581 0C1543.3 0 1505.7 0 1468 0C1430.3 0 1392.7 0 1355 0C1317.3 0 1279.7 0 1242 0C1204.3 0 1166.7 0 1129 0C1091.3 0 1053.7 0 1016.2 0C978.7 0 941.3 0 903.8 0C866.3 0 828.7 0 791 0C753.3 0 715.7 0 678 0C640.3 0 602.7 0 565 0C527.3 0 489.7 0 452 0C414.3 0 376.7 0 339 0C301.3 0 263.7 0 226 0C188.3 0 150.7 0 113 0C75.3 0 37.7 0 18.8 0L0 0Z",
  "M0 71L18.8 65.5C37.7 60 75.3 49 113 49.5C150.7 50 188.3 62 226 63.3C263.7 64.7 301.3 55.3 339 52.2C376.7 49 414.3 52 452 51C489.7 50 527.3 45 565 43.8C602.7 42.7 640.3 45.3 678 47.2C715.7 49 753.3 50 791 49.7C828.7 49.3 866.3 47.7 903.8 47C941.3 46.3 978.7 46.7 1016.2 51C1053.7 55.3 1091.3 63.7 1129 63.3C1166.7 63 1204.3 54 1242 54C1279.7 54 1317.3 63 1355 61.2C1392.7 59.3 1430.3 46.7 1468 43.5C1505.7 40.3 1543.3 46.7 1581 47.8C1618.7 49 1656.3 45 1694 44.5C1731.7 44 1769.3 47 1807 46.2C1844.7 45.3 1882.3 40.7 1901.2 38.3L1920 36L1920 0L1901.2 0C1882.3 0 1844.7 0 1807 0C1769.3 0 1731.7 0 1694 0C1656.3 0 1618.7 0 1581 0C1543.3 0 1505.7 0 1468 0C1430.3 0 1392.7 0 1355 0C1317.3 0 1279.7 0 1242 0C1204.3 0 1166.7 0 1129 0C1091.3 0 1053.7 0 1016.2 0C978.7 0 941.3 0 903.8 0C866.3 0 828.7 0 791 0C753.3 0 715.7 0 678 0C640.3 0 602.7 0 565 0C527.3 0 489.7 0 452 0C414.3 0 376.7 0 339 0C301.3 0 263.7 0 226 0C188.3 0 150.7 0 113 0C75.3 0 37.7 0 18.8 0L0 0Z",
  "M0 35L18.8 40.7C37.7 46.3 75.3 57.7 113 63.8C150.7 70 188.3 71 226 67.2C263.7 63.3 301.3 54.7 339 52.2C376.7 49.7 414.3 53.3 452 56.8C489.7 60.3 527.3 63.7 565 65C602.7 66.3 640.3 65.7 678 65.3C715.7 65 753.3 65 791 59.7C828.7 54.3 866.3 43.7 903.8 45C941.3 46.3 978.7 59.7 1016.2 63.2C1053.7 66.7 1091.3 60.3 1129 59.2C1166.7 58 1204.3 62 1242 64.2C1279.7 66.3 1317.3 66.7 1355 61.2C1392.7 55.7 1430.3 44.3 1468 44.5C1505.7 44.7 1543.3 56.3 1581 60.5C1618.7 64.7 1656.3 61.3 1694 57.5C1731.7 53.7 1769.3 49.3 1807 50.7C1844.7 52 1882.3 59 1901.2 62.5L1920 66L1920 0L1901.2 0C1882.3 0 1844.7 0 1807 0C1769.3 0 1731.7 0 1694 0C1656.3 0 1618.7 0 1581 0C1543.3 0 1505.7 0 1468 0C1430.3 0 1392.7 0 1355 0C1317.3 0 1279.7 0 1242 0C1204.3 0 1166.7 0 1129 0C1091.3 0 1053.7 0 1016.2 0C978.7 0 941.3 0 903.8 0C866.3 0 828.7 0 791 0C753.3 0 715.7 0 678 0C640.3 0 602.7 0 565 0C527.3 0 489.7 0 452 0C414.3 0 376.7 0 339 0C301.3 0 263.7 0 226 0C188.3 0 150.7 0 113 0C75.3 0 37.7 0 18.8 0L0 0Z",
];

interface NavbarProps {
  onClickHome: React.MouseEventHandler;
  onClickAbout: React.MouseEventHandler;
  onClickProjects: React.MouseEventHandler;
  onClickContact: React.MouseEventHandler;
  invisibleNav: boolean;
}

const Navbar: FC<NavbarProps> = ({
  onClickHome,
  onClickAbout,
  onClickProjects,
  onClickContact,
  invisibleNav,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const animationProps = useSpring({
    wave: waves[activeIndex],
    config: { duration: 3000 },
  });

  useEffect(() => {
    const intervalId = setInterval(() => {
      setActiveIndex((prevActiveIndex) => {
        if (prevActiveIndex === 0) return 1;
        if (prevActiveIndex === 1) return 2;
        return 0;
      });
    }, 3000);

    // Call the callback function once before starting the interval
    setActiveIndex((prevActiveIndex) => {
      if (prevActiveIndex === 0) return 1;
      if (prevActiveIndex === 1) return 2;
      return 0;
    });

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div>
      <div className="navbar">
        <div className="flex-1">
          <a
            className="btn btn-ghost normal-case text-xl"
            onClick={onClickHome}
          >
            mustafa turner
          </a>
        </div>
        <div className="hidden md:flex">
          <ul className="menu menu-horizontal px-1 font-semibold">
            <li onClick={onClickAbout}>
              <a>About Me</a>
            </li>
            <li onClick={onClickProjects}>
              <a>Projects</a>
            </li>
            <li onClick={onClickContact}>
              <a>Get in Touch</a>
            </li>
          </ul>
        </div>
        <div className="dropdown dropdown-end md:hidden">
          <label tabIndex={0} className="btn btn-ghost btn-circle">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h7"
              />
            </svg>
          </label>
          <ul
            tabIndex={0}
            className="menu menu-compact dropdown-content mt-3 p-2 shadow bg-base-100 rounded-box w-52"
          >
            <li onClick={onClickAbout}>
              <a>About Me</a>
            </li>
            <li onClick={onClickProjects}>
              <a>Projects</a>
            </li>
            <li onClick={onClickContact}>
              <a>Get in Touch</a>
            </li>
          </ul>
        </div>
      </div>
      <animated.div
        // style={{ opacity: shapeOpacity }}
        className="w-full fixed top-0 -z-10"
      >
        <div
          className={`${
            invisibleNav ? "bg-base-100" : "bg-primary"
          } w-full h-10 xl:h-5 2xl:h-2 transition-colors duration-300`}
        ></div>
        <svg
          id="visual"
          viewBox="0 0 1920 1080"
          width="1920"
          height="1080"
          xmlns="http://www.w3.org/2000/svg"
          version="1.1"
        >
          <animated.path
            className="transition-colors duration-300"
            d={animationProps.wave}
            fill={invisibleNav ? "#20161F" : "#DB924B"}
            strokeLinecap="round"
            strokeLinejoin="miter"
          ></animated.path>
        </svg>
        {/* <img className="w-full" src="src/assets/wavetop.svg" alt="" /> */}
      </animated.div>
    </div>
  );
};

export default Navbar;
