# MAUNG 3D, loading & scroll story

## Karakter

MAUNG adalah versi 3D dari maskot 2D SI-MAUNG (`public/images/login-mascot.webp` sebagai acuan): anak harimau dengan kepala besar, telinga bulat, jambang pipi bergerigi, bulu oranye keemasan dengan loreng hitam tebal, wajah/moncong/sekitar mata krem, mata besar berkilau dengan alis tegas, hidung cokelat tua, mulut tersenyum, ekor bercincin hitam–oranye dengan ujung gelap, setelan navy, kemeja putih, dasi kuning, saputangan saku, dan sepatu pantofel gelap.

Seluruhnya **prosedural** — primitive three.js + tekstur kanvas yang dilukis di kode (`src/three/maung/`). Tidak ada file model (GLB) yang diunduh dan tidak ada aset atau kode dari proyek lain.

- `headCoords.js` — satu sumber koordinat wajah. Tengkorak adalah bola yang dideformasi (`skullPoint`: rahang/pipi melebar, jambang bergerigi, wajah sedikit rata). Fitur wajah (mata, alis, hidung, moncong, telinga) ditempatkan dengan sudut yang sama yang dipakai untuk melukis tekstur, sehingga loreng dan fitur selalu sejajar.
- `textures.js` — tekstur kepala 2048×1024: bulu, area krem, dan **loreng hitam yang dilukis sebagai bagian material** (kuas meruncing yang dikoreksi peregangan bola). `sheenColorMap` terpisah menjaga loreng tetap hitam di bawah kilau bulu. Lantai punya varian terang & gelap.
- `createMaung.js` — geometri, material, rig:

```
root → bob → body ─ kaki, sepatu (+sol), torso (lathe), kemeja V, kerah, kerah jas bertakik, dasi, kancing, saputangan
                 ├ shoulderL/R → elbowL/R → pawL/R (telapak, ibu jari, tiga jari; koin di paw kiri)
                 ├ neck → head ─ tengkorak (tekstur loreng), moncong & bantalan kumis, hidung segitiga,
                 │               mulut "D" + lidah + taring, garis senyum, mata (+kelopak atas/bawah, bulu mata),
                 │               alis (tabung meruncing yang menempel di tengkorak), telinga (luar, dalam, loreng belakang)
                 └ tail[0..8] (9 sendi bersarang, cincin bergantian, ujung gelap)
```

Perilaku (`animateMaung.js`), satu `update(dt, t, state)` per frame:
- napas & lompat kecil, kedip alami 2–5 dtk (kadang dua kali), kedutan telinga acak;
- kepala dan mata menatap target (dibatasi agar leher tidak "patah"); di desktop mengikuti kursor pada babak pembuka/penutup;
- ekspresi `idle | listening | thinking | happy` (kelopak, alis, mulut, kemiringan kepala);
- pose berbobot yang dicampur halus: `wave`, `listen` (tangan ke telinga), `point` (tangan kiri menunjuk), `coin` (memamerkan koin), `cheer` (dua tangan naik tanpa menembus pipi);
- ekor bergelombang (gelombang berjalan sepanjang sendi).

Reaksi produk: saat lembar pencatatan mendengarkan, MAUNG memasang pose mendengar; saat membaca kalimat, ekspresi berpikir; setelah transaksi tersimpan, ia melompat dan bersorak.

### Pratinjau model (khusus pengembangan)

`tools/maung-preview.html` merender satu frame deterministik model saja — berguna untuk memeriksa wajah/loreng tanpa menjalankan aplikasi. Jalankan `npm run dev`, lalu buka mis.:

```
http://localhost:5173/tools/maung-preview.html?yaw=0.4&expr=happy&pose=cheer&theme=light&zoom=head
```

Parameter: `yaw`, `pose` (`wave|listen|point|coin|cheer`), `expr` (`idle|listening|thinking|happy`), `theme` (`light|dark`), `zoom` (`head|body`), `t` (detik animasi), `blink=1`, `tex=1` (tampilkan tekstur kepala datar). File ini tidak ikut build produksi.

## Satu scene untuk seluruh kunjungan

