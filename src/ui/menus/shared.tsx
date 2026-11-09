"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { TOPICS, projectsForTopic, type Project, type TopicId } from "@/content/projects";
import { useOpenProject } from "../useOpenProject";
import styles from "./shared.module.css";

/** Each folder's colour, shared by every menu so a topic looks the same wherever it shows. A look can repaint them by
 * setting --tint-software and the rest on its root. */
const TINT: Record<TopicId, string> = {
  software: "var(--tint-software, #5eead4)",
  ai: "var(--tint-ai, #a78bfa)",
  awards: "var(--tint-awards, #fbbf24)",
};
export const tint = (id: TopicId) => ({ "--tint": TINT[id] }) as CSSProperties;

export const topicLabel = (id: TopicId) => TOPICS.find((t) => t.id === id)!.label;
export const folderLabel = (id: TopicId) => `${topicLabel(id)}, ${projectsForTopic(id).length} projects`;

const reducedMotion = () =>
  typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** Plays a paused timeline, or jumps straight to its end (callbacks included) when the visitor prefers less motion. */
export function run(tl: gsap.core.Timeline) {
  if (reducedMotion()) tl.progress(1);
  else tl.play();
}

export function TopicIcon({ id }: { id: TopicId }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {id === "software" && <path d="M8 7l-5 5 5 5M16 7l5 5-5 5M13.5 4l-3 16" />}
      {id === "ai" && (
        <>
          <path d="M11 3l1.9 5.1L18 10l-5.1 1.9L11 17l-1.9-5.1L4 10l5.1-1.9z" />
          <path d="M19 14.5l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9z" />
        </>
      )}
      {id === "awards" && (
        <>
          <path d="M8 4h8v5a4 4 0 0 1-8 0z" />
          <path d="M8 6H5.5a2.5 2.5 0 0 0 2.6 3.9M16 6h2.5a2.5 2.5 0 0 1-2.6 3.9M12 13v4M8.5 20.5h7M9.5 17h5" />
        </>
      )}
    </svg>
  );
}

/** The partner's logo, or the project's initial on its folder's colour when it has none. Decorative: titles name them. */
export function ProjectMark({ project, className = "" }: { project: Project; className?: string }) {
  return project.logo ? (
    // eslint-disable-next-line @next/next/no-img-element -- a small static logo
    <img className={`${styles.mark} ${className}`} src={project.logo.src} alt="" />
  ) : (
    <span className={`${styles.mark} ${className}`} aria-hidden>
      {project.title[0]}
    </span>
  );
}

/** The darkening behind an open menu, so it reads over the scene. */
export const Scrim = () => <div className={styles.scrim} data-scrim aria-hidden />;

/**
 * What every Projects menu shares: open and close, the chosen folder, Escape (back a level, then closed), clicks
 * outside, and where keyboard focus goes. `mounted` and `shown` lag behind `open` and `topic` until the menu calls
 * `unmount` and `settle` at the end of its exit animations, so things can animate out before they disappear.
 */
export function useProjectsMenu() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [topic, setTopic] = useState<TopicId | null>(null);
  const [shown, setShown] = useState<TopicId | null>(null);
  if (open && !mounted) setMounted(true);
  if (shown === null && topic !== null) setShown(topic); // nothing to animate out first
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const refocus = useRef<TopicId | null>(null); // the folder to focus once its projects have gone
  const focusTrigger = useRef(false); // closed from the keyboard or its close button: focus goes back to Projects
  const { open: openProject } = useOpenProject();

  const close = useCallback(() => {
    setOpen(false);
    setTopic(null);
  }, []);
  const dismiss = useCallback(() => {
    focusTrigger.current = true;
    close();
  }, [close]);
  const back = useCallback(() => {
    refocus.current = topic;
    setTopic(null);
  }, [topic]);
  const pick = useCallback((id: TopicId) => (topic === id ? back() : setTopic(id)), [topic, back]);
  const toggle = useCallback(() => (open ? close() : setOpen(true)), [open, close]);
  const choose = useCallback(
    (slug: string) => {
      close();
      openProject(slug, trigger.current); // the menu goes away, so the dialog hands focus back to Projects
    },
    [close, openProject],
  );
  const settle = useCallback(() => setShown(topic), [topic]);
  const unmount = useCallback(() => {
    setMounted(false);
    setShown(null);
    if (focusTrigger.current) trigger.current?.focus();
    focusTrigger.current = false;
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (topic) back();
      else dismiss();
    };
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) close();
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open, topic, back, close, dismiss]);

  // Back from a folder: focus returns to it once its projects are gone. Into a folder: if the button that was focused
  // went away with the previous level, focus moves to the first project.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    if (shown === null && refocus.current) {
      el.querySelector<HTMLElement>(`[data-folder="${refocus.current}"]`)?.focus();
      refocus.current = null;
    } else if (shown !== null && !el.contains(document.activeElement)) {
      el.querySelector<HTMLElement>("[data-leaf]")?.focus();
    }
  }, [shown]);

  return { open, mounted, topic, shown, root, trigger, toggle, close, dismiss, pick, back, choose, settle, unmount };
}

export { TOPICS, projectsForTopic };
