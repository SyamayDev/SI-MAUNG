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
  // GitHub Pages (and `vite preview` of it) serves the app from /SI-MAUNG/; Vercel
  // (process.env.VERCEL is set on its builders) serves it from the domain root.
  // VITE_BASE_PATH overrides both. `npm run dev` uses "/".
  const hostBase = process.env.VERCEL ? "/" : "/SI-MAUNG/";
  const base = command === "build" || isPreview ? env.VITE_BASE_PATH || hostBase : "/";

  // The Vercel ↔ Supabase integration names the PUBLIC client settings without the
  // VITE_ prefix. Map exactly those two (URL + anon/publishable key) — never the
  // service-role key or any other secret.
  const pick = (...names) => names.map((n) => process.env[n]).find(Boolean);
  const supabaseUrl = env.VITE_SUPABASE_URL || pick("NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL");
  const supabaseKey =
    env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    pick("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "SUPABASE_PUBLISHABLE_KEY", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_ANON_KEY");

  return {
    base,
    define: {
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(supabaseUrl || ""),
      "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(supabaseKey || ""),
    },
    plugins: [react(), threeChunkManifest(), spaFallback()],
    build: {
      // three.js lives in its own lazy chunk (the 3D stage); keep the warning
      // meaningful for the entry bundle.
      chunkSizeWarningLimit: 800,
    },
  };
});
