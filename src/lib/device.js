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

let probe;
function probeWebGL() {
  if (probe) return probe;
  probe = { webgl: false, software: false };
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
    if (gl) {
      const info = gl.getExtension("WEBGL_debug_renderer_info");
      const renderer = String(gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER) || "");
      probe = { webgl: true, software: /swiftshader|llvmpipe|softpipe|software|basic render/i.test(renderer) };
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    }
  } catch {
    /* no WebGL */
  }
  return probe;
}

/**
 * Should the live 3D scene load? Not when the user turned it off, prefers
 * reduced motion, has no WebGL, or only a software renderer (it would stutter)
 * — `?3d=on` in the URL forces it for testing.
 */
export function canRender3D() {
  if (typeof window === "undefined") return { ok: false, reason: "ssr" };
  const forced = /[?&]3d=on\b/.test(window.location.search);
  if (/[?&]3d=off\b/.test(window.location.search)) return { ok: false, reason: "off" };
  if (!forced && getPreferences().scene3d === "off") return { ok: false, reason: "off" };
  if (!forced && prefersReducedMotion()) return { ok: false, reason: "reduced-motion" };
  const { webgl, software } = probeWebGL();
  if (!webgl) return { ok: false, reason: "no-webgl" };
  if (software && !forced) return { ok: false, reason: "software" };
  return { ok: true, reason: "" };
}
