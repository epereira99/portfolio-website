"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { projectBySlug, type Project } from "@/content/projects";
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
      <div className={styles.frame}>
        {project.images?.length ? <Polaroids key={project.slug} images={project.images} /> : null}
        <div className={styles.card}>
          <button ref={closeButton} type="button" className={styles.close} aria-label="Close" onClick={closeProject}>
            ✕
          </button>
          <div className={styles.body}>
            <header className={styles.header}>
              <div>
                <h2 id={titleId} className={styles.title}>
                  {project.title}
                </h2>
              </div>
              {project.logo && (
                // eslint-disable-next-line @next/next/no-img-element -- a small static logo
                <img className={styles.logo} src={project.logo.src} alt={project.logo.alt} />
              )}
            </header>
            <ul className={styles.tags}>
              {project.tags.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
            {project.link && (
              <a className={styles.link} href={project.link.href} target="_blank" rel="noopener noreferrer">
                {project.link.label} ↗
              </a>
            )}
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
      </div>
    </dialog>
  );
}

type Photo = NonNullable<Project["images"]>[number];

/** Polaroids taped around the card, spread out rather than stacked. Clicking one enlarges it, frame and all;
 * clicking again puts it back. */
function Polaroids({ images }: { images: Photo[] }) {
  const [big, setBig] = useState<number | null>(null);
  const zoom = useRef<HTMLDialogElement>(null);
  const shown = big === null ? undefined : images[big];
  useEffect(() => {
    if (big === null || !zoom.current) return;
    zoom.current.showModal(); // its own top layer: full screen whatever the card around it does
    zoom.current.scrollTop = 0; // focusing the button scrolls a long document to its middle; start at the top
  }, [big]);
  return (
    <div
      className={styles.polaroids}
      onKeyDown={(e) => {
        if (e.key !== "Escape" || big === null) return;
        e.stopPropagation(); // shrink the photo, not close the whole dialog
        setBig(null);
      }}
    >
      {images.map((img, i) => (
        // the button carries keyboard and screen-reader use; the figure catches clicks on the frame and caption too
        <figure
          key={img.src}
          className={`${styles.polaroid} ${img.long ? styles.long : ""} ${img.wide ? styles.wide : ""}`}
          style={{ visibility: big === i ? "hidden" : undefined }}
          onClick={() => setBig(i)}
        >
          <button type="button" aria-expanded={big === i} aria-label="Enlarge photo">
            {/* eslint-disable-next-line @next/next/no-img-element -- pre-sized webp */}
            <img src={img.src} alt={img.alt} />
          </button>
          {img.caption && <figcaption>{img.caption}</figcaption>}
        </figure>
      ))}
      {shown && (
        <dialog
          ref={zoom}
          className={styles.zoom}
          aria-label="Photo"
          onCancel={(e) => e.preventDefault()}
          onClick={() => setBig(null)}
        >
          <figure className={`${styles.polaroid} ${shown.long ? styles.long : ""} ${shown.wide ? styles.wide : ""}`}>
            <button type="button" aria-label="Shrink photo">
              {/* eslint-disable-next-line @next/next/no-img-element -- pre-sized webp */}
              <img src={shown.src} alt={shown.alt} />
            </button>
            {shown.caption && <figcaption>{shown.caption}</figcaption>}
          </figure>
        </dialog>
      )}
    </div>
  );
}
