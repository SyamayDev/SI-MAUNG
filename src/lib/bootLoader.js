/**
 * First-visit loading sequence. Every step is reported by the code that does
 * the work — nothing advances on a timer:
 *   app     session restored and the first route resolved
 *   engine  the three.js chunk downloaded (byte progress when the build
 *           lists the chunk sizes, otherwise indeterminate) and evaluated
 *   model   MAUNG's geometry, materials and textures built
 *   scene   studio lighting baked (PMREM environment)
 *   shader  GPU programs compiled (renderer.compileAsync)
 *   ready   the first frame drawn
 * The overlay only waits for the 3D steps when the current page shows MAUNG;
 * the backend (Supabase) is never awaited here.
 */
const listeners = new Set();

export const BOOT_STEPS = [
  { id: "app", label: "Menyiapkan pengalaman SI-MAUNG", weight: 0.1 },
  { id: "engine", label: "Memuat mesin 3D (three.js)", weight: 0.4 },
  { id: "model", label: "Membangun model & material MAUNG", weight: 0.15 },
  { id: "scene", label: "Menyiapkan pencahayaan & scene 3D", weight: 0.1 },
  { id: "shader", label: "Mengompilasi shader", weight: 0.2 },
  { id: "ready", label: "Siap digunakan", weight: 0.05 },
];

const initialSteps = () => Object.fromEntries(BOOT_STEPS.map((s) => [s.id, { status: "pending", progress: null, note: "" }]));

let state = {
  phase: "loading", // loading | leaving | done
  steps: initialSteps(),
  failure: "", // human-readable reason when 3D could not be prepared
  startedAt: typeof performance !== "undefined" ? performance.now() : 0,
};

const emit = () => listeners.forEach((l) => l());

function patchStep(id, patch) {
  const prev = state.steps[id];
  if (!prev) return;
  // never move backwards from a final state
  if ((prev.status === "done" || prev.status === "skipped") && patch.status && patch.status !== "done" && patch.status !== "skipped") return;
  state = { ...state, steps: { ...state.steps, [id]: { ...prev, ...patch } } };
  emit();
}

export const bootStore = {
  subscribe(l) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  getState: () => state,
};

export const stepActive = (id) => patchStep(id, { status: "active" });
export const stepProgress = (id, fraction, note = "") =>
  patchStep(id, { status: "active", progress: fraction == null ? null : Math.max(0, Math.min(1, fraction)), note });
export const stepDone = (id) => patchStep(id, { status: "done", progress: 1 });
export const stepSkip = (id, note = "") => patchStep(id, { status: "skipped", note });

export function stepFail(id, note) {
  patchStep(id, { status: "error", note });
  state = { ...state, failure: note };
  emit();
}

/** The 3D steps that are not needed right now (no 3D on this page / device). */
export function skip3DSteps(note) {
  for (const s of BOOT_STEPS) if (s.id !== "app" && state.steps[s.id].status !== "done") stepSkip(s.id, note);
}

/** Weighted share of the work that has really completed (0..1). */
export function bootProgress(s = state) {
  let sum = 0;
  let total = 0;
  for (const step of BOOT_STEPS) {
    const st = s.steps[step.id];
    if (st.status === "skipped") continue;
    total += step.weight;
    if (st.status === "done") sum += step.weight;
    else if (st.progress != null) sum += step.weight * st.progress;
  }
  return total ? sum / total : 1;
}

export function finishBoot({ instant = false } = {}) {
  if (state.phase !== "loading") return;
  state = { ...state, phase: instant ? "done" : "leaving" };
  emit();
  if (!instant) {
    setTimeout(() => {
      state = { ...state, phase: "done" };
      emit();
    }, 650);
  }
}
