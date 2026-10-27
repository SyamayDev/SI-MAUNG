/** Device capability checks that decide whether (and how richly) the 3D scene runs. */
import { getPreferences } from "./preferences";

const mq = (q) => typeof window !== "undefined" && Boolean(window.matchMedia?.(q).matches);

export const prefersReducedMotion = () => mq("(prefers-reduced-motion: reduce)");
export const hasFinePointer = () => mq("(hover: hover) and (pointer: fine)");

/** "high" desktop GPUs, "mid" phones/laptops, "low" modest hardware. */
export function deviceTier() {
  if (typeof navigator === "undefined") return "mid";
  const cores = navigator.hardwareConcurrency || 4;
  const memory = navigator.deviceMemory || 4;
  if (cores <= 2 || memory <= 2) return "low";
  if (mq("(pointer: coarse)") || cores <= 4 || memory <= 4 || window.innerWidth < 768) return "mid";
  return "high";
}

/** Context attributes the 3D stage renders with (the probe below must match them). */
export const glAttributes = () => ({
  alpha: true,
  antialias: deviceTier() !== "low",
  depth: true,
  stencil: false,
  premultipliedAlpha: true,
  preserveDrawingBuffer: false,
  powerPreference: "default",
});

let probe;
/**
 * WebGL2 check (three.js needs WebGL2). Creating a context is the single most
 * expensive start-up step (hundreds of ms on some drivers), so the probe's
 * context is kept and handed to the 3D stage instead of making a second one.
 */
function probeWebGL() {
  if (probe) return probe;
  probe = { webgl: false, software: false, handoff: null };
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2", glAttributes());
    if (gl) {
      const info = gl.getExtension("WEBGL_debug_renderer_info");
      const renderer = String(gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER) || "");
      const software = /swiftshader|llvmpipe|softpipe|software|basic render/i.test(renderer);
      probe = { webgl: true, software, handoff: software ? null : { canvas, gl } };
      if (software) gl.getExtension("WEBGL_lose_context")?.loseContext();
    }
  } catch {
    /* no WebGL2 */
  }
  return probe;
}

/** The probe's WebGL2 context, given to the 3D stage once (null afterwards or if there is none). */
export function takeProbedContext() {
  const handoff = probe?.handoff || null;
  if (probe) probe.handoff = null;
  return handoff;
}

/**
 * Should the live 3D scene load? Not when the user turned it off, has no
 * WebGL, or only a software renderer (it would stutter) — `?3d=on` in the URL
 * forces it for testing. Reduced motion keeps the 3D MAUNG but holds him still
 * (see sceneStore.reducedMotion).
 */
export function canRender3D(scene3dPreference = getPreferences().scene3d) {
  if (typeof window === "undefined") return { ok: false, reason: "ssr" };
  const forced = /[?&]3d=on\b/.test(window.location.search);
  if (/[?&]3d=off\b/.test(window.location.search)) return { ok: false, reason: "off" };
  if (!forced && scene3dPreference === "off") return { ok: false, reason: "off" };
  const { webgl, software } = probeWebGL();
  if (!webgl) return { ok: false, reason: "no-webgl" };
  if (software && !forced) return { ok: false, reason: "software" };
  return { ok: true, reason: "" };
}
