"use client";

import { useEffect, useRef } from "react";
import { SCREEN_H, SCREEN_W } from "./config";
import { integerZoom } from "./grid";
import styles from "./WorldCanvas.module.css";

/** The tile world. Phaser is imported in the effect so it never runs on the server. */
export function WorldCanvas() {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current!;
    let cancelled = false;
    let destroy = () => {};
    Promise.all([import("phaser"), import("./WorldScene")]).then(([Phaser, { WorldScene }]) => {
      if (cancelled) return;
      const game = new Phaser.Game({
        type: Phaser.AUTO,
        parent: el,
        width: SCREEN_W,
        height: SCREEN_H,
        pixelArt: true,
        roundPixels: true,
        backgroundColor: "#1b1b1b",
        scale: { mode: Phaser.Scale.NONE, zoom: integerZoom(el.clientWidth, el.clientHeight, window.devicePixelRatio) },
        scene: [WorldScene],
      });
      const fit = new ResizeObserver(() => game.scale.setZoom(integerZoom(el.clientWidth, el.clientHeight, window.devicePixelRatio)));
      fit.observe(el);
      destroy = () => (fit.disconnect(), game.destroy(true));
    });
    return () => {
      cancelled = true;
      destroy();
    };
  }, []);

  return <div ref={host} className={styles.host} />;
}
