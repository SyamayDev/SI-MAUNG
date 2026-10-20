/** Scene-mode routing and React hooks around the shared 3D scene store. */
import { useMemo, useSyncExternalStore } from "react";
import { scene, subscribeScene } from "../../lib/sceneStore";
import { canRender3D } from "../../lib/device";
import { usePreferences } from "../../lib/preferences";

export const NO_3D_REASONS = {
  off: "Dimatikan di Pengaturan — memakai ilustrasi 2D",
  "no-webgl": "Browser ini tidak mendukung WebGL — memakai ilustrasi 2D",
  software: "Grafis perangkat terlalu terbatas — memakai ilustrasi 2D",
};

const STORY_ROUTES = ["/", "/dashboard"];
const PORTRAIT_ROUTES = ["/login", "/register", "/forgot-password", "/reset-password", "/onboarding"];

/** Which 3D mode a route uses: "story" | "portrait" | "off". */
export function sceneModeFor(pathname) {
  const path = pathname.replace(/\/+$/, "") || "/";
  if (STORY_ROUTES.includes(path)) return "story";
  if (PORTRAIT_ROUTES.includes(path)) return "portrait";
  return "off";
}

/** Can this device show the live 3D MAUNG right now (reacts to the Settings switch)? */
export function use3DSupport() {
  const { scene3d } = usePreferences();
  return useMemo(() => canRender3D(scene3d), [scene3d]);
}

export function useSceneField(key) {
  return useSyncExternalStore(subscribeScene, () => scene[key], () => scene[key]);
}

/** For pages that frame MAUNG themselves: is the live 3D model available here? */
export function useMaung3D() {
  const support = use3DSupport();
  const failed = useSceneField("failed");
  const ready = useSceneField("ready");
  return { available: support.ok && !failed, live: support.ok && !failed && ready, reason: support.reason };
}
