"use client";

import { useEffect } from "react";
import { bindKeyboard } from "./buttons";
import { startStore } from "./store";
import type { View } from "./view";
import { WorldCanvas } from "./WorldCanvas";
import { Overlay } from "./ui/Overlay";
import { TouchControls } from "./ui/TouchControls";
import styles from "./World.module.css";

/** The whole game: the tile world with every overlay on top. initial: what the page opens on. */
export function World({ initial }: { initial: View }) {
  useEffect(() => {
    const stop = startStore(initial);
    const unbind = bindKeyboard(window);
    return () => (unbind(), stop());
  }, [initial]);

  return (
    <div className={styles.root}>
      <div className={styles.screen}>
        <WorldCanvas />
        <Overlay initial={initial} />
      </div>
      <TouchControls />
    </div>
  );
}
