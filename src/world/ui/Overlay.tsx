"use client";

import { useEffect } from "react";
import { BoardView } from "./BoardView";
import { onPress } from "../buttons";
import { Close } from "./Close";
import { Scroll } from "./Scroll";
import { setView, useNearbySign, useView } from "../store";
import { MENU_ITEMS, reduce, type View } from "../view";
import { CV_URL, EMAIL, LINKEDIN } from "@/content/contact";
import { DEGREES } from "@/content/degrees";
import { PLACES } from "@/content/places";
import styles from "./ui.module.css";

/** Every screen with text, over the world. initial: the view the page was rendered with. */
export function Overlay({ initial }: { initial: View }) {
  const view = useView(initial);
  const sign = useNearbySign();

  // The arrows are game buttons, so Up/Down scroll long text (degrees, contracts) for keyboard players.
  useEffect(
    () =>
      onPress((b) => {
        if (b === "up" || b === "down") document.querySelector("[data-scrolls]")?.scrollBy({ top: b === "up" ? -64 : 64 });
      }),
    [],
  );

  switch (view.kind) {
    case "world":
      // Not a layer: the hunter keeps walking and taps reach the controls underneath.
      return sign && <p className={`${styles.box} ${styles.dialogue} ${styles.passive}`} role="status">{sign}</p>;
    case "board":
      return <BoardView view={view} />;
    case "scroll": {
      const board = reduce(view, "b") as Extract<View, { kind: "board" }>; // the board this scroll rolls back to
      return (
        <>
          <BoardView view={board} behind />
          <Scroll view={view} />
        </>
      );
    }
    case "dialogue":
      return (
        <div className={styles.layer}>
          <p className={`${styles.box} ${styles.dialogue}`} role="status">
            {view.lines[view.page]}
            <span className={styles.cursor} aria-hidden>▼</span>
          </p>
        </div>
      );
    case "menu":
      return (
        <div className={styles.layer}>
          <nav className={`${styles.box} ${styles.menu}`} aria-label="Start menu">
            <Close view={view} />
            <ul>
              {MENU_ITEMS.map((item, i) => (
                <li key={item}>
                  <button
                    type="button"
                    aria-current={i === view.index || undefined}
                    onClick={() => setView(reduce({ kind: "menu", index: i }, "a"))}
                  >
                    {i === view.index && <span aria-hidden>▶ </span>}
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      );
    case "map":
      return (
        <div className={styles.layer}>
          <nav className={`${styles.box} ${styles.panel}`} aria-label="Map">
            <Close view={view} />
            {(["portugal", "sweden"] as const).map((side) => (
              <section key={side}>
                <h2>{side === "portugal" ? "Portugal" : "Sweden"}</h2>
                <ul>
                  {PLACES.map((p, i) =>
                    p.side === side ? (
                      <li key={p.id}>
                        <button
                          type="button"
                          aria-current={i === view.index || undefined}
                          onClick={() => setView({ kind: "world", travelTo: p.id })}
                        >
                          {i === view.index ? "▶ " : ""}
                          {p.name}
                        </button>
                      </li>
                    ) : null,
                  )}
                </ul>
              </section>
            ))}
          </nav>
        </div>
      );
    case "hunter":
      return (
        <div className={styles.layer}>
          <section className={`${styles.box} ${styles.panel}`} aria-label="Hunter">
            <Close view={view} />
            <h2>Eduardo Pereira</h2>
            <p>Coming soon.</p>
            {CV_URL && <a href={CV_URL}>Download the CV</a>}
          </section>
        </div>
      );
    case "raven":
      return (
        <div className={styles.layer}>
          <section className={`${styles.box} ${styles.panel}`} aria-label="Send a raven">
            <Close view={view} />
            <h2>Send a raven</h2>
            <p><a href={`mailto:${EMAIL}`}>{EMAIL}</a></p>
            <p><a href={LINKEDIN} target="_blank" rel="noreferrer">LinkedIn</a></p>
          </section>
        </div>
      );
    case "degree": {
      const degree = DEGREES.find((d) => d.slug === view.slug)!;
      return (
        <div className={styles.layer}>
          <article className={`${styles.box} ${styles.panel} ${styles.long}`} aria-label={degree.title} data-scrolls>
            <Close view={view} />
            <h2>{degree.title}</h2>
            <p>{degree.subtitle}</p>
            {degree.sections.map((s) => <p key={s.heading}>{s.body}</p>)}
            {degree.lists?.map((l) => (
              <section key={l.heading}>
                <h3>{l.heading}</h3>
                <ul>{l.items.map((item) => <li key={item}>{item}</li>)}</ul>
              </section>
            ))}
          </article>
        </div>
      );
    }
  }
}
