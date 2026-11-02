"use client";

import { projectBySlug } from "@/content/projects";
import { STAGES } from "@/content/stages";
import { CV_URL, EMAIL, ENDING, LINKEDIN } from "@/content/contact";
import { useScreens } from "@/journey/progress";
import { chapterAt, overlayAt } from "@/journey/timeline";
import { useOpenProject } from "./useOpenProject";
import styles from "./JourneyOverlay.module.css";

export function JourneyOverlay() {
  const s = useScreens();
  const overlay = overlayAt(s);
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

  if (overlay.kind === "ending") {
    return (
      <div className={styles.block} key="ending" style={{ opacity: Math.min(overlay.t / 0.4, 1) }}>
        <p className={styles.stage}>Stockholm · Today</p>
        <h2 className={styles.chapterTitle}>{ENDING.title}</h2>
        <p className={styles.text}>{ENDING.line}</p>
        <div className={styles.actions}>
          <a className={styles.more} href={`mailto:${EMAIL}`}>
            Email me
          </a>
          <a className={styles.more} href={LINKEDIN} target="_blank" rel="noopener noreferrer">
            LinkedIn
          </a>
          {CV_URL && (
            <a className={styles.more} href={CV_URL} download>
              Download CV
            </a>
          )}
        </div>
      </div>
    );
  }

  const stage = chapterAt(s);
  if (!stage) return null;
  const index = STAGES.findIndex((st) => st.id === stage);
  const { city, chapter, degree } = STAGES[index];
  const project = overlay.kind === "project" ? projectBySlug(overlay.slug) : undefined;

  // The chapter stays for the whole stage; its projects fade in under it one at a time (each keyed so it fades in).
  return (
    <div className={styles.block} key={`chapter-${stage}`}>
      <p className={styles.stage}>
        Chapter {index + 1} · {city}
      </p>
      <h2 className={styles.chapterTitle}>
        {chapter.title}
        {chapter.dot && (
          <span data-dot aria-hidden style={{ color: chapter.dot }}>
            .
          </span>
        )}
      </h2>
      <p className={styles.text}>{chapter.detail}</p>
      {degree && (
        <button type="button" className={styles.more} onClick={() => open(degree)}>
          About the degree
        </button>
      )}
      {project && (
        <div className={styles.project} key={project.slug}>
          <p className={styles.stage}>{project.stageLabel}</p>
          <h3 className={styles.title}>{project.title}</h3>
          <p className={styles.text}>{project.subtitle}</p>
          <button type="button" className={styles.more} onClick={() => open(project.slug)}>
            Read more
          </button>
        </div>
      )}
    </div>
  );
}
