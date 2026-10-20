/**
 * The one 3D host for the whole visit, mounted next to the routes:
 *  • decides the scene mode from the route (story / portrait / off)
 *  • starts loading the 3D chunk at once when the page shows MAUNG, or when
 *    the browser is idle otherwise — so a later visit to the dashboard is instant
 *  • keeps the WebGL world alive across navigation (paused while "off")
 *  • shows the 2D posters ONLY when 3D is impossible or failed
 * Two layers: the sky backdrop (full screen, behind everything) and the stage
 * that holds MAUNG. On phones/tablets the story stage is a fixed band under
 * the top bar that the chapters scroll beneath (styles/scene.css), so text
 * never covers him.
 */
import { useEffect, useState, useSyncExternalStore } from "react";
import { useLocation } from "react-router-dom";
import { setScene } from "../../lib/sceneStore";
import { loadStage } from "../../lib/load3d";
import { bootStore, skip3DSteps } from "../../lib/bootLoader";
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
  const bootPhase = useSyncExternalStore(bootStore.subscribe, () => bootStore.getState().phase, () => "loading");

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
    const begin = () => startLoading().then((C) => C && setStageComponent(() => C));
    if (mode !== "off") {
      begin();
      return undefined;
    }
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(begin, { timeout: 3000 });
      return () => window.cancelIdleCallback(id);
    }
    const id = setTimeout(begin, 1200);
    return () => clearTimeout(id);
  }, [mode, support]);

  const live = ready && !failed;
  const fallback = !support.ok || failed;

  return (
    <>
      <div className={`scene-backdrop scene-backdrop--${mode}`} aria-hidden="true">
        <div className="scene-sky" />
      </div>
      <div className={`scene-host scene-host--${mode} ${shell ? "scene-host--shell" : ""} ${live ? "is-live" : ""}`} aria-hidden="true">
      <div className="scene-sky scene-host__sky" />
      {fallback && mode === "story" && (
        <div className="story-posters">
          {CHAPTER_POSTERS.map((src, i) => (
            <img key={src} src={asset(src)} alt="" className={i === Math.min(chapter, CHAPTER_POSTERS.length - 1) ? "is-current" : ""} loading={i === 0 ? "eager" : "lazy"} decoding="async" />
          ))}
        </div>
      )}
      {StageComponent && !fallback && <StageComponent />}
      {mode !== "off" && !live && !fallback && bootPhase === "done" && <p className="scene-host__loading">Menyiapkan MAUNG 3D…</p>}
      </div>
    </>
  );
}
