"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { getScreens, readScreensFromWindow, scrollToScreens, setScreens } from "./progress";
import { TOTAL_SCREENS } from "./timeline";

gsap.registerPlugin(ScrollTrigger);

export function ScrollDriver() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const trigger = ScrollTrigger.create({
      trigger: ref.current,
      start: "top top",
      end: "bottom bottom",
      onUpdate: () => setScreens(readScreensFromWindow()),
    });
    setScreens(readScreensFromWindow());

    // Same place in the story after a resize, not the same pixel offset.
    const onResize = () => {
      const prev = getScreens();
      ScrollTrigger.refresh(); // restores its own scroll position, so jump after it
      scrollToScreens(prev, "instant");
      setScreens(prev);
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      trigger.kill();
    };
  }, []);

  // lvh, not svh: on phones innerHeight can exceed svh, and the ending must stay reachable
  return <div ref={ref} aria-hidden style={{ height: `${(TOTAL_SCREENS + 1) * 100}lvh` }} />;
}
