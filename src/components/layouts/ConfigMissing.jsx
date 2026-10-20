/** Shown instead of a blank page when the Supabase client env vars are missing. */
export default function ConfigMissing() {
  return (
    <div className="page" style={{ maxWidth: 620 }}>
      <div className="panel stack" role="alert">
        <h1 className="panel__title">Konfigurasi Supabase belum diisi</h1>
        <p className="muted">
          SI-MAUNG butuh <code>VITE_SUPABASE_URL</code> dan <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> saat build. Salin <code>.env.example</code> menjadi{" "}
          <code>.env.local</code>, isi nilainya dari dashboard Supabase (Project Settings → API), lalu jalankan ulang.
        </p>
      </div>
    </div>
  );
}
