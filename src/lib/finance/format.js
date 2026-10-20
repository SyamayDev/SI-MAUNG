/** Display formatting — Rupiah and Indonesian dates (locale id-ID). */
import { parseLocalISODate } from "./dates.js";

const rupiah = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0, maximumFractionDigits: 0 });
const plain = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 });

/** 25000 → "Rp 25.000" (Intl inserts a non-breaking space). */
export function formatRupiah(value) {
  return rupiah.format(Number(value) || 0);
}

/** Signed amount for a transaction row: "+Rp 25.000" / "−Rp 25.000". */
export function formatSigned(value, type) {
  return `${type === "income" ? "+" : "−"}${formatRupiah(Math.abs(Number(value) || 0))}`;
}

/** Thousands-grouped digits only ("25.000"), for money inputs. */
export function formatDigits(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? plain.format(n) : "";
}

/** Short form for tight spaces: Rp 1,2 jt / Rp 350 rb. */
export function formatCompactRupiah(value) {
  const n = Math.abs(Number(value) || 0);
  const sign = Number(value) < 0 ? "−" : "";
  const fmt = (x) => x.toLocaleString("id-ID", { maximumFractionDigits: 1 });
  if (n >= 1e12) return `${sign}Rp ${fmt(n / 1e12)} T`;
  if (n >= 1e9) return `${sign}Rp ${fmt(n / 1e9)} M`;
  if (n >= 1e6) return `${sign}Rp ${fmt(n / 1e6)} jt`;
  if (n >= 1e3) return `${sign}Rp ${fmt(n / 1e3)} rb`;
  return `${sign}Rp ${fmt(n)}`;
}

const dateFormats = {
  short: { day: "numeric", month: "short", year: "numeric" },
  long: { weekday: "long", day: "numeric", month: "long", year: "numeric" },
  dayMonth: { day: "numeric", month: "short" },
  monthYear: { month: "long", year: "numeric" },
  monthShort: { month: "short" },
};

/** "2026-10-20" → "20 Okt 2026" (local time, never shifted by UTC). */
export function formatDate(isoOrDate, style = "short") {
  const d = isoOrDate instanceof Date ? isoOrDate : parseLocalISODate(isoOrDate);
  if (!d) return "—";
  return d.toLocaleDateString("id-ID", dateFormats[style] || dateFormats.short);
}

export function formatPercent(ratio, digits = 0) {
  if (!Number.isFinite(ratio)) return "—";
  return `${(ratio * 100).toLocaleString("id-ID", { maximumFractionDigits: digits })}%`;
}
