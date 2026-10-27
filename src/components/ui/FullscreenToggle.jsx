import { useEffect, useState } from "react";
import { Maximize, Minimize } from "lucide-react";

const doc = typeof document !== "undefined" ? document : null;
const fsElement = () => doc?.fullscreenElement || doc?.webkitFullscreenElement || null;
const supported = () => Boolean(doc && (doc.fullscreenEnabled || doc.webkitFullscreenEnabled));

/**
 * Full-screen on/off (Fullscreen API). Hidden where the browser can't do it —
 * e.g. Safari on iPhone; there, "Tambahkan ke Layar Utama" opens SI-MAUNG as
 * a full-screen app instead (public/manifest.webmanifest).
 */
export default function FullscreenToggle({ className = "" }) {
  const [on, setOn] = useState(() => Boolean(fsElement()));
  const [canUse] = useState(supported);

  useEffect(() => {
    const sync = () => setOn(Boolean(fsElement()));
    doc?.addEventListener("fullscreenchange", sync);
    doc?.addEventListener("webkitfullscreenchange", sync);
    return () => {
      doc?.removeEventListener("fullscreenchange", sync);
      doc?.removeEventListener("webkitfullscreenchange", sync);
    };
  }, []);

  if (!canUse) return null;

  const toggle = async () => {
    try {
      if (fsElement()) await (doc.exitFullscreen?.() ?? doc.webkitExitFullscreen?.());
      else {
        const root = doc.documentElement;
        await (root.requestFullscreen?.({ navigationUI: "hide" }) ?? root.webkitRequestFullscreen?.());
      }
    } catch {
      /* refused (e.g. not triggered by the user) — the button simply stays as it was */
    }
  };

  const Icon = on ? Minimize : Maximize;
  const label = on ? "Keluar dari layar penuh" : "Layar penuh";
  return (
    <button type="button" className={`round-btn ${className}`} onClick={toggle} aria-label={label} aria-pressed={on} title={label}>
      <Icon size={18} aria-hidden="true" />
    </button>
  );
}
