/**
 * Persistent host for the MAUNG world — a small vanilla three.js renderer
 * (the world is imperative, so a React renderer would only add weight and
 * defeat tree-shaking). Mounted once by SceneHost and kept for the whole
 * visit, so navigating back to a 3D page never rebuilds the model or
 * recompiles shaders.
 *
 * Set-up is split into real steps reported to the loading screen
 * (lib/bootLoader.js): build model → bake lighting → compile shaders →
 * first frame. Each runs in its own task so the page stays responsive.
 *  • the loop runs only while a 3D page is visible and the tab is active
 *  • device-pixel-ratio capped per device tier and lowered when frames get slow
 *  • any failure (WebGL error, lost context) switches the page to its 2D fallback
 *  • geometry, materials, textures, render targets and the GL context are
 *    released on unmount
 */
import { useEffect, useRef } from "react";
import { NeutralToneMapping, PerspectiveCamera, Scene, SRGBColorSpace, Timer, WebGLRenderer } from "three";
import { buildWorld } from "./world/buildWorld.js";
import { scene as store, setScene, subscribeScene } from "../lib/sceneStore.js";
import { deviceTier, glAttributes, takeProbedContext } from "../lib/device.js";
import { stepActive, stepDone, stepFail } from "../lib/bootLoader.js";

const nextTask = () => new Promise((resolve) => setTimeout(resolve, 0));

export default function Stage() {
  const hostRef = useRef(null);

  useEffect(() => {
    // Start once the browser is idle: the page's first paint (headline, buttons)
    // never waits for the GPU set-up below.
    let cleanup = null;
    let cancelled = false;
    const begin = () => {
      if (!cancelled) cleanup = setup(hostRef.current);
    };
    const idle = "requestIdleCallback" in window ? window.requestIdleCallback(begin, { timeout: 400 }) : setTimeout(begin, 50);
    return () => {
      cancelled = true;
      if ("requestIdleCallback" in window) window.cancelIdleCallback(idle);
      else clearTimeout(idle);
      cleanup?.();
    };
  }, []);

  return <div ref={hostRef} className="scene-host__canvas" />;
}

/** Builds the renderer, world and loop inside `host`; returns the cleanup. */
function setup(host) {
  let disposed = false;
  const tier = deviceTier();
  const maxDpr = tier === "high" ? 1.75 : tier === "mid" ? 1.5 : 1;
  let dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
  let step = "model";

  const fail = (message) => {
    stepFail(step, message);
    setScene({ failed: true, ready: false });
  };

  let renderer;
  try {
    // Reuse the context lib/device opened to check WebGL2 (never create two).
    const handoff = takeProbedContext();
    renderer = new WebGLRenderer({ ...glAttributes(), ...(handoff ? { canvas: handoff.canvas, context: handoff.gl } : {}) });
  } catch {
    fail("WebGL tidak dapat dijalankan di perangkat ini.");
    return undefined;
  }
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = NeutralToneMapping; // keeps the brand amber saturated
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(dpr);
  const canvas = renderer.domElement;
  canvas.setAttribute("aria-hidden", "true");
  canvas.tabIndex = -1;
  host.appendChild(canvas);

  const scene = new Scene();
  const camera = new PerspectiveCamera(30, 1, 0.1, 80);
  camera.position.set(1.2, 2.2, 9);
  const size = { width: 1, height: 1 };
  const timer = new Timer();
  const clock = { elapsedTime: 0 };
  const state = { camera, size, clock, scene };

  const resize = () => {
    const w = Math.max(1, host.clientWidth);
    const h = Math.max(1, host.clientHeight);
    size.width = w;
    size.height = h;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(host);

  let world = null;
  // The render loop may only start once compileAsync has finished: an earlier
  // frame would compile every shader synchronously and freeze the page.
  let compiled = false;

  // Frame budget: drop the pixel ratio a step if the average frame stays slower than ~30 fps.
  let budgetTime = 0;
  let budgetFrames = 0;
  let first = true;
  let resumed = true;
  const frame = (time) => {
    timer.update(time);
    const delta = resumed ? 1 / 60 : timer.getDelta(); // a paused stretch is not one huge frame
    resumed = false;
    clock.elapsedTime = timer.getElapsed();
    const tf = first ? performance.now() : 0;
    world.update(state, delta);
    renderer.render(scene, camera);
    if (first) {
      performance.measure("simaung:first-frame", { start: tf, detail: { programs: renderer.info.programs?.length } });
      first = false;
      requestAnimationFrame(() => {
        stepDone("ready");
        setScene({ ready: true });
      });
    }
    budgetTime += delta;
    budgetFrames += 1;
    if (budgetTime > 2) {
      if (budgetTime / budgetFrames > 1 / 30 && dpr > 1) {
        dpr = Math.max(1, +(dpr - 0.25).toFixed(2));
        renderer.setPixelRatio(dpr);
        resize();
      }
      budgetTime = 0;
      budgetFrames = 0;
    }
  };

  let running = false;
  const sync = () => {
    const visible = store.mode !== "off" && (store.mode !== "story" || store.inView);
    const want = Boolean(world) && compiled && visible && !store.failed && !document.hidden;
    if (want === running) return;
    running = want;
    if (want) resumed = true;
    renderer.setAnimationLoop(want ? frame : null);
  };
  const unsubscribe = subscribeScene(sync);
  document.addEventListener("visibilitychange", sync);

  const onLost = (e) => {
    e.preventDefault();
    setScene({ failed: true, ready: false });
  };
  canvas.addEventListener("webglcontextlost", onLost);

  (async () => {
    try {
      stepActive("model");
      await nextTask();
      if (disposed) return;
      let t = performance.now();
      world = buildWorld({ tier });
      performance.measure("simaung:model", { start: t });
      stepDone("model");

      step = "scene";
      stepActive("scene");
      await nextTask();
      if (disposed) return;
      // No environment map: generating one (PMREM) blocked the main thread for
      // ~1 s while the GPU driver compiled its shaders. buildWorld's sky/ground
      // fill and frontal light give the same soft look at no start-up cost.
      scene.add(world.root);
      stepDone("scene");

      step = "shader";
      stepActive("shader");
      world.update(state, 0); // place camera, coins and MAUNG before compiling
      t = performance.now();
      await renderer.compileAsync(scene, camera);
      performance.measure("simaung:shaders", { start: t, detail: { programs: renderer.info.programs?.length } });
      if (disposed) return;
      stepDone("shader");

      compiled = true;
      step = "ready";
      stepActive("ready");
      sync();
    } catch {
      if (!disposed) fail("Scene 3D gagal disiapkan di perangkat ini.");
    }
  })();

  return () => {
    disposed = true;
    renderer.setAnimationLoop(null);
    unsubscribe();
    document.removeEventListener("visibilitychange", sync);
    canvas.removeEventListener("webglcontextlost", onLost);
    ro.disconnect();
    if (world) {
      scene.remove(world.root);
      world.dispose();
    }
    renderer.dispose();
    renderer.forceContextLoss();
    canvas.remove();
    setScene({ ready: false });
  };
}
