"use client";

import { STAGES } from "@/content/stages";
import { scrollToScreens, useScreens } from "@/journey/progress";
import { INTRO_END, segmentAt, segmentStart } from "@/journey/timeline";
import styles from "./StageHeader.module.css";

export function StageHeader() {
  const s = useScreens();
  const current = segmentAt(s);
  const hidden = s < INTRO_END;
  const text = current === "voyage" ? "At sea · Porto → Jönköping" : STAGES.find((st) => st.id === current)!.header;

  return (
    <nav aria-label="Journey" aria-hidden={hidden} inert={hidden} className={`${styles.nav} ${hidden ? styles.hidden : ""}`}>
      <div className={styles.cities}>
        {STAGES.map((st) => (
          <button
            key={st.id}
            type="button"
            className={styles.city}
            aria-current={st.id === current ? "step" : undefined}
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
      <p className={styles.stage}>{text}</p>
    </nav>
  );
}
