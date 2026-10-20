import { lazy, Suspense, useEffect, useState, useSyncExternalStore } from "react";
import { scene, setScene, subscribeScene } from "../../lib/sceneStore";
import { canRender3D } from "../../lib/device";
import { asset } from "../../lib/assets";
import { CHAPTER_POSTERS } from "./posters";

const Stage = lazy(() => import("../../three/Stage.jsx"));

/**
 * Fixed backdrop behind the story: a CSS night sky, the 2D posters, and — when
 * the device can render it — the live 3D world, loaded after the page is idle
 * so the dashboard figures and actions paint first.
 */
export default function StoryBackdrop({ posters = CHAPTER_POSTERS }) {
  const [support] = useState(canRender3D);
  const [mount, setMount] = useState(false);
  const ready = useSyncExternalStore(subscribeScene, () => scene.ready, () => false);
  const failed = useSyncExternalStore(subscribeScene, () => scene.failed, () => false);
  const chapter = useSyncExternalStore(subscribeScene, () => scene.chapter, () => 0);

  useEffect(() => {
    if (!support.ok) return undefined;
    const start = () => setMount(true);
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(start, { timeout: 1500 });
      return () => window.cancelIdleCallback(id);
    }
    const id = setTimeout(start, 400);
    return () => clearTimeout(id);
  }, [support.ok]);

  // A failure only disables 3D for this visit of the page.
  useEffect(() => () => setScene({ failed: false, ready: false }), []);

  const live = support.ok && mount && !failed;

  return (
    <div className={`story-backdrop ${live && ready ? "is-live" : ""}`} aria-hidden="true">
      <div className="story-sky" />
      <div className="story-posters">
        {posters.map((src, i) => (
          <img key={src} src={asset(src)} alt="" className={i === Math.min(chapter, posters.length - 1) ? "is-current" : ""} loading={i === 0 ? "eager" : "lazy"} decoding="async" />
        ))}
      </div>
      {live && (
        <div className="story-canvas">
          <Suspense fallback={null}>
            <Stage />
          </Suspense>
        </div>
      )}
      {live && !ready && <p className="story-loading">Menyiapkan MAUNG 3D…</p>}
    </div>
  );
}