`src/components/scene/SceneHost.jsx` dipasang sekali di samping rute dan menyimpan **satu** dunia WebGL selama aplikasi terbuka (tidak dibuat ulang tiap pindah halaman). Mode ditentukan rute (`sceneHooks.js → sceneModeFor`):

| Mode | Rute | Perilaku |
| --- | --- | --- |
| `story` | `/`, `/dashboard` | cerita bergulir enam babak (di bawah) |
| `portrait` | `/login`, `/register`, `/forgot-password`, `/reset-password`, `/onboarding` | MAUNG dibingkai ke elemen `[data-maung-frame]` halaman itu (`useMaungFrame`), dengan pose per halaman: masuk = koin, daftar = menunjuk (sukses = sorak), lupa sandi = berpikir, atur ulang = melambai, onboarding = melambai → mendengar → menunjuk → sorak |
| `off` | halaman lain | loop render berhenti; dunia tetap di memori sehingga kembali ke beranda instan |

Halaman tanpa 3D tetap memulai pemuatan chunk 3D saat browser idle, sehingga kunjungan berikutnya ke beranda tidak menunggu.

## Loading berbasis kesiapan nyata

Urutan tampilan pertama:

1. `index.html` langsung melukis loader statis (ikon harimau SVG inline, tema sudah benar) — tanpa menunggu JavaScript.
2. React menggantinya dengan `LoadingScreen` (`src/components/scene/LoadingScreen.jsx`) yang membaca `src/lib/bootLoader.js`. Setiap langkah ditandai selesai oleh kode yang benar-benar mengerjakannya:

| Langkah | Ditandai oleh | Progres |
| --- | --- | --- |
| Menyiapkan pengalaman SI-MAUNG | sesi auth selesai dicek (maks. 8 dtk; Supabase lambat/mati → lanjut sebagai tamu) | selesai/belum |
| Memuat mesin 3D (three.js) | `src/lib/load3d.js` mengunduh chunk `Stage` yang tercantum di meta `simaung:3d` (disuntikkan saat build oleh `vite.config.js`) dengan pembaca streaming → **byte nyata** "x / y MB"; lalu `import()` dari cache | byte |
| Membangun model & material MAUNG | `buildWorld()` di `Stage.jsx` | selesai/belum |
| Menyiapkan pencahayaan & scene 3D | PMREM `RoomEnvironment` | selesai/belum |
| Mengompilasi shader | `renderer.compileAsync()` | selesai/belum |
| Siap digunakan | frame pertama benar-benar dirender | selesai/belum |

Persentase adalah bobot langkah yang selesai + byte nyata dari langkah unduhan — tidak ada timer palsu. Bila ukuran tidak diketahui, bilah menjadi *indeterminate*. Tidak ada klaim "mengunduh GLB" karena memang tidak ada.

- Loader hanya menahan halaman yang menampilkan MAUNG. Halaman lain (mis. `/transactions`) selesai begitu auth siap; 3D disiapkan di latar belakang.
- Setelah 5 dtk muncul tombol **Lewati**; setelah 25 dtk loader menyerah otomatis. Gagal (unduhan/WebGL) → pesan jelas dengan **Coba lagi** / **Lanjut** dan fallback 2D.
- Selama loader tampil, aplikasi di belakangnya `inert` (tidak bisa difokus tidak sengaja). Transisi keluar 650 ms; `prefers-reduced-motion` mematikan animasinya.
- Hasil: frame pertama aplikasi sudah memuat MAUNG 3D siap — poster 2D bukan frame normal.

## Tema terang / gelap

`src/lib/theme.js` menyimpan pilihan `light | dark | system` di `localStorage` (`simaung:theme`). Skrip inline di `index.html` menerapkan `data-theme` sebelum paint pertama (tanpa kedip tema). Scene ikut tema lewat `sceneStore.theme` → `buildWorld.applyTheme()`: langit fajar hangat + lantai krem di tema terang, malam navy berbintang di tema gelap; warna & intensitas cahaya, glow, cincin, dan blending menyesuaikan.

## Babak & data (mode story)

