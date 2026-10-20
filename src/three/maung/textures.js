/**
 * Canvas-painted textures for MAUNG — nothing is downloaded.
 * SphereGeometry UVs: u = 0.25 is the front (+Z), v = 0 is the top.
 */
import { CanvasTexture, ClampToEdgeWrapping, LinearMipmapLinearFilter, RepeatWrapping, SRGBColorSpace } from "three";

export const MAUNG_COLORS = {
  fur: "#f3920f",
  furLight: "#f8b544",
  cream: "#ffe7c4",
  stripe: "#3a2214",
  nose: "#5a3320",
  suit: "#1d2a66",
  suitDeep: "#141e4f",
  shirt: "#fbf8f1",
  tie: "#f4b324",
  shoe: "#15161d",
  gold: "#f6c445",
  goldDeep: "#c98a12",
  inner: "#f6c8b6",
  mouth: "#7a2a22",
  tongue: "#e9776e",
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
  t.anisotropy = 4;
  t.minFilter = LinearMipmapLinearFilter;
  t.wrapS = repeat ? RepeatWrapping : ClampToEdgeWrapping;
  return t;
}

/** A tapered brush stroke (tiger stripe) from (x1,y1) to (x2,y2). */
function stripe(ctx, x1, y1, x2, y2, width) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const nx = (-dy / len) * width;
  const ny = (dx / len) * width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.quadraticCurveTo(x1 + dx * 0.45 + nx, y1 + dy * 0.45 + ny, x2, y2);
  ctx.quadraticCurveTo(x1 + dx * 0.55 - nx * 0.6, y1 + dy * 0.55 - ny * 0.6, x1, y1);
  ctx.fill();
}

/** Head fur: amber with forehead and side stripes, lighter towards the face. */
export function headTexture() {
  const W = 1024;
  const H = 512;
  const [c, ctx] = canvas(W, H);
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#e9840a");
  g.addColorStop(0.55, MAUNG_COLORS.fur);
  g.addColorStop(1, "#f6a530");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // soft highlight on the forehead
  const hl = ctx.createRadialGradient(W * 0.25, H * 0.3, 10, W * 0.25, H * 0.3, H * 0.4);
  hl.addColorStop(0, "rgba(255,214,140,0.55)");
  hl.addColorStop(1, "rgba(255,214,140,0)");
  ctx.fillStyle = hl;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = MAUNG_COLORS.stripe;
  const fx = W * 0.25; // front
  // forehead: a central mark flanked by two pairs of chevrons
  stripe(ctx, fx, H * 0.06, fx, H * 0.27, 13);
  stripe(ctx, fx - 22, H * 0.1, fx - 52, H * 0.25, 10);
  stripe(ctx, fx + 22, H * 0.1, fx + 52, H * 0.25, 10);
  stripe(ctx, fx - 40, H * 0.06, fx - 86, H * 0.17, 8);
  stripe(ctx, fx + 40, H * 0.06, fx + 86, H * 0.17, 8);
  // brow flicks above the eyes
  stripe(ctx, fx - 70, H * 0.36, fx - 112, H * 0.31, 6);
  stripe(ctx, fx + 70, H * 0.36, fx + 112, H * 0.31, 6);
  // side stripes (temples → cheeks), mirrored around the front
  for (const side of [-1, 1]) {
    const sx = fx + side * W * 0.16;
    stripe(ctx, sx, H * 0.34, sx - side * 70, H * 0.42, 11);
    stripe(ctx, sx + side * 8, H * 0.47, sx - side * 76, H * 0.53, 11);
    stripe(ctx, sx + side * 14, H * 0.6, sx - side * 64, H * 0.63, 9);
  }
  // crown and back of the head
  for (let i = 0; i < 6; i++) {
    const bx = W * (0.5 + i * 0.09);
    stripe(ctx, bx, H * 0.08, bx + 26, H * 0.42, 11);
  }
  return finish(c);
}

/** Eye: sclera with a warm brown iris, pupil and two catch-lights. Iris faces u = 0.25. */
export function eyeTexture() {
  const W = 512;
  const H = 256;
  const [c, ctx] = canvas(W, H);
  ctx.fillStyle = "#fffaf2";
  ctx.fillRect(0, 0, W, H);
  const cx = W * 0.25;
  const cy = H * 0.5;
  const r = H * 0.36;
  const iris = ctx.createRadialGradient(cx, cy + r * 0.25, r * 0.1, cx, cy, r);
  iris.addColorStop(0, "#c27a2c");
  iris.addColorStop(0.65, "#7a4416");
  iris.addColorStop(1, "#3b1f0b");
  ctx.fillStyle = iris;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#140a05";
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.46, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(cx - r * 0.32, cy - r * 0.34, r * 0.24, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + r * 0.3, cy + r * 0.3, r * 0.11, 0, Math.PI * 2);
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

/** Stage floor: a dark disc with a warm rim and faint concentric grooves. */
export function floorTexture() {
  const S = 512;
  const [c, ctx] = canvas(S, S);
  const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0, "rgba(46,62,140,0.9)");
  g.addColorStop(0.55, "rgba(24,34,90,0.75)");
  g.addColorStop(0.86, "rgba(16,22,64,0.35)");
  g.addColorStop(0.93, "rgba(242,165,22,0.35)");
  g.addColorStop(1, "rgba(16,22,64,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  ctx.strokeStyle = "rgba(255,255,255,0.05)";
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
