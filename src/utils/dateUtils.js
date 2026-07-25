export function toISODate(input = new Date()) {
  const d = input instanceof Date ? input : new Date(input);
  return d.toISOString().slice(0, 10);
}

export function formatReadable(input = new Date()) {
  const d = input instanceof Date ? input : new Date(input);
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function parseDateLike(text) {
  if (!text) return null;
  const t = text.toLowerCase();
  if (t.includes("today") || t.includes("hari ini"))
    return toISODate(new Date());
  if (t.includes("yesterday") || t.includes("kemarin"))
    return toISODate(new Date(Date.now() - 86400000));

  // match YYYY-MM-DD
  const m = text.match(/(\d{4}-\d{2}-\d{2})/);
  if (m) return m[1];

  // simple dd/mm/yyyy or dd-mm-yyyy
  const m2 = text.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/);
  if (m2) {
    const parsed = new Date(m2[1].replace(/\//g, "-"));
    if (!isNaN(parsed)) return toISODate(parsed);
  }

  return null;
}

export default { toISODate, formatReadable, parseDateLike };
