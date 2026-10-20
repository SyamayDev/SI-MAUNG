/**
 * MAUNG — SI-MAUNG's tiger-cub mascot as a procedural, rigged three.js model,
 * built in code from the brand's existing 2D character (amber fur with dark
 * stripes, cream muzzle, navy suit, amber tie). No external model files.
 *
 * Units: feet on y = 0, ears ≈ 2.75 high. MAUNG faces +Z.
 * Rig:
 *   root → bob → body (legs, shoes, torso, suit details)
 *              → shoulders L/R → elbows → paws (coin in the left paw)
 *              → neck → head (skull, face, eyes + lids, brows, nose, mouth, ears)
 *              → tail[0..n] (nested joints)
 */
import {
  CapsuleGeometry,
  CircleGeometry,
  ConeGeometry,
  CylinderGeometry,
  ExtrudeGeometry,
  Group,
  LatheGeometry,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  Shape,
  SphereGeometry,
  TorusGeometry,
  Vector2,
} from "three";
import { MAUNG_COLORS as C, coinTexture, eyeTexture, headTexture, shadowTexture } from "./textures.js";

export const MAUNG_HEIGHT = 2.75;

function mesh(geometry, material, { pos, rot, scale, name } = {}) {
  const m = new Mesh(geometry, material);
  if (pos) m.position.set(...pos);
  if (rot) m.rotation.set(...rot);
  if (scale !== undefined) Array.isArray(scale) ? m.scale.set(...scale) : m.scale.setScalar(scale);
  if (name) m.name = name;
  return m;
}

function group(name, pos) {
  const g = new Group();
  g.name = name;
  if (pos) g.position.set(...pos);
  return g;
}

function extruded(points, depth, bevel = 0.012) {
  const shape = new Shape(points.map(([x, y]) => new Vector2(x, y)));
  return new ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 2,
    curveSegments: 6,
  });
}

/**
 * @param {{ quality?: "high" | "mid" | "low" }} options
 */
