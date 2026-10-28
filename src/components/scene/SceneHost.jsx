/**
 * The one 3D host for the whole visit, mounted next to the routes:
 *  • decides the scene mode from the route (story / portrait / off)
 *  • loads the 3D chunk progressively: the page's text and buttons come first,
 *    MAUNG 3D starts on the first interaction or once the page has settled
 *    (lib/whenEngaged), with a light vector MAUNG in its place meanwhile
 *  • keeps the WebGL world alive across navigation (paused while "off")
 *  • shows the 2D posters ONLY when 3D is impossible or failed
 * Two layers behind the page: the sky backdrop (gradients that shift colour
 * per chapter) and the stage that holds MAUNG. The story's text panels are
 * pinned in their own zone (styles/story.css), so they never cover him.
 */
import { useEffect, useState, useSyncExternalStore } from "react";
import { useLocation } from "react-router-dom";
import { scene, setScene } from "../../lib/sceneStore";
import { canRender3D } from "../../lib/device";
import { loadStage } from "../../lib/load3d";
import { bootProgress, bootStore, skip3DSteps } from "../../lib/bootLoader";
import { whenEngaged } from "../../lib/whenEngaged";
import TigerMark from "./TigerMark";
import { asset } from "../../lib/assets";
import { CHAPTER_POSTERS } from "../story/posters";
import { NO_3D_REASONS, sceneModeFor, use3DSupport, useSceneField } from "./sceneHooks";

function startLoading() {
  return loadStage().catch(() => setScene({ failed: true }));
}

export default function SceneHost() {
  const { pathname } = useLocation();
  const mode = sceneModeFor(pathname);
  const shell = pathname.startsWith("/dashboard");
  const support = use3DSupport();
  const [StageComponent, setStageComponent] = useState(null);
  const ready = useSceneField("ready");
  const failed = useSceneField("failed");
  const chapter = useSceneField("chapter");
  const boot = useSyncExternalStore(bootStore.subscribe, bootStore.getState, bootStore.getState);

  useEffect(() => {
    setScene({ mode, shell });
  }, [mode, shell]);

  // Switching 3D back on in Settings gives it a fresh attempt.
  useEffect(() => {
    if (support.ok) setScene({ failed: false });
  }, [support]);

  useEffect(() => {
    if (!support.ok) {
      skip3DSteps(NO_3D_REASONS[support.reason] || "Memakai ilustrasi 2D");
      return undefined;
    }
    const begin = () => {
      if (!scene.webglChecked) {
        // First run: check the GPU now (not during the first render). If 3D is
        // not possible, `support` flips and this effect skips to the 2D art.
        const checked = canRender3D(undefined, { probe: true });
        setScene({ webglChecked: true });
        if (!checked.ok) return;
      }
      startLoading().then((C) => C && setStageComponent(() => C));
    };
    // Pages with MAUNG load him once the visitor engages or the page settles;
    // other pages warm the chunk up later so a visit to the story is instant.
    return whenEngaged(begin, { delay: mode !== "off" ? 2500 : 6000 });
  }, [mode, support.ok, support.reason]);

  const live = ready && !failed;
  const fallback = !support.ok || failed;
  const progress = Math.round(bootProgress(boot) * 100);

  return (
    <>
      <div className={`scene-backdrop scene-backdrop--${mode}`} aria-hidden="true">
        <div className="scene-sky" />
      </div>
      <div className={`scene-host scene-host--${mode} ${shell ? "scene-host--shell" : ""} ${live ? "is-live" : ""}`} aria-hidden="true">
      {fallback && mode === "story" && (
        <div className="story-posters">
          {CHAPTER_POSTERS.map((src, i) => (
            <img key={src} src={asset(src)} alt="" className={i === Math.min(chapter, CHAPTER_POSTERS.length - 1) ? "is-current" : ""} loading={i === 0 ? "eager" : "lazy"} decoding="async" />
          ))}
        </div>
      )}
      {mode === "story" && !live && !fallback && (
        <div className="scene-host__placeholder">
          <TigerMark size={132} animated />
        </div>
      )}
      {StageComponent && !fallback && <StageComponent />}
      {mode !== "off" && !live && !fallback && boot.phase === "done" && boot.steps.engine.status !== "pending" && (
        <p className="scene-host__loading">Menyiapkan MAUNG 3D… {progress}%</p>
      )}
      </div>
    </>
  );
}
