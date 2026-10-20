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

/**
 * Lists the 3D stage chunk(s) and their byte sizes in
 * <meta name="simaung:3d" content="assets/Stage-xxx.js|614000 …">, so the
 * loading screen can show real download progress (src/lib/load3d.js).
 * Only chunks that the entry does not already load are listed.
 */
function threeChunkManifest() {
  return {
    name: "si-maung-3d-manifest",
    apply: "build",
    transformIndexHtml: {
      order: "post",
      handler(html, ctx) {
        if (!ctx.bundle) return html;
        const chunks = Object.values(ctx.bundle).filter((c) => c.type === "chunk");
        const byName = new Map(chunks.map((c) => [c.fileName, c]));
        const stage = chunks.find((c) => (c.facadeModuleId || "").replace(/\\/g, "/").endsWith("/src/three/Stage.jsx"));
        const entry = chunks.find((c) => c.isEntry);
        if (!stage || !entry) return html;
        const loaded = new Set();
        const walkEntry = (f) => {
          if (loaded.has(f)) return;
          loaded.add(f);
          (byName.get(f)?.imports || []).forEach(walkEntry);
        };
        walkEntry(entry.fileName);
        const needed = new Set();
        const walkStage = (f) => {
          if (needed.has(f) || loaded.has(f)) return;
          needed.add(f);
          (byName.get(f)?.imports || []).forEach(walkStage);
        };
        walkStage(stage.fileName);
        const content = [...needed].map((f) => `${f}|${Buffer.byteLength(byName.get(f).code)}`).join(" ");
        return { html, tags: [{ tag: "meta", attrs: { name: "simaung:3d", content }, injectTo: "head" }] };
      },
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
    plugins: [react(), threeChunkManifest(), spaFallback()],
    build: {
      // three.js lives in its own lazy chunk (the 3D stage); keep the warning
      // meaningful for the entry bundle.
      chunkSizeWarningLimit: 800,
    },
  };
});
