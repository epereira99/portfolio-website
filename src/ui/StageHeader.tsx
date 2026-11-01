"use client";

import type { CSSProperties } from "react";
import { STAGES, type StageId } from "@/content/stages";
import { scrollToScreens, useScreens } from "@/journey/progress";
import { ENDING_START, INTRO_END, SEGMENTS, segmentAt, segmentStart, stageProgress } from "@/journey/timeline";
import styles from "./StageHeader.module.css";

export function StageHeader() {
  const s = useScreens();
  const current = segmentAt(s);
  const hidden = s < INTRO_END;
  const ending = s >= ENDING_START;
  const stage = ending ? undefined : STAGES.find((st) => st.id === current);
  // A city is done once the next segment has begun, and every city is done at the ending.
  const done = (id: StageId) => {
    const next = SEGMENTS[SEGMENTS.findIndex((g) => g.id === id) + 1];
    return ending || (next !== undefined && s >= segmentStart(next.id));
  };

  return (
    <nav aria-label="Journey" aria-hidden={hidden} inert={hidden} className={`${styles.nav} ${hidden ? styles.hidden : ""}`}>
      <div className={styles.cities}>
        {STAGES.map((st) => (
          <button
            key={st.id}
            type="button"
            className={styles.city}
            aria-current={st.id === current && !ending ? "step" : undefined}
            data-done={done(st.id) || undefined}
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
            {done(st.id) && (
              <span className={styles.check} aria-hidden>
                {" ✓"}
              </span>
            )}
          </button>
        ))}
      </div>
      <p className={styles.stage}>
        {stage ? (
          <>
            <strong className={styles.title}>{stage.chapter.title}</strong> · {stage.chapter.detail}
          </>
        ) : ending ? (
          "Today · Stockholm — the next chapter"
        ) : (
          "At sea · Porto → Jönköping"
        )}
      </p>
    </nav>
  );
}