export function createMaung({ quality = "mid" } = {}) {
  const k = quality === "high" ? 1 : quality === "mid" ? 0.75 : 0.5;
  const seg = (n) => Math.max(8, Math.round(n * k));
  const disposables = [];
  const keep = (x) => (disposables.push(x), x);
  const rich = quality !== "low";

  // Rich PBR (sheen, clear-coat) on capable devices; plain standard material elsewhere.
  const pbr = (params, extra) => keep(rich && extra ? new MeshPhysicalMaterial({ ...params, ...extra }) : new MeshStandardMaterial(params));

  const headMap = keep(headTexture());
  const eyeMap = keep(eyeTexture());
  const coinMap = keep(coinTexture());

  const mat = {
    head: pbr({ map: headMap, roughness: 0.62 }, { sheen: 0.6, sheenColor: 0xffd08a, sheenRoughness: 0.6 }),
    fur: pbr({ color: C.fur, roughness: 0.62 }, { sheen: 0.5, sheenColor: 0xffd08a, sheenRoughness: 0.6 }),
    cream: pbr({ color: C.cream, roughness: 0.78 }, { sheen: 0.4, sheenColor: 0xffffff, sheenRoughness: 0.7 }),
    stripe: pbr({ color: C.stripe, roughness: 0.6 }),
    suit: pbr({ color: C.suit, roughness: 0.62 }, { sheen: 0.7, sheenColor: 0x6b7fe0, sheenRoughness: 0.45 }),
    suitDeep: pbr({ color: C.suitDeep, roughness: 0.5 }, { clearcoat: 0.25, clearcoatRoughness: 0.5 }),
    shirt: pbr({ color: C.shirt, roughness: 0.5 }),
    tie: pbr({ color: C.tie, roughness: 0.32 }, { clearcoat: 0.6, clearcoatRoughness: 0.25 }),
    shoe: pbr({ color: C.shoe, roughness: 0.3 }, { clearcoat: 1, clearcoatRoughness: 0.08 }),
    eye: pbr({ map: eyeMap, roughness: 0.1 }, { clearcoat: 1, clearcoatRoughness: 0.03 }),
    nose: pbr({ color: C.nose, roughness: 0.28 }, { clearcoat: 0.9, clearcoatRoughness: 0.15 }),
    mouth: pbr({ color: C.mouth, roughness: 0.6 }),
    tongue: pbr({ color: C.tongue, roughness: 0.5 }),
    inner: pbr({ color: C.inner, roughness: 0.7 }),
    gold: pbr({ color: C.gold, metalness: 0.85, roughness: 0.28 }),
    coinFace: pbr({ map: coinMap, metalness: 0.75, roughness: 0.3 }),
    button: pbr({ color: "#0d1236", roughness: 0.35 }),
    shine: keep(new MeshBasicMaterial({ color: 0xffffff })),
  };

  const sphere = (r, ws = 32, hs = 24) => keep(new SphereGeometry(r, seg(ws), seg(hs)));

  const root = group("MAUNG");
  const bob = group("bob");
  root.add(bob);
  const body = group("body");
  bob.add(body);

  /* ---------- legs & shoes ---------- */
  const legGeo = keep(new CylinderGeometry(0.15, 0.16, 0.44, seg(20)));
  const shoeGeo = sphere(0.17, 24, 16);
  for (const s of [-1, 1]) {
    body.add(mesh(legGeo, mat.suit, { pos: [s * 0.19, 0.36, 0], name: "leg" }));
    body.add(mesh(shoeGeo, mat.shoe, { pos: [s * 0.2, 0.09, 0.08], scale: [1, 0.56, 1.45], name: "shoe" }));
  }

  /* ---------- torso: one lathe silhouette (jacket) ---------- */
  const torsoProfile = [
    [0.0, 0.46], [0.36, 0.47], [0.5, 0.55], [0.53, 0.7], [0.51, 0.9], [0.5, 1.06], [0.47, 1.2], [0.38, 1.32], [0.22, 1.41], [0.0, 1.44],
  ].map(([r, y]) => new Vector2(r, y));
  const torso = mesh(keep(new LatheGeometry(torsoProfile, seg(48))), mat.suit, { scale: [1, 1, 0.88], name: "torso" });
  body.add(torso);

  // Shirt, lapels and tie live on a plate tilted to follow the chest.
  const chest = group("chest", [0, 0.9, 0.445]);
  chest.rotation.x = -0.2;
  body.add(chest);
  chest.add(mesh(keep(extruded([[-0.17, 0.44], [0.17, 0.44], [0, 0]], 0.012)), mat.shirt, { pos: [0, 0, -0.012] }));
  for (const s of [-1, 1]) {
    const lapel = extruded(
      [
        [s * 0.17, 0.44],
        [s * 0.25, 0.44],
        [s * 0.05, -0.02],
        [0, 0],
      ],
      0.014
    );
    chest.add(mesh(keep(lapel), mat.suitDeep, { pos: [0, 0, 0.002] }));
  }
  chest.add(mesh(sphere(0.045, 16, 12), mat.tie, { pos: [0, 0.39, 0.012], scale: [1.15, 0.85, 0.6] }));
  chest.add(
    mesh(keep(extruded([[-0.04, 0.36], [0.04, 0.36], [0.06, 0.12], [0, 0.05], [-0.06, 0.12]], 0.012)), mat.tie, { pos: [0, 0, 0.006] })
  );
  const buttonGeo = sphere(0.03, 12, 8);
  body.add(mesh(buttonGeo, mat.button, { pos: [0, 0.8, 0.452], scale: [1, 1, 0.5] }));
  body.add(mesh(buttonGeo, mat.button, { pos: [0, 0.66, 0.462], scale: [1, 1, 0.5] }));
  // pocket square on MAUNG's left chest
  const pocket = mesh(keep(extruded([[-0.06, 0], [0.06, 0], [0.02, 0.07], [-0.03, 0.05]], 0.008, 0.006)), mat.shirt, {
    pos: [0.27, 1.02, 0.36],
    rot: [-0.1, 0.62, 0],
  });
  body.add(pocket);

  /* ---------- arms: shoulder → elbow → paw ---------- */
  const upperGeo = keep(new CapsuleGeometry(0.12, 0.2, seg(6), seg(16)));
  const foreGeo = keep(new CapsuleGeometry(0.11, 0.18, seg(6), seg(16)));
  const cuffGeo = keep(new CylinderGeometry(0.108, 0.108, 0.05, seg(20)));
  const pawGeo = sphere(0.125, 24, 16);
  const arms = {};
  for (const [key, s] of [["L", 1], ["R", -1]]) {
    const shoulder = group(`shoulder${key}`, [s * 0.46, 1.2, 0.0]);
    shoulder.rotation.z = s * 0.18;
    shoulder.add(mesh(upperGeo, mat.suit, { pos: [0, -0.17, 0] }));
    const elbow = group(`elbow${key}`, [0, -0.34, 0]);
    shoulder.add(elbow);
    elbow.add(mesh(foreGeo, mat.suit, { pos: [0, -0.14, 0] }));
    elbow.add(mesh(cuffGeo, mat.shirt, { pos: [0, -0.29, 0] }));
    const paw = group(`paw${key}`, [0, -0.39, 0.01]);
    elbow.add(paw);
    paw.add(mesh(pawGeo, mat.fur, { scale: [1, 0.92, 1.05] }));
    body.add(shoulder);
    arms[key] = { shoulder, elbow, paw };
  }

  // The coin MAUNG shows off (left paw).
  const coin = group("coin", [0.02, -0.17, 0.08]);
  const coinMesh = new Mesh(keep(new CylinderGeometry(0.17, 0.17, 0.035, seg(40))), [mat.gold, mat.coinFace, mat.coinFace]);
  coinMesh.rotation.x = Math.PI / 2;
  coin.add(coinMesh);
  coin.scale.setScalar(0.001);
  arms.L.paw.add(coin);

  /* ---------- head ---------- */
  const neck = group("neck", [0, 1.36, 0.02]);
  body.add(neck);
  const head = group("head");
  neck.add(head);

  head.add(mesh(sphere(0.6, 48, 32), mat.head, { pos: [0, 0.56, 0], scale: [1.1, 0.96, 0.98], name: "skull" }));
  // cream face: muzzle, puffed cheeks, eye patches, cheek tufts
  head.add(mesh(sphere(0.19, 32, 20), mat.cream, { pos: [0, 0.36, 0.5], scale: [1.2, 0.8, 0.88], name: "muzzle" }));
  for (const s of [-1, 1]) {
    head.add(mesh(sphere(0.2, 28, 20), mat.cream, { pos: [s * 0.26, 0.33, 0.42], scale: [1.08, 0.86, 0.72] }));
    head.add(mesh(sphere(0.155, 24, 16), mat.cream, { pos: [s * 0.215, 0.645, 0.47], scale: [1.05, 1.08, 0.55] }));
    const tuftGeo = keep(new ConeGeometry(0.07, 0.15, seg(12)));
    head.add(mesh(tuftGeo, mat.cream, { pos: [s * 0.62, 0.34, 0.02], rot: [0, 0, s * -(Math.PI / 2 + 0.3)] }));
    head.add(mesh(tuftGeo, mat.cream, { pos: [s * 0.57, 0.2, 0.06], rot: [0, 0, s * -(Math.PI / 2 + 0.8)], scale: 0.8 }));
  }

  // eyes with upper/lower lids (lids rotate about the eye centre)
  const eyeGeo = sphere(0.14, 32, 24);
  const upperLidGeo = keep(new SphereGeometry(0.145, seg(28), seg(12), 0, Math.PI * 2, 0, Math.PI / 2));
  const lowerLidGeo = keep(new SphereGeometry(0.143, seg(28), seg(12), 0, Math.PI * 2, Math.PI / 2, Math.PI / 2));
  const eyes = [-1, 1].map((s) => {
    const pivot = group(`eye${s < 0 ? "R" : "L"}`, [s * 0.215, 0.66, 0.5]);
    const eye = mesh(eyeGeo, mat.eye);
    const upper = mesh(upperLidGeo, mat.fur);
    const lower = mesh(lowerLidGeo, mat.cream);
    pivot.add(eye, upper, lower);
    head.add(pivot);
    return { pivot, eye, upper, lower };
  });

  // brows (expressive)
  const browGeo = keep(new CapsuleGeometry(0.028, 0.11, seg(4), seg(8)));
  const brows = [-1, 1].map((s) => {
    const b = mesh(browGeo, mat.stripe, { pos: [s * 0.22, 0.87, 0.48], rot: [0, 0, Math.PI / 2 - s * 0.07] });
    b.userData.base = { y: 0.87, rz: Math.PI / 2 - s * 0.07, s };
    head.add(b);
    return b;
  });

  // nose, mouth
  head.add(mesh(sphere(0.075, 24, 16), mat.nose, { pos: [0, 0.47, 0.645], scale: [1.5, 0.95, 1.0], name: "nose" }));
  head.add(mesh(sphere(0.018, 8, 6), mat.shine, { pos: [-0.035, 0.5, 0.71] }));
  head.add(mesh(keep(new CapsuleGeometry(0.011, 0.05, 2, 6)), mat.stripe, { pos: [0, 0.405, 0.672] }));
  // Open smile like the 2D mascot: a "D" (flat top, round bottom) with a tongue.
  // The flat top doubles as the smile line when the mouth closes.
  const mouthOpen = group("mouthOpen", [0, 0.345, 0.676]);
  mouthOpen.rotation.x = 0.32; // follow the muzzle curve
  const mouthGeo = keep(new CircleGeometry(0.09, seg(24), Math.PI, Math.PI));
  mouthOpen.add(mesh(mouthGeo, mat.mouth, { scale: [1.25, 1, 1] }));
  mouthOpen.add(mesh(keep(new CircleGeometry(0.06, seg(20), Math.PI, Math.PI)), mat.tongue, { pos: [0, -0.04, 0.002], scale: [1.35, 0.75, 1] }));
  head.add(mouthOpen);
  // Smile line: a shallow arc whose corners turn up.
  const SMILE_R = 0.34;
  const SMILE_ARC = 0.7;
  const smile = mesh(keep(new TorusGeometry(SMILE_R, 0.011, seg(6), seg(20), SMILE_ARC)), mat.stripe, {
    pos: [0, 0.342 + SMILE_R, 0.68],
    rot: [0.32, 0, -Math.PI / 2 - SMILE_ARC / 2],
  });
  head.add(smile);

  // ears
  const earOuter = sphere(0.19, 24, 16);
  const earInner = sphere(0.13, 20, 12);
  const ears = [-1, 1].map((s) => {
    const ear = group(`ear${s < 0 ? "R" : "L"}`, [s * 0.43, 0.98, -0.04]);
    ear.rotation.z = s * -0.38;
    ear.add(mesh(earOuter, mat.fur, { scale: [1, 1.05, 0.45] }));
    ear.add(mesh(earInner, mat.inner, { pos: [0, -0.015, 0.055], scale: [0.85, 0.9, 0.3] }));
    ear.userData.baseZ = ear.rotation.z;
    head.add(ear);
    return ear;
  });

  /* ---------- tail: nested joints with alternating bands ---------- */
  const tail = [];
  let parent = group("tailBase", [0.16, 0.56, -0.36]);
  parent.rotation.set(-1.05, 0, -0.85);
  body.add(parent);
  const TAIL_N = 8;
  for (let i = 0; i < TAIL_N; i++) {
    const r = 0.078 - i * 0.003;
    const joint = group(`tail${i}`, i === 0 ? [0, 0, 0] : [0, 0.13, 0]);
    joint.rotation.z = i === 0 ? 0 : -0.2;
    joint.rotation.x = i === 0 ? 0 : 0.06;
    joint.userData.rest = { x: joint.rotation.x, z: joint.rotation.z };
    const band = i % 2 === 1 || i === TAIL_N - 1;
    joint.add(mesh(keep(new CapsuleGeometry(r, 0.07, seg(4), seg(12))), band ? mat.stripe : mat.fur, { pos: [0, 0.065, 0] }));
    parent.add(joint);
    tail.push(joint);
    parent = joint;
  }

  /* ---------- contact shadow ---------- */
  const shadowMat = keep(new MeshBasicMaterial({ map: keep(shadowTexture()), transparent: true, depthWrite: false, opacity: 0.85 }));
  const shadow = mesh(keep(new PlaneGeometry(1.9, 1.9)), shadowMat, { pos: [0, 0.006, 0.02], rot: [-Math.PI / 2, 0, 0], name: "shadow" });
  root.add(shadow);

  return {
    root,
    rig: { bob, body, torso, neck, head, eyes, brows, ears, smile, mouthOpen, arms, coin, tail, shadow },
    materials: mat,
    dispose() {
      disposables.forEach((d) => d.dispose?.());
    },
  };
}
