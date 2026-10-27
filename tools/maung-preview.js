/**
 * Development-only viewer for the procedural MAUNG model (not part of the
 * production build). Run `npm run dev` and open /tools/maung-preview.html.
 *
 * Query parameters:
 *   yaw=0.4        turn MAUNG (radians)
 *   pose=wave      wave | listen | point | coin | cheer
 *   expr=happy     idle | listening | thinking | happy
 *   theme=light    light | dark lighting
 *   zoom=head      head | body (framing)
 *   t=2            animation time in seconds (frozen, deterministic)
 *   blink=1        show a closed-eye frame
 */
import { DirectionalLight, HemisphereLight, NeutralToneMapping, PerspectiveCamera, PMREMGenerator, Scene, SRGBColorSpace, Vector3, WebGLRenderer } from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { createMaung } from "../src/three/maung/createMaung.js";
import { headTexture } from "../src/three/maung/textures.js";
import { createMaungAnimator } from "../src/three/maung/animateMaung.js";

const q = new URLSearchParams(location.search);
if (q.get("tex")) {
  // show the painted head texture itself (u = 0.5 is the face)
  const img = headTexture().image;
  img.style.cssText = "position:fixed;inset:0;width:100%;height:auto;";
  document.body.append(img);
  document.body.dataset.ready = "1";
  throw new Error("texture view");
}
const theme = q.get("theme") === "light" ? "light" : "dark";
document.body.dataset.theme = theme;

const host = document.getElementById("view");
const renderer = new WebGLRenderer({ antialias: true, alpha: true });
renderer.outputColorSpace = SRGBColorSpace;
renderer.toneMapping = NeutralToneMapping;
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
host.appendChild(renderer.domElement);

const scene = new Scene();
// Default = the app's light-only setup (no environment map). env=1 adds the old
// PMREM room environment for comparison.
if (q.get("env") === "1") {
  const t0 = performance.now();
  const pmrem = new PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04, 0.1, 100, { size: Number(q.get("envsize") || 256) }).texture;
  renderer.getContext().finish();
  window.__pmremMs = Math.round(performance.now() - t0);
  scene.environmentIntensity = theme === "light" ? 0.55 : 0.45;
} else {
  // light-only look: a bright sky/ground fill stands in for the room's diffuse light,
  // a soft frontal key keeps highlights on eyes, shoes and coins
  scene.add(new HemisphereLight("#ffffff", "#9a8878", Number(q.get("amb") || 1.6)));
  const front = new DirectionalLight("#ffffff", Number(q.get("front") || 1.1));
  front.position.set(0.5, 2.5, 6);
  scene.add(front);
}
scene.add(new HemisphereLight(theme === "light" ? "#fff4e0" : "#c6d4ff", "#3b2a1c", theme === "light" ? 0.9 : 0.6));
const key = new DirectionalLight("#ffe3b8", 2.1);
key.position.set(-3, 5, 4.5);
const rim = new DirectionalLight(theme === "light" ? "#ffd9a3" : "#86a0ff", theme === "light" ? 1.2 : 1.9);
rim.position.set(3.5, 3, -4);
const fill = new DirectionalLight("#ffffff", 0.6);
fill.position.set(2, 1.5, 5);
scene.add(key, rim, fill);

const maung = createMaung({ quality: "high" });
scene.add(maung.root);
maung.root.rotation.y = Number(q.get("yaw") || 0);
const animator = createMaungAnimator(maung);

const camera = new PerspectiveCamera(30, innerWidth / innerHeight, 0.1, 50);
const zoom = q.get("zoom") || "body";
const target = zoom === "head" ? new Vector3(0, 1.95, 0) : new Vector3(0, 1.38, 0);
camera.position.copy(target).add(new Vector3(0, 0.15, zoom === "head" ? 4.2 : 7.6));
camera.lookAt(target);

const pose = {};
if (q.get("pose")) pose[q.get("pose")] = 1;
const t = Number(q.get("t") || 2.2);
// settle the damped values, then render one deterministic frame
for (let i = 0; i < 120; i++) animator.update(1 / 30, t, { expression: q.get("expr") || "idle", pose, look: camera.position, still: true });
if (q.get("blink")) {
  for (const { upper } of maung.rig.eyes) upper.rotation.x = 0.45;
}
renderer.render(scene, camera);
document.body.dataset.ready = "1";
