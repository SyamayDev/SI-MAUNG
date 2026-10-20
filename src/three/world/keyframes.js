/**
 * Story keyframing. Story position s is continuous: chapter i settles at
 * s = i and holds until i + 0.7; between i − 0.3 and i it arrives from i − 1.
 */
export const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (x) => x * x * (3 - 2 * x);
export const damp = (current, target, lambda, dt) => current + (target - current) * (1 - Math.exp(-lambda * dt));

/** { a, b, w } — blend from chapter a to chapter b with weight w (0 → a, 1 → b). */
export function chapterBlend(story, count) {
  const i = Math.max(0, Math.min(count - 1, Math.floor(story + 0.3)));
  const local = story - (i - 0.3);
  if (i > 0 && local < 0.3) return { a: i - 1, b: i, w: smooth(clamp01(local / 0.3)) };
  return { a: i, b: i, w: 1 };
}

/** Progress (0..1) through chapter i's holding phase. */
export const holdProgress = (story, i) => clamp01((story - i) / 0.7);

/** How present chapter i is (0..1), fading in while it arrives and out as the next arrives. */
export function presence(story, i) {
  if (story < i - 0.3 || story >= i + 1) return 0;
  if (story < i) return smooth((story - (i - 0.3)) / 0.3);
  if (story < i + 0.7) return 1;
  return 1 - smooth((story - (i + 0.7)) / 0.3);
}

/** Interpolate arrays (or numbers) between two keyframes. */
export function mix(A, B, w, out) {
  if (typeof A === "number") return lerp(A, B, w);
  out = out || new Array(A.length);
  for (let k = 0; k < A.length; k++) out[k] = lerp(A[k], B[k], w);
  return out;
}
