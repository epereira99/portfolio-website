import { Close } from "./Close";
import type { View } from "../view";
import { contractBySlug, villageLabel } from "@/content/contracts";
import styles from "./ui.module.css";

/** A contract unrolled: header (title, village, date, duration, logo) over the body (reason, goal, work). */
export function Scroll({ view }: { view: Extract<View, { kind: "scroll" }> }) {
  const c = contractBySlug(view.slug)!;
  return (
    <div className={`${styles.layer} ${styles.dim}`}>
      <article className={styles.scroll} aria-labelledby={`contract-${c.slug}`} data-scrolls>
        <Close view={view} />
        <header className={styles.scrollHead}>
          <div>
            <h2 id={`contract-${c.slug}`}>{c.title}</h2>
            <dl className={styles.fields}>
              <dt>Village</dt>
              <dd>{villageLabel(c)}</dd>
              <dt>Date</dt>
              <dd>{c.date}</dd>
              <dt>Duration</dt>
              <dd>{c.duration}</dd>
            </dl>
          </div>
          {c.logo ? (
            // eslint-disable-next-line @next/next/no-img-element -- pixel logos are tiny and must not be resampled
            <img className={styles.logo} src={c.logo.src} alt={c.logo.alt} />
          ) : (
            <span className={styles.logoSlot} aria-hidden />
          )}
        </header>
        <dl className={`${styles.fields} ${styles.body}`}>
          <dt>Reason</dt>
          <dd>{c.reason}</dd>
          <dt>Goal</dt>
          <dd>{c.goal}</dd>
          <dt>Work</dt>
          <dd>{c.work}</dd>
        </dl>
        {c.done && <span className={styles.seal} aria-label="Contract completed">✓</span>}
      </article>
    </div>
  );
}
