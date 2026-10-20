import { copyFile } from "node:fs/promises";
import { resolve } from "node:path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

/**
 * GitHub Pages cannot rewrite unknown paths to index.html, so a direct visit
 * to /SI-MAUNG/transactions would 404. Shipping the same document as 404.html
 * lets the SPA boot on any route (React Router then renders the right page).
 */
function spaFallback() {
  let outDir = "dist";
  return {
    name: "si-maung-spa-fallback",
    apply: "build",
    configResolved(config) {
      outDir = config.build.outDir;
    },
    async closeBundle() {
      await copyFile(resolve(outDir, "index.html"), resolve(outDir, "404.html"));
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ command, mode, isPreview }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  // Production (and `vite preview` of it) is served from https://syamaydev.github.io/SI-MAUNG/.
  // Override with VITE_BASE_PATH=/ when hosting at a domain root. `npm run dev` uses "/".
  const base = command === "build" || isPreview ? env.VITE_BASE_PATH || "/SI-MAUNG/" : "/";

  return {
    base,
    plugins: [react(), spaFallback()],
    build: {
      // three.js lives in its own lazy chunk (the 3D stage); keep the warning
      // meaningful for the entry bundle.
      chunkSizeWarningLimit: 800,
    },
  };
});
