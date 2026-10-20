/**
 * "Dunia MAUNG" — the persistent 3D scene behind the scroll story.
 *
 * Built imperatively (one scene graph, one update per frame) and driven by the
 * shared scene store (lib/sceneStore.js):
 *   0 Kenali uangmu        — MAUNG greets; coins orbit
 *   1 Ucapkan, MAUNG catat — paw to ear; coins fly from his mouth into a transaction card
 *   2 Setiap arus          — inflow / outflow streams, split by the user's real monthly totals
 *   3 Lihat pola           — coins stack into columns, heights = real category shares
 *   4 Sedikit demi sedikit — a ring of coins lights up to the real savings progress
 *   5 Kendali              — MAUNG waves goodbye; coins orbit again
 * All coins are one InstancedMesh whose layout morphs between chapters.
 *
 * Portrait mode (auth & onboarding pages) frames MAUNG inside a page element
 * with a pose chosen by that page. Light/dark theme changes the lighting and
 * stage props, never MAUNG's own colours. Reduced motion holds calm poses.
 */
import {
  AdditiveBlending,
  AmbientLight,
  BufferGeometry,
  Color,
  CylinderGeometry,
  DirectionalLight,
  Float32BufferAttribute,
  Group,
  HemisphereLight,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  NormalBlending,
  Object3D,
  PlaneGeometry,
  PointLight,
  Points,
  PointsMaterial,
  Sprite,
  SpriteMaterial,
  TorusGeometry,
  Vector3,
} from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { createMaung } from "../maung/createMaung.js";
import { createMaungAnimator } from "../maung/animateMaung.js";
import { chipTexture, floorTexture, glowTexture } from "../maung/textures.js";
import { pointer, scene as store } from "../../lib/sceneStore.js";
import { chapterBlend, clamp01, damp, holdProgress, lerp, mix, presence, smooth } from "./keyframes.js";

const CHAPTERS = 6;
const GOLDEN = 0.6180339887;
const frac = (x) => x - Math.floor(x);

/* ---------- camera framing per chapter ----------
 * target: what the camera aims at; size: [w, h] box (world units) that must
 * stay visible; dir: camera direction from the target; maung: [x, rotY]. */
// screen: [centre x, usable width] as fractions of the canvas (wide layout; text sits on the left).
const FRAMES = [
  { target: [0, 1.38, 0], size: [2.9, 3.1], dir: [0.34, 0.16, 1], maung: [0, -0.3], screen: [0.72, 0.46] },
  { target: [0.75, 1.6, 0], size: [4.3, 2.9], dir: [-0.28, 0.12, 1], maung: [-0.35, 0.5], screen: [0.7, 0.5] },
  { target: [0, 1.0, -0.3], size: [7.0, 3.4], dir: [0, 0.5, 1], maung: [0, 0], screen: [0.64, 0.66] },
  { target: [0.95, 1.05, 0], size: [5.6, 3.2], dir: [0.45, 0.28, 1], maung: [-0.95, 0.5], screen: [0.7, 0.54] },
  { target: [0, 1.75, -0.4], size: [3.9, 4.0], dir: [0, -0.04, 1], maung: [0, 0], screen: [0.72, 0.46] },
  { target: [0, 1.38, 0], size: [3.2, 3.3], dir: [-0.3, 0.14, 1], maung: [0, -0.15], screen: [0.72, 0.46] },
];
// Phones/tablets: tighter boxes, the band above the text is short.
const FRAMES_TALL = [
  { target: [0, 1.45, 0], size: [2.3, 2.9] },
  { target: [0.7, 1.6, 0], size: [3.9, 2.6] },
  { target: [0, 1.0, -0.3], size: [5.4, 2.6] },
  { target: [0.8, 1.05, 0], size: [5.2, 2.8] },
  { target: [0, 1.75, -0.4], size: [3.6, 3.7] },
  { target: [0, 1.45, 0], size: [2.3, 2.9] },
];

