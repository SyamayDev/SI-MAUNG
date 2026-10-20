/**
 * First-visit loading screen. Shows the real set-up steps reported through
 * lib/bootLoader.js and lifts only when the page is ready to be shown:
 *   pages with MAUNG: after the first 3D frame has been drawn
 *   other pages:      as soon as the session and route are known
 * The backend is never awaited, and the screen can always be left: a skip
 * button appears after a few seconds, and a stalled or failed 3D set-up
 * hands over to the 2D fallback instead of hanging.
 */
import { useEffect, useState, useSyncExternalStore } from "react";
import { AlertTriangle, Check, Minus } from "lucide-react";
import TigerMark from "./TigerMark";
import { BOOT_STEPS, bootProgress, bootStore, finishBoot, skip3DSteps, stepDone, stepFail } from "../../lib/bootLoader";
import { setScene } from "../../lib/sceneStore";
import { useAuth } from "../../context/AuthContext";
import { use3DSupport, useSceneField } from "./sceneHooks";

const SKIP_AFTER_MS = 5000;
const GIVE_UP_AFTER_MS = 25000;

function StepIcon({ status }) {
  if (status === "done") return <Check size={14} aria-hidden="true" />;
  if (status === "error") return <AlertTriangle size={14} aria-hidden="true" />;
  if (status === "skipped") return <Minus size={14} aria-hidden="true" />;
  if (status === "active") return <span className="boot__spin" aria-hidden="true" />;
  return <span className="boot__dot" aria-hidden="true" />;
}

const STATUS_TEXT = { done: "selesai", error: "gagal", skipped: "dilewati", active: "sedang berjalan", pending: "menunggu" };

export default function LoadingScreen() {
  const boot = useSyncExternalStore(bootStore.subscribe, bootStore.getState, bootStore.getState);
  const { status } = useAuth();
  const mode = useSceneField("mode");
  const ready = useSceneField("ready");
  const failed = useSceneField("failed");
  const reduced = useSceneField("reducedMotion");
  const [canSkip, setCanSkip] = useState(false);
  const [stalled, setStalled] = useState(false);
  const support = use3DSupport();

  const appReady = status !== "loading";
  const needs3D = support.ok && mode !== "off";

  // The static first-paint loader in index.html hands over to this one.
  useEffect(() => {
    document.getElementById("boot-static")?.remove();
  }, []);

  useEffect(() => {
    if (appReady) stepDone("app");
  }, [appReady]);

  useEffect(() => {
    if (boot.phase !== "loading") return undefined;
    const skipTimer = setTimeout(() => setCanSkip(true), SKIP_AFTER_MS);
    const giveUp = setTimeout(() => setStalled(true), GIVE_UP_AFTER_MS);
    return () => {
      clearTimeout(skipTimer);
      clearTimeout(giveUp);
    };
  }, [boot.phase]);

  useEffect(() => {
    if (boot.phase !== "loading" || !appReady) return undefined;
    if (!needs3D) {
      if (support.ok) skip3DSteps("Disiapkan di latar belakang untuk halaman ber-MAUNG");
      finishBoot({ instant: reduced });
      return undefined;
    }
    if (ready) {
      finishBoot({ instant: reduced });
      return undefined;
    }
    if (failed || stalled) {
      if (stalled && !failed) {
        stepFail("ready", "Menyiapkan 3D memakan waktu terlalu lama.");
        setScene({ failed: true });
      }
      const id = setTimeout(() => finishBoot(), 2600);
      return () => clearTimeout(id);
    }
    return undefined;
  }, [boot.phase, appReady, needs3D, ready, failed, stalled, reduced, support.ok]);

  if (boot.phase === "done") return null;

  const pct = Math.round(bootProgress(boot) * 100);
  const current = BOOT_STEPS.find((s) => boot.steps[s.id].status === "active") || BOOT_STEPS.find((s) => boot.steps[s.id].status === "pending");
  const indeterminate = current && boot.steps[current.id].status === "active" && boot.steps[current.id].progress == null && current.id === "engine";
  const headline = boot.failure ? "MAUNG 3D belum bisa tampil" : current ? current.label : "Siap digunakan";

  return (
    <div className={`boot ${boot.phase === "leaving" ? "is-leaving" : ""}`} role="dialog" aria-modal="true" aria-labelledby="boot-title" aria-describedby="boot-status">
      <div className="boot__card">
        <TigerMark size={96} animated className="boot__mark" />
        <p className="boot__brand">
          SI<span>MAUNG</span>
        </p>
        <p className="boot__title" id="boot-title">
          {headline}
        </p>
        <div
          className={`boot__bar ${indeterminate ? "is-indeterminate" : ""}`}
          role="progressbar"
          aria-label="Kemajuan persiapan"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={indeterminate ? undefined : pct}
          aria-valuetext={indeterminate ? "Mengunduh, ukuran belum diketahui" : `${pct}%`}
        >
          <span style={{ width: `${pct}%` }} />
        </div>
        <p className="boot__pct" aria-hidden="true">
          {pct}%
        </p>
        <ol className="boot__steps" id="boot-status" aria-live="polite">
          {BOOT_STEPS.map((s) => {
            const st = boot.steps[s.id];
            return (
              <li key={s.id} className={`boot__step is-${st.status}`}>
                <StepIcon status={st.status} />
                <span className="boot__step-label">
                  {s.label}
                  <span className="sr-only"> — {STATUS_TEXT[st.status]}</span>
                </span>
                {st.note && <span className="boot__note">{st.note}</span>}
              </li>
            );
          })}
        </ol>
        {boot.failure ? (
          <p className="boot__failure">
            {boot.failure} Aplikasi tetap berjalan dengan ilustrasi 2D.
            <span className="boot__actions">
              <button type="button" className="btn btn--sm" onClick={() => window.location.reload()}>
                Coba lagi
              </button>
              <button type="button" className="btn btn--sm btn--primary" onClick={() => finishBoot()}>
                Lanjut
              </button>
            </span>
          </p>
        ) : (
          canSkip &&
          appReady && (
            <button type="button" className="boot__skip link-btn" onClick={() => finishBoot()}>
              Masuk tanpa menunggu — MAUNG menyusul
            </button>
          )
        )}
      </div>
    </div>
  );
}
