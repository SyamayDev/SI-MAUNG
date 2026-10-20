# MAUNG 3D & scroll story

## Karakter

MAUNG adalah versi 3D dari maskot 2D SI-MAUNG yang sudah ada (`public/images/*.webp`): anak harimau amber dengan loreng cokelat tua, moncong krem, setelan navy, kemeja putih, dasi amber, dan saputangan saku. Seluruhnya **prosedural** — dibangun dari primitive three.js dan tekstur kanvas di `src/three/maung/` — sehingga tidak ada file model untuk diunduh dan semua bagian bisa diubah di kode. Tidak ada aset atau kode dari proyek lain.

Rig (`createMaung.js`):

```
root → bob → body ─ kaki, sepatu, torso (lathe), kemeja/kerah/dasi/kancing/saputangan
                 ├ shoulderL/R → elbowL/R → pawL/R (koin di paw kiri)
                 ├ neck → head ─ tengkorak (tekstur loreng), moncong & pipi krem, mata (+kelopak atas/bawah),
                 │               alis, hidung, mulut “D” + lidah + garis senyum, telinga
                 └ tail[0..7] (sendi bersarang, cincin cokelat bergantian)
```

Perilaku (`animateMaung.js`), satu `update(dt, t, state)` per frame:
- napas & lompat kecil, kedip alami 2–5 dtk (kadang dua kali), kedutan telinga acak;
- kepala dan mata menatap target (dibatasi agar leher tidak “patah”); di desktop mengikuti kursor pada babak pembuka/penutup;
- ekspresi `idle | listening | thinking | happy` (kelopak, alis, mulut, kemiringan kepala);
- pose berbobot yang dicampur halus: `wave`, `listen` (tangan ke kepala), `point` (menunjuk tumpukan), `coin` (memamerkan koin), `cheer`;
- ekor bergelombang (gelombang berjalan sepanjang sendi).

Reaksi produk: saat lembar pencatatan mendengarkan, MAUNG memasang pose mendengar; saat membaca kalimat, ekspresi berpikir; setelah transaksi tersimpan, ia melompat dan bersorak.

## Babak & data

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

`src/lib/scrollStory.js` hanya **membaca** scroll (tidak ada scroll-jacking, tidak ada pinning paksa). Posisi cerita kontinu: babak *i* “tiba” pada `[i−0.3, i)` saat bagian atasnya bergerak dari bawah viewport ke garis baca, lalu “bertahan” pada `[i, i+0.7)` hingga babak berikutnya mulai tiba. Satu listener pasif + maksimal satu `requestAnimationFrame` per frame; ukuran diukur ulang saat resize/rotasi dan saat tinggi konten berubah (`ResizeObserver`). Nilai ditulis ke `sceneStore` (dibaca scene tiap frame — tanpa render React per piksel) dan ke CSS (`--p`, `data-active`).

Kamera dibingkai otomatis: tiap babak mendefinisikan target, ukuran kotak yang harus terlihat, dan arah kamera; jaraknya dihitung dari FOV, lalu `setViewOffset` menggeser subjek ke ruang kosong layar — kolom kanan di desktop, pita di atas panel teks di ponsel (diukur per babak). Semua transisi diredam (damped) agar tidak bergetar.

## Performa & fallback

- `StoryBackdrop` memuat `Stage` lewat `React.lazy` setelah `requestIdleCallback`; poster 2D tampil sampai frame 3D pertama selesai, lalu memudar.
- Host three.js vanilla (`src/three/Stage.jsx`): loop `setAnimationLoop` hanya jalan saat cerita terlihat dan tab aktif; DPR maks 1.75/1.5/1 per tier perangkat, turun 0.25 bila rata-rata frame > 33 ms; tanpa shadow map (bayangan kontak dari tekstur), lingkungan studio `RoomEnvironment` → PMREM (tanpa HDR eksternal), tone mapping Neutral.
- Pembersihan saat unmount: semua geometri, material, tekstur, render target, renderer (+`forceContextLoss`) dan listener/observer. Diuji: 6 kali bolak-balik rute tetap 1 canvas.
- Fallback 2D (poster maskot per babak): `prefers-reduced-motion`, tanpa WebGL, renderer software, error/`webglcontextlost`, atau Pengaturan → Scene 3D → Mati. `?3d=on` / `?3d=off` untuk pengujian.
- Kanvas `aria-hidden` dan `pointer-events: none`; semua aksi ada sebagai kontrol HTML biasa.
