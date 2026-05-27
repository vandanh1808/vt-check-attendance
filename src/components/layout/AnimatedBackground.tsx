"use client";

import { useMemo, useState, useEffect } from "react";
import Particles from "@tsparticles/react";
import type { ISourceOptions } from "@tsparticles/engine";
import { useTheme } from "@/hooks/useTheme";

const sakuraOptions: ISourceOptions = {
  fullScreen: false,
  fpsLimit: 60,
  background: {
    color: "transparent",
  },
  particles: {
    number: { value: 40, density: { enable: true } },
    color: { value: ["#ffb7c5", "#ff8faf", "#fca5c2", "#f9a8d4", "#fbb6ce", "#fecdd3"] },
    shape: { type: "circle" },
    opacity: {
      value: { min: 0.25, max: 0.65 },
      animation: { enable: true, speed: 0.3, startValue: "random", sync: false },
    },
    size: { value: { min: 2, max: 7 } },
    move: {
      enable: true,
      direction: "bottom",
      speed: { min: 0.5, max: 2 },
      straight: false,
      outModes: { default: "out" },
    },
    rotate: {
      value: { min: 0, max: 360 },
      direction: "random",
      animation: { enable: true, speed: 4 },
    },
    wobble: { enable: true, distance: 20, speed: 6 },
    drift: { min: -1, max: 1 },
    shadow: {
      enable: true,
      color: "#ff69b4",
      blur: 8,
      offset: { x: 0, y: 0 },
    },
  },
  detectRetina: true,
};

const nightOptions: ISourceOptions = {
  fullScreen: false,
  fpsLimit: 60,
  background: {
    color: "transparent",
  },
  particles: {
    number: { value: 120, density: { enable: true } },
    color: { value: ["#ffffff", "#e0e7ff", "#c7d2fe", "#a5b4fc"] },
    shape: { type: "circle" },
    opacity: {
      value: { min: 0.05, max: 0.8 },
      animation: {
        enable: true,
        speed: 0.6,
        startValue: "random",
        sync: false,
      },
    },
    size: { value: { min: 0.3, max: 2.2 } },
    move: {
      enable: true,
      speed: { min: 0.02, max: 0.15 },
      direction: "none",
      outModes: { default: "bounce" },
    },
    twinkle: {
      particles: {
        enable: true,
        frequency: 0.03,
        opacity: 1,
        color: { value: "#ffffff" },
      },
    },
  },
  emitters: [
    {
      direction: "bottom-right",
      position: { x: 5, y: 5 },
      rate: { quantity: 1, delay: 5 },
      size: { width: 50, height: 0 },
      life: { count: 0 },
      particles: {
        color: { value: "#ffffff" },
        shape: { type: "circle" },
        opacity: {
          value: 1,
          animation: { enable: true, speed: 1.5, startValue: "max", destroy: "min" },
        },
        size: { value: { min: 1, max: 2.5 } },
        move: {
          enable: true,
          speed: { min: 25, max: 45 },
          direction: "bottom-right",
          straight: true,
          outModes: { default: "destroy" },
        },
        life: { duration: { value: 1 }, count: 1 },
        shadow: {
          enable: true,
          color: "#a5b4fc",
          blur: 12,
          offset: { x: 0, y: 0 },
        },
      },
    },
    {
      direction: "bottom-right",
      position: { x: 30, y: 0 },
      rate: { quantity: 1, delay: 8 },
      size: { width: 30, height: 0 },
      life: { count: 0 },
      particles: {
        color: { value: "#c7d2fe" },
        shape: { type: "circle" },
        opacity: {
          value: 0.9,
          animation: { enable: true, speed: 1.2, startValue: "max", destroy: "min" },
        },
        size: { value: { min: 0.8, max: 1.8 } },
        move: {
          enable: true,
          speed: { min: 20, max: 35 },
          direction: "bottom-right",
          straight: true,
          outModes: { default: "destroy" },
        },
        life: { duration: { value: 1.2 }, count: 1 },
        shadow: {
          enable: true,
          color: "#818cf8",
          blur: 8,
          offset: { x: 0, y: 0 },
        },
      },
    },
  ],
  detectRetina: true,
};

export default function AnimatedBackground() {
  const { theme } = useTheme();
  const [key, setKey] = useState(0);

  useEffect(() => {
    setKey((k) => k + 1);
  }, [theme]);

  const options = useMemo(
    () => (theme === "dark" ? nightOptions : sakuraOptions),
    [theme],
  );

  return (
    <Particles
      key={key}
      id="bg-particles"
      className="pointer-events-none !fixed inset-0 z-0"
      options={options}
    />
  );
}
