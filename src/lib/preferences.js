/**
 * Per-device preferences (localStorage). Each one is wired to real behaviour:
 *   scene3d       "auto" | "off"  — whether the 3D MAUNG scene may load
 *   voiceAutoSave boolean         — save voice/text drafts without review when
 *                                   the parser reports no issues (default off)
 */
import { useSyncExternalStore } from "react";

const KEY = "simaung:prefs";
const DEFAULTS = { scene3d: "auto", voiceAutoSave: false };
const listeners = new Set();

function read() {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || "{}") };
  } catch {
    return { ...DEFAULTS };
  }
}

let prefs = read();

export function getPreferences() {
  return prefs;
}

export function setPreference(key, value) {
  prefs = { ...prefs, [key]: value };
  try {
    localStorage.setItem(KEY, JSON.stringify(prefs));
  } catch {
    /* storage unavailable (private mode) — keep for this session */
  }
  listeners.forEach((l) => l());
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function usePreferences() {
  return useSyncExternalStore(subscribe, getPreferences, () => DEFAULTS);
}
