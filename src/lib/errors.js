/**
 * Maps Supabase/network errors to short Indonesian messages. Raw database
 * messages (which can reveal schema details) are never shown to the user.
 */
const AUTH_MESSAGES = [
  [/invalid login credentials/i, "Email atau kata sandi salah."],
  [/email not confirmed/i, "Email belum dikonfirmasi. Buka tautan konfirmasi di kotak masuk Anda."],
  [/user already registered|already been registered/i, "Email ini sudah terdaftar. Silakan masuk."],
  [/password should be at least|password.*(short|length)/i, "Kata sandi minimal 6 karakter."],
  [/weak password|pwned/i, "Kata sandi terlalu lemah. Gunakan kombinasi yang lebih unik."],
  [/same.*password|new password should be different/i, "Kata sandi baru harus berbeda dari yang lama."],
  [/rate limit|too many requests|security purposes/i, "Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi."],
  [/invalid email|unable to validate email/i, "Format email tidak valid."],
  [/signups not allowed|signup.*disabled/i, "Pendaftaran akun baru sedang ditutup."],
  // a wrong project key in the build — not the user's fault, and not an expired session
  [/invalid api key|no api key/i, "Aplikasi belum terhubung dengan benar ke server (kunci API tidak valid). Hubungi pengelola SI-MAUNG."],
  [/auth session missing|session.*expired|jwt expired|invalid jwt/i, "Sesi Anda berakhir. Silakan masuk lagi."],
];

export function isNetworkError(error) {
  const msg = String(error?.message || error || "");
  return error?.name === "TypeError" || /failed to fetch|networkerror|load failed|network request failed|fetch failed/i.test(msg);
}

export function toUserMessage(error, fallback = "Terjadi kesalahan. Silakan coba lagi.") {
  if (!error) return "";
  if (isNetworkError(error)) return "Tidak dapat terhubung ke server. Periksa koneksi internet Anda.";
  const msg = String(error.message || "");
  for (const [re, text] of AUTH_MESSAGES) if (re.test(msg)) return text;
  if (error.code === "42501" || /row-level security/i.test(msg)) return "Akses ditolak oleh server.";
  if (error.code === "PGRST301" || error.status === 401) return "Sesi Anda berakhir. Silakan masuk lagi.";
  if (error.code === "23514") return "Data tidak memenuhi aturan penyimpanan. Periksa kembali isian Anda.";
  return fallback;
}

/** Column missing in the live schema (migration not applied yet). */
export function isMissingColumn(error) {
  return error?.code === "PGRST204" || error?.code === "42703";
}
