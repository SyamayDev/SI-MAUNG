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

/** Chapter section wrapper. `panel` content is what the 3D frames itself around. */
export function Chapter({ index, id, labelledBy, className = "", children }) {
  return (
    <section data-chapter={index} id={id} aria-labelledby={labelledBy} className={`chapter ${className}`}>
      <div className="chapter__panel" data-panel>
        {children}
      </div>
    </section>
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
