/**
 * Canvas-painted textures for MAUNG — nothing is downloaded.
 *
 * The head texture is painted in the same angular "face coordinates" the
 * geometry uses (see headCoords.js): phi = 0 is the front, phi > 0 is
 * MAUNG's left (+x), theta = 0 is the crown. The head sphere is generated
 * with its UV seam at the back, so u = 0.5 + phi / 2π and v = theta / π.
 * Brush widths are corrected for the sphere's horizontal stretch (1 / sin θ),
 * so stripes keep their drawn thickness on the model.
 */
import { CanvasTexture, ClampToEdgeWrapping, LinearMipmapLinearFilter, RepeatWrapping, SRGBColorSpace } from "three";
import { FEATURES } from "./headCoords.js";

export const MAUNG_COLORS = {
  fur: "#f39417",
  furDeep: "#e07d0a",
  furLight: "#f9b046",
  cream: "#fff4e2",
  stripe: "#1d140f",
  nose: "#3a1f14",
  suit: "#1e2d6e",
  suitDeep: "#141f52",
  shirt: "#fbf8f2",
  tie: "#f7c21e",
  shoe: "#14151b",
  gold: "#f6c445",
  goldDeep: "#c98a12",
  inner: "#f6d6c2",
  mouth: "#6e1f1a",
  tongue: "#ee7a6f",
};

function canvas(w, h) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return [c, c.getContext("2d")];
}

function finish(c, { srgb = true, repeat = false } = {}) {
  const t = new CanvasTexture(c);
  if (srgb) t.colorSpace = SRGBColorSpace;
  t.anisotropy = 8;
  t.minFilter = LinearMipmapLinearFilter;
  t.wrapS = repeat ? RepeatWrapping : ClampToEdgeWrapping;
  return t;
}

/* ---------- face-coordinate painter ---------- */

function painter(ctx, W, H) {
  const toPx = (phi, theta) => [(0.5 + phi / (2 * Math.PI)) * W, (theta / Math.PI) * H];
  const stretch = (theta) => 1 / Math.max(0.25, Math.sin(theta));

  /**
   * Tapered brush stroke along a path of [phi, theta] points.
   * widths: [start, end] in radians of surface arc.
   */
  function brush(points, [w0, w1], color) {
    // dense Catmull-Rom sampling in angular space
    const pts = [];
    const n = points.length;
    for (let i = 0; i < n - 1; i++) {
      const p0 = points[Math.max(0, i - 1)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(n - 1, i + 2)];
      for (let k = 0; k < 10; k++) {
        const t = k / 10;
        const t2 = t * t;
        const t3 = t2 * t;
        const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
        pts.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
      }
    }
    pts.push(points[n - 1]);
    const left = [];
    const right = [];
    pts.forEach((p, i) => {
      const a = pts[Math.max(0, i - 1)];
      const b = pts[Math.min(pts.length - 1, i + 1)];
      const sinT = Math.max(0.25, Math.sin(p[1]));
      // tangent in physical (arc) space
      let tx = (b[0] - a[0]) * sinT;
      let ty = b[1] - a[1];
      const len = Math.hypot(tx, ty) || 1;
      tx /= len;
      ty /= len;
      const u = i / (pts.length - 1);
      // smooth taper: full in the middle part, pointed at the thin end
      const w = (w0 + (w1 - w0) * u) * (0.35 + 0.65 * Math.sin(Math.min(1, u * 1.15 + 0.08) * Math.PI) ** 0.35);
      const nx = -ty * (w / 2);
      const ny = tx * (w / 2);
      left.push(toPx(p[0] + nx / sinT, p[1] + ny));
      right.push(toPx(p[0] - nx / sinT, p[1] - ny));
    });
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(...left[0]);
    left.forEach((q) => ctx.lineTo(...q));
    right.reverse().forEach((q) => ctx.lineTo(...q));
    ctx.closePath();
    ctx.fill();
  }

  /** Filled blob from [phi, theta] outline points (smoothed). */
  function blob(points, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    const px = points.map(([p, t]) => toPx(p, t));
    const n = px.length;
    ctx.moveTo((px[n - 1][0] + px[0][0]) / 2, (px[n - 1][1] + px[0][1]) / 2);
    for (let i = 0; i < n; i++) {
      const a = px[i];
      const b = px[(i + 1) % n];
      ctx.quadraticCurveTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
    }
    ctx.closePath();
    ctx.fill();
  }

  /** Ellipse measured in surface arc (radians), drawn as a polygon. */
  function ellipse(phi, theta, rw, rh, color, rot = 0) {
    const pts = [];
    for (let i = 0; i < 40; i++) {
      const a = (i / 40) * Math.PI * 2;
      const dx = Math.cos(a) * rw;
      const dy = Math.sin(a) * rh;
      const x = dx * Math.cos(rot) - dy * Math.sin(rot);
      const y = dx * Math.sin(rot) + dy * Math.cos(rot);
      pts.push([phi + x * stretch(theta + y), theta + y]);
    }
    blob(pts, color);
  }

  return { brush, blob, ellipse, toPx };
}

