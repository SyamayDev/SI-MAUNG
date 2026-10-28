/**
 * Shared state between the DOM and the WebGL scene. The scene reads these
 * plain fields every frame (no React re-render per scroll pixel); React only
 * subscribes to the few fields that change what is rendered.
 */
const listeners = new Set();

const reduceQuery = typeof window !== "undefined" ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;

export const scene = {
  /**
   * What the persistent 3D host shows for the current route:
   *   "story"    landing & dashboard scroll story
   *   "portrait" MAUNG framed in a page element ([data-maung-frame]: auth, onboarding)
   *   "off"      not visible (render loop paused, world kept in memory)
   */
  mode: "off",
  /** Resolved colour theme: "light" | "dark" (lighting, floor, sky props). */
  theme: "light",
  /** Portrait mode: the frame rect as viewport fractions { x, y, w, h }, and MAUNG's pose there. */
  frame: { x: 0.55, y: 0.15, w: 0.4, h: 0.7 },
  portraitPose: "wave",
  /** prefers-reduced-motion: MAUNG holds calm poses, coins and camera don't drift. */
  reducedMotion: Boolean(reduceQuery?.matches),
  /** Desktop app shell (sidebar) is on screen: the canvas starts right of it. */
  shell: false,
  /** Continuous story position: chapter i spans [i, i + 1). Written by scrollStory.js. */
  story: 0,
  /** Index of the chapter currently in view. */
  chapter: 0,
  /** The story section is on screen (render loop pauses otherwise). */
  inView: true,
  /** "wide": text left, MAUNG right. "tall": phones/tablets, MAUNG in the zone above the pinned text panel. */
  layout: "wide",
  /** Tall layout: MAUNG's zone in px from the viewport top — from bandTop (top bar) to bandBottom[i] (chapter i's text panel). */
  bandTop: 64,
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
  /**
   * The WebGL capability probe has run. It creates a GL context (expensive),
   * so it waits until the stage is about to load; until then 3D is assumed
   * possible and a light vector MAUNG stands in.
   */
  webglChecked: false,
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

reduceQuery?.addEventListener("change", (e) => setScene({ reducedMotion: e.matches }));

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
