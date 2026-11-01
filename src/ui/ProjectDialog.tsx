"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { projectBySlug } from "@/content/projects";
import { syncOpenProjectFromUrl, useOpenProject } from "./useOpenProject";
import styles from "./ProjectDialog.module.css";

export function ProjectDialog() {
  const { slug, close } = useOpenProject();
  const project = slug ? projectBySlug(slug) : undefined;
  const closeButton = useRef<HTMLButtonElement>(null);

  useLayoutEffect(syncOpenProjectFromUrl, []);

  useEffect(() => {
    if (!project) return;
    const opener = document.activeElement as HTMLElement | null;
    const root = document.documentElement;
    root.style.overflow = "hidden"; // pauses the walk without moving the scroll position
    closeButton.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      root.style.overflow = "";
      opener?.focus?.();
    };
  }, [project, close]);

  if (!project) return null;
  const titleId = `project-${project.slug}`;

  return (
    <div className={styles.backdrop} onClick={close}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={styles.card}
        onClick={(e) => e.stopPropagation()}
      >
        <button ref={closeButton} type="button" className={styles.close} aria-label="Close" onClick={close}>
          ✕
        </button>
        <div className={styles.graphic} style={{ background: project.color }} />
        <div className={styles.body}>
          <p className={styles.stage}>{project.stageLabel}</p>
          <h2 id={titleId} className={styles.title}>
            {project.title}
          </h2>
          <ul className={styles.tags}>
            {project.tags.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          {project.sections.map((s) => (
            <section key={s.heading}>
              <h3 className={styles.heading}>{s.heading}</h3>
              <p className={styles.text}>{s.body}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
