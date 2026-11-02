"use client";

import { useEffect, useRef } from "react";
import { getScreens } from "../progress";
import { voyageState } from "../voyage/phase";
import { MEMORIES, memoryPose } from "./memories";
import { WALK_FRAMES, easeProgress, walkFrame, walkFrameUrl } from "./walk";
import styles from "./MemoryWalk.module.css";

const STARS = 420;

/** The Journey's world: a starry night, painted memories, and Eduardo walking, all driven by scroll (spec 2026-11-02). */
export function MemoryWalk() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const walkerRef = useRef<HTMLImageElement>(null);
  const memoryRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const phone = window.matchMedia("(max-width: 640px)");
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d");
    const stars = Array.from({ length: STARS }, () => ({ x: Math.random() * 2 - 1, y: Math.random() * 2 - 1, z: Math.random() }));

    const resize = () => {
      canvas.width = innerWidth * devicePixelRatio;
      canvas.height = innerHeight * devicePixelRatio;
    };
    resize();
    window.addEventListener("resize", resize);

    // Scrubbing starts only once every frame is in memory; until then (or if any fails) he stays on the still frame.
    let ready = false;
    let loaded = 0;
    for (let i = 0; i < WALK_FRAMES; i++) {
      const im = new Image();
      im.onload = () => {
        loaded += 1;
        ready = loaded === WALK_FRAMES;
      };
      im.src = walkFrameUrl(i);
    }

    let p = getScreens();
    let shown = 0;
    let raf = 0;
    const tick = () => {
      p = easeProgress(p, getScreens());

      if (ctx) {
        const { width: w, height: h } = canvas;
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = "#dfe6ff";
        for (const st of stars) {
          // Depth follows distance walked, so the stars rush past going forward and recede going back.
          const z = (reducedMotion ? st.z : (((st.z - p * 0.4) % 1) + 1) % 1) + 0.02;
          ctx.globalAlpha = Math.min(Math.max((1 - z) * 1.4, 0), 1);
          ctx.beginPath();
          ctx.arc(w / 2 + (st.x / z) * w * 0.25, h * 0.42 + (st.y / z) * h * 0.25, Math.max(0.5, (1 - z) * 2.2) * devicePixelRatio, 0, 7);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }

      MEMORIES.forEach((m, i) => {
        const el = memoryRefs.current[i];
        if (!el) return;
        const pose = memoryPose(m, p, reducedMotion);
        el.style.opacity = String(pose.opacity);
        el.style.transform = `translateX(${phone.matches ? 0 : pose.x}vw) scale(${pose.scale})`;
      });

      const walker = walkerRef.current!;
      walker.style.opacity = String(1 - voyageState(p).mapOpacity);
      const f = walkFrame(p);
      if (ready && !reducedMotion && f !== shown) {
        walker.src = walkFrameUrl(f); // already in the browser cache from the preload
        shown = f;
      }

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
      <canvas ref={canvasRef} className={styles.stars} />
      {MEMORIES.map((m, i) => (
        <div
          key={m.id}
          data-memory={m.id}
          ref={(el) => {
            memoryRefs.current[i] = el;
          }}
          className={`${styles.memory} ${m.layout === "centre" ? styles.centre : styles.side} ${m.src ? "" : styles.placeholder}`}
          style={m.src ? { backgroundImage: `url(${m.src})` } : undefined}
        >
          {!m.src && <span>{m.label}</span>}
        </div>
      ))}
      {/* eslint-disable-next-line @next/next/no-img-element -- frames are swapped per animation frame; next/image would fight that */}
      <img ref={walkerRef} className={styles.walker} src={walkFrameUrl(0)} alt="" />
    </div>
  );
}
