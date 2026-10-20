/**
 * Loads the 3D stage chunk. Production builds list the chunk files and their
 * sizes in <meta name="simaung:3d"> (vite.config.js); they are downloaded with
 * a streaming reader so the loader can show real byte progress, and the
 * module import that follows is served from the HTTP cache. In development
 * (no list) the import runs directly and progress is reported as unknown.
 * The promise is shared: the chunk is only ever fetched once per page load.
 */
import { stepActive, stepDone, stepFail, stepProgress } from "./bootLoader";

let pending = null;

async function prefetchWithProgress(onProgress) {
  const list = document.querySelector('meta[name="simaung:3d"]')?.content?.trim();
  if (!list) {
    onProgress(null);
    return;
  }
  const base = import.meta.env.BASE_URL || "/";
  const files = list.split(/\s+/).map((entry) => {
    const [file, size] = entry.split("|");
    return { url: `${base}${file}`, size: Number(size) || 1, got: 0 };
  });
  const total = files.reduce((s, f) => s + f.size, 0);
  let raf = 0;
  const mb = (n) => (n / 1048576).toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const report = () => {
    raf = 0;
    const got = files.reduce((s, f) => s + Math.min(f.got, f.size), 0);
    onProgress(Math.min(0.99, got / total), `${mb(got)} / ${mb(total)} MB`);
  };
  await Promise.all(
    files.map(async (f) => {
      const res = await fetch(f.url, { credentials: "same-origin" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      if (res.body?.getReader) {
        const reader = res.body.getReader();
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          f.got += value.length;
          if (!raf) raf = requestAnimationFrame(report);
        }
      } else {
        await res.arrayBuffer();
      }
      f.got = f.size;
    })
  );
  cancelAnimationFrame(raf);
  onProgress(0.99, `${mb(total)} MB diunduh`);
}

export function loadStage() {
  if (!pending) {
    stepActive("engine");
    pending = (async () => {
      try {
        await prefetchWithProgress((p, note) => stepProgress("engine", p, note));
      } catch {
        // the module import below still tries the normal way
      }
      const mod = await import("../three/Stage.jsx");
      stepDone("engine");
      return mod.default;
    })().catch((error) => {
      pending = null;
      stepFail("engine", "Mesin 3D gagal dimuat. Periksa koneksi internet.");
      throw error;
    });
  }
  return pending;
}
