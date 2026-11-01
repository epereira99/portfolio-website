"use client";

import type { CSSProperties } from "react";
import { STAGES } from "@/content/stages";
import { scrollToScreens, useScreens } from "@/journey/progress";
import { INTRO_END, segmentAt, segmentStart, stageProgress } from "@/journey/timeline";
import styles from "./StageHeader.module.css";

export function StageHeader() {
  const s = useScreens();
  const current = segmentAt(s);
  const hidden = s < INTRO_END;
  const stage = STAGES.find((st) => st.id === current);

  return (
    <nav aria-label="Journey" aria-hidden={hidden} inert={hidden} className={`${styles.nav} ${hidden ? styles.hidden : ""}`}>
      <div className={styles.cities}>
        {STAGES.map((st) => (
          <button
            key={st.id}
            type="button"
            className={styles.city}
            aria-current={st.id === current ? "step" : undefined}
            // the current city fills up as you walk through its stage
            style={st.id === current ? ({ "--progress": stageProgress(s).toFixed(2) } as CSSProperties) : undefined}
            onClick={() =>
              scrollToScreens(
                segmentStart(st.id),
                window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
              )
            }
          >
            {st.city}
          </button>
        ))}
      </div>
      <p className={styles.stage}>
        {stage ? (
          <>
            <strong className={styles.title}>{stage.chapter.title}</strong> · {stage.chapter.detail}
          </>
        ) : (
          "At sea · Porto → Jönköping"
        )}
      </p>
    </nav>
  );
}
