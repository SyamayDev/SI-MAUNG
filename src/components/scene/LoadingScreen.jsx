/**
 * First-visit loading screen. It covers the page only until the session is
 * restored and the first route is resolved — never for the 3D stage: MAUNG
 * loads behind the visible page (SceneHost) and fades in when ready, so text,
 * forms and buttons are usable as early as possible.
 * The backend is never awaited for longer than the auth check, and the screen
 * can always be left: a skip button appears after a few seconds. A 3D set-up
 * that stalls is handed over to the 2D posters instead of hanging.
 */
import { useEffect, useState, useSyncExternalStore } from "react";
import TigerMark from "./TigerMark";
import { bootStore, finishBoot, stepDone, stepFail } from "../../lib/bootLoader";
import { setScene } from "../../lib/sceneStore";
import { useAuth } from "../../context/AuthContext";
import { use3DSupport, useSceneField } from "./sceneHooks";

const SKIP_AFTER_MS = 5000;
const GIVE_UP_AFTER_MS = 25000;

export default function LoadingScreen() {
  const boot = useSyncExternalStore(bootStore.subscribe, bootStore.getState, bootStore.getState);
  const { status } = useAuth();
  const mode = useSceneField("mode");
  const ready = useSceneField("ready");
  const failed = useSceneField("failed");
  const [canSkip, setCanSkip] = useState(false);
  const [stalled, setStalled] = useState(false);
  const support = use3DSupport();

  const appReady = status !== "loading";
  const engineStarted = boot.steps.engine.status !== "pending";

  // The static first-paint loader in index.html hands over to this one — but
  // only once the main stylesheet (loaded without blocking the first paint)
  // is active, so nothing unstyled is ever shown.
  useEffect(() => {
    const handOver = () => document.getElementById("boot-static")?.remove();
    const cssActive = () => getComputedStyle(document.documentElement).getPropertyValue("--z-loader").trim() !== "";
    if (cssActive()) {
      handOver();
      return undefined;
    }
    const link = document.querySelector("link[data-app-css]");
    const onLoad = () => handOver();
    link?.addEventListener("load", onLoad);
    const fallback = setTimeout(handOver, 8000);
    return () => {
      link?.removeEventListener("load", onLoad);
      clearTimeout(fallback);
    };
  }, []);

  useEffect(() => {
    if (appReady) stepDone("app");
  }, [appReady]);

  useEffect(() => {
    if (boot.phase !== "loading") return undefined;
    const skipTimer = setTimeout(() => setCanSkip(true), SKIP_AFTER_MS);
    return () => clearTimeout(skipTimer);
  }, [boot.phase]);

  // The page is shown as soon as the session and route are known.
  useEffect(() => {
    if (boot.phase !== "loading" || !appReady) return;
    finishBoot({ instant: true });
  }, [boot.phase, appReady]);

  // Give the 3D set-up a deadline once it has actually started.
  useEffect(() => {
    if (!engineStarted || ready || failed) return undefined;
    const giveUp = setTimeout(() => setStalled(true), GIVE_UP_AFTER_MS);
    return () => clearTimeout(giveUp);
  }, [engineStarted, ready, failed]);

  useEffect(() => {
    if (!stalled || ready || failed || !support.ok || mode === "off") return;
    stepFail("ready", "Menyiapkan 3D memakan waktu terlalu lama.");
    setScene({ failed: true });
  }, [stalled, ready, failed, support.ok, mode]);

  if (boot.phase === "done") return null;

  return (
    <div className={`boot ${boot.phase === "leaving" ? "is-leaving" : ""}`} role="dialog" aria-modal="true" aria-labelledby="boot-title">
      <div className="boot__card">
        <TigerMark size={96} animated className="boot__mark" />
        <p className="boot__brand">
          SI<span>MAUNG</span>
        </p>
        <p className="boot__tagline display">
          Catat uang, <span className="accent-italic">cukup ngomong.</span>
        </p>
        <p className="boot__title" id="boot-title" aria-live="polite">
          Menyiapkan pengalaman SI-MAUNG
        </p>
        <div className="boot__bar is-indeterminate" role="progressbar" aria-label="Memuat aplikasi" aria-valuetext="Memeriksa sesi masuk">
          <span />
        </div>
        {canSkip && (
          <button type="button" className="boot__skip link-btn" onClick={() => finishBoot()}>
            Lanjut sekarang
          </button>
        )}
      </div>
    </div>
  );
}
