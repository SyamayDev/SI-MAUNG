# SI-MAUNG — Sistem Informasi Manajemen Keuangan

Aplikasi pencatat keuangan pribadi berbahasa Indonesia dengan **pencatatan suara** sebagai fitur utama dan **MAUNG**, maskot anak harimau 3D yang memandu dasbor lewat cerita bergulir (scroll story).

> Ucapkan “kemarin beli buku 45 ribu” → MAUNG membaca nominal, jenis, kategori, dan tanggal → kamu memeriksa → simpan.

## Fitur

| Fitur | Keterangan |
| --- | --- |
| **Catat dengan suara** | Web Speech API (`id-ID`). Transkrip dibaca *parser di perangkat* menjadi draf transaksi yang wajib ditinjau sebelum disimpan. Bagian yang meragukan (nominal tanpa satuan, jenis tidak disebut, tanggal perkiraan) ditandai. |
| **Ketik / isi manual** | Browser tanpa pengenalan suara (mis. Firefox) tetap bisa mengetik kalimat yang sama atau mengisi formulir. |
| **Beranda (scroll story)** | Enam babak dengan data nyata: saldo & tombol catat → suara → arus bulan ini → pola kategori + wawasan → tujuan tabungan → aksi cepat. Scene 3D bereaksi pada angka yang sama. |
| **Riwayat** | Cari, saring (jenis, kategori, periode, rentang tanggal), urutkan, kelompok per tanggal, ubah, hapus (dengan konfirmasi). Saringan tersimpan di URL. |
| **Analitik** | 3/6/12 bulan: total, grafik bulanan (bulan kosong tetap 0), rincian kategori + tabel ringkas, wawasan yang menyebut dasar perhitungannya. |
| **Tabungan** | Buat/ubah/hapus tujuan, setor & tarik, kebutuhan per bulan menuju tenggat. |
| **Asisten** | Mencatat dari kalimat dan menjawab pertanyaan ringkas tentang catatanmu (“berapa pengeluaran bulan ini?”) — dihitung dari data, tanpa model AI. Jujur bila tidak mengerti. |
| **Akun** | Daftar (dengan/ tanpa konfirmasi email), masuk, lupa & atur ulang kata sandi, onboarding, ubah nama & kata sandi. |
| **Pengaturan** | Hanya kontrol yang berfungsi: nama tampilan, kata sandi, tema warna, simpan-otomatis suara (bawaan mati), scene 3D otomatis/mati. |
| **Tema terang / gelap** | Awalnya mengikuti tema perangkat. Satu tombol (bulan = gelap, matahari = terang) di landing, halaman masuk/daftar, onboarding, sidebar & top bar aplikasi menukar tema; Pengaturan punya Terang/Gelap dan *Ikuti perangkat lagi*. Pilihan disimpan di perangkat dan diterapkan sebelum paint pertama (tanpa kedip). |

## Stack

React 19 · Vite 8 · React Router 7 · Supabase (Auth + Postgres + RLS, opsional Edge Function) · three.js (scene 3D, di-*lazy load*) · Recharts · lucide-react · Fraunces & Manrope (self-hosted via Fontsource).

## Menjalankan

Prasyarat: Node.js 20+ (diuji dengan Node 22) dan npm.

```bash
npm install
cp .env.example .env.local   # isi VITE_SUPABASE_URL & VITE_SUPABASE_PUBLISHABLE_KEY
npm run dev                   # http://localhost:5173
```

| Perintah | Fungsi |
| --- | --- |
| `npm run dev` | Server pengembangan (base `/`). |
| `npm run build` | Build produksi ke `dist/` dengan base `/SI-MAUNG/` + `404.html` (fallback SPA GitHub Pages). |
| `npm run preview` | Menyajikan build di `http://localhost:4173/SI-MAUNG/`. |
| `npm run lint` | ESLint. |
| `npm test` | Unit test (Node test runner) untuk parser nominal/tanggal/kategori, validasi, ringkasan, wawasan, dan jawaban asisten. |
| `npm run deploy` | Build lalu publikasikan `dist/` ke branch `gh-pages` di `origin` (lihat *Deployment*). |

### Variabel lingkungan

