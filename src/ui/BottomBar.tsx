"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { PROJECTS } from "@/content/projects";
import { fanPositions } from "./fan";
import { useOpenProject } from "./useOpenProject";
import styles from "./BottomBar.module.css";

const positions = fanPositions(PROJECTS.length);

export function BottomBar() {
  const [fanOpen, setFanOpen] = useState(false);
  const bar = useRef<HTMLDivElement>(null);
  const { open } = useOpenProject();

  useEffect(() => {
    if (!fanOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setFanOpen(false);
    const onDown = (e: PointerEvent) => !bar.current?.contains(e.target as Node) && setFanOpen(false);
    window.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [fanOpen]);

  return (
    <div ref={bar} className={styles.bar}>
      {fanOpen && (
        <div className={styles.fan}>
          {PROJECTS.map((p, i) => (
            <button
              key={p.slug}
              type="button"
              className={styles.card}
              style={{ "--x": `${positions[i].x}px`, "--y": `${positions[i].y}px`, "--i": i } as CSSProperties}
              onClick={() => {
                setFanOpen(false);
                open(p.slug);
              }}
            >
              <span className={styles.graphic} style={{ background: p.color }} aria-hidden />
              <span className={styles.label}>{p.title}</span>
            </button>
          ))}
        </div>
      )}
      <button type="button" className={styles.pill} aria-expanded={fanOpen} onClick={() => setFanOpen((o) => !o)}>
        Projects
      </button>
      <Link href="/about" className={styles.pill}>
        About me
      </Link>
    </div>
  );
}
