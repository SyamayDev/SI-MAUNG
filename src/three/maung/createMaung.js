/**
 * MAUNG — SI-MAUNG's tiger-cub mascot as a procedural, rigged three.js model,
 * modelled on the brand's 2D character (public/images/login-mascot.webp):
 * big round head with cheek-fur jowls, rounded ears, amber fur with bold dark
 * stripes, cream face mask, large brown eyes with dark lash lines, dark
 * inverted-triangle nose, open smile; navy suit with notched lapels, white
 * shirt collar, yellow tie, pocket square; banded tail with a dark tip.
 * No external model files — everything is built and painted here.
 *
 * Units: feet on y = 0, ear tips ≈ 2.8. MAUNG faces +Z.
 * Rig:
 *   root → bob → body (legs, shoes, torso, suit details)
 *              → shoulderL/R → elbowL/R → pawL/R (coin in the left paw)
 *              → neck → head (skull, muzzle, nose, mouth, eyes + lids, brows, ears)
 *              → tail[0..n] (nested joints)
 */
import {
  CapsuleGeometry,
  CatmullRomCurve3,
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
  TubeGeometry,
  Vector2,
  Vector3,
} from "three";
import { MAUNG_COLORS as C, coinTexture, eyeTexture, headSheenTexture, headTexture, shadowTexture } from "./textures.js";
import { FEATURES, HEAD, headSurface, skullPoint } from "./headCoords.js";

export const MAUNG_HEIGHT = 2.8;

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
  if (pos) g.position.set(...(Array.isArray(pos) ? pos : pos.toArray()));
  return g;
}

function extruded(points, depth, bevel = 0.012) {
  const shape = new Shape(points.map(([x, y]) => new Vector2(x, y)));
  return new ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2, curveSegments: 8 });
}

/** The skull: a dense sphere (UV seam at the back) reshaped by skullPoint(). */
function skullGeometry(widthSegments, heightSegments) {
  const geo = new SphereGeometry(1, widthSegments, heightSegments, -Math.PI / 2);
  const pos = geo.attributes.position;
  const v = new Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i).normalize();
    skullPoint(v.x, v.y, v.z, v);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  return geo;
}

/** Nose: a sphere pinched into a soft, inverted triangle. */
function noseGeometry(segments) {
  const geo = new SphereGeometry(1, segments, Math.round(segments * 0.7));
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const pinch = y < 0 ? 1 + y * 0.62 : 1 + y * 0.08;
    pos.setX(i, x * pinch);
    pos.setY(i, y < 0 ? y * 1.05 : y * 0.8);
  }
  geo.computeVertexNormals();
  return geo;
}

