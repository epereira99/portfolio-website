"use client";

import { useEffect, useRef } from "react";
import { easeProgress, getScreens } from "../progress";
import { ENDING_START, segmentAt, segmentStart } from "../timeline";
import { SPRITES, drawRoad, type Sprites } from "./road";
import { CARTOON_WALK, WALK, stepFrame, walkFrame, walkFrameUrl } from "./walk";
import styles from "./MemoryWalk.module.css";

/** The Journey's world: Eduardo walking a sunny road that turns to snow and pines in Sweden, all driven by scroll. */
export function MemoryWalk() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const walkerRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d");
    // Art direction being compared (Eduardo, 2026-11-04): ?style=painted or ?style=cartoon draws generated sprites,
    // and the cartoon walker once its frames exist; without it the scene draws its own shapes.
    const style = new URLSearchParams(location.search).get("style");
    const sprites: Sprites = {};
    if (style === "painted" || style === "cartoon") {
      for (const name of SPRITES) {
        const im = new Image();
        im.src = `/road/${style}/${name}.webp`; // a missing one just never loads, and its shapes stay
        sprites[name] = im;
      }
    }
    const walk = style === "cartoon" ? CARTOON_WALK : WALK;

    const resize = () => {
      canvas.width = innerWidth * devicePixelRatio;
      canvas.height = innerHeight * devicePixelRatio;
    };
    resize();
    window.addEventListener("resize", resize);

    // Scrubbing starts only once every frame is in memory; until then (or if any fails) he stays on the still frame.
    // Reduced motion never scrubs, so it never downloads them.
    let ready = false;
    let loaded = 0;
    for (let i = 0; i < (reducedMotion ? 0 : walk.frames); i++) {
      const im = new Image();
      im.onload = () => {
        loaded += 1;
        ready = loaded === walk.frames;
      };
      im.src = walkFrameUrl(i, walk);
    }

    let p = getScreens();
    let shown = 0;
    let last = p;
    let scrubbing = false;
    let raf = 0;
    const tick = () => {
      p = easeProgress(p, getScreens());

      // The scenery stops where he does, at the ending. With reduced motion it holds still at the start of each stage.
      if (ctx) drawRoad(ctx, canvas.width, canvas.height, reducedMotion ? segmentStart(segmentAt(p)) : Math.min(p, ENDING_START), sprites);

      const walker = walkerRef.current!;
      if (ready && !reducedMotion) {
        // Step a few frames at a time while scrubbing; land directly on the first frame shown and after a snap.
        const target = walkFrame(p, walk);
        const f = scrubbing && Math.abs(p - last) <= 1 ? stepFrame(shown, target, 3, walk.frames) : target;
        scrubbing = true;
        if (f !== shown || walker.src.indexOf(`/${walk.dir}/`) < 0) {
          walker.src = walkFrameUrl(f, walk); // already in the browser cache from the preload
          shown = f;
        }
      }
      last = p;

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className={styles.scene} aria-hidden>
      <canvas ref={canvasRef} className={styles.road} />
      {/* eslint-disable-next-line @next/next/no-img-element -- frames are swapped per animation frame; next/image would fight that */}
      <img ref={walkerRef} className={styles.walker} src={walkFrameUrl(0)} alt="" />
    </div>
  );
}