`src/three/world/buildWorld.js` membangun satu scene yang berevolusi. Semua koin adalah satu `InstancedMesh` yang berubah formasi:

| Babak | Konten HTML (data nyata) | Scene |
| --- | --- | --- |
| 0 Kenali uangmu | saldo, masuk/keluar bulan ini, tombol catat | MAUNG melambai, koin mengorbit |
| 1 Ucapkan, MAUNG catat | langkah, contoh kalimat, transaksi terakhir dari suara | pose mendengar; cincin suara & koin mengalir dari mulut ke kartu transaksi |
| 2 Setiap arus | batang masuk/keluar, selisih, transaksi terbaru | aliran koin teal (masuk) & koral (keluar) — proporsi = total bulan ini; tanpa data: koin diam bertumpuk |
| 3 Pola | 5 kategori teratas, wawasan berbasis data | tumpukan koin per kategori — tinggi = porsi nyata, warna = warna kategori; MAUNG menunjuk yang tertinggi |
| 4 Tabungan | progres gabungan & per tujuan | cincin koin menyala sesuai progres nyata; tanpa tujuan: MAUNG berpikir |
| 5 Kendali | aksi cepat | MAUNG melambai, orbit kembali |

Di landing (belum masuk) scene berjalan dalam mode ilustrasi (`data.demo`), tanpa angka.

## Scroll

`src/lib/scrollStory.js` hanya **membaca** scroll (tidak ada scroll-jacking, tidak ada pinning paksa). Posisi cerita kontinu: babak *i* "tiba" pada `[i−0.3, i)` saat bagian atasnya bergerak dari bawah viewport ke garis baca, lalu "bertahan" pada `[i, i+0.7)` hingga babak berikutnya mulai tiba. Satu listener pasif + maksimal satu `requestAnimationFrame` per frame; ukuran diukur ulang saat resize/rotasi dan saat tinggi konten berubah (`ResizeObserver`). Nilai ditulis ke `sceneStore` (dibaca scene tiap frame — tanpa render React per piksel) dan ke CSS (`--p`, `data-active`).

Kamera dibingkai otomatis: tiap babak mendefinisikan target, ukuran kotak yang harus terlihat, dan arah kamera; jaraknya dihitung dari FOV, lalu `setViewOffset` menggeser subjek ke ruang kosong layar — kolom kanan di desktop, pita di atas panel teks di ponsel (diukur per babak). Semua transisi diredam (damped) agar tidak bergetar.

## Performa, reduced motion & fallback

- Host three.js vanilla (`src/three/Stage.jsx`), chunk terpisah ±162 KB gzip. Loop `setAnimationLoop` hanya berjalan bila mode bukan `off`, cerita terlihat (mode story), dan tab aktif. DPR maks 1.75/1.5/1 per tier perangkat, turun 0.25 bila rata-rata frame > 33 ms. Tanpa shadow map (bayangan kontak dari tekstur), lingkungan studio `RoomEnvironment` → PMREM (tanpa HDR eksternal), tone mapping Neutral.
- **`prefers-reduced-motion: reduce`**: MAUNG 3D tetap tampil tetapi **diam** — waktu animasi dibekukan, tanpa napas/kedip/ekor/lambaian, kamera langsung ke posisi tanpa transisi, dan koin tidak bergerak. Diuji: dua tangkapan berjarak 1,2 dtk identik piksel-per-piksel; saat preferensi dimatikan, frame kembali bergerak.
- Fallback 2D (poster maskot per babak / ilustrasi di halaman auth) **hanya** bila 3D tidak mungkin: tanpa WebGL, renderer software, error/`webglcontextlost`, gagal unduh, atau Pengaturan → Scene 3D → Mati. `?3d=on` / `?3d=off` untuk pengujian.
- Pembersihan saat unmount: semua geometri, material, tekstur, render target, renderer (+`forceContextLoss`) dan listener/observer. Diuji: 6 kali bolak-balik rute tetap 1 canvas.
- Lapisan 3D `aria-hidden` dan `pointer-events: none`; semua aksi ada sebagai kontrol HTML biasa.
