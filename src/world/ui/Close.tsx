"use client";

import { setView } from "../store";
import { reduce, type View } from "../view";
import styles from "./ui.module.css";

/** Same as pressing B, for mouse and touch users. */
export function Close({ view }: { view: View }) {
  return (
    <button type="button" className={styles.close} aria-label="Close" onClick={() => setView(reduce(view, "b"))}>
      ✕
    </button>
  );
}
