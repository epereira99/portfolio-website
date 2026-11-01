"use client";

import { projectBySlug } from "@/content/projects";
import { STAGES } from "@/content/stages";
import { useScreens } from "@/journey/progress";
import { overlayAt } from "@/journey/timeline";
import { useOpenProject } from "./useOpenProject";
import styles from "./JourneyOverlay.module.css";

export function JourneyOverlay() {
  const overlay = overlayAt(useScreens());
  const { open } = useOpenProject();

  if (overlay.kind === "intro") {
    return (
      <div className={styles.block} key="intro">
        <div className={styles.photo} aria-label="Photo of Eduardo Pereira (coming soon)" role="img" />
        <h1 className={styles.name}>Eduardo Pereira</h1>
        <p className={styles.role}>AI / ML / Software Engineer</p>
        <p className={styles.text}>
          MSc in AI Engineering. Based in Stockholm, open to new roles. Scroll to walk through my journey from Braga to
          Stockholm.
        </p>
      </div>
    );
  }

  if (overlay.kind === "chapter") {
    const index = STAGES.findIndex((st) => st.id === overlay.stage);
    const { city, chapter } = STAGES[index];
    // Holds for the first half, then shrinks up toward the header; scroll-linked, so it reverses.
    const k = Math.max(0, (overlay.t - 0.5) / 0.5);
    return (
      <div
        className={`${styles.block} ${styles.chapter}`}
        key={`chapter-${overlay.stage}`}
        style={{ opacity: 1 - k, transform: `translateY(${(-14 * k).toFixed(2)}vh) scale(${(1 - 0.45 * k).toFixed(3)})` }}
      >
        <p className={styles.stage}>
          Chapter {index + 1} · {city}
        </p>
        <h2 className={styles.chapterTitle}>{chapter.title}</h2>
        <p className={styles.text}>{chapter.detail}</p>
      </div>
    );
  }

  const project = overlay.kind === "project" ? projectBySlug(overlay.slug) : undefined;
  if (!project) return null;

  // keyed so each new project fades in
  return (
    <div className={styles.block} key={project.slug}>
      <p className={styles.stage}>{project.stageLabel}</p>
      <h2 className={styles.title}>{project.title}</h2>
      <p className={styles.text}>{project.subtitle}</p>
      <button type="button" className={styles.more} onClick={() => open(project.slug)}>
        Read more
      </button>
    </div>
  );
}
