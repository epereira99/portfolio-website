"use client";

import { useEffect, useRef } from "react";
import { Close } from "./Close";
import { setView } from "../store";
import { BOARD_COLUMNS, type View } from "../view";
import { contractsFor, villageLabel } from "@/content/contracts";
import styles from "./ui.module.css";

/** The board seen through the hunter's eyes: papers pinned on cork, the town at dusk behind it. */
/** behind: drawn under an open scroll, so it is inert and hidden from assistive tech. */
export function BoardView({ view, behind = false }: { view: Extract<View, { kind: "board" }>; behind?: boolean }) {
  const papers = contractsFor(view.place);
  const selected = useRef<HTMLButtonElement>(null);
  const current = papers[view.index];

  useEffect(() => {
    if (!behind) selected.current?.focus();
  }, [view.index, behind]);

  return (
    <div className={`${styles.layer} ${styles.dusk}`} inert={behind} aria-hidden={behind || undefined}>
      <section className={styles.board} aria-label="Contracts board">
        <Close view={view} />
        <h2 className={styles.boardTitle}>CONTRACTS</h2>
        <div className={styles.cork} style={{ gridTemplateColumns: `repeat(${BOARD_COLUMNS}, 1fr)` }}>
          {papers.map((c, i) => (
            <button
              key={c.slug}
              ref={i === view.index ? selected : undefined}
              type="button"
              className={styles.paper}
              aria-label={`${villageLabel(c)} · ${c.title}`}
              aria-current={i === view.index || undefined}
              onClick={() => setView({ kind: "scroll", place: view.place, slug: c.slug })}
            >
              <b>{villageLabel(c).split(" · ")[0]}</b>
              <span>{c.title}</span>
              <span className={styles.logoSlot} aria-hidden />
              {c.done && <span className={styles.seal} aria-hidden>✓</span>}
            </button>
          ))}
        </div>
      </section>
      <p className={styles.chalk} aria-hidden>
        ◀▶ pick<br />A open<br />B leave
      </p>
      {current && (
        <p className={`${styles.box} ${styles.info}`}>
          {villageLabel(current)} · {current.date}
        </p>
      )}
    </div>
  );
}
