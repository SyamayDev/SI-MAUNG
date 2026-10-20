/**
 * MAUNG's behaviour layer — call update(dt, t, state) once per frame.
 *
 * state: {
 *   look?: Vector3 (world point to look at),
 *   expression?: "idle" | "listening" | "thinking" | "happy",
 *   pose?: { wave, listen, point, coin, cheer } weights 0..1 (blended, damped),
 *   still?: boolean (reduced motion: hold a calm pose)
 * }
 * One-shot gestures: hop(t) — a small happy jump; twitch(t) — ear flick.
 */
import { MathUtils, Vector3 } from "three";

const EXPRESSIONS = {
  //          lid (1 open)  lower (0 down)  brow  tilt   mouth
  idle: { lid: 1, lower: 0, brow: 0, tilt: 0, mouth: 0.6 },
  listening: { lid: 1.08, lower: 0, brow: 1, tilt: 0.16, mouth: 0.25 },
  thinking: { lid: 0.85, lower: 0.12, brow: 0.6, tilt: -0.12, mouth: 0.15 },
  happy: { lid: 1.02, lower: 0.16, brow: 0.4, tilt: 0.05, mouth: 1 },
};

// Arm poses: shoulder (x, z), elbow x — for the right (R, gesture) arm unless noted.
const ARM_REST = { sx: 0, sz: 0.18, ex: -0.15 };
const POSES = {
  wave: { R: { sx: -0.2, sz: 2.45, ex: -0.55 } },
  listen: { R: { sx: -0.35, sz: 2.55, ex: -1.35 } },
  point: { L: { sx: -1.25, sz: 0.65, ex: -0.1 } }, // MAUNG's left arm points to the stacks on screen-right
  coin: { L: { sx: -1.1, sz: 0.35, ex: -1.3 } },
  cheer: { R: { sx: -0.35, sz: 2.2, ex: -0.55 }, L: { sx: -0.35, sz: 2.2, ex: -0.55 } },
};

const damp = (a, b, lambda, dt) => MathUtils.lerp(a, b, 1 - Math.exp(-lambda * dt));
const tmp = new Vector3();

