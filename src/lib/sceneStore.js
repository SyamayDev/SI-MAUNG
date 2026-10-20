/**
 * Shared state between the DOM and the WebGL scene. The scene reads these
 * plain fields every frame (no React re-render per scroll pixel); React only
 * subscribes to the few fields that change what is rendered.
 */
const listeners = new Set();

export const scene = {
  /** Continuous story position: chapter i spans [i, i + 1). Written by scrollStory.js. */
  story: 0,
  /** Index of the chapter currently in view. */
  chapter: 0,
  /** The story section is on screen (render loop pauses otherwise). */
  inView: true,
  /** "wide": text left, MAUNG right. "tall": phones/tablets, MAUNG framed in the band above the text. */
  layout: "wide",
  /** Tall layout: free band [top, bottom] as viewport fractions, per chapter. */
  bandTop: 0.1,
  bandBottom: [],
  /** Real figures behind the chapters (null = no data → the scene shows no figure). */
  data: {
    flow: null, // { income, expense } for this month
    categories: [], // [{ category, share, color }] top expense categories this month
    goal: null, // overall goal progress 0..1
    demo: false, // landing page: abstract shapes, no figures
  },
  /** MAUNG's current mood: idle | listening | thinking | happy */
  mood: "idle",
  /** Last one-shot cue: { type: "saved" | "wave" | "hop", at: ms } */
  cue: { type: "", at: -1 },
  /** The 3D stage has drawn its first frame. */
  ready: false,
  failed: false,
};

export function setScene(patch) {
  let changed = false;
  for (const [k, v] of Object.entries(patch)) {
    if (scene[k] !== v) {
      scene[k] = v;
      changed = true;
    }
  }
  if (changed) listeners.forEach((l) => l());
}

export function subscribeScene(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const now = () => (typeof performance !== "undefined" ? performance.now() : 0);

/** One-shot gesture for MAUNG (e.g. a transaction was saved). */
export function cue(type) {
  scene.cue = { type, at: now() };
}

export function setMood(mood) {
  scene.mood = mood;
}

/** Pointer in normalised device coordinates; only mice steer MAUNG's gaze. */
export const pointer = { x: 0, y: 0, active: false };
if (typeof window !== "undefined") {
  window.addEventListener(
    "pointermove",
    (e) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
      pointer.active = e.pointerType === "mouse";
    },
    { passive: true }
  );
}
