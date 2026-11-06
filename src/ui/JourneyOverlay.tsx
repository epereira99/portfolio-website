"use client";

import { projectBySlug } from "@/content/projects";
import { STAGES } from "@/content/stages";
import { ENDING_STORY, INTRO_STORY, STORIES } from "@/content/stories";
import { CV_URL, EMAIL, ENDING, LINKEDIN } from "@/content/contact";
import { useScreens } from "@/journey/progress";
import { INTRO_END, chapterAt, chapterProgress, overlayAt } from "@/journey/timeline";
import { bubblesAt } from "@/journey/beats";
import { MAX_BUBBLES, revealed } from "./story";
import { useOpenProject } from "./useOpenProject";
import styles from "./JourneyOverlay.module.css";

/** His words beside him as chat bubbles: at most MAX_BUBBLES, the newest nearest him; fade is the block's opacity. */
function Story({ bubbles, fade = 1 }: { bubbles: { index: number; text: string }[]; fade?: number }) {
  if (bubbles.length === 0) return null;
  return (
    <aside className={styles.bubbles} style={{ opacity: fade }}>
      {bubbles.slice(-MAX_BUBBLES).map(({ index, text }) => (
        // keyed by its place in the block, so the stack shifts up and only the new one fades in
        <p className={styles.bubble} data-testid="bubble" key={index}>
          {text}
        </p>
      ))}
    </aside>
  );
}

const HINT_GONE = 0.08; // screens of scroll by which the tutorial prompt has faded out

/** A game-style tutorial prompt: it pops in after his hello and fades away as soon as you start walking. */
function ScrollHint({ s }: { s: number }) {
  if (s >= HINT_GONE) return null;
  return (
    <p className={styles.scrollHint} style={{ opacity: 1 - s / HINT_GONE }}>
      <span className={styles.mouse} aria-hidden />
      <span className={styles.desktop}>Scroll to walk</span>
      <span className={styles.touch}>Swipe up to walk</span>
    </p>
  );
}

export function JourneyOverlay() {
  const s = useScreens();
  const overlay = overlayAt(s);
  const { open } = useOpenProject();

  if (overlay.kind === "intro") {
    return (
      <>
        <Story bubbles={revealed(INTRO_STORY, s / INTRO_END)} key="story-intro" />
        {/* he introduces himself in the bubbles; the name stays for search engines and screen readers */}
        <h1 className={styles.hidden}>Eduardo Pereira · AI / ML / Software Engineer</h1>
        <ScrollHint s={s} />
      </>
    );
  }

  if (overlay.kind === "ending") {
    return (
      <>
        <Story bubbles={revealed(ENDING_STORY, overlay.t)} key="story-ending" />
        <div className={styles.block} key="ending">
          <h2 className={styles.chapterTitle}>{ENDING.title}</h2>
          <p className={styles.text}>{ENDING.detail}</p>
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
      </>
    );
  }

  const stage = chapterAt(s);
  if (!stage) return null;
  const { chapter, degree } = STAGES.find((st) => st.id === stage)!;
  const projects = overlay.kind === "project" ? overlay.slugs.map(projectBySlug).filter((p) => p !== undefined) : [];
  const { block, lines, fade } = bubblesAt(STORIES[stage], chapterProgress(s));

  // The chapter stays for the whole stage; beside him, the stage's story in bubbles; under the chapter, the projects
  // the story is talking about, fading in when first mentioned and out with their block's bubbles.
  return (
    <>
      <Story
        bubbles={lines.map((line, index) => ({ index, text: line.say }))}
        fade={fade}
        key={`story-${stage}-${block}`}
      />
      <div className={`${styles.block} ${chapter.logo ? styles.withLogo : ""}`} key={`chapter-${stage}`}>
        {chapter.logo && (
          // eslint-disable-next-line @next/next/no-img-element -- a small static logo
          <img className={styles.logo} src={chapter.logo.src} alt={chapter.logo.alt} />
        )}
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
        {projects.map((project) => (
          <div className={styles.project} key={project.slug} style={{ opacity: fade }}>
            <div className={styles.projectHead}>
              {/* the partner's logo; Effektify's already marks its chapter, so it isn't repeated */}
              {project.logo && project.logo.src !== chapter.logo?.src && (
                // eslint-disable-next-line @next/next/no-img-element -- a small static logo
                <img className={styles.projectLogo} src={project.logo.src} alt={project.logo.alt} />
              )}
              <h3 className={styles.title}>{project.title}</h3>
            </div>
            <button type="button" className={styles.more} onClick={() => open(project.slug)}>
              Read more
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
