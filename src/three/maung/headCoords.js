/**
 * MAUNG's head shape in one place, so geometry, texture and facial features
 * agree. Angles ("face coordinates"): phi = 0 front, phi > 0 towards MAUNG's
 * left (+x); theta = 0 crown, π/2 equator, π chin.
 *
 * The skull is an ellipsoid with tiger-cub jowls: the lower sides widen and
 * end in a zig-zag fringe of cheek fur, like the 2D mascot's silhouette.
 */
import { Vector3 } from "three";

export const HEAD = { rx: 0.66, ry: 0.58, rz: 0.6, cy: 0.56 };

/** Where facial features sit, in face coordinates. */
export const FEATURES = {
  eye: { phi: 0.37, theta: 1.36 },
  brow: { phi: 0.37, theta: 1.05 },
  nose: { phi: 0, theta: 1.66 },
  muzzle: { phi: 0, theta: 1.86 },
  ear: { phi: 0.88, theta: 0.5 },
};

const smoothstep = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const frac = (x) => x - Math.floor(x);

/** Unit direction (nx, ny, nz) → point on the skull, relative to the skull centre. */
export function skullPoint(nx, ny, nz, out = new Vector3()) {
  const { rx, ry, rz } = HEAD;
  let x = nx * rx;
  let y = ny * ry;
  let z = nz * rz;
  const side = Math.abs(nx);

  // jowls: the lower sides widen, more towards the front
  const low = smoothstep(0.2, -0.65, ny);
  x *= 1 + 0.2 * low * smoothstep(0.2, 0.9, side) * (0.55 + 0.45 * smoothstep(-0.4, 0.5, nz));

  // zig-zag fringe of cheek fur along the jowl silhouette
  const rim =
    smoothstep(0.6, 0.95, side) * smoothstep(0.8, 0.1, Math.abs(nz - 0.1)) * smoothstep(-0.45, -0.1, nz) * smoothstep(-0.9, -0.5, ny) * smoothstep(0.22, -0.05, ny);
  if (rim > 0) {
    const a = Math.atan2(ny, side); // ≈ -1.1 (low) … 0.2
    const tri = 1 - Math.abs(2 * frac(a / 0.32 + 0.5) - 1);
    const spike = tri ** 2.4 * 0.13 * rim;
    x += Math.sign(nx) * spike;
    y -= spike * 0.4; // tufts point slightly down, like brushed fur
  }

  // a softer, flatter face and a flat underside where the head meets the collar
  if (nz > 0) z *= 1 - 0.06 * nz * smoothstep(-0.3, 0.5, ny);
  if (y < -0.46) y = -0.46 + (y + 0.46) * 0.45;
  return out.set(x, y, z);
}

export function faceDirection(phi, theta, out = new Vector3()) {
  return out.set(Math.sin(theta) * Math.sin(phi), Math.cos(theta), Math.sin(theta) * Math.cos(phi));
}

const _d = new Vector3();
const _a = new Vector3();
const _b = new Vector3();

/**
 * Point on the head surface (head-local, i.e. including HEAD.cy), optionally
 * lifted along the surface normal. Returns { point, normal }.
 */
export function headSurface(phi, theta, lift = 0) {
  faceDirection(phi, theta, _d);
  const point = skullPoint(_d.x, _d.y, _d.z, new Vector3());
  // numeric normal from two nearby points
  faceDirection(phi + 0.01, theta, _a);
  faceDirection(phi, theta + 0.01, _b);
  const pa = skullPoint(_a.x, _a.y, _a.z, new Vector3()).sub(point);
  const pb = skullPoint(_b.x, _b.y, _b.z, new Vector3()).sub(point);
  const normal = pb.cross(pa).normalize();
  if (normal.dot(point) < 0) normal.negate();
  point.addScaledVector(normal, lift);
  point.y += HEAD.cy;
  return { point, normal };
}