const EXPRESSION = ["idle", "listening", "idle", "thinking", "happy", "happy"];
const POSE = [{}, { listen: 1 }, {}, { point: 1 }, { coin: 1 }, { wave: 1 }];

const COLORS = {
  gold: new Color("#f6c445"),
  income: new Color("#20c495"),
  expense: new Color("#ff6b5e"),
  dim: new Color("#2c3468"),
  gray: new Color("#8b90aa"),
};

const CHIP_POS = new Vector3(1.95, 1.62, 0.2);
const RING_CENTER = new Vector3(0, 1.75, -0.7);
const RING_R = 1.6;

function quadBezier(a, c, b, u, out) {
  const v = 1 - u;
  return out.set(
    v * v * a.x + 2 * v * u * c.x + u * u * b.x,
    v * v * a.y + 2 * v * u * c.y + u * u * b.y,
    v * v * a.z + 2 * v * u * c.z + u * u * b.z
  );
}

export function buildWorld({ tier = "mid" } = {}) {
  const root = new Group();
  root.name = "DuniaMAUNG";
  const disposables = [];
  const keep = (x) => (disposables.push(x), x);

  /* ---------- lights ---------- */
  const hemi = new HemisphereLight("#c6d4ff", "#3b2a1c", 0.6);
  root.add(hemi);
  root.add(new AmbientLight("#ffffff", 0.12));
  const key = new DirectionalLight("#ffe3b8", 2.1);
  key.position.set(-3, 5, 4.5);
  root.add(key);
  const rim = new DirectionalLight("#86a0ff", 1.9);
  rim.position.set(3.5, 3, -4);
  root.add(rim);
  const fill = new DirectionalLight("#ffffff", 0.55);
  fill.position.set(2, 1.5, 5);
  root.add(fill);
  const inLight = new PointLight("#20c495", 0, 9, 1.6);
  inLight.position.set(-2.6, 1.6, 1.2);
  const outLight = new PointLight("#ff6b5e", 0, 9, 1.6);
  outLight.position.set(2.6, 1.6, 1.2);
  root.add(inLight, outLight);

  /* ---------- stage ---------- */
  const floorMaps = { dark: keep(floorTexture("dark")), light: keep(floorTexture("light")) };
  const floor = new Mesh(keep(new PlaneGeometry(9, 9)), keep(new MeshBasicMaterial({ map: floorMaps.dark, transparent: true, depthWrite: false })));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.002;
  root.add(floor);

  const glowMat = keep(new SpriteMaterial({ map: keep(glowTexture()), color: "#f2a516", transparent: true, opacity: 0.22, blending: AdditiveBlending, depthWrite: false }));
  const glow = new Sprite(glowMat);
  glow.position.set(0, 1.6, -1.2);
  glow.scale.set(5.5, 5.5, 1);
  root.add(glow);

  // faint stars for depth
  const starCount = tier === "low" ? 120 : 260;
  const starPos = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    const a = frac(i * GOLDEN) * Math.PI * 2;
    const r = 9 + frac(i * 0.37) * 14;
    starPos.set([Math.cos(a) * r, 1 + frac(i * 0.71) * 12, -6 - Math.abs(Math.sin(a)) * r], i * 3);
  }
  const starGeo = keep(new BufferGeometry());
  starGeo.setAttribute("position", new Float32BufferAttribute(starPos, 3));
  const stars = new Points(starGeo, keep(new PointsMaterial({ color: "#dfe6ff", size: 0.05, transparent: true, opacity: 0.7, depthWrite: false })));
  root.add(stars);

  /* ---------- MAUNG ---------- */
  const maung = createMaung({ quality: tier });
  const animator = createMaungAnimator(maung);
  root.add(maung.root);
  const mouthWorld = new Vector3();

  /* ---------- chapter 1: transaction card + sound rings ---------- */
  const chip = new Group();
  chip.position.copy(CHIP_POS);
  chip.rotation.y = -0.45;
  const chipBody = new Mesh(keep(new RoundedBoxGeometry(1.15, 0.74, 0.07, 3, 0.06)), keep(new MeshStandardMaterial({ color: "#fffaf0", roughness: 0.5 })));
  const chipFace = new Mesh(keep(new PlaneGeometry(1.08, 0.675)), keep(new MeshBasicMaterial({ map: keep(chipTexture()), toneMapped: false })));
  chipFace.position.z = 0.037;
  chip.add(chipBody, chipFace);
  chip.scale.setScalar(0.001);
  root.add(chip);

  const ringGeo = keep(new TorusGeometry(0.22, 0.012, 8, 48));
  const soundRings = [0, 1, 2].map(() => {
    const m = new Mesh(ringGeo, keep(new MeshBasicMaterial({ color: "#f2a516", transparent: true, opacity: 0, blending: AdditiveBlending, depthWrite: false })));
    root.add(m);
    return m;
  });

  /* ---------- chapter 4: savings ring outline ---------- */
  const ringOutline = new Mesh(
    keep(new TorusGeometry(RING_R, 0.014, 8, 160)),
    keep(new MeshBasicMaterial({ color: "#5b6bd0", transparent: true, opacity: 0, blending: AdditiveBlending, depthWrite: false }))
  );
  ringOutline.position.copy(RING_CENTER);
  root.add(ringOutline);

  /* ---------- coins ---------- */
  const N = tier === "high" ? 72 : tier === "mid" ? 54 : 36;
  const coinGeo = keep(new CylinderGeometry(0.13, 0.13, 0.03, tier === "low" ? 16 : 28));
  const coinMat = keep(new MeshStandardMaterial({ color: "#ffffff", metalness: 0.75, roughness: 0.3 }));
  const coins = new InstancedMesh(coinGeo, coinMat, N);
  coins.frustumCulled = false;
  for (let i = 0; i < N; i++) coins.setColorAt(i, COLORS.gold);
  root.add(coins);

  const dummy = new Object3D();
  const pA = new Vector3();
  const pB = new Vector3();
  const rA = new Vector3();
  const rB = new Vector3();
  const cA = new Color();
  const cB = new Color();
  const ctrl = new Vector3();
  const startV = new Vector3();
  const endV = new Vector3();
  const tmp = new Vector3();

  // Data-derived layout parameters (recomputed when the data object changes).
  let dataRef = null;
  let inCount = 0;
  let hasFlow = false;
  let stacks = []; // [{ x, z, count, color }]
  let stackOf = new Int16Array(N);
  let levelOf = new Int16Array(N);
  let tallestTop = new Vector3(1.2, 1.4, 0.2);
  let ringFill = 0;

  function applyData() {
    const d = store.data;
    dataRef = d;
    const flow = d.flow;
    const total = flow ? flow.income + flow.expense : 0;
    hasFlow = d.demo || total > 0;
    const inRatio = d.demo ? 0.58 : total > 0 ? flow.income / total : 0.5;
    inCount = Math.round(N * inRatio);

    const cats = d.demo
      ? [0.34, 0.24, 0.18, 0.14, 0.1].map((share, j) => ({ share, color: ["#f2a516", "#3b6fd8", "#b4488f", "#6450c8", "#1e9c82"][j] }))
      : d.categories || [];
    const maxH = Math.min(24, Math.floor(N * 0.42));
    const maxShare = cats[0]?.share || 1;
    stacks = Array.from({ length: 5 }, (_, j) => {
      const c = cats[j];
      return {
        x: 0.55 + j * 0.6,
        z: 0.3 - j * 0.14,
        count: c ? Math.max(1, Math.round((c.share / maxShare) * maxH)) : cats.length ? 0 : 1,
        color: new Color(c ? c.color : COLORS.gray),
      };
    });
    let idx = 0;
    stackOf.fill(-1);
    stacks.forEach((s, j) => {
      for (let k = 0; k < s.count && idx < N; k++, idx++) {
        stackOf[idx] = j;
        levelOf[idx] = k;
      }
    });
    const tall = stacks.reduce((a, b) => (b.count > a.count ? b : a), stacks[0]);
    tallestTop = new Vector3(tall.x, 0.058 * tall.count + 0.1, tall.z);
  }

  /** Layout of coin i for chapter c → writes pos/rot/color, returns scale. */
  function layout(c, i, t, pos, rot, col) {
    switch (c) {
      case 1: {
        // words → coins → card: fly from MAUNG's mouth into the transaction card
        const u = frac(t * 0.3 + i * GOLDEN);
        ctrl.set((mouthWorld.x + CHIP_POS.x) / 2, Math.max(mouthWorld.y, CHIP_POS.y) + 0.85, 0.9);
        quadBezier(mouthWorld, ctrl, CHIP_POS, u, pos);
        rot.set(Math.PI / 2, 0, u * 6);
        col.copy(COLORS.gold);
        return Math.sin(u * Math.PI) * 0.55;
      }
      case 2: {
        if (!hasFlow) {
          // no data yet: a quiet pile at MAUNG's feet
          const a = frac(i * GOLDEN) * Math.PI * 2;
          const r = 0.75 + (i % 4) * 0.13;
          pos.set(Math.cos(a) * r, 0.02 + Math.floor(i / 18) * 0.032, Math.sin(a) * r * 0.8);
          rot.set(0, a, 0);
          col.copy(COLORS.gray);
          return 0.8;
        }
        const income = i < inCount;
        const u = frac(t * 0.15 + i * GOLDEN);
        if (income) {
          startV.set(-4.8, 0.3, -2.8);
          ctrl.set(-2.7, 1.7, 0.7);
          endV.set(-0.8, 0.35, 0.55);
        } else {
          startV.set(0.8, 0.35, 0.55);
          ctrl.set(2.7, 1.7, 0.7);
          endV.set(4.8, 0.3, -2.8);
        }
        quadBezier(startV, ctrl, endV, u, pos);
        pos.y += Math.sin(t * 2 + i) * 0.04;
        rot.set(0, income ? 0.8 : -0.8, t * 4 + i);
        col.copy(income ? COLORS.income : COLORS.expense);
        return 0.35 + Math.sin(u * Math.PI) * 0.75;
      }
      case 3: {
        const j = stackOf[i];
        if (j < 0) {
          pos.set(0.9, -0.2, 0);
          rot.set(0, 0, 0);
          col.copy(COLORS.gray);
          return 0.001;
        }
        const s = stacks[j];
        const jitter = Math.sin(i * 12.9898) * 0.012;
        pos.set(s.x + jitter, 0.03 + levelOf[i] * 0.058, s.z - jitter);
        rot.set(0, i * 0.7, 0);
        col.copy(s.color);
        return 1;
      }
      case 4: {
        const a = Math.PI / 2 - (i / N) * Math.PI * 2;
        pos.set(RING_CENTER.x + Math.cos(a) * RING_R, RING_CENTER.y + Math.sin(a) * RING_R, RING_CENTER.z);
        const lit = (i + 0.5) / N <= ringFill;
        rot.set(Math.PI / 2, 0, lit ? Math.sin(t * 2 + i) * 0.25 : 0);
        col.copy(lit ? COLORS.gold : COLORS.dim);
        return lit ? 0.8 : 0.5;
      }
      default: {
        // 0 & 5: inclined orbit — the near side dips below MAUNG's face
        const ring = i % 3;
        const a = (i / N) * Math.PI * 2 + t * (c === 5 ? 0.3 : 0.2) * (ring === 1 ? -1 : 1);
        const r = 1.8 + ring * 0.24;
        pos.set(Math.cos(a) * r, 0.78 - Math.sin(a) * 0.3 + ring * 0.1, Math.sin(a) * r * 0.72);
        rot.set(t * 1.3 + i, i, 0.4);
        col.copy(COLORS.gold);
        return 0.6;
      }
    }
  }

  /* ---------- camera rig ---------- */
  const cam = { pos: new Vector3(1.2, 2.2, 9), look: new Vector3(0, 1.4, 0), cx: 0.72, cy: 0.52, init: false };
  const target = new Vector3();
  const dir = new Vector3();
  const lookTarget = new Vector3();
  const lookA = new Vector3();
  const lookB = new Vector3();
  const frameTarget = [0, 0, 0];
  const frameSize = [0, 0];
  const frameDir = [0, 0, 0];

  let t0 = -1;
  let waveUntil = 0;
  let cheerUntil = 0;
  let lastCue = -1;
  let lastMode = "off";
  let lastPortraitPose = "";
  let themeApplied = "";
  const pose = { wave: 0, listen: 0, point: 0, coin: 0, cheer: 0 };

  /** Lighting and stage props per colour theme (MAUNG's own colours never change). */
  function applyTheme(theme, scene3) {
    themeApplied = theme;
    const light = theme === "light";
    hemi.color.set(light ? "#fff3df" : "#c6d4ff");
    hemi.groundColor.set(light ? "#c99a5c" : "#3b2a1c");
    hemi.intensity = light ? 0.95 : 0.6;
    key.intensity = light ? 2.3 : 2.1;
    rim.color.set(light ? "#ffcf8a" : "#86a0ff");
    rim.intensity = light ? 1.3 : 1.9;
    fill.intensity = light ? 0.75 : 0.55;
    floor.material.map = floorMaps[light ? "light" : "dark"];
    floor.material.needsUpdate = true;
    glowMat.color.set(light ? "#ffb347" : "#f2a516");
    stars.visible = !light;
    ringOutline.material.color.set(light ? "#c98a12" : "#5b6bd0");
    ringOutline.material.blending = light ? NormalBlending : AdditiveBlending;
    soundRings.forEach((r) => (r.material.blending = light ? NormalBlending : AdditiveBlending));
    COLORS.dim.set(light ? "#cdb995" : "#2c3468");
    if (scene3) scene3.environmentIntensity = light ? 0.6 : 0.45;
  }

  // Portrait poses requested by pages (auth, onboarding).
  const PORTRAIT = {
    wave: { pose: { wave: 1 }, expression: "happy" },
    listen: { pose: { listen: 1 }, expression: "listening" },
    point: { pose: { point: 1 }, expression: "idle" },
    coin: { pose: { coin: 1 }, expression: "happy" },
    cheer: { pose: { cheer: 1 }, expression: "happy" },
    thinking: { pose: {}, expression: "thinking" },
    idle: { pose: {}, expression: "idle" },
  };

  function chapterLook(c, t, camera, out) {
    switch (c) {
      case 1:
        return out.copy(CHIP_POS);
      case 2:
        return out.set(Math.sin(t * 0.5) * 3, 0.7, 1.6);
      case 3:
        return out.copy(tallestTop);
      default:
        if (pointer.active && (c === 0 || c === 5)) return out.set(pointer.x * 3.2, 1.9 + pointer.y * 1.6, 4);
        return out.copy(camera.position);
    }
  }

  return {
    root,
    update(state, delta) {
      const { camera, size, clock } = state;
      const still = store.reducedMotion;
      const t = clock.elapsedTime;
      const tm = still ? 0 : t; // motion time: frozen for reduced motion
      const dt = Math.min(delta, 0.05);
      if (store.theme !== themeApplied) applyTheme(store.theme, state.scene);
      const portrait = store.mode === "portrait";
      const snap = lastMode === "off" || !cam.init || still;
      if (t0 < 0 || (lastMode === "off" && store.mode !== "off")) {
        t0 = t;
        waveUntil = t + 2.8; // hello!
      }
      lastMode = store.mode;
      if (store.data !== dataRef) applyData();

      const s = portrait ? 0.3 : store.story;
      const { a, b, w } = chapterBlend(s, CHAPTERS);
      const tall = !portrait && store.layout === "tall";

      /* camera framing */
      const fa = FRAMES[a];
      const fb = FRAMES[b];
      const ta = tall ? FRAMES_TALL[a] : fa;
      const tb = tall ? FRAMES_TALL[b] : fb;
      mix(ta.target, tb.target, w, frameTarget);
      mix(ta.size, tb.size, w, frameSize);
      mix(fa.dir, fb.dir, w, frameDir);
      target.fromArray(frameTarget);
      dir.fromArray(frameDir).normalize();

      let cx = mix(fa.screen[0], fb.screen[0], w);
      let cy = 0.53;
      let bw = mix(fa.screen[1], fb.screen[1], w);
      let bh = 0.78;
      if (portrait) {
        const f = store.frame;
        cx = f.x + f.w / 2;
        cy = f.y + f.h / 2;
        bw = f.w * 0.95;
        bh = f.h * 0.95;
      } else if (tall) {
        const bandTop = store.bandTop;
        const bands = store.bandBottom;
        const bottom = lerp(bands[a] ?? 0.5, bands[b] ?? 0.5, w);
        const band = Math.max(0.26, bottom - bandTop);
        cx = 0.5;
        cy = bandTop + band / 2;
        bw = 0.94;
        bh = band * 0.92;
      }
      const aspect = size.width / Math.max(1, size.height);
      const tanHalf = Math.tan((camera.fov * Math.PI) / 360);
      const dist = Math.max(frameSize[1] / (bh * 2 * tanHalf), frameSize[0] / (bw * 2 * tanHalf * aspect));
      const camTarget = tmp.copy(target).addScaledVector(dir, dist);
      const k = snap ? 1000 : 3.2;
      cam.init = true;
      cam.pos.set(damp(cam.pos.x, camTarget.x, k, dt), damp(cam.pos.y, camTarget.y, k, dt), damp(cam.pos.z, camTarget.z, k, dt));
      cam.look.set(damp(cam.look.x, target.x, k, dt), damp(cam.look.y, target.y, k, dt), damp(cam.look.z, target.z, k, dt));
      cam.cx = damp(cam.cx, cx, k, dt);
      cam.cy = damp(cam.cy, cy, k, dt);
      camera.position.copy(cam.pos);
      camera.lookAt(cam.look);
      camera.setViewOffset(size.width, size.height, -(cam.cx - 0.5) * size.width, -(cam.cy - 0.5) * size.height, size.width, size.height);

      /* MAUNG placement, mood and gestures */
      const mx = mix(fa.maung[0], fb.maung[0], w);
      const mr = mix(fa.maung[1], fb.maung[1], w);
      maung.root.position.x = damp(maung.root.position.x, portrait ? 0 : mx, snap ? 1000 : 4, dt);
      maung.root.rotation.y = damp(maung.root.rotation.y, portrait ? -0.2 : mr, snap ? 1000 : 4, dt);

      if (store.cue.at > lastCue) {
        lastCue = store.cue.at;
        if (store.cue.type === "saved") {
          animator.hop(t);
          cheerUntil = t + 1.6;
        }
      }

      const noGoal = !store.data.demo && store.data.goal == null;
      const noCats = !store.data.demo && !(store.data.categories || []).length;
      const chapterPose = (c) => (c === 4 && noGoal) || (c === 3 && noCats) ? {} : POSE[c];
      const pa = chapterPose(a);
      const pb = chapterPose(b);
      for (const key of Object.keys(pose)) pose[key] = lerp(pa[key] || 0, pb[key] || 0, w);
      let expression = EXPRESSION[w > 0.5 ? b : a];
      if ((w > 0.5 ? b : a) === 4 && noGoal) expression = "thinking";
      if ((w > 0.5 ? b : a) === 3 && noCats) expression = "thinking";
      if (t < waveUntil && s < 0.6) pose.wave = Math.max(pose.wave, smooth(clamp01((waveUntil - t) / 0.6)));
      if (store.mood === "listening") {
        expression = "listening";
        pose.listen = 1;
        pose.point = 0;
        pose.wave = 0;
      } else if (store.mood === "thinking") expression = "thinking";
      else if (store.mood === "happy") expression = "happy";
      if (portrait) {
        const p = PORTRAIT[store.portraitPose] || PORTRAIT.idle;
        if (store.portraitPose !== lastPortraitPose) {
          lastPortraitPose = store.portraitPose;
          waveUntil = t + 2.8;
          if (store.portraitPose === "cheer" && !still) animator.hop(t);
        }
        for (const key of Object.keys(pose)) pose[key] = p.pose[key] || 0;
        expression = p.expression;
        // a greeting wave when the page opens, then a calm happy idle
        if (store.portraitPose === "wave") pose.wave = smooth(clamp01((waveUntil - t) / 0.6));
      }
      if (t < cheerUntil) {
        expression = "happy";
        pose.cheer = 1;
        pose.listen = 0;
        pose.wave = 0;
        pose.point = 0;
      }

      chapterLook(portrait ? 0 : a, tm, camera, lookA);
      chapterLook(portrait ? 0 : b, tm, camera, lookB);
      lookTarget.lerpVectors(lookA, lookB, w);
      if (still) pose.wave = 0; // no repeating gestures with reduced motion
      animator.update(dt, t, { look: lookTarget, expression, pose, still });
      maung.rig.mouthOpen.getWorldPosition(mouthWorld);

      /* chapter props */
      const p1 = presence(s, 1);
      chip.scale.setScalar(Math.max(0.001, smooth(p1)));
      chip.position.y = CHIP_POS.y + Math.sin(tm * 1.4) * 0.05;
      chip.rotation.z = Math.sin(tm * 0.9) * 0.03;
      soundRings.forEach((ring, i) => {
        const ph = still ? 0.35 + i * 0.2 : frac(tm * 0.55 + i / 3);
        ring.position.copy(mouthWorld).lerp(CHIP_POS, ph * 0.55);
        ring.lookAt(CHIP_POS);
        ring.scale.setScalar(0.4 + ph * 1.3);
        ring.material.opacity = (1 - ph) * 0.75 * p1;
      });

      const p2 = presence(s, 2);
      inLight.intensity = hasFlow ? p2 * 5 : 0;
      outLight.intensity = hasFlow ? p2 * 5 : 0;

      const p4 = presence(s, 4);
      ringOutline.material.opacity = p4 * 0.45;
      const goal = store.data.demo ? holdProgress(s, 4) * 0.8 : store.data.goal ?? 0;
      ringFill = damp(ringFill, p4 > 0.5 ? goal : 0, still ? 1000 : 2.5, dt);

      glowMat.opacity = (themeApplied === "light" ? 0.32 : 0.18) + p4 * ringFill * 0.25 + Math.sin(tm * 1.2) * 0.03;
      stars.rotation.y = tm * 0.01;

      /* coins */
      for (let i = 0; i < N; i++) {
        const wi = a === b ? 1 : clamp01(w * 1.5 - (i / N) * 0.5);
        let sc = layout(b, i, tm, pB, rB, cB);
        if (a !== b && wi < 1) {
          const sa = layout(a, i, tm, pA, rA, cA);
          const e = smooth(wi);
          pB.lerpVectors(pA, pB, e);
          rB.lerpVectors(rA, rB, e);
          cB.lerpColors(cA, cB, e);
          sc = lerp(sa, sc, e);
        }
        dummy.position.copy(pB);
        dummy.rotation.set(rB.x, rB.y, rB.z);
        dummy.scale.setScalar(Math.max(0.001, sc));
        dummy.updateMatrix();
        coins.setMatrixAt(i, dummy.matrix);
        coins.setColorAt(i, cB);
      }
      coins.instanceMatrix.needsUpdate = true;
      coins.instanceColor.needsUpdate = true;
    },
    dispose() {
      maung.dispose();
      coins.dispose();
      disposables.forEach((d) => d.dispose?.());
    },
  };
}
