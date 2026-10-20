/**
 * Colour theme: "light" | "dark". Until the user picks one, the theme follows
 * the device (prefers-color-scheme) and keeps following it live. Picking a
 * theme (the toggle or Settings) stores it per device; index.html applies the
 * stored/device theme before first paint (no flash), and this module keeps
 * <html data-theme>, the theme-color meta tag and the 3D scene in sync.
 */
import { useSyncExternalStore } from "react";
import { setScene } from "./sceneStore";

export const THEME_KEY = "simaung:theme";
export const THEME_LABELS = { light: "Terang", dark: "Gelap" };
const META_COLORS = { light: "#f9efdd", dark: "#0d1436" };

const listeners = new Set();
const media = typeof window !== "undefined" ? window.matchMedia("(prefers-color-scheme: dark)") : null;

/** The stored choice, or null while the theme follows the device. */
function readChoice() {
  try {
    const v = localStorage.getItem(THEME_KEY);
    return v === "light" || v === "dark" ? v : null;
  } catch {
    return null;
  }
}

let choice = typeof window !== "undefined" ? readChoice() : null;

const deviceTheme = () => (media?.matches ? "dark" : "light");
export const resolveTheme = () => choice || deviceTheme();

function apply() {
  if (typeof document === "undefined") return;
  const theme = resolveTheme();
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", META_COLORS[theme]);
  setScene({ theme });
}

function emit() {
  listeners.forEach((l) => l());
}

function store(next) {
  choice = next;
  try {
    if (next) localStorage.setItem(THEME_KEY, next);
    else localStorage.removeItem(THEME_KEY);
  } catch {
    /* storage unavailable — keep for this session */
  }
  apply();
  emit();
}

/** Pick "light" or "dark" explicitly (stored on this device). */
export function setTheme(next) {
  if (next === "light" || next === "dark") store(next);
}

/** Switch to the other theme. */
export const toggleTheme = () => setTheme(resolveTheme() === "dark" ? "light" : "dark");

/** Forget the stored choice and follow the device again. */
export const followDevice = () => store(null);

media?.addEventListener("change", () => {
  if (!choice) {
    apply();
    emit();
  }
});

// Another tab changed the choice.
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === THEME_KEY) {
      choice = readChoice();
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

/** { theme: "light" | "dark", followsDevice } */
export function useTheme() {
  const theme = useSyncExternalStore(subscribe, resolveTheme, () => "light");
  const followsDevice = useSyncExternalStore(subscribe, () => choice === null, () => true);
  return { theme, followsDevice };
}
