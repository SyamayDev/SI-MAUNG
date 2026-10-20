/**
 * Colour theme: "light" | "dark" | "system" (follows the OS). The choice is
 * stored per device; index.html applies it before first paint (no flash),
 * and this module keeps <html data-theme>, the theme-color meta tag and the
 * 3D scene in sync afterwards.
 */
import { useSyncExternalStore } from "react";
import { setScene } from "./sceneStore";

export const THEME_KEY = "simaung:theme";
export const THEME_OPTIONS = ["light", "dark", "system"];
export const THEME_LABELS = { light: "Terang", dark: "Gelap", system: "Ikuti sistem" };
const META_COLORS = { light: "#f9efdd", dark: "#0d1436" };

const listeners = new Set();
const media = typeof window !== "undefined" ? window.matchMedia("(prefers-color-scheme: dark)") : null;

function readPreference() {
  try {
    const v = localStorage.getItem(THEME_KEY);
    return THEME_OPTIONS.includes(v) ? v : "system";
  } catch {
    return "system";
  }
}

let preference = typeof window !== "undefined" ? readPreference() : "system";

export const resolveTheme = (pref = preference) => (pref === "system" ? (media?.matches ? "dark" : "light") : pref);

function apply() {
  if (typeof document === "undefined") return;
  const theme = resolveTheme();
  const root = document.documentElement;
  root.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", META_COLORS[theme]);
  setScene({ theme });
}

function emit() {
  listeners.forEach((l) => l());
}

export function setThemePreference(next) {
  if (!THEME_OPTIONS.includes(next)) return;
  preference = next;
  try {
    localStorage.setItem(THEME_KEY, next);
  } catch {
    /* storage unavailable — keep for this session */
  }
  apply();
  emit();
}

export const nextThemePreference = (pref = preference) => THEME_OPTIONS[(THEME_OPTIONS.indexOf(pref) + 1) % THEME_OPTIONS.length];

media?.addEventListener("change", () => {
  if (preference === "system") {
    apply();
    emit();
  }
});

// Another tab changed the preference.
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === THEME_KEY) {
      preference = readPreference();
      apply();
      emit();
    }
  });
}

apply();

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** { preference, theme (resolved), setPreference } */
export function useTheme() {
  const pref = useSyncExternalStore(subscribe, () => preference, () => "system");
  const theme = useSyncExternalStore(subscribe, () => resolveTheme(), () => "light");
  return { preference: pref, theme, setPreference: setThemePreference };
}