| Nama | Wajib | Keterangan |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | ya | URL project Supabase. Publik. |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | ya | Publishable/anon key. Publik — keamanan data dijaga RLS, bukan kerahasiaan key ini. |
| `VITE_ENABLE_AI_PARSER` | tidak | `true` untuk memakai Edge Function `parse-transaction` sebagai cadangan. Bukan rahasia. |
| `VITE_BASE_PATH` | tidak | Base path build (bawaan `/SI-MAUNG/`; pakai `/` untuk domain root). |

**Jangan pernah** menaruh `service_role` key atau kunci penyedia AI di variabel `VITE_*` — semuanya ikut ke bundle browser. Kunci AI hanya disimpan sebagai *secret* Edge Function (`OPENAI_API_KEY`). `VITE_OPENAI_KEY` lama **tidak dipakai lagi**.

## Supabase

Skema, migration, RLS, uji keamanan, dan Edge Function dijelaskan di **[docs/SUPABASE.md](docs/SUPABASE.md)**. Ringkasnya:

- `supabase/migrations/20261020000000_simaung_core.sql` — idempoten dan non-destruktif: tabel `profiles`, `transactions`, `savings_goals`, kolom opsional (`notes`, `source`), aturan data `NOT VALID` (hanya baris baru), indeks, trigger profil untuk pengguna baru, RLS + policy `simaung_*` berbasis `auth.uid()`.
- `supabase/tests/rls_check.sql` — uji RLS dengan dua pengguna sintetis (di-*rollback*).
- `supabase/scripts/audit_policies.sql` — audit read-only untuk menemukan policy lama yang terlalu longgar.
- `supabase/functions/parse-transaction` — cadangan AI opsional; kunci hanya di server.

Atur juga **Auth → URL Configuration**: Site URL `https://syamaydev.github.io/SI-MAUNG/`, dan Redirect URLs `https://syamaydev.github.io/SI-MAUNG/**`, `http://localhost:5173/**`, `http://localhost:4173/SI-MAUNG/**` (dipakai tautan konfirmasi & atur ulang kata sandi).

## Suara: cara menguji

1. Buka di Chrome/Edge (desktop atau Android) atau Safari 14.1+. Halaman harus `https://` atau `localhost` agar mikrofon diizinkan.
2. Tekan **Catat dengan suara** (di ponsel: tombol mikrofon di tengah bawah), izinkan mikrofon, ucapkan mis. “bayar listrik seratus dua puluh lima ribu”.
3. Periksa hasil, ubah bila perlu, **Simpan**. Transaksi hanya tersimpan setelah Supabase mengonfirmasi.
4. Firefox/browser tanpa Web Speech API: kartu “Browser ini belum mendukung…” muncul; ketik kalimat yang sama.

Privasi: SI-MAUNG tidak merekam/menyimpan audio. Di Chrome, suara diubah menjadi teks oleh layanan pengenalan suara browser (Google); teksnya dibaca parser di perangkat. Hanya bila `VITE_ENABLE_AI_PARSER=true`, kalimat yang tidak terbaca dikirim ke Edge Function.

## Pengalaman 3D

MAUNG dibangun **prosedural** di kode (tanpa file model/GLB), mengikuti maskot `login-mascot.webp`: kepala besar, telinga bulat, jambang pipi, bulu oranye keemasan dengan loreng hitam yang dilukis di material, wajah krem, mata besar, setelan navy, kemeja putih, dasi kuning, ekor bercincin. File utama: `src/three/maung/` (`headCoords.js`, `textures.js`, `createMaung.js`, `animateMaung.js`) dan `src/three/world/buildWorld.js` (koreografi, koin instanced, kamera, tema). Detail di **[docs/3D-EXPERIENCE.md](docs/3D-EXPERIENCE.md)**.

