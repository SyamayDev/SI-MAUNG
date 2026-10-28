# SI-MAUNG — Sistem Informasi Manajemen Keuangan

Aplikasi pencatat keuangan pribadi berbahasa Indonesia dengan **pencatatan suara** sebagai fitur utama dan **MAUNG**, maskot anak harimau 3D yang memandu dasbor lewat cerita bergulir (scroll story).

> Ucapkan “gajian tiga juta setengah” atau “bayar parkir goceng” → MAUNG membaca nominal, jenis, kategori, dan tanggal → kamu memeriksa → simpan.

- Situs: <https://syamaydev.github.io/SI-MAUNG/> (GitHub Pages) · <https://si-maung.vercel.app/> (Vercel)
- Repo: <https://github.com/SyamayDev/SI-MAUNG>

## Fitur

| Fitur | Keterangan |
| --- | --- |
| **Catat dengan suara** | Web Speech API (`id-ID`). Transkrip dibaca *parser di perangkat* (lihat [Parser nominal](#parser-nominal-bahasa-indonesia)) menjadi draf transaksi yang wajib ditinjau sebelum disimpan. Nominal yang bisa dibaca dua cara tidak pernah ditebak: pengguna memilih (“Rp2.500.000 atau Rp2.000.500?”). |
| **Ketik / isi manual** | Browser tanpa pengenalan suara (mis. Firefox) tetap bisa mengetik kalimat yang sama atau mengisi formulir. Suara, ketikan, asisten, dan cadangan AI memakai **parser yang sama**. |
| **Beranda (scroll story)** | Enam babak dengan data nyata: saldo & tombol catat → suara → arus bulan ini → pola kategori + wawasan → tujuan tabungan → aksi cepat. Scene 3D bereaksi pada angka yang sama. |
| **Riwayat** | Cari, saring (jenis, kategori, periode, rentang tanggal), urutkan, kelompok per tanggal, ubah, hapus (dengan konfirmasi). Saringan tersimpan di URL. |
| **Analitik** | 3/6/12 bulan: total, grafik bulanan (bulan kosong tetap 0), rincian kategori + tabel ringkas, wawasan yang menyebut dasar perhitungannya. |
| **Tabungan** | Buat/ubah/hapus tujuan, setor & tarik, kebutuhan per bulan menuju tenggat. |
| **Asisten** | Mencatat dari kalimat dan menjawab pertanyaan tentang catatanmu sendiri — total per periode (hari ini, kemarin, minggu ini/lalu, bulan ini/lalu, nama bulan, “7 hari terakhir”, tahun ini), per kategori/kata (“pengeluaran makan minggu ini”, “habis berapa buat kopi”), saldo, transaksi terakhir, transaksi terbesar, rata-rata per hari, berapa kali, perbandingan dengan bulan lalu, progres tabungan. Paham sapaan dan akhiran (“halo, berapa pengeluaran**ku** bulan ini”). Semua dihitung dari data, tanpa model AI; jujur bila pertanyaan di luar itu. |
| **Akun** | Daftar (dengan/tanpa konfirmasi email), masuk, lupa & atur ulang kata sandi, onboarding, ubah nama & kata sandi. |
| **Pengaturan** | Hanya kontrol yang berfungsi: nama tampilan, kata sandi, tema warna, simpan-otomatis suara (bawaan mati), scene 3D otomatis/mati. |
| **Tema terang / gelap** | Awalnya mengikuti tema perangkat; tombol tema di landing, halaman masuk/daftar, onboarding, sidebar & top bar; Pengaturan punya Terang/Gelap dan *Ikuti perangkat lagi*. Diterapkan sebelum paint pertama (tanpa kedip). |

## Stack

React 19 · Vite 8 · React Router 7 · Supabase (Auth + Postgres + RLS, opsional Edge Function) · three.js (scene 3D, dimuat progresif) · Recharts · lucide-react · Fraunces & Manrope (self-hosted via Fontsource).

## Menjalankan

**Panduan langkah demi langkah (Supabase, lokal, Vercel, GitHub Pages, pratinjau link): [docs/SETUP.md](docs/SETUP.md).**

Prasyarat: Node.js 20+ (diuji dengan Node 22) dan npm.

```bash
npm install
cp .env.example .env.local   # isi VITE_SUPABASE_URL & VITE_SUPABASE_PUBLISHABLE_KEY
npm run dev                   # http://localhost:5173
```

| Perintah | Fungsi |
| --- | --- |
| `npm run dev` | Server pengembangan (base `/`). |
| `npm run build` | Build produksi ke `dist/` (base `/` di Vercel, `/SI-MAUNG/` di tempat lain) + `404.html`, `robots.txt`, `sitemap.xml`. |
| `npm run build:ghpages` | Build khusus GitHub Pages (mode `ghpages`: base `/SI-MAUNG/` selalu, apa pun isi `.env.local`). |
| `npm run preview` | Menyajikan build di `http://localhost:4173/SI-MAUNG/`. |
| `npm run lint` | ESLint. |
| `npm test` | Unit test (Node test runner, 54 test): parser nominal Indonesia (tabel regresi wajib + slang, pecahan, ambiguitas, koreksi, kalkulasi), tanggal, kategori, refund, validasi, ringkasan/wawasan, jawaban asisten. |
| `npm run deploy` | `build:ghpages` lalu publikasikan `dist/` ke branch `gh-pages` di `origin` (lihat *Deployment*). |

### Variabel lingkungan

| Nama | Wajib | Keterangan |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | ya | URL project Supabase. Publik. |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | ya | Publishable/anon key. Publik — keamanan data dijaga RLS, bukan kerahasiaan key ini. |
| `VITE_ENABLE_AI_PARSER` | tidak | `true` untuk memakai Edge Function `parse-transaction` sebagai cadangan. Bukan rahasia. |
| `VITE_BASE_PATH` | tidak | Base path build. Biarkan kosong (GitHub Pages → `/SI-MAUNG/`, Vercel → `/` otomatis). |
| `VITE_SITE_URL` | tidak | Alamat publik untuk canonical/pratinjau link/sitemap. Biarkan kosong. |

**Jangan pernah** menaruh `service_role` key atau kunci penyedia AI di variabel `VITE_*` — semuanya ikut ke bundle browser. Kunci AI hanya disimpan sebagai *secret* Edge Function (`OPENAI_API_KEY`). `VITE_OPENAI_KEY` lama **tidak dipakai lagi**.

## Parser nominal Bahasa Indonesia

Satu modul untuk semua jalur input (suara, ketikan, asisten, pemeriksaan hasil AI):

- [`src/lib/finance/moneyLexicon.js`](src/lib/finance/moneyLexicon.js) — kamus yang bisa diatur: angka, satuan, pecahan, slang, alias tidak pasti, kata kalkulasi/koreksi/perkiraan, perbaikan hasil speech-to-text.
- [`src/lib/finance/indonesianMoneyParser.js`](src/lib/finance/indonesianMoneyParser.js) — `parseMoney()` (dan `reconcileAIAmount()` untuk hasil AI).
- [`src/lib/finance/parseTransaction.js`](src/lib/finance/parseTransaction.js) — kalimat → draf transaksi (jenis, nominal, keterangan, kategori, tanggal, pihak/tempat, catatan keraguan).

**Akar bug “dua juta setengah” = Rp2.000.000:** parser lama membaca “dua juta” lalu hanya *menandai* “setengah” di belakangnya tanpa menambahkan setengah juta. Sekarang pecahan setelah satuan selalu milik satuan itu, dan seluruh hitungan memakai bilangan bulat tepat (BigInt fixed-point, bukan floating point).

| Ucapan | Hasil |
| --- | --- |
| dua juta setengah · dua setengah juta · dua koma lima juta · dua juta lima ratus ribu | Rp2.500.000 |
| satu juta setengah · satu setengah juta | Rp1.500.000 |
| setengah juta · seperempat juta · tiga perempat juta · dua juta seperempat | Rp500.000 · Rp250.000 · Rp750.000 · Rp2.250.000 |
| dua setengah ribu · dua puluh lima ribu lima ratus | Rp2.500 · Rp25.500 |
| satu juta dua ratus lima puluh ribu · tiga juta tujuh ratus lima puluh ribu | Rp1.250.000 · Rp3.750.000 |
| gopek · nopek · seceng/ceceng · noceng · goceng · ceban · noban · goban | Rp500 · 200 · 1.000 · 2.000 · 5.000 · 10.000 · 20.000 · 50.000 |
| cepek ceng · gopek ceng · cetiao · gotiao · cepek tiao | Rp100.000 · 500.000 · 1.000.000 · 5.000.000 · 100.000.000 |
| limpul ribu · seratus limpul ribu · dua ceban · 3 goceng | Rp50.000 · 150.000 · 20.000 · 15.000 |
| seket ewu · rong atus ewu · sarebu (Jawa/Sunda) | Rp50.000 · 200.000 · 1.000 |
| Rp25.000 · 25rb · 1,5jt · 100k · 2jt500rb · Rp 2 500 000 · 1/2 juta · duapuluhlima ribu | dibaca sesuai angka |
| lima ratus ribu ditambah dua ratus ribu · 500rb + 200rb · setengah dari dua juta · 3 x 25rb | kalkulasi eksplisit (ditandai “Dihitung: …”) |
| 20 ribu eh salah 25 ribu · bukan 20 ribu tapi 25 ribu · ralat 30 ribu | nominal terakhir dipakai (ditandai) |
| sekitar 50 ribu · 50an ribu · sejuta lebih · dua jutaan | dipakai tetapi ditandai **perkiraan** |

**Tidak pernah ditebak — pengguna memilih atau mengetik nominal (form tidak bisa disimpan sebelum itu):**

| Ucapan | Pilihan yang ditawarkan |
| --- | --- |
| dua juta lima ratus · transfer masuk satu juta lima ratus | Rp2.500.000 / Rp2.000.500 · Rp1.500.000 / Rp1.000.500 |
| sejuta dua · dua ribu lima | Rp1.200.000 / Rp1.000.002 · Rp2.500 / Rp2.005 |
| catat dua setengah (tanpa satuan) | Rp2.500 / Rp2.500.000 |
| cepek · gocap · jigo (arti beda per daerah) | Rp100 / Rp100.000 · Rp50 / Rp50.000 · Rp25 / Rp25.000 |
| limpul (tanpa “ribu”) | Rp50.000 / Rp50 |
| beli kopi 25 (angka tanpa satuan) | Rp25.000 / Rp25 |
| kopi 25rb dan roti 15rb (dua nominal) | total Rp40.000 / Rp25.000 / Rp15.000 |
| beli 3 kopi masing-masing 20 ribu | total Rp60.000 / satuan Rp20.000 |

Aturan lain: jumlah/waktu bukan uang (“2 jam”, “setengah kilo”, “tahun 2026”, “3 porsi”); “refund” dicatat sebagai pemasukan tetapi arahnya diminta dikonfirmasi (“refund ke pelanggan” = pengeluaran, “dapat refund” = pemasukan); kata “minus” → pengeluaran dengan nominal positif + catatan; nominal akhir selalu bilangan bulat aman (*safe integer*) > 0, divalidasi lagi sebelum ke Supabase. Draf yang punya keraguan apa pun tidak pernah disimpan otomatis, juga saat *simpan-otomatis suara* aktif.

**Menambah istilah:** taruh kata di tabel yang tepat di `moneyLexicon.js` — `CANONICAL_SLANG` bila artinya pasti, `UNCERTAIN_ALIASES` (dengan daftar `choices`) bila artinya bergantung daerah/konteks — lalu tambahkan test di `src/lib/finance/money.test.js`. Sumber slang: istilah Hokkien yang tercatat di KBBI/detik.com/GNFI (gopek, goceng, ceban, goban, cepek ceng, cetiao, gotiao, …). “Limpul” tidak ditemukan di sumber tertulis; diperlakukan sebagai singkatan “lima puluh” dan selalu dikonfirmasi bila tanpa satuan.

## Supabase

Untuk project baru: jalankan **[`supabase/setup.sql`](supabase/setup.sql)** di SQL Editor (satu file, aman diulang, menampilkan hasil cek di akhir). Skema, migration, RLS, uji keamanan, dan Edge Function dijelaskan di **[docs/SUPABASE.md](docs/SUPABASE.md)**. Ringkasnya:

- `supabase/migrations/20261020000000_simaung_core.sql` — idempoten dan non-destruktif: tabel `profiles`, `transactions`, `savings_goals`, kolom opsional (`notes`, `source`), aturan data `NOT VALID` (hanya baris baru), indeks, trigger profil untuk pengguna baru, RLS + policy `simaung_*` berbasis `auth.uid()`.
- `supabase/tests/rls_check.sql` — uji RLS dengan dua pengguna sintetis (di-*rollback*).
- `supabase/scripts/audit_policies.sql` — audit read-only untuk menemukan policy lama yang terlalu longgar.
- `supabase/functions/parse-transaction` — cadangan AI opsional; kunci hanya di server; nominalnya selalu dicek ulang parser deterministik di browser.

**Auth → URL Configuration (wajib, belum benar di project saat ini):** Site URL `https://syamaydev.github.io/SI-MAUNG/`; Redirect URLs `https://syamaydev.github.io/SI-MAUNG/**`, `https://si-maung.vercel.app/**`, `https://si-maung-*-syamaydevs-projects.vercel.app/**`, `http://localhost:5173/**`, `http://localhost:4173/**`. Project saat ini masih ber-Site URL `http://localhost:3000` dengan daftar redirect kosong, sehingga tautan konfirmasi daftar & reset kata sandi mengarah ke localhost (lihat [docs/SUPABASE.md](docs/SUPABASE.md#auth)).

## Suara: cara menguji

1. Buka di Chrome/Edge (desktop atau Android) atau Safari 14.1+. Halaman harus `https://` atau `localhost` agar mikrofon diizinkan.
2. Tekan **Catat dengan suara** (di ponsel: tombol mikrofon di tengah bawah), izinkan mikrofon, ucapkan mis. “bayar listrik seratus dua puluh lima ribu” atau “gajian dua juta setengah”.
3. Periksa hasil, ubah bila perlu (bila nominal ambigu, pilih salah satu tombol nominal), **Simpan**. Transaksi hanya tersimpan setelah Supabase mengonfirmasi; tombol simpan terkunci selama proses sehingga tidak ada insert ganda.
4. Firefox/browser tanpa Web Speech API: kartu “Browser ini belum mendukung…” muncul; ketik kalimat yang sama.
5. Tanpa login, kotak demo di landing memakai parser yang sama (tidak ada yang dikirim/disimpan).

Privasi: SI-MAUNG tidak merekam/menyimpan audio. Di Chrome, suara diubah menjadi teks oleh layanan pengenalan suara browser (Google); teksnya dibaca parser di perangkat. Hanya bila `VITE_ENABLE_AI_PARSER=true`, kalimat yang tidak terbaca dikirim ke Edge Function.

## Pengalaman 3D

MAUNG dibangun **prosedural** di kode (tanpa file model/GLB), mengikuti maskot `login-mascot.webp`: kepala besar, telinga bulat, jambang pipi, bulu oranye keemasan dengan loreng hitam yang dilukis di material, wajah krem, mata besar, setelan navy, kemeja putih, dasi kuning, ekor bercincin. File utama: `src/three/maung/` (`headCoords.js`, `textures.js`, `createMaung.js`, `animateMaung.js`) dan `src/three/world/buildWorld.js` (koreografi, koin instanced, kamera, tema). Detail di **[docs/3D-EXPERIENCE.md](docs/3D-EXPERIENCE.md)**.

- **Satu scene persisten** (`src/components/scene/SceneHost.jsx`): mode *story* di landing & beranda, mode *portrait* (MAUNG dibingkai di panel, pose per halaman) di masuk/daftar/lupa sandi/atur ulang/onboarding, dan berhenti di halaman lain.
- **Konten dulu, MAUNG 3D menyusul:** layar pembuka statis di `index.html` (tagline besar, tanpa jaringan) → teks, formulir, dan tombol tampil begitu sesi auth dicek → MAUNG vektor ringan menempati posisinya → MAUNG 3D dimuat pada interaksi pertama (scroll/sentuh/pointer/tombol) atau ±2,5 dtk setelah halaman selesai dimuat, lalu memudar masuk. Pemeriksaan WebGL2 (membuat konteks GPU) juga baru dijalankan saat itu. Progres 3D nyata (byte unduhan, model, shader) tampil kecil di pojok panggung.
- `prefers-reduced-motion`: MAUNG 3D tetap tampil dalam pose tenang tanpa animasi. Fallback 2D bila 3D tidak mungkin (tanpa WebGL, renderer software, error/context lost, gagal unduh, macet > 25 dtk) atau dimatikan di Pengaturan. Uji paksa: `?3d=on` / `?3d=off`.
- Scroll tidak pernah dibajak: satu listener pasif + satu `requestAnimationFrame`, loop berhenti saat scene tak terlihat atau tab tersembunyi, DPR dibatasi dan diturunkan otomatis bila FPS turun.
- Pratinjau model khusus pengembangan: `npm run dev` lalu buka `/tools/maung-preview.html?pose=cheer&expr=happy&zoom=head` (tidak ikut build).

## Responsif

Mobile-first: di bawah 1024 px sidebar menjadi top bar + bottom navigation dengan tombol mikrofon di tengah; dialog menjadi bottom sheet dengan scroll internal dan safe-area iOS; di halaman cerita tiap babak dipin — MAUNG di atas, teks di zonanya sendiri di bawah. Di asisten, formulir transaksi memakai lebar penuh di ponsel (≤ 480 px) dan label tidak pernah terpotong di tengah kata. Diperiksa tanpa horizontal overflow pada 320, 360, 390, 430, 768, 1024, 1280, 1440 px (lihat *Status verifikasi*).

## Deployment

### GitHub Pages

`npm run build` menghasilkan aset dengan base `/SI-MAUNG/` dan menyalin `index.html` menjadi `404.html`, sehingga rute langsung seperti `/SI-MAUNG/transactions` tetap terbuka. `BrowserRouter` memakai `basename` dari `import.meta.env.BASE_URL`.

`npm run deploy` = `vite build --mode ghpages` → `gh-pages-clean` → `gh-pages -d dist --dotfiles --nojekyll --remove "{**/*,.*}"`, yang mendorong isi `dist/` ke branch **`gh-pages`** di `origin` (`SyamayDev/SI-MAUNG`). Sumber Pages: *Settings → Pages → Deploy from a branch → `gh-pages` / `(root)`*. Variabel `VITE_*` harus ada saat build (di `.env.local`).

### Vercel

Project `si-maung` dibangun dari branch `main` (setiap push ke `main` = deploy baru). `vite.config.js` mendeteksi builder Vercel (`VERCEL=1`) dan memakai base `/`; `vercel.json` berisi rewrite SPA, cache panjang untuk `assets/`, dan **mematikan build otomatis branch `gh-pages`** (branch itu hasil build GitHub Pages; dulu setiap deploy Pages memicu build Vercel yang gagal).

**Penyebab daftar/masuk gagal di Vercel:** project Vercel tidak punya environment variable sama sekali, sehingga build-nya tidak berisi URL & key Supabase dan menampilkan “Konfigurasi Supabase belum diisi”. Pada 28 Okt 2026 `VITE_SUPABASE_URL` dan `VITE_SUPABASE_PUBLISHABLE_KEY` (dua nilai publik) sudah ditambahkan untuk Production, Preview, dan Development. Env dibaca saat build, jadi **perlu satu deploy baru** (push ke `main` atau *Redeploy* di dashboard) agar si-maung.vercel.app memakainya. Build juga membaca nama bawaan integrasi Vercel ↔ Supabase untuk dua nilai publik itu saja; service-role key tidak pernah dibaca.

## Struktur

```
src/
  lib/finance/      logika domain murni + test (parser nominal & kamus slang, transaksi, tanggal, kategori, validasi, ringkasan, jawaban asisten)
  lib/              klien Supabase (dimuat on-demand), store keuangan & scene, scroll story, preferensi, tema, boot loader, pemuat 3D, whenEngaged, deteksi perangkat
  services/         akses tabel Supabase & Edge Function
  context/          Auth, Finance (useSyncExternalStore), Toast, Modal (lembar pencatatan)
  components/       ui/, capture/ (suara-first), transactions/, story/, layouts/, auth/, scene/ (SceneHost, LoadingScreen, bingkai portrait)
  three/            Stage (host three.js), maung/ (model, tekstur, animasi), world/ (babak, kamera, tema)
  pages/            Landing, Dashboard, Transactions, Analytics, SavingsGoals, AIChatPage, Settings, auth & onboarding
  styles/           tokens (terang + gelap), base, components, layout, capture, story, scene, pages
tools/              maung-preview (pratinjau model, khusus pengembangan)
supabase/           migrations, tests, scripts, functions
```

## SEO, pratinjau link, PWA & performa

- `<head>`: judul & deskripsi, canonical, Open Graph + Twitter card (`public/og-image.jpg`, 1200×630), JSON-LD `WebApplication`. Alamat absolut diisi saat build (plugin `siteMeta`). Judul tab, `robots` dan canonical diperbarui per rute (`components/layouts/RouteMeta.jsx`): `/`, `/login`, `/register`, `/forgot-password` boleh diindeks; halaman privat, `/reset-password` (berisi token sekali pakai) dan halaman 404 sengaja `noindex`. `robots.txt` & `sitemap.xml` dibuat saat build.
- PWA: `public/manifest.webmanifest` + ikon 192/512 (maskable) & apple-touch-icon. Tombol layar penuh muncul bila browser mendukung.
- Strategi performa (28 Okt 2026): paint pertama tanpa jaringan → skrip diminta setelah paint (`paintBeforeScripts`) → render React sebagai *transition* → SDK Supabase dan three.js dimuat terpisah/progresif → pemeriksaan WebGL ditunda → logo 192 px (12 KB, sebelumnya 72 KB untuk tampilan 40 px).
- **Lighthouse 12.8.2** (28 Okt 2026, build produksi lokal `vite preview`, Chrome 156 headless; mobile = simulasi Moto G Power, 4G lambat, CPU 4×):

  | Halaman | Mobile (Perf / A11y / BP / SEO) | Desktop |
  | --- | --- | --- |
  | `/` | 100 / 100 / 100 / 100 | 100 / 100 / 100 / 100 |
  | `/login` | 100 / 100 / 100 / 100 | 100 / 100 / 100 / 100 |
  | `/register` | 100 / 100 / 100 / 100 | 100 / 100 / 100 / 100 |
  | `/forgot-password` | 100 / 100 / 100 / 100 | 100 / 100 / 100 / 100 |
  | URL tak dikenal (404) | 100 / 100 / 100 / 66 | 100 / 100 / 100 / 66 |

  Mobile: FCP 0,6 dtk, LCP 0,9 dtk, TBT 0–60 ms, CLS ≤ 0,003. SEO 66 di halaman 404 karena halaman itu sengaja `noindex` (halaman “tidak ditemukan” tidak boleh diindeks). Halaman yang butuh login (beranda, riwayat, analitik, tabungan, asisten, pengaturan) tidak bisa diaudit Lighthouse tanpa akun. Sebelum perubahan ini mobile = 73–81.

## Status verifikasi (28 Okt 2026)

Benar-benar dijalankan:
- `npm test` ✔ 54/54 · `npm run lint` ✔ 0 masalah · `npm run build` ✔.
- Chrome sungguhan (puppeteer-core + Chrome terpasang, build produksi): landing di 390 & 1440 px tanpa error console; MAUNG vektor tampil lebih dulu, MAUNG 3D hidup setelah interaksi dan juga tanpa interaksi (±2,5 dtk); demo parser di landing: “pengeluaran dua juta setengah buat laptop” → Rp 2.500.000, “bayar parkir goceng” → Rp 5.000, “catat dua setengah” → “Rp 2.500 atau Rp 2.500.000?”.
- Tanpa horizontal overflow di `/`, `/login`, `/register`, `/forgot-password` pada 320, 360, 390, 430, 768, 1024, 1280, 1440 px.
- Halaman Asisten asli (`AIChatPage`) dijalankan di harness sementara dengan auth/keuangan tiruan dan data sintetis: “halo berapa pengeluaranku bulan ini” → dijawab; daftar transaksi terakhir tampil; “dua juta lima ratus buat laptop” → tombol Rp 2.500.000 / Rp 2.000.500, memilih lalu simpan → nominal tersimpan tepat 2500000 (kategori Belanja). Kontras gelembung pesan pengguna: 16,9:1 (terang), 15,6:1 (gelap) — sebelumnya teks navy di atas navy. Tanpa overflow di 320/360/390 px.
- Supabase project `SI-MAUNG`: pemeriksaan skema & RLS read-only (tanpa membaca baris data) — cocok dengan frontend.
- Vercel: env vars publik Supabase ditambahkan ke project `si-maung`.

Belum diverifikasi / belum dilakukan:
- **Deploy**: perubahan kode ini belum di-commit/push dan belum di-deploy ke GitHub Pages maupun Vercel. Redeploy Vercel dari dashboard/MCP diblokir izin; deploy berikutnya dari `main` akan memakai env vars baru.
- **Supabase Auth URL Configuration** belum diubah (masih `localhost:3000`) — perubahan ke project live diblokir izin; langkahnya ada di [docs/SUPABASE.md](docs/SUPABASE.md#auth).
- Alur login/daftar end-to-end di situs live dan halaman yang butuh login di build produksi (tidak ada kredensial uji; konfirmasi email aktif).
- Uji integrasi INSERT ke Supabase dengan akun sintetis (butuh akun uji yang terkonfirmasi).
- Edge Function `parse-transaction` belum di-deploy/diuji (butuh secret).
- Pengenalan suara nyata di perangkat fisik; Safari/iOS dan Firefox belum diuji langsung (hanya Chrome).

## Masalah terbuka

- Kunci OpenAI yang dulu memakai `VITE_OPENAI_KEY` ikut ter-*bundle* ke JavaScript publik pada build lama. **Rotasi/cabut kunci itu** di dashboard penyedia (kode sekarang tidak membacanya).
- Layanan email bawaan Supabase hanya mengirim ke anggota tim project; untuk pengguna umum pasang SMTP sendiri atau matikan konfirmasi email.
- Folder `retro-future/` (demo template Colorlib) dan `src/components/auth/RetroFutureAuth.*` tidak dipakai aplikasi; lisensi template belum diperiksa — pertimbangkan untuk dihapus.
- Arti slang bisa berbeda per daerah; yang tidak pasti sengaja selalu ditanyakan. Ucapan yang tidak dikenal parser tetap bisa dikoreksi di formulir.
- Di Chrome/Windows (ANGLE D3D11) konsol bisa menampilkan satu *warning* kompilasi shader `X4122` dari three.js — catatan compiler driver, bukan error aplikasi.
