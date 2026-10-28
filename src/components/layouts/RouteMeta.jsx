import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const HOME_TITLE = "SI-MAUNG: Catat Keuangan Cukup dengan Suara";
const TITLES = {
  "/": HOME_TITLE,
  "/login": "Masuk",
  "/register": "Daftar gratis",
  "/forgot-password": "Lupa kata sandi",
  "/reset-password": "Atur ulang kata sandi",
  "/onboarding": "Kenalan dulu",
  "/dashboard": "Beranda",
  "/transactions": "Riwayat transaksi",
  "/analytics": "Analitik",
  "/savings": "Tujuan tabungan",
  "/ai": "Asisten",
  "/settings": "Pengaturan",
};
// Public pages search engines may list (the reset-password page carries one-time tokens: never indexed).
const INDEXABLE = new Set(["/", "/login", "/register", "/forgot-password"]);

function setMeta(selector, attr, value) {
  const el = document.head.querySelector(selector);
  if (el) el.setAttribute(attr, value);
}

/** Per-route document title, robots and canonical (screen readers announce the title on navigation). */
export default function RouteMeta() {
  const { pathname } = useLocation();
  useEffect(() => {
    const path = pathname.replace(/\/+$/, "") || "/";
    const known = TITLES[path];
    document.title = path === "/" ? HOME_TITLE : `${known || "Halaman tidak ditemukan"} · SI-MAUNG`;
    setMeta('meta[name="robots"]', "content", INDEXABLE.has(path) ? "index, follow, max-image-preview:large" : "noindex, nofollow");
    const canonical = document.head.querySelector('link[rel="canonical"]');
    if (canonical) {
      const site = new URL(canonical.dataset.site || (canonical.dataset.site = canonical.href));
      canonical.href = new URL(path === "/" ? "" : path.slice(1), site).href;
    }
  }, [pathname]);
  return null;
}