/** The tiger stripes, shared by the colour map and the sheen map. */
function paintStripes(brush, S) {
  // forehead: a bold central wedge and two pairs of chevrons, thick just above the brows
  brush([[0, 0.4], [0, 0.72], [0, 1.08]], [0.07, 0.17], S);
  for (const s of [-1, 1]) {
    brush([[s * 0.16, 0.5], [s * 0.25, 0.74], [s * 0.3, 0.96]], [0.05, 0.13], S);
    brush([[s * 0.44, 0.44], [s * 0.58, 0.58], [s * 0.66, 0.7]], [0.04, 0.09], S);
    // temple → cheek stripes pointing towards the face; the low ones cut into the cream jowls
    brush([[s * 1.32, 1.0], [s * 1.06, 1.05], [s * 0.78, 1.13]], [0.13, 0.03], S);
    brush([[s * 1.36, 1.32], [s * 1.08, 1.36], [s * 0.8, 1.44]], [0.14, 0.03], S);
    brush([[s * 1.34, 1.66], [s * 1.08, 1.71], [s * 0.84, 1.8]], [0.13, 0.03], S);
    brush([[s * 1.26, 1.98], [s * 1.04, 2.05], [s * 0.86, 2.15]], [0.1, 0.025], S);
    // crown and back of the head
    for (let i = 0; i < 4; i++) {
      const p = s * (0.82 + i * 0.5);
      brush([[p, 0.3], [p + s * 0.06, 0.62], [p + s * 0.02, 0.98]], [0.15, 0.03], S);
    }
  }
  brush([[Math.PI - 0.15, 0.32], [Math.PI, 0.7], [Math.PI + 0.05, 1.05]], [0.15, 0.03], S);
  brush([[-Math.PI + 0.15, 0.32], [-Math.PI, 0.7], [-Math.PI - 0.05, 1.05]], [0.15, 0.03], S);
}

/**
 * Sheen strength across the head: full on fur, none on the stripes — so the
 * velvet highlight never washes the stripes out to brown.
 */
export function headSheenTexture() {
  const W = 1024;
  const H = 512;
  const [c, ctx] = canvas(W, H);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);
  paintStripes(painter(ctx, W, H).brush, "#000000");
  return finish(c);
}

/** Head fur: amber with a cream face mask and bold dark stripes that follow the anatomy. */
export function headTexture() {
  const W = 2048;
  const H = 1024;
  const [c, ctx] = canvas(W, H);
  const { brush } = painter(ctx, W, H);
  const C = MAUNG_COLORS;

  // base fur: deeper on the crown and back, lighter towards the cheeks
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, C.furDeep);
  g.addColorStop(0.45, C.fur);
  g.addColorStop(1, C.furLight);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  const back = ctx.createLinearGradient(0, 0, W, 0); // u = 0 / 1 is the back of the head
  back.addColorStop(0, "rgba(160,70,0,0.18)");
  back.addColorStop(0.3, "rgba(160,70,0,0)");
  back.addColorStop(0.7, "rgba(160,70,0,0)");
  back.addColorStop(1, "rgba(160,70,0,0.18)");
  ctx.fillStyle = back;
  ctx.fillRect(0, 0, W, H);

  // ---- cream face mask (one connected shape, soft edge) ----
  const mask = document.createElement("canvas");
  mask.width = W;
  mask.height = H;
  const mctx = mask.getContext("2d");
  const m = painter(mctx, W, H);
  const E = FEATURES.eye;
  for (const s of [-1, 1]) {
    m.ellipse(s * E.phi * 1.08, E.theta + 0.03, 0.25, 0.24, C.cream, s * 0.25);
    // jowl / cheek fur
    m.ellipse(s * 0.62, 1.98, 0.42, 0.34, C.cream, s * -0.35);
  }
  // muzzle & chin, joined to the eye patches
  m.blob(
    [
      [-0.2, 1.55], [0, 1.68], [0.2, 1.55], [0.46, 1.6], [0.72, 1.85], [0.86, 2.2], [0.6, 2.5], [0.25, 2.7],
      [0, 2.75], [-0.25, 2.7], [-0.6, 2.5], [-0.86, 2.2], [-0.72, 1.85], [-0.46, 1.6],
    ],
    C.cream
  );
  ctx.save();
  ctx.filter = "blur(3px)"; // soft fur edge where supported; hard edge elsewhere
  ctx.drawImage(mask, 0, 0);
  ctx.restore();

  // soft light on the forehead fur (painted before the stripes so they stay solid)
  const hl = ctx.createRadialGradient(W * 0.5, H * 0.24, 10, W * 0.5, H * 0.24, H * 0.32);
  hl.addColorStop(0, "rgba(255,226,170,0.3)");
  hl.addColorStop(1, "rgba(255,226,170,0)");
  ctx.fillStyle = hl;
  ctx.fillRect(0, 0, W, H);

  paintStripes(brush, C.stripe);
  return finish(c);
}

