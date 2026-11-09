"use client";

import { useSyncExternalStore } from "react";
import { press, release, type Button } from "../buttons";
import styles from "./TouchControls.module.css";

const COARSE = "(pointer: coarse)";
const subscribe = (fn: () => void) => {
  const mq = window.matchMedia(COARSE);
  mq.addEventListener("change", fn);
  return () => mq.removeEventListener("change", fn);
};

function Pad({ button, label, className }: { button: Button; label: string; className: string }) {
  const up = () => release(button);
  return (
    <button
      type="button"
      aria-label={label}
      className={className}
      onPointerDown={(e) => {
        e.preventDefault(); // keep focus and stop the long-press menu
        press(button);
      }}
      onPointerUp={up}
      onPointerCancel={up}
      onPointerLeave={up}
      onContextMenu={(e) => e.preventDefault()}
    >
      {label.length === 1 ? label : null}
    </button>
  );
}

/** The handheld's buttons on touch screens: D-pad left, A/B right, Start between them. */
export function TouchControls() {
  const touch = useSyncExternalStore(subscribe, () => window.matchMedia(COARSE).matches, () => false);
  if (!touch) return null;
  return (
    <div className={styles.controls}>
      <div className={styles.dpad}>
        <Pad button="up" label="Up" className={styles.up} />
        <Pad button="left" label="Left" className={styles.left} />
        <Pad button="right" label="Right" className={styles.right} />
        <Pad button="down" label="Down" className={styles.down} />
      </div>
      <Pad button="start" label="Start" className={styles.start} />
      <div className={styles.ab}>
        <Pad button="b" label="B" className={styles.b} />
        <Pad button="a" label="A" className={styles.a} />
      </div>
    </div>
  );
}
