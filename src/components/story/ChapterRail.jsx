import { useSyncExternalStore } from "react";
import { scene, subscribeScene } from "../../lib/sceneStore";
import { scrollToChapter } from "../../lib/scrollStory";

/** Desktop chapter navigation (real buttons that scroll to each chapter). */
export default function ChapterRail({ labels }) {
  const chapter = useSyncExternalStore(subscribeScene, () => scene.chapter, () => 0);
  return (
    <nav className="chapter-rail on-stage" aria-label="Babak cerita">
      {labels.map((label, i) => (
        <button key={label} type="button" aria-current={i === chapter ? "step" : undefined} onClick={() => scrollToChapter(i)}>
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}

/**
 * One pinned chapter. The section is tall (scroll length grows with `steps`);
 * its stage sticks to the viewport while the 3D world plays, and the panel
 * stays in its own zone — below MAUNG on phones, left column on wide screens.
 * lib/scrollStory drives --enter / --p / --exit and data-step on the section.
 */
export function Chapter({ index, id, labelledBy, className = "", steps = 1, children }) {
  return (
    <section data-chapter={index} data-steps={steps} id={id} aria-labelledby={labelledBy} className={`chapter ${className}`} style={{ "--steps": steps }}>
      <div className="chapter__stage">
        <div className="chapter__panel" data-panel>
          {children}
        </div>
      </div>
    </section>
  );
}

/** Cards that take turns in the same place while the chapter is pinned — one per scroll step. */
export function Deck({ children }) {
  return <div className="deck">{children}</div>;
}

/** A deck card. Inactive cards stay readable by screen readers; focusing one scrolls to its step. */
export function Step({ n, children }) {
  return (
    <div className="deck__card" data-step-card={n}>
      {children}
    </div>
  );
}

/** Progress marks for a chapter's steps (decorative; each card has its own heading). */
export function StepDots({ labels }) {
  return (
    <ol className="step-dots" aria-hidden="true">
      {labels.map((label, i) => (
        <li key={label} data-dot={i}>
          <span>{label}</span>
        </li>
      ))}
    </ol>
  );
}

export function Kicker({ n, total = 6, children }) {
  return (
    <p className="eyebrow chapter__kicker reveal">
      <span>
        <b>{String(n).padStart(2, "0")}</b> / {String(total).padStart(2, "0")}
      </span>
      {children}
    </p>
  );
}
