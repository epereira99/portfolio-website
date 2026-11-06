"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import bar from "../BottomBar.module.css";
import {
  ProjectMark,
  Scrim,
  TOPICS,
  TopicIcon,
  folderLabel,
  projectsForTopic,
  run,
  tint,
  topicLabel,
  useProjectsMenu,
} from "./shared";
import s from "./TreeMenu.module.css";

const NS = "http://www.w3.org/2000/svg";

/** A curve from the top centre of `from` up to the bottom centre of `to`, relative to `origin`. */
function curve(origin: DOMRect, from: Element, to: Element) {
  const a = from.getBoundingClientRect();
  const b = to.getBoundingClientRect();
  const [x1, y1] = [a.left + a.width / 2 - origin.left, a.top - origin.top];
  const [x2, y2] = [b.left + b.width / 2 - origin.left, b.bottom - origin.top];
  const mid = (y1 + y2) / 2;
  return `M${x1} ${y1}C${x1} ${mid} ${x2} ${mid} ${x2} ${y2}`;
}

/** Draws one branch per pair into `group`, replacing what was there, and returns them. */
function grow(group: SVGGElement, pairs: [Element, Element][]) {
  const origin = group.ownerSVGElement!.getBoundingClientRect();
  group.replaceChildren(
    ...pairs.map(([from, to]) => {
      const path = document.createElementNS(NS, "path");
      path.setAttribute("d", curve(origin, from, to));
      path.setAttribute("pathLength", "1");
      return path;
    }),
  );
  return [...group.children];
}

/** A tree growing up out of Projects: three folders on curved branches, the open one branching into its projects. */
export function TreeMenu() {
  const m = useProjectsMenu();
  const trunk = useRef<SVGGElement>(null);
  const branch = useRef<SVGGElement>(null);
  const { root, trigger, toggle, open, mounted, topic, shown, settle, unmount } = m;

  // Opening: the branches draw up from Projects and each folder pops at its tip. Closing: the reverse, quicker.
  useLayoutEffect(() => {
    const el = root.current;
    if (!mounted || !el || !trunk.current || !branch.current) return;
    const ctx = gsap.context(() => {
      const folders = gsap.utils.toArray<HTMLElement>("[data-folder]");
      const lines = grow(trunk.current!, folders.map((f) => [trigger.current!, f]));
      const tl = gsap.timeline({ paused: true });
      if (open)
        tl.from("[data-scrim]", { opacity: 0, duration: 0.4 })
          .from(lines, { strokeDashoffset: 1, duration: 0.42, stagger: 0.07, ease: "power2.out" }, 0)
          .from(folders, { opacity: 0, scale: 0.55, duration: 0.5, stagger: 0.07, ease: "back.out(2.2)" }, 0.2);
      else
        tl.to(folders, { opacity: 0, scale: 0.7, duration: 0.2, stagger: { each: 0.04, from: "end" }, ease: "power2.in" })
          .to([...lines, ...branch.current!.children], { strokeDashoffset: 1, duration: 0.24, ease: "power2.in" }, 0.06)
          .to("[data-scrim]", { opacity: 0, duration: 0.3 }, 0)
          .eventCallback("onComplete", unmount);
      run(tl);
    }, el);
    return () => ctx.revert();
  }, [open, mounted, root, trigger, unmount]);

  // A folder opens: its branches draw up to its projects, which spring in one after another.
  useLayoutEffect(() => {
    const el = root.current;
    if (!shown || !el || !branch.current) return;
    const ctx = gsap.context(() => {
      const leaves = gsap.utils.toArray<HTMLElement>("[data-leaf]");
      const from = el.querySelector(`[data-folder="${shown}"]`)!;
      const lines = grow(branch.current!, leaves.map((l) => [from, l]));
      run(
        gsap
          .timeline({ paused: true })
          .from(lines, { strokeDashoffset: 1, duration: 0.42, stagger: 0.06, ease: "power2.out" })
          .from(leaves, { opacity: 0, y: 16, scale: 0.88, duration: 0.45, stagger: 0.06, ease: "back.out(1.8)" }, 0.16),
      );
    }, el);
    return () => ctx.revert();
  }, [shown, root]);

  // A folder closes, or another is chosen: its projects drop away and their branches pull back first.
  useLayoutEffect(() => {
    const el = root.current;
    if (!shown || shown === topic || !el || !branch.current) return;
    const ctx = gsap.context(() => {
      run(
        gsap
          .timeline({
            paused: true,
            onComplete: () => {
              branch.current?.replaceChildren();
              settle();
            },
          })
          .to("[data-leaf]", { opacity: 0, y: 12, scale: 0.9, duration: 0.18, stagger: { each: 0.03, from: "end" }, ease: "power2.in" })
          .to(branch.current!.children, { strokeDashoffset: 1, duration: 0.2, ease: "power2.in" }, 0.04),
      );
    }, el);
    return () => ctx.revert();
  }, [topic, shown, settle, root]);

  // the branches follow the nodes when the window changes size
  useEffect(() => {
    if (!mounted) return;
    const redraw = () => {
      const el = root.current;
      if (!el || !trunk.current || !branch.current) return;
      grow(trunk.current, [...el.querySelectorAll("[data-folder]")].map((f) => [trigger.current!, f]));
      const from = shown && el.querySelector(`[data-folder="${shown}"]`);
      if (from) grow(branch.current, [...el.querySelectorAll("[data-leaf]")].map((l) => [from, l]));
    };
    window.addEventListener("resize", redraw);
    return () => window.removeEventListener("resize", redraw);
  }, [mounted, shown, root, trigger]);

  return (
    <div ref={root} className={s.root}>
      <button
        ref={trigger}
        type="button"
        className={bar.pill}
        aria-expanded={open}
        aria-controls="projects-menu"
        onClick={toggle}
      >
        Projects
      </button>
      {mounted && (
        <>
          <Scrim />
          <svg className={s.lines} aria-hidden>
            <g ref={trunk} />
            <g ref={branch} className={s.branch} style={shown ? tint(shown) : undefined} />
          </svg>
          <div id="projects-menu" className={s.tree} inert={!open}>
            <ul className={s.folders}>
              {TOPICS.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    data-folder={t.id}
                    className={s.folder}
                    style={tint(t.id)}
                    aria-label={folderLabel(t.id)}
                    aria-expanded={topic === t.id}
                    data-dim={(topic !== null && topic !== t.id) || undefined}
                    onClick={() => m.pick(t.id)}
                  >
                    <span className={s.icon}>
                      <TopicIcon id={t.id} />
                    </span>
                    {t.label}
                    <span className={s.count}>{projectsForTopic(t.id).length}</span>
                  </button>
                </li>
              ))}
            </ul>
            {shown && (
              <ul className={s.leaves} key={shown} aria-label={topicLabel(shown)} style={tint(shown)}>
                {projectsForTopic(shown).map((p) => (
                  <li key={p.slug}>
                    <button type="button" data-leaf className={s.leaf} onClick={() => m.choose(p.slug)}>
                      <ProjectMark project={p} className={s.mark} />
                      <span className={s.leafTitle}>{p.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}

