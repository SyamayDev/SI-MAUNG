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

/**
 * Absolute site URL for canonical / Open Graph / JSON-LD tags (index.html uses
 * %SITE_URL%), plus robots.txt and sitemap.xml. Link previews (WhatsApp etc.)
 * need absolute image URLs, so this is resolved at build time.
 */
function siteMeta(siteUrl) {
  const publicPages = ["", "login", "register", "forgot-password"];
  return {
    name: "simaung-site-meta",
    transformIndexHtml: {
      order: "pre",
      handler: (html) => html.replaceAll("%SITE_URL%", siteUrl),
    },
    generateBundle() {
      const today = new Date().toISOString().slice(0, 10);
      const root = new URL(siteUrl).pathname;
      this.emitFile({
        type: "asset",
        fileName: "robots.txt",
        source: ["User-agent: *", "Allow: /", `Disallow: ${root}dashboard`, `Disallow: ${root}transactions`, `Disallow: ${root}settings`, "", `Sitemap: ${siteUrl}sitemap.xml`, ""].join("\n"),
      });
      const urls = publicPages.map((p) => `  <url><loc>${siteUrl}${p}</loc><lastmod>${today}</lastmod><priority>${p ? "0.5" : "1.0"}</priority></url>`);
      this.emitFile({
        type: "asset",
        fileName: "sitemap.xml",
        source: ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">', ...urls, "</urlset>", ""].join("\n"),
      });
    },
  };
}

/**
 * The main stylesheet must not block the first paint: index.html already
 * paints the loader with inline styles. The link becomes a preload that turns
 * into a stylesheet when it arrives; LoadingScreen keeps the static loader up
 * until then, so unstyled content is never visible.
 */
function nonBlockingCss() {
  return {
    name: "simaung-non-blocking-css",
    apply: "build",
    transformIndexHtml: {
      order: "post",
      handler: (html) =>
        html.replace(/<link rel="stylesheet" crossorigin href="([^"]+)">/g, (_, href) =>
          `<link rel="preload" as="style" crossorigin href="${href}" data-app-css onload="this.onload=null;this.rel='stylesheet'">` +
          `<noscript><link rel="stylesheet" crossorigin href="${href}"></noscript>`,
        ),
    },
  };
}

/**
 * Paint first, then fetch the app. The first-paint screen in index.html
 * (brand + tagline, inline styles, system fonts) needs no network at all, so
 * the entry script, its module preloads and the stylesheet are requested
 * right after the browser reports that first paint, instead of competing
 * with it. Without Paint Timing support two animation frames are used; a
 * background tab (no paint, no frames) falls back to a timer.
 */
function paintBeforeScripts() {
  return {
    name: "simaung-paint-before-scripts",
    apply: "build",
    transformIndexHtml: {
      order: "post",
      handler(html) {
        const scripts = [];
        const preloads = [];
        const styles = [];
        let out = html
          .replace(/<script type="module" crossorigin src="([^"]+)"><\/script>\s*/g, (_, src) => (scripts.push(src), ""))
          .replace(/<link rel="modulepreload" crossorigin href="([^"]+)">\s*/g, (_, href) => (preloads.push(href), ""))
          .replace(/<link rel="preload" as="style" crossorigin href="([^"]+)" data-app-css onload="[^"]*">/g, (_, href) => (styles.push(href), ""));
        if (!scripts.length) return html;
        const add = (list, js) => `${JSON.stringify(list)}.forEach(function(u){${js}});`;
        const loader =
          "<script>(function(){var done=false;function go(){if(done)return;done=true;var h=document.head;" +
          add(styles, 'var l=document.createElement("link");l.rel="stylesheet";l.crossOrigin="";l.href=u;l.setAttribute("data-app-css","");h.appendChild(l);') +
          add(preloads, 'var l=document.createElement("link");l.rel="modulepreload";l.crossOrigin="";l.href=u;h.appendChild(l);') +
          add(scripts, 'var s=document.createElement("script");s.type="module";s.crossOrigin="";s.src=u;h.appendChild(s);') +
          "}function later(){setTimeout(go,0)}" +
          "var po=window.PerformanceObserver,types=po&&po.supportedEntryTypes||[];" +
          'if(types.indexOf("paint")>=0){try{new po(function(list,obs){list.getEntries().forEach(function(e){if(e.name==="first-contentful-paint"){obs.disconnect();later();}})}).observe({type:"paint",buffered:true});}catch(e){later();}}' +
          "else{requestAnimationFrame(function(){requestAnimationFrame(later)})}" +
          "setTimeout(go,800);})();</script>";
        out = out.replace("</body>", `  ${loader}\n  </body>`);
        return out;
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
  // Public address of this build (canonical, link previews, sitemap).
  const vercelDomain = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  const siteUrl = (
    env.VITE_SITE_URL ||
    (command !== "build" && !isPreview ? "http://localhost:5173/" : vercelDomain ? `https://${vercelDomain}/` : `https://syamaydev.github.io${base}`)
  ).replace(/\/?$/, "/");

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
    plugins: [react(), siteMeta(siteUrl), threeChunkManifest(), nonBlockingCss(), paintBeforeScripts(), spaFallback()],
    build: {
      // three.js lives in its own lazy chunk (the 3D stage); keep the warning
      // meaningful for the entry bundle.
      chunkSizeWarningLimit: 800,
      rolldownOptions: {
        output: {
          // one small icon chunk instead of a request per icon
          codeSplitting: { groups: [{ name: "icons", test: /node_modules[/\\]lucide-react/ }] },
        },
      },
    },
  };
});