/** Eye: large warm-brown iris, black pupil, two catch-lights. Iris faces u = 0.25 (+Z). */
export function eyeTexture() {
  const W = 512;
  const H = 256;
  const [c, ctx] = canvas(W, H);
  ctx.fillStyle = "#fffaf3";
  ctx.fillRect(0, 0, W, H);
  const cx = W * 0.25;
  const cy = H * 0.5;
  const r = H * 0.4;
  const iris = ctx.createRadialGradient(cx, cy + r * 0.35, r * 0.1, cx, cy, r);
  iris.addColorStop(0, "#d58a35");
  iris.addColorStop(0.55, "#8a4816");
  iris.addColorStop(0.92, "#3b1d09");
  iris.addColorStop(1, "#1a0c04");
  ctx.fillStyle = iris;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#0d0603";
  ctx.beginPath();
  ctx.arc(cx, cy + r * 0.04, r * 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.ellipse(cx - r * 0.3, cy - r * 0.32, r * 0.24, r * 0.2, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + r * 0.32, cy + r * 0.28, r * 0.1, 0, Math.PI * 2);
  ctx.fill();
  return finish(c);
}

/** Coin face: gold disc with a raised rim and an "Rp" mark. */
export function coinTexture() {
  const S = 256;
  const [c, ctx] = canvas(S, S);
  const g = ctx.createRadialGradient(S * 0.4, S * 0.35, 10, S / 2, S / 2, S / 2);
  g.addColorStop(0, "#ffe28a");
  g.addColorStop(0.7, MAUNG_COLORS.gold);
  g.addColorStop(1, MAUNG_COLORS.goldDeep);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  ctx.strokeStyle = "rgba(140,90,10,0.55)";
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.arc(S / 2, S / 2, S * 0.4, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "rgba(120,72,6,0.75)";
  ctx.font = `800 ${S * 0.34}px Georgia, serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("Rp", S / 2, S / 2 + 4);
  return finish(c);
}

/** Card face for the "voice → transaction" chip: a generic receipt layout, no figures. */
export function chipTexture() {
  const W = 512;
  const H = 320;
  const [c, ctx] = canvas(W, H);
  ctx.fillStyle = "#fffaf0";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = MAUNG_COLORS.tie;
  ctx.fillRect(0, 0, 18, H);
  ctx.fillStyle = "#1d2a66";
  ctx.beginPath();
  ctx.arc(80, 80, 34, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff3df";
  ctx.font = "800 30px Georgia, serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("Rp", 80, 82);
  const bar = (x, y, w, h, color) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, h / 2);
    ctx.fill();
  };
  bar(136, 58, 250, 22, "#1d2a66");
  bar(136, 92, 160, 16, "#c9c3b4");
  bar(46, 160, 420, 14, "#e6dfcf");
  bar(46, 192, 340, 14, "#e6dfcf");
  bar(46, 246, 200, 40, "#0f8a6e");
  bar(270, 246, 196, 40, "#f2a516");
  return finish(c);
}

/** Soft round contact shadow. */
export function shadowTexture() {
  const S = 128;
  const [c, ctx] = canvas(S, S);
  const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0, "rgba(0,0,0,0.55)");
  g.addColorStop(0.55, "rgba(0,0,0,0.22)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  return finish(c, { srgb: false });
}

/** Stage floor: a disc with a warm rim and faint grooves, tinted per theme. */
export function floorTexture(theme = "dark") {
  const S = 512;
  const [c, ctx] = canvas(S, S);
  const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  if (theme === "light") {
    g.addColorStop(0, "rgba(255,248,236,0.95)");
    g.addColorStop(0.55, "rgba(246,226,196,0.8)");
    g.addColorStop(0.86, "rgba(236,208,166,0.35)");
    g.addColorStop(0.93, "rgba(242,165,22,0.45)");
    g.addColorStop(1, "rgba(242,165,22,0)");
  } else {
    g.addColorStop(0, "rgba(46,62,140,0.9)");
    g.addColorStop(0.55, "rgba(24,34,90,0.75)");
    g.addColorStop(0.86, "rgba(16,22,64,0.35)");
    g.addColorStop(0.93, "rgba(242,165,22,0.35)");
    g.addColorStop(1, "rgba(16,22,64,0)");
  }
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  ctx.strokeStyle = theme === "light" ? "rgba(120,80,20,0.08)" : "rgba(255,255,255,0.05)";
  ctx.lineWidth = 2;
  for (let r = 40; r < S * 0.45; r += 34) {
    ctx.beginPath();
    ctx.arc(S / 2, S / 2, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  return finish(c);
}

/** Soft additive glow sprite. */
export function glowTexture() {
  const S = 128;
  const [c, ctx] = canvas(S, S);
  const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.3, "rgba(255,255,255,0.45)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  return finish(c, { srgb: false });
}
