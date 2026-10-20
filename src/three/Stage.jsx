/**
 * Host for the MAUNG world — a small vanilla three.js renderer (the world is
 * imperative, so a full React renderer would only add weight and defeat
 * three.js tree-shaking). Lazy-loaded by StoryBackdrop.
 *  • the loop runs only while the story is on screen and the tab is visible
 *  • device-pixel-ratio capped per device tier and lowered when frames get slow
 *  • procedural studio reflections (RoomEnvironment → PMREM), no HDR download
 *  • any failure (WebGL error, lost context) flips the page to the 2D posters
 *  • geometry, materials, textures, render targets and the GL context are
 *    released on unmount
 */
import { useEffect, useRef } from "react";
import { NeutralToneMapping, PerspectiveCamera, PMREMGenerator, Scene, SRGBColorSpace, Timer, WebGLRenderer } from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { buildWorld } from "./world/buildWorld.js";
import { scene as store, setScene, subscribeScene } from "../lib/sceneStore.js";
import { deviceTier } from "../lib/device.js";

export default function Stage() {
  const hostRef = useRef(null);

  useEffect(() => {
    const host = hostRef.current;
    const tier = deviceTier();
    const maxDpr = tier === "high" ? 1.75 : tier === "mid" ? 1.5 : 1;
    let dpr = Math.min(window.devicePixelRatio || 1, maxDpr);

    let renderer;
    try {
      renderer = new WebGLRenderer({ antialias: tier !== "low", alpha: true, stencil: false, powerPreference: "high-performance" });
    } catch {
      setScene({ failed: true });
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
    const state = { camera, size, clock };

    let world;
    let envRT;
    const pmrem = new PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    try {
      world = buildWorld({ tier });
      envRT = pmrem.fromScene(room, 0.04);
      scene.environment = envRT.texture;
      scene.environmentIntensity = 0.45;
      scene.add(world.root);
    } catch {
      setScene({ failed: true });
    }

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
      if (!world) return;
      world.update(state, delta);
      renderer.render(scene, camera);
      if (first) {
        first = false;
        requestAnimationFrame(() => setScene({ ready: true }));
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
      const want = store.inView && !store.failed && !document.hidden;
      if (want === running) return;
      running = want;
      if (want) resumed = true;
      renderer.setAnimationLoop(want ? frame : null);
    };
    const unsubscribe = subscribeScene(sync);
    document.addEventListener("visibilitychange", sync);
    sync();

    const onLost = (e) => {
      e.preventDefault();
      setScene({ failed: true, ready: false });
    };
    canvas.addEventListener("webglcontextlost", onLost);

    return () => {
      renderer.setAnimationLoop(null);
      unsubscribe();
      document.removeEventListener("visibilitychange", sync);
      canvas.removeEventListener("webglcontextlost", onLost);
      ro.disconnect();
      if (world) {
        scene.remove(world.root);
        world.dispose();
      }
      scene.environment = null;
      envRT?.dispose();
      pmrem.dispose();
      room.dispose?.();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
      setScene({ ready: false });
    };
  }, []);

  return <div ref={hostRef} style={{ position: "absolute", inset: 0 }} />;
}
