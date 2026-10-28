# Menjalankan SI-MAUNG dari nol

Panduan ini untuk pemilik project. Ikuti urutannya; setiap langkah menyebut cara memeriksa bahwa langkah itu berhasil.

## 1. Supabase (database + login)

1. Buka <https://supabase.com/dashboard> → **New project**. Nama bebas (mis. `SI-MAUNG`), region terdekat (Singapore/Tokyo), simpan password database di tempat aman.
2. Setelah project siap: **SQL Editor → New query** → tempel **seluruh isi** [`supabase/setup.sql`](../supabase/setup.sql) → **Run**.
   - Hasil yang benar (tabel di bagian bawah): 3 baris `profiles`, `savings_goals`, `transactions`, kolom `rls_aktif = true`, `jumlah_policy` 3 / 4 / 4, `trigger_profil = true`.
   - File ini aman dijalankan berkali-kali dan tidak menghapus data.
3. **Authentication → URL Configuration**
   - **Site URL**: alamat utama aplikasi, mis. `https://syamaydev.github.io/SI-MAUNG/` (atau `https://si-maung.vercel.app/`). **Bukan** `http://localhost:3000` (nilai bawaan project baru).
   - **Redirect URLs** (tambahkan semua yang dipakai):
     - `https://si-maung.vercel.app/**`
     - `https://syamaydev.github.io/SI-MAUNG/**`
     - `http://localhost:5173/**`
     - `https://si-maung-*-syamaydevs-projects.vercel.app/**` (deploy preview Vercel)
     - `http://localhost:4173/**`
   - Tanpa ini, tautan konfirmasi email dan reset kata sandi mengarah ke alamat yang salah.
4. **Authentication → Emails**
   - Layanan email bawaan Supabase hanya mengirim ke alamat **anggota tim project** dan dibatasi beberapa email per jam. Untuk pengguna umum, isi **SMTP Settings** (mis. Resend, Brevo, Gmail SMTP), **atau** matikan *Confirm email* di **Authentication → Sign In / Providers → Email** bila konfirmasi tidak diperlukan.
5. **Project Settings → API Keys**: salin **Project URL** dan **Publishable key** (atau *anon key* lama). Keduanya publik. **Jangan** pernah memakai `service_role` / *secret key* di aplikasi ini.

## 2. Menjalankan di komputer

```bash
npm install
cp .env.example .env.local
```

Isi `.env.local`:

```
VITE_SUPABASE_URL=https://<ref-project>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable key>
```

`VITE_BASE_PATH` tidak perlu diisi (GitHub Pages dan Vercel sudah ditangani otomatis). Lalu:

```bash
npm run dev        # http://localhost:5173
```

Cek: buka `/register`, daftar dengan email Anda sendiri → muncul layar "Cek email". Setelah konfirmasi, masuk → onboarding → beranda.

## 3. Vercel (si-maung.vercel.app)

1. Project Vercel terhubung ke repo GitHub `SyamayDev/SI-MAUNG`, branch `main`. Setiap `git push` ke `main` = deploy baru.
2. **Settings → Environment Variables** (Production, Preview, Development):
   - `VITE_SUPABASE_URL` = Project URL
   - `VITE_SUPABASE_PUBLISHABLE_KEY` = Publishable key
   - Jangan isi `VITE_BASE_PATH` (Vercel otomatis memakai `/`).
   - Setelah mengubah env vars, lakukan **Redeploy** (env dibaca saat build).
   - Status 28 Okt 2026: kedua variabel sudah ditambahkan ke project `si-maung` (Production, Preview, Development). Deploy production yang aktif dibangun **sebelum** itu, sehingga masih menampilkan “Konfigurasi Supabase belum diisi” sampai ada deploy baru (push ke `main` atau *Redeploy* di dashboard).
3. Build: `npm run build`, output `dist` (sudah diatur di [`vercel.json`](../vercel.json), termasuk rewrite SPA sehingga refresh di `/login` atau `/transactions` tidak 404). `vercel.json` juga mematikan build otomatis untuk branch `gh-pages` (isinya hasil build GitHub Pages, bukan source — dulu selalu gagal).
4. Cek: buka `https://si-maung.vercel.app/` → loader → landing; buka langsung `https://si-maung.vercel.app/login` → halaman masuk.

## 4. GitHub Pages (syamaydev.github.io/SI-MAUNG)

1. Sekali saja: repo → **Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch `gh-pages` / `(root)` → Save**. (Jangan `main`: branch itu berisi kode sumber, bukan hasil build.)
2. Setiap ingin memperbarui: `npm run deploy`. Perintah ini membangun dengan mode `ghpages` (base `/SI-MAUNG/`, lihat [`.env.ghpages`](../.env.ghpages)) lalu mendorong `dist/` ke branch `gh-pages`.

## 5. Pratinjau link (WhatsApp, Telegram, dll.)

- Gambar `public/og-image.jpg` (1200×630) + judul & deskripsi ada di `<head>`; alamat absolutnya diisi saat build (Vercel: domain production otomatis; GitHub Pages: `https://syamaydev.github.io/SI-MAUNG/`; bisa dipaksa dengan `VITE_SITE_URL`).
- WhatsApp menyimpan pratinjau lama untuk link yang sudah pernah dikirim. Untuk melihat yang baru, kirim link dengan tambahan seperti `https://si-maung.vercel.app/?v=2`, atau tunggu cache-nya kedaluwarsa. Pemeriksa: <https://developers.facebook.com/tools/debug/> (tekan *Scrape Again*).

## 6. Layar penuh & pasang sebagai aplikasi

- Tombol **layar penuh** (ikon kotak) ada di header landing, halaman masuk/daftar, onboarding, sidebar, dan top bar HP. Di Safari iPhone tombol ini tidak muncul karena browser tersebut tidak mengizinkannya.
- Di HP: menu browser → **Tambahkan ke Layar Utama / Install app**. SI-MAUNG lalu terbuka tanpa bilah alamat (manifest `public/manifest.webmanifest`).

## 7. Opsional: parser AI di server

Aplikasi sudah membaca kalimat transaksi di perangkat tanpa AI. Edge Function `parse-transaction` (cadangan AI) dijelaskan di [docs/SUPABASE.md](SUPABASE.md); kuncinya hanya disimpan sebagai *secret* Supabase, tidak pernah di `VITE_*`.