- **Satu scene persisten** (`src/components/scene/SceneHost.jsx`) untuk seluruh kunjungan: mode *story* di landing & beranda, mode *portrait* (MAUNG dibingkai di panel kiri, pose per halaman) di masuk/daftar/lupa sandi/atur ulang/onboarding, dan berhenti di halaman lain.
- **Loading berbasis kesiapan nyata**: loader statis di `index.html` → `LoadingScreen` dengan langkah yang ditandai oleh kode yang benar-benar mengerjakannya (auth, unduhan chunk three.js dengan byte nyata, model, pencahayaan, kompilasi shader, frame pertama). Tanpa timer palsu; tombol *Lewati* setelah 5 dtk; tidak pernah menunggu Supabase lebih dari 8 dtk.
- `prefers-reduced-motion`: MAUNG 3D tetap tampil dalam pose tenang tanpa animasi. Fallback 2D hanya bila 3D tidak mungkin (tanpa WebGL, renderer software, error/context lost, gagal unduh) atau dimatikan di Pengaturan. Uji paksa: `?3d=on` / `?3d=off`.
- Scroll tidak pernah dibajak: satu listener pasif + satu `requestAnimationFrame`, loop berhenti saat scene tak terlihat atau tab tersembunyi, DPR dibatasi dan diturunkan otomatis bila FPS turun.
- Pratinjau model khusus pengembangan: `npm run dev` lalu buka `/tools/maung-preview.html?pose=cheer&expr=happy&zoom=head` (tidak ikut build).

## Responsif

Mobile-first: di bawah 1024 px sidebar menjadi top bar + bottom navigation dengan tombol mikrofon di tengah; dialog menjadi bottom sheet dengan scroll internal dan safe-area iOS, dan baris tombol simpan/batal pada formulir panjang tetap terlihat di bawah; di halaman cerita MAUNG berdiri di panggung tetap di bawah top bar dan babak-babak bergulir di bawahnya, sehingga teks tidak pernah menutupinya. Diperiksa tanpa horizontal overflow pada 320, 360, 390, 430, 768, 1024, 1280, 1440 px (lihat *Status verifikasi*).

## Deployment (GitHub Pages)

`npm run build` menghasilkan aset dengan base `/SI-MAUNG/` dan menyalin `index.html` menjadi `404.html`, sehingga rute langsung seperti `/SI-MAUNG/transactions` tetap terbuka. `BrowserRouter` memakai `basename` dari `import.meta.env.BASE_URL`.

`npm run deploy` = `vite build` → `gh-pages-clean` (membuang cache clone lama gh-pages) → `gh-pages -d dist --dotfiles --nojekyll --remove "{**/*,.*}"`, yang mendorong isi `dist/` ke branch **`gh-pages`** di `origin` (`SyamayDev/SI-MAUNG`). Pola `--remove` memastikan file lama — termasuk dotfile — tidak tertinggal di branch publikasi.

**Pengaturan Pages yang wajib (sekali saja):** GitHub → repo `SI-MAUNG` → *Settings* → *Pages* → *Build and deployment* → *Source*: **Deploy from a branch** → Branch: **`gh-pages`**, folder **`/ (root)`** → *Save*. Selama Pages masih menyajikan branch `main`, situs akan memuat `index.html` source (`/src/main.jsx`) yang tidak bisa dijalankan browser → halaman kosong.

Penyebab masalah sebelumnya:
1. **Halaman kosong** — Pages menyajikan source di branch `main`, bukan hasil build.
2. **`fatal: a branch named 'gh-pages' already exists`** — cache clone gh-pages (`node_modules/.cache/gh-pages`) berisi branch lokal `gh-pages` dari percobaan yang gagal. Sekarang dibersihkan otomatis oleh `gh-pages-clean` sebelum setiap deploy.
3. Remote `origin` dulu menunjuk `SyamayDev/moneytalk.git` (dialihkan GitHub ke repo yang sama); kini `https://github.com/SyamayDev/SI-MAUNG.git`.

Variabel `VITE_*` harus ada saat build (di mesin lokal atau secrets CI).

## Struktur

```
src/
  lib/finance/      logika domain murni + test (parser, tanggal, kategori, validasi, ringkasan, jawaban asisten)
  lib/              klien Supabase, store keuangan & scene, scroll story, preferensi, tema, boot loader, pemuat 3D, deteksi perangkat
  services/         akses tabel Supabase & Edge Function
  context/          Auth, Finance (useSyncExternalStore), Toast, Modal (lembar pencatatan)
  components/       ui/, capture/ (suara-first), transactions/, story/, layouts/, auth/, scene/ (SceneHost, LoadingScreen, bingkai portrait)
  three/            Stage (host three.js), maung/ (model, tekstur, animasi), world/ (babak, kamera, tema)
  pages/            Landing, Dashboard, Transactions, Analytics, SavingsGoals, AIChatPage, Settings, auth & onboarding
  styles/           tokens (terang + gelap), base, components, layout, capture, story, scene, pages
tools/              maung-preview (pratinjau model, khusus pengembangan)
supabase/           migrations, tests, scripts, functions
```