/** A tapered stroke that hugs the head (brows): tube along surface points, thinner at the ends. */
function surfaceStroke(points, radius, segments = 32) {
  const curve = new CatmullRomCurve3(points);
  const radial = 8;
  const geo = new TubeGeometry(curve, segments, radius, radial, false);
  const pos = geo.attributes.position;
  const v = new Vector3();
  const p = new Vector3();
  for (let i = 0; i <= segments; i++) {
    const u = i / segments;
    const taper = 0.25 + 0.75 * Math.sin(Math.PI * Math.min(1, u * 1.05)) ** 0.6;
    curve.getPointAt(u, p);
    for (let j = 0; j <= radial; j++) {
      const idx = i * (radial + 1) + j;
      v.fromBufferAttribute(pos, idx).sub(p).multiplyScalar(taper).add(p);
      pos.setXYZ(idx, v.x, v.y, v.z);
    }
  }
  geo.computeVertexNormals();
  return geo;
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

  // Physically based "vinyl toy" finish: velvet sheen on fur and fabric, clear-coat on shoes, eyes and nose.
  const pbr = (params, extra) => keep(rich && extra ? new MeshPhysicalMaterial({ ...params, ...extra }) : new MeshStandardMaterial(params));

  const headMap = keep(headTexture());
  const headSheen = keep(headSheenTexture());
  const eyeMap = keep(eyeTexture());
  const coinMap = keep(coinTexture());

  const mat = {
    head: pbr({ map: headMap, roughness: 0.74 }, { sheen: 0.75, sheenColor: 0xffd9a8, sheenColorMap: headSheen, sheenRoughness: 0.55 }),
    fur: pbr({ color: C.fur, roughness: 0.72 }, { sheen: 0.7, sheenColor: 0xffd9a8, sheenRoughness: 0.55 }),
    cream: pbr({ color: C.cream, roughness: 0.82 }, { sheen: 0.55, sheenColor: 0xffffff, sheenRoughness: 0.6 }),
    stripe: pbr({ color: C.stripe, roughness: 0.62 }),
    suit: pbr({ color: C.suit, roughness: 0.74 }, { sheen: 0.85, sheenColor: 0x7486e6, sheenRoughness: 0.45 }),
    suitDeep: pbr({ color: C.suitDeep, roughness: 0.6 }, { sheen: 0.5, sheenColor: 0x5c6fd0, sheenRoughness: 0.5 }),
    shirt: pbr({ color: C.shirt, roughness: 0.55 }),
    tie: pbr({ color: C.tie, roughness: 0.34 }, { clearcoat: 0.6, clearcoatRoughness: 0.25 }),
    shoe: pbr({ color: C.shoe, roughness: 0.3 }, { clearcoat: 1, clearcoatRoughness: 0.06 }),
    sole: pbr({ color: "#2a2b33", roughness: 0.8 }),
    eye: pbr({ map: eyeMap, roughness: 0.08 }, { clearcoat: 1, clearcoatRoughness: 0.02 }),
    lash: pbr({ color: "#140c07", roughness: 0.5 }),
    nose: pbr({ color: C.nose, roughness: 0.26 }, { clearcoat: 0.9, clearcoatRoughness: 0.12 }),
    mouth: pbr({ color: C.mouth, roughness: 0.6 }),
    tongue: pbr({ color: C.tongue, roughness: 0.45 }),
    tooth: pbr({ color: "#ffffff", roughness: 0.3 }),
    inner: pbr({ color: C.inner, roughness: 0.75 }, { sheen: 0.5, sheenColor: 0xffffff, sheenRoughness: 0.6 }),
    gold: pbr({ color: C.gold, metalness: 0.85, roughness: 0.28 }),
    coinFace: pbr({ map: coinMap, metalness: 0.75, roughness: 0.3 }),
    button: pbr({ color: "#0b1030", roughness: 0.35 }),
    shine: keep(new MeshBasicMaterial({ color: 0xffffff })),
  };

  const sphere = (r, ws = 32, hs = 24) => keep(new SphereGeometry(r, seg(ws), seg(hs)));

  const root = group("MAUNG");
  const bob = group("bob");
  root.add(bob);
  const body = group("body");
  bob.add(body);

  /* ---------- legs & shoes ---------- */
  const legGeo = keep(new CylinderGeometry(0.155, 0.17, 0.46, seg(22)));
  const shoeGeo = sphere(0.17, 28, 18);
  const soleGeo = keep(new CylinderGeometry(0.17, 0.17, 0.03, seg(24)));
  for (const s of [-1, 1]) {
    body.add(mesh(legGeo, mat.suit, { pos: [s * 0.2, 0.37, 0], name: "leg" }));
    body.add(mesh(shoeGeo, mat.shoe, { pos: [s * 0.21, 0.1, 0.08], scale: [1.02, 0.58, 1.5], name: "shoe" }));
    body.add(mesh(soleGeo, mat.sole, { pos: [s * 0.21, 0.018, 0.08], scale: [1, 1, 1.48] }));
  }

  /* ---------- torso: jacket silhouette ---------- */
  const torsoProfile = [
    [0.0, 0.46], [0.38, 0.47], [0.53, 0.55], [0.55, 0.68], [0.51, 0.86], [0.52, 1.0], [0.51, 1.13], [0.43, 1.28], [0.27, 1.38], [0.0, 1.42],
  ].map(([r, y]) => new Vector2(r, y));
  const TORSO_Z = 0.86;
  body.add(mesh(keep(new LatheGeometry(torsoProfile, seg(56))), mat.suit, { scale: [1, 1, TORSO_Z], name: "torso" }));
  const frontZ = (y) => {
    // front surface depth of the lathe at height y (for details that sit on the jacket)
    for (let i = 0; i < torsoProfile.length - 1; i++) {
      const a = torsoProfile[i];
      const b = torsoProfile[i + 1];
      if (y >= a.y && y <= b.y) return (a.x + ((y - a.y) / (b.y - a.y)) * (b.x - a.x)) * TORSO_Z;
    }
    return 0.4;
  };

  // shirt, collar, lapels and tie on a plate tilted to follow the chest
  const chest = group("chest", [0, 0.9, frontZ(0.9) + 0.002]);
  chest.rotation.x = -0.2;
  body.add(chest);
  chest.add(mesh(keep(extruded([[-0.17, 0.46], [0.17, 0.46], [0, 0]], 0.012)), mat.shirt, { pos: [0, 0, -0.014] }));
  for (const s of [-1, 1]) {
    // notched lapel
    const lapel = extruded(
      [[s * 0.15, 0.47], [s * 0.27, 0.47], [s * 0.31, 0.37], [s * 0.245, 0.335], [s * 0.06, -0.03], [0, 0]],
      0.016
    );
    chest.add(mesh(keep(lapel), mat.suitDeep, { pos: [0, 0, 0.002] }));
    // shirt collar point
    const collar = extruded([[s * 0.02, 0.5], [s * 0.16, 0.49], [s * 0.07, 0.36]], 0.01, 0.008);
    chest.add(mesh(keep(collar), mat.shirt, { pos: [0, 0, 0.012] }));
  }
  chest.add(mesh(sphere(0.048, 18, 12), mat.tie, { pos: [0, 0.405, 0.04], scale: [1.15, 0.85, 0.6] }));
  // the tie sits in front of the lapels so the whole blade reads, like the 2D art
  chest.add(mesh(keep(extruded([[-0.038, 0.37], [0.038, 0.37], [0.06, 0.13], [0, 0.07], [-0.06, 0.13]], 0.012)), mat.tie, { pos: [0, 0, 0.03] }));
  const buttonGeo = sphere(0.03, 12, 8);
  body.add(mesh(buttonGeo, mat.button, { pos: [0, 0.79, frontZ(0.79) + 0.008], scale: [1, 1, 0.5] }));
  body.add(mesh(buttonGeo, mat.button, { pos: [0, 0.65, frontZ(0.65) + 0.006], scale: [1, 1, 0.5] }));
  // jacket closure below the buttons
  const seamCurve = new CatmullRomCurve3([0.6, 0.53, 0.48].map((y) => new Vector3(0, y, frontZ(y) + 0.004)));
  body.add(mesh(keep(new TubeGeometry(seamCurve, 8, 0.006, 6, false)), mat.suitDeep));
  // pocket square on MAUNG's left chest
  body.add(
    mesh(keep(extruded([[-0.065, 0], [0.065, 0], [0.04, 0.075], [0.005, 0.05], [-0.03, 0.08]], 0.008, 0.006)), mat.shirt, {
      pos: [0.27, 1.02, 0.355],
      rot: [-0.1, 0.62, 0],
    })
  );
  body.add(mesh(keep(new PlaneGeometry(0.15, 0.012)), mat.suitDeep, { pos: [0.27, 1.015, 0.357], rot: [-0.1, 0.62, 0] }));

  /* ---------- arms: shoulder → elbow → paw ---------- */
  const upperGeo = keep(new CapsuleGeometry(0.125, 0.2, seg(6), seg(18)));
  const foreGeo = keep(new CylinderGeometry(0.118, 0.112, 0.28, seg(18)));
  const cuffGeo = keep(new CylinderGeometry(0.104, 0.104, 0.05, seg(20)));
  const palmGeo = sphere(0.122, 24, 16);
  const thumbGeo = sphere(0.05, 14, 10);
  const fingerGeo = sphere(0.045, 12, 8);
  const arms = {};
  for (const [key, s] of [["L", 1], ["R", -1]]) {
    const shoulder = group(`shoulder${key}`, [s * 0.47, 1.21, 0.0]);
    shoulder.rotation.z = s * 0.18;
    shoulder.add(mesh(upperGeo, mat.suit, { pos: [0, -0.17, 0] }));
    const elbow = group(`elbow${key}`, [0, -0.34, 0]);
    shoulder.add(elbow);
    elbow.add(mesh(foreGeo, mat.suit, { pos: [0, -0.14, 0] }));
    elbow.add(mesh(cuffGeo, mat.shirt, { pos: [0, -0.3, 0] }));
    const paw = group(`paw${key}`, [0, -0.4, 0.01]);
    elbow.add(paw);
    paw.add(mesh(palmGeo, mat.fur, { scale: [1, 0.95, 1.02] }));
    paw.add(mesh(thumbGeo, mat.fur, { pos: [-s * 0.095, 0.02, 0.06] }));
    for (const f of [-1, 0, 1]) paw.add(mesh(fingerGeo, mat.fur, { pos: [f * 0.055, -0.1, 0.035] }));
    body.add(shoulder);
    arms[key] = { shoulder, elbow, paw };
  }

  // The coin MAUNG shows off (left paw).
  const coin = group("coin", [0.02, -0.17, 0.09]);
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

  head.add(mesh(keep(skullGeometry(seg(128), seg(96))), mat.head, { pos: [0, HEAD.cy, 0], name: "skull" }));

  // muzzle: cream bulge with whisker pads (the "w" under the nose)
  const M = headSurface(FEATURES.muzzle.phi, FEATURES.muzzle.theta, -0.085);
  const unit = sphere(1, 36, 24);
  head.add(mesh(unit, mat.cream, { pos: M.point.toArray(), scale: [0.2, 0.135, 0.16], name: "muzzle" }));
  const dotGeo = sphere(0.009, 6, 4);
  for (const s of [-1, 1]) {
    const pad = M.point.clone().add(new Vector3(s * 0.075, 0.01, 0.12));
    head.add(mesh(unit, mat.cream, { pos: pad.toArray(), scale: [0.09, 0.07, 0.065] }));
    for (const [dx, dy] of [[0.0, 0.015], [0.03, -0.005], [0.0, -0.025]]) {
      head.add(mesh(dotGeo, mat.stripe, { pos: [pad.x + s * (0.02 + dx), pad.y + dy, pad.z + 0.058 - Math.abs(dx) * 0.4] }));
    }
  }

  // nose: dark, glossy, inverted rounded triangle with a highlight
  const N = headSurface(FEATURES.nose.phi, FEATURES.nose.theta, 0.0);
  const noseCenter = N.point.clone().add(new Vector3(0, -0.005, 0.05));
  head.add(mesh(keep(noseGeometry(seg(28))), mat.nose, { pos: noseCenter.toArray(), scale: [0.105, 0.07, 0.07], rot: [-0.15, 0, 0], name: "nose" }));
  head.add(mesh(unit, mat.shine, { pos: [noseCenter.x - 0.035, noseCenter.y + 0.035, noseCenter.z + 0.055], scale: [0.022, 0.013, 0.01] }));
  // philtrum
  const philtrumTop = noseCenter.clone().add(new Vector3(0, -0.065, 0.035));
  head.add(mesh(keep(new CapsuleGeometry(0.009, 0.035, 2, 6)), mat.stripe, { pos: [philtrumTop.x, philtrumTop.y - 0.018, philtrumTop.z + 0.002] }));

  // mouth: open "D" smile with tongue and two little fangs; the arc above doubles as the closed-mouth line
  const mouthY = philtrumTop.y - 0.045;
  const mouthZ = philtrumTop.z + 0.004;
  const mouthOpen = group("mouthOpen", [0, mouthY, mouthZ]);
  mouthOpen.rotation.x = 0.32;
  mouthOpen.add(mesh(keep(new CircleGeometry(0.1, seg(28), Math.PI, Math.PI)), mat.mouth, { scale: [1.5, 1, 1] }));
  mouthOpen.add(mesh(keep(new CircleGeometry(0.066, seg(20), Math.PI, Math.PI)), mat.tongue, { pos: [0, -0.048, 0.002], scale: [1.6, 0.75, 1] }));
  const fangGeo = keep(new ConeGeometry(0.014, 0.034, 8));
  for (const s of [-1, 1]) mouthOpen.add(mesh(fangGeo, mat.tooth, { pos: [s * 0.1, -0.017, 0.003], rot: [0, 0, Math.PI] }));
  head.add(mouthOpen);
  const SMILE_R = 0.36;
  const SMILE_ARC = 0.95;
  const smile = mesh(keep(new TorusGeometry(SMILE_R, 0.011, seg(6), seg(24), SMILE_ARC)), mat.stripe, {
    pos: [0, mouthY + SMILE_R + 0.002, mouthZ + 0.004],
    rot: [0.32, 0, -Math.PI / 2 - SMILE_ARC / 2],
  });
  head.add(smile);

  // eyes: glossy eyeball, cream lids (the face-mask colour) with a dark lash line on the upper lid
  const EYE_R = 0.152;
  const eyeGeo = sphere(EYE_R, 36, 28);
  const upperLidGeo = keep(new SphereGeometry(EYE_R * 1.07, seg(32), seg(14), 0, Math.PI * 2, 0, Math.PI / 2));
  const lowerLidGeo = keep(new SphereGeometry(EYE_R * 1.05, seg(32), seg(14), 0, Math.PI * 2, Math.PI / 2, Math.PI / 2));
  const lashGeo = keep(new TorusGeometry(EYE_R * 1.07, 0.017, seg(8), seg(32), Math.PI));
  const eyes = [-1, 1].map((s) => {
    const E = headSurface(s * FEATURES.eye.phi, FEATURES.eye.theta, -0.07);
    const pivot = group(`eye${s < 0 ? "R" : "L"}`, E.point);
    pivot.rotation.y = s * 0.2; // eyes follow the curve of the face
    const eye = mesh(eyeGeo, mat.eye);
    const upper = mesh(upperLidGeo, mat.cream);
    upper.add(mesh(lashGeo, mat.lash, { rot: [Math.PI / 2, 0, 0] }));
    const lower = mesh(lowerLidGeo, mat.cream);
    pivot.add(eye, upper, lower);
    head.add(pivot);
    return { pivot, eye, upper, lower };
  });

  // brows: thick dark arcs that hug the forehead (expressive)
  const brows = [-1, 1].map((s) => {
    const pts = [-0.15, -0.05, 0.05, 0.15].map((d, i) => {
      const arch = i === 1 || i === 2 ? -0.035 : 0;
      return headSurface(s * (FEATURES.brow.phi + d), FEATURES.brow.theta + arch + d * 0.12, 0.012).point;
    });
    const center = pts[1].clone().add(pts[2]).multiplyScalar(0.5);
    const geo = keep(surfaceStroke(pts.map((p) => p.clone().sub(center)), 0.026, 24));
    const brow = group(`brow${s < 0 ? "R" : "L"}`, center);
    brow.add(mesh(geo, mat.stripe));
    brow.userData.base = { y: center.y, rz: 0, s };
    head.add(brow);
    return brow;
  });

  // ears: rounded, amber outside, cream inside, a dark stripe on the back
  const earOuter = sphere(0.21, 28, 18);
  const earInner = sphere(0.145, 22, 14);
  const ears = [-1, 1].map((s) => {
    const A = headSurface(s * FEATURES.ear.phi, FEATURES.ear.theta, -0.05);
    const ear = group(`ear${s < 0 ? "R" : "L"}`, A.point);
    ear.rotation.set(-0.05, s * 0.32, s * -0.38);
    ear.add(mesh(earOuter, mat.fur, { scale: [1, 1.04, 0.42] }));
    ear.add(mesh(earInner, mat.inner, { pos: [0, -0.02, 0.06], scale: [0.86, 0.88, 0.3] }));
    ear.add(mesh(unit, mat.stripe, { pos: [0, 0.06, -0.075], scale: [0.11, 0.06, 0.03] }));
    ear.userData.baseZ = ear.rotation.z;
    head.add(ear);
    return ear;
  });

  /* ---------- tail: nested joints with alternating bands ---------- */
  const tail = [];
  let parent = group("tailBase", [0.16, 0.56, -0.36]);
  parent.rotation.set(-1.05, 0, -0.85);
  body.add(parent);
  const TAIL_N = 9;
  for (let i = 0; i < TAIL_N; i++) {
    const r = 0.085 - i * 0.0025;
    const joint = group(`tail${i}`, i === 0 ? [0, 0, 0] : [0, 0.125, 0]);
    joint.rotation.z = i === 0 ? 0 : -0.19;
    joint.rotation.x = i === 0 ? 0 : 0.05;
    joint.userData.rest = { x: joint.rotation.x, z: joint.rotation.z };
    const band = i % 2 === 1 || i >= TAIL_N - 2;
    joint.add(mesh(keep(new CapsuleGeometry(r, 0.065, seg(4), seg(14))), band ? mat.stripe : mat.fur, { pos: [0, 0.062, 0] }));
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
    rig: { bob, body, neck, head, eyes, brows, ears, smile, mouthOpen, arms, coin, tail, shadow },
    materials: mat,
    dispose() {
      disposables.forEach((d) => d.dispose?.());
    },
  };
}
