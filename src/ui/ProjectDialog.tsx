"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { projectBySlug } from "@/content/projects";
import { closeProject, syncOpenProjectFromUrl, takeReturnFocus, useOpenProject } from "./useOpenProject";
import styles from "./ProjectDialog.module.css";

export function ProjectDialog() {
  const { slug } = useOpenProject();
  const project = slug ? projectBySlug(slug) : undefined;
  const dialog = useRef<HTMLDialogElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const downOnBackdrop = useRef(false);

  useLayoutEffect(syncOpenProjectFromUrl, []);

  useEffect(() => {
    const el = dialog.current;
    if (!project || !el) return;
    const opener = takeReturnFocus() ?? (document.activeElement as HTMLElement | null);
    const root = document.documentElement;
    el.showModal(); // native modal: focus stays inside, the page behind is inert
    root.style.overflow = "hidden"; // pauses the walk without moving the scroll position
    closeButton.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeProject();
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      if (el.open) el.close();
      root.style.overflow = "";
      if (opener?.isConnected) opener.focus();
    };
  }, [project]);

  if (!project) return null;
  const titleId = `project-${project.slug}`;

  return (
    <dialog
      ref={dialog}
      aria-labelledby={titleId}
      className={styles.dialog}
      onCancel={(e) => e.preventDefault()} // Escape is handled above, so React state stays the source of truth
      onPointerDown={(e) => (downOnBackdrop.current = e.target === e.currentTarget)}
      onClick={(e) => downOnBackdrop.current && e.target === e.currentTarget && closeProject()}
    >
      <div className={styles.card}>
        <button ref={closeButton} type="button" className={styles.close} aria-label="Close" onClick={closeProject}>
          ✕
        </button>
        <div className={styles.graphic} style={{ background: project.color }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- a small static logo, shown at its own size */}
          {project.image && <img className={styles.logo} src={project.image.src} alt={project.image.alt} />}
        </div>
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
          {project.lists?.map((l, i) => (
            <section key={l.heading}>
              <h3 id={`${titleId}-list-${i}`} className={styles.heading}>
                {l.heading}
              </h3>
              <ul aria-labelledby={`${titleId}-list-${i}`} className={styles.list}>
                {l.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </dialog>
  );
}