## Status verifikasi (20 Okt 2026)

Benar-benar dijalankan:
- `npm run build` ✔, `npm run lint` ✔ (0 masalah), `npm test` ✔ (24 test).
- Uji tampilan otomatis (Chrome headless + GPU) pada 8 lebar layar (320–1440) × 11 halaman × **tema terang & gelap**: tanpa horizontal overflow, tanpa error console. Uji alur end-to-end (38 cek: catat→tinjau→simpan, tanpa insert ganda, edit, hapus, cari, tabungan, asisten, tombol mic mobile, reduced-motion, empty/error state, onboarding) — **dengan backend Supabase tiruan berisi data sintetis**, karena project Supabase asli tidak dapat dijangkau.
- Loader: urutan langkah, byte unduhan nyata (juga dengan jaringan diperlambat), MAUNG 3D sudah siap saat loader hilang (tanpa poster 2D), aplikasi tidak `inert` lagi — di landing, masuk (390 & 1440), beranda, terang & gelap.
- Scene: 6× bolak-balik rute tetap 1 canvas, resize langsung ke 390 px, tombol back, 3D dimatikan → poster, reduced-motion → 3D diam (frame identik) dan bergerak lagi bila preferensi dimatikan.
- Branch `gh-pages` dipublikasikan ke `SyamayDev/SI-MAUNG` dan isinya diuji di server lokal yang meniru GitHub Pages (subpath `/SI-MAUNG/`, `404.html` dengan status 404): root, muat langsung `/login`, `/transactions`, `/analytics`, `/dashboard`, `/savings`, URL tak dikenal — tanpa aset 404, tanpa request ke localhost lain, tema benar.
- Migration + `rls_check.sql` dijalankan di container lokal `supabase/postgres:17.6.1.166` (skema lama berisi baris & database kosong): idempoten, baris lama tidak berubah, semua cek RLS lolos.

Belum diverifikasi:
- **Situs live** `https://syamaydev.github.io/SI-MAUNG/` masih menyajikan source branch `main` sampai sumber Pages diubah ke `gh-pages` (lihat *Deployment*).
- Supabase: project lama sudah tidak ada; aplikasi kini memakai project `supabase-bistre-basket` (migration + uji RLS sudah dijalankan di sana, lihat [docs/SUPABASE.md](docs/SUPABASE.md)). Pendaftaran akun sungguhan belum saya coba (agar tidak membuat akun/email palsu); Site URL & Redirect URLs project baru masih harus diatur di dashboard; email konfirmasi bawaan Supabase hanya terkirim ke anggota tim project.
- Edge Function `parse-transaction` belum di-deploy/diuji (butuh akses project & secret).
- Pengenalan suara nyata di perangkat fisik (headless tidak punya mikrofon); alur teks dengan parser yang sama sudah diuji.
- Safari/iOS dan Firefox belum diuji langsung (hanya Chrome).

## Masalah terbuka

- Kunci OpenAI yang dulu memakai `VITE_OPENAI_KEY` ikut ter-*bundle* ke JavaScript publik pada build lama. **Rotasi/cabut kunci itu** di dashboard penyedia dan hapus barisnya dari `.env.local` (kode sekarang tidak membacanya; build saat ini sudah diperiksa bebas kunci).
- Di Chrome/Windows (ANGLE D3D11) konsol bisa menampilkan satu *warning* kompilasi shader `X4122` dari chunk bawaan three.js. Itu catatan compiler driver, bukan error aplikasi; render tidak terpengaruh.
- Folder `retro-future/` (demo template Colorlib) dan `src/components/auth/RetroFutureAuth.*` tidak dipakai aplikasi; lisensi template belum diperiksa — pertimbangkan untuk dihapus.
- Audio tidak bisa diproses di browser tanpa Web Speech API; tidak ada transkripsi server.