export function createMaungAnimator(maung) {
  const { bob, body, neck, head, eyes, brows, ears, mouthOpen, smile, arms, coin, tail } = maung.rig;
  const s = {
    yaw: 0,
    pitch: 0,
    tilt: 0,
    lid: 1,
    lower: 0,
    brow: 0,
    mouth: 0.6,
    blinkT: -1,
    nextBlink: 1.2,
    double: false,
    hopT: -1,
    twitchT: -1,
    twitchSide: 1,
    nextTwitch: 4,
    pose: { wave: 0, listen: 0, point: 0, coin: 0, cheer: 0 },
  };

  const blinkAmount = (t) => {
    if (s.blinkT < 0) return 0;
    const k = (t - s.blinkT) / 0.16;
    if (k >= 1) {
      if (s.double) {
        s.double = false;
        s.blinkT = t + 0.09;
      } else s.blinkT = -1;
      return 0;
    }
    return k < 0 ? 0 : Math.sin(k * Math.PI);
  };

  function armTarget(side) {
    const out = { sx: ARM_REST.sx, sz: ARM_REST.sz, ex: ARM_REST.ex };
    for (const [name, w] of Object.entries(s.pose)) {
      const p = POSES[name]?.[side];
      if (!p || w <= 0.001) continue;
      out.sx += (p.sx - ARM_REST.sx) * w;
      out.sz += (p.sz - ARM_REST.sz) * w;
      out.ex += (p.ex - ARM_REST.ex) * w;
    }
    return out;
  }

  return {
    hop(t) {
      s.hopT = t;
    },
    twitch(t, side = Math.random() < 0.5 ? -1 : 1) {
      s.twitchT = t;
      s.twitchSide = side;
    },
    update(dt, t, state = {}) {
      dt = Math.min(dt, 0.05);
      const still = Boolean(state.still);
      const e = EXPRESSIONS[state.expression] || EXPRESSIONS.idle;

      // gaze, clamped so the neck never looks broken
      let yawT = 0;
      let pitchT = 0;
      if (state.look) {
        tmp.copy(state.look);
        neck.worldToLocal(tmp);
        yawT = MathUtils.clamp(Math.atan2(tmp.x, tmp.z), -0.6, 0.6);
        pitchT = MathUtils.clamp(-Math.atan2(tmp.y - 0.56, Math.hypot(tmp.x, tmp.z)), -0.28, 0.24);
      }
      const rate = still ? 30 : 4.5;
      s.yaw = damp(s.yaw, yawT, rate, dt);
      s.pitch = damp(s.pitch, pitchT, rate, dt);
      s.tilt = damp(s.tilt, e.tilt, still ? 30 : 4, dt);
      s.lid = damp(s.lid, e.lid, 10, dt);
      s.lower = damp(s.lower, e.lower, 10, dt);
      s.brow = damp(s.brow, e.brow, 8, dt);
      s.mouth = damp(s.mouth, e.mouth, 9, dt);
      for (const key of Object.keys(s.pose)) s.pose[key] = damp(s.pose[key], state.pose?.[key] || 0, still ? 30 : 5, dt);

      // blinking every 2–5 s, sometimes twice
      if (!still && t > s.nextBlink && s.blinkT < 0) {
        s.blinkT = t;
        s.double = Math.random() < 0.22;
        s.nextBlink = t + 2 + Math.random() * 3;
      }
      const blink = still ? 0 : blinkAmount(t);

      // breathing + hop
      const breathe = still ? 0 : Math.sin(t * 1.8);
      let hop = 0;
      if (s.hopT >= 0) {
        const k = (t - s.hopT) / 0.55;
        if (k >= 1) s.hopT = -1;
        else hop = Math.sin(k * Math.PI) * 0.18;
      }
      bob.position.y = breathe * 0.018 + hop;
      body.scale.set(1 + breathe * 0.006, 1 + breathe * 0.01 - hop * 0.15, 1 + breathe * 0.006);

      head.rotation.set(s.pitch, s.yaw, s.tilt + (still ? 0 : Math.sin(t * 0.8) * 0.02));

      for (const { eye, upper, lower } of eyes) {
        eye.rotation.set(s.pitch * 0.4, s.yaw * 0.5, 0);
        const open = MathUtils.clamp(s.lid - blink * 1.25, 0, 1.15);
        // open: the lid cap tucks back; closed: its rim (with the lash line) sweeps down across the eye
        upper.rotation.x = MathUtils.lerp(0.45, -0.9, open);
        const low = MathUtils.clamp(s.lower + blink * 0.45, 0, 1);
        lower.rotation.x = MathUtils.lerp(0.55, -0.75, low);
      }
      for (const b of brows) {
        const base = b.userData.base;
        b.position.y = base.y + s.brow * 0.05;
        b.rotation.z = base.rz - base.s * s.brow * 0.12;
      }
      mouthOpen.scale.set(1, Math.max(0.06, s.mouth), 1);
      smile.scale.set(1, 1 - s.mouth * 0.15, 1);

      // ears: occasional flick, perk up while listening
      if (!still && t > s.nextTwitch && s.twitchT < 0) {
        this.twitch(t);
        s.nextTwitch = t + 4 + Math.random() * 5;
      }
      let flick = 0;
      if (s.twitchT >= 0) {
        const k = (t - s.twitchT) / 0.35;
        if (k >= 1) s.twitchT = -1;
        else flick = Math.sin(k * Math.PI * 2) * 0.25 * (1 - k);
      }
      ears.forEach((ear, i) => {
        const side = i === 0 ? -1 : 1;
        ear.rotation.z = ear.userData.baseZ + side * s.brow * 0.12 + (side === s.twitchSide ? flick : 0);
        ear.rotation.x = -s.brow * 0.15;
      });

      // arms
      for (const side of ["L", "R"]) {
        const sign = side === "L" ? 1 : -1;
        const target = armTarget(side);
        const { shoulder, elbow } = arms[side];
        const sway = still ? 0 : Math.sin(t * 1.8 + (side === "L" ? 0 : 1.2)) * 0.03;
        let waveRock = 0;
        if (side === "R" && !still) waveRock = Math.sin(t * 9) * 0.32 * s.pose.wave;
        shoulder.rotation.x = target.sx + sway * 0.5;
        shoulder.rotation.z = sign * (target.sz + sway);
        elbow.rotation.x = target.ex;
        elbow.rotation.z = sign * waveRock;
      }
      coin.scale.setScalar(Math.max(0.001, MathUtils.smoothstep(s.pose.coin, 0.35, 0.8)));
      coin.rotation.y = still ? 0 : Math.sin(t * 2.2) * 0.35;

      // tail: travelling wave down the chain
      tail.forEach((joint, i) => {
        const rest = joint.userData.rest;
        const wave = still ? 0 : Math.sin(t * 2.1 - i * 0.55) * (0.05 + i * 0.012);
        joint.rotation.z = rest.z + wave;
        joint.rotation.x = rest.x + (still ? 0 : Math.cos(t * 1.6 - i * 0.5) * 0.03);
      });
    },
  };
}
