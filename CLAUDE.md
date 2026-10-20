# CLAUDE.md — SI-MAUNG: Immersive 3D Finance Companion

> **Instruksi utama untuk Claude Code / Claude Opus 5.** Bertindak sebagai product architect, creative director, senior React engineer, UX/UI designer, 3D artist, interaction/motion designer, Supabase engineer, security reviewer, accessibility specialist, dan QA engineer. Tujuannya bukan hanya mempercantik tampilan. Bangun SI-MAUNG menjadi aplikasi pengelolaan keuangan pribadi yang terasa premium, punya identitas yang kuat, memiliki karakter 3D yang benar-benar bergerak mengikuti scroll, responsif di ponsel, dan tetap benar-benar berfungsi dari autentikasi sampai penyimpanan transaksi.

Website/repository utama:
- Repository SI-MAUNG: https://github.com/SyamayDev/SI-MAUNG
- Website SI-MAUNG: https://syamaydev.github.io/SI-MAUNG/
- Repository referensi pengalaman 3D: https://github.com/SyamayDev/react-sistemrekomendasijurusan
- Website referensi SI-RAJU: https://si-raju.vercel.app/
- GitHub Pages SI-RAJU: https://syamaydev.github.io/react-sistemrekomendasijurusan/

Baca dokumen ini secara menyeluruh sebelum melakukan perubahan. **Jangan berhenti pada audit, desain, wireframe, saran, atau rencana.** Setelah audit awal, implementasikan perubahan di workspace, jalankan pemeriksaan yang tersedia, perbaiki masalah yang ditemukan, dan laporkan hasil nyata beserta hal yang belum dapat diverifikasi.

---

## 1. Misi Produk

SI-MAUNG adalah **Sistem Informasi Manajemen Keuangan**. Fungsi intinya sederhana dan harus tetap sederhana bagi pengguna: mencatat pemasukan dan pengeluaran, terutama melalui ucapan/voice input yang diproses menjadi data transaksi secara otomatis dengan bantuan parser/AI. Aplikasi juga memiliki atau merencanakan dashboard, riwayat transaksi, analitik, tujuan tabungan, asisten teks, autentikasi, onboarding, dan pengaturan.

### Sasaran redesign

1. Buat identitas visual SI-MAUNG yang khas dan mudah diingat.
2. Jadikan maskot/karakter SI-MAUNG sebagai model 3D orisinal yang hidup, dapat bergerak, dan bereaksi terhadap progres scroll.
3. Rancang pengalaman scroll-storytelling bertahap seperti SI-RAJU: posisi kamera, karakter, lingkungan, dan visual pendukung berubah secara terarah pada tiap babak scroll.
4. Integrasikan storytelling dengan fitur finansial nyata. Visual 3D tidak boleh menjadi demo terpisah yang tidak berhubungan dengan data atau fungsi aplikasi.
5. Jadikan voice-first transaction capture sebagai fitur utama yang mudah ditemukan dan digunakan dengan satu tangan di HP.
6. Pertahankan alur yang sudah berfungsi. Perbaiki bagian yang rusak, setengah jadi, tidak terhubung, statis padahal mengaku dinamis, atau tidak aman.
7. Pastikan aplikasi tetap cepat, dapat diakses, responsif, bisa digunakan tanpa WebGL, serta tetap layak dihosting pada deployment SI-MAUNG yang benar.
8. Periksa dan gunakan akses Supabase yang memang tersedia di lingkungan kerja untuk memahami serta memperbaiki backend/database sesuai kebutuhan. Perlakukan data keuangan pengguna sebagai data sensitif.

### Definisi keberhasilan

Hasil akhir harus terasa seperti **produk keuangan personal yang dirancang profesional dan memiliki karakter 3D sendiri**, bukan dashboard template generik, bukan landing page kosong yang sekadar memamerkan animasi, dan bukan mockup dengan tombol mati.

---

## 2. Cara Kerja Wajib: Audit Dahulu, Lalu Langsung Implementasi

Jalankan tahapan ini tanpa menunggu persetujuan untuk detail desain biasa. Ambil keputusan mandiri selama keputusan tersebut tidak destruktif dan tidak membahayakan data.

### Tahap A — Kenali seluruh project

1. Baca file ini sampai selesai.
2. Jalankan `git status --short --branch` dan periksa diff yang sudah ada. Jangan menimpa pekerjaan yang sedang berlangsung.
3. Baca `README.md`, `package.json`, lockfile, `index.html`, konfigurasi Vite, ESLint, `.gitignore`, semua folder `src/`, semua aset `public/`, dan folder tambahan. Daftar dan periksa setiap file yang berperan pada alur utama.
4. Jangan mengasumsikan bahwa ringkasan lama masih sepenuhnya cocok. Verifikasi kondisi kode saat ini.
5. Baca semua halaman, provider/context, hooks, services, lib, utils, modal, voice components, stylesheet, dan konfigurasi routing.
6. Identifikasi seluruh alur aplikasi melalui impor dan pemakaian fungsi, bukan hanya nama file. Cari TODO, stub, komentar sementara, fungsi yang tidak dipakai, event handler kosong, `console.log`, placeholder, error handling yang hilang, hardcoded insight, data palsu, serta link atau asset yang rusak.
7. Audit paket dan kompatibilitas versi sebelum memilih library baru.
8. Lakukan audit responsif: layout navigasi, halaman autentikasi, dashboard, transaksi, analitik, tabungan, chat, settings, modal, form, chart, dan scene 3D.
9. Periksa konfigurasi build, `base` Vite, React Router, URL deployment, pemuatan asset, serta kemungkinan subpath GitHub Pages.
10. Buat catatan internal singkat tentang alur yang benar-benar ada dan masalah terkonfirmasi. Jangan menghabiskan seluruh sesi hanya untuk menulis laporan; lanjutkan implementasi.

### Tahap B — Pelajari SI-RAJU dengan sengaja

Buka repository dan website SI-RAJU. Periksa `CLAUDE.md` SI-RAJU, struktur 3D, model karakter, scroll-story, responsive handling, fallback, serta cara scene dihubungkan dengan progress scroll. Jika akses browser tidak tersedia, gunakan source code yang dapat dibaca dalam repository referensi.

Pelajari **prinsip dan tekniknya**, terutama:
- satu karakter 3D sebagai pemandu pengalaman;
- satu scene yang berevolusi melalui beberapa babak scroll;
- progress scroll yang dinormalisasi dan konsisten;
- kamera dan objek yang bergerak mengikuti bagian cerita;
- layout teks yang berubah antara desktop dan ponsel;
- animasi tidak memaksa pengguna atau mengambil alih native scrolling;
- mengurangi kerja render ketika scene tidak terlihat;
- kualitas visual yang tetap baik saat reduced-motion atau WebGL tidak tersedia.

**Jangan menyalin RAJU, model burung hantu, aset, copywriting, warna/identitas spesifik, ataupun source code yang tidak berlisensi untuk digunakan ulang.** SI-MAUNG harus punya maskot, dunia, bahasa desain, animasi, dan narasi sendiri. Gunakan SI-RAJU sebagai benchmark kualitas pengalaman dan referensi teknik saja.

### Tahap C — Kerjakan, bukan sekadar memberi saran

Setelah audit awal, langsung lakukan implementasi dalam kelompok perubahan yang masuk akal. Jangan menunggu persetujuan untuk pilihan warna, ukuran spacing, struktur komponen, atau keputusan teknis rutin. Jika suatu integrasi benar-benar terhalang oleh kredensial atau akses yang tidak tersedia, kerjakan bagian lain terlebih dahulu, dokumentasikan blocker secara jujur, dan jangan mengarang bahwa integrasi berhasil.

### Tahap D — Verifikasi berulang

Setelah perubahan utama:
- jalankan perintah build yang disediakan repository;
- jalankan lint dan test yang tersedia;
- buat atau perbarui unit test untuk parser nominal dan logika transaksi;
- periksa hasil build, console error, route, link, asset, layout responsif, loading, empty state, dan error state;
- lakukan pemeriksaan visual pada beberapa viewport bila browser tooling tersedia;
- selesaikan error yang berasal dari perubahan Anda sebelum menyatakan selesai.

---

## 3. Aturan Non-Negosiasi

1. **Jangan merusak fitur keuangan yang ada demi estetika.**
2. **Jangan mengganti React/Vite atau mengubah arsitektur keseluruhan tanpa alasan teknis yang kuat.** Pertahankan stack yang ada jika layak.
3. Jangan mereset repository, menghapus perubahan pengguna, menjalankan `git reset --hard`, `git clean -fd`, force-push, atau operasi sejenis.
4. Jangan membuat kontrol, CTA, tombol, grafik, modal, tab, search, atau filter yang sekadar terlihat berfungsi. Semua tindakan yang ditampilkan harus benar-benar punya hasil.
5. Jangan mengarang transaksi, persentase insight, saldo, progres tabungan, data pengguna, kinerja, atau klaim keamanan.
6. Jangan menyimpan transaksi secara otomatis ketika hasil ucapan ambigu tanpa konfirmasi yang dapat dipahami. Otomatisasi parsing boleh, tetapi data penting harus bisa ditinjau pengguna sebelum tersimpan, kecuali pengguna secara eksplisit mengaktifkan perilaku auto-save yang aman.
7. Jangan membuang tabel, kolom, row, policy, function, bucket, trigger, atau data Supabase secara destruktif. Jangan melakukan operasi destruktif live tanpa persetujuan eksplisit setelah menjelaskan konsekuensinya.
8. Jangan pernah mencetak, menyalin ke dokumentasi, melakukan commit, atau memasukkan ke source control nilai rahasia: API key, `service_role`, password, access token, refresh token, atau data transaksi pribadi.
9. Jangan mengirim kunci AI melalui bundle browser. Variabel `VITE_*` adalah konfigurasi client dan nilainya bisa terlihat pengguna.
10. Jangan memasukkan data pribadi asli ke fixture test, screenshot, log, atau dokumentasi.
11. Jangan memakai aset atau model eksternal tanpa memeriksa lisensi dan atribusi.
12. Jangan memakai emoji sebagai pengganti maskot 3D atau sebagai satu-satunya bahasa visual.
13. Jangan menggunakan efek scroll yang mematikan scrolling alami, membuat page terasa macet, atau menjadikan konten tidak terjangkau.
14. Jangan menganggap build sukses berarti UI dan fungsinya telah selesai.
15. Jangan mengklaim test, deployment, perubahan database, atau pemeriksaan visual telah dilakukan jika memang tidak dilakukan.

---

## 4. Creative Direction — “MAUNG: Money in Motion”

Kembangkan art direction setelah memeriksa aset dan identitas SI-MAUNG yang sudah ada. Jika logo, maskot, dan warna yang dimiliki proyek sudah jelas dan relevan, pertahankan lalu tingkatkan. Jika belum ada sistem visual yang kuat, gunakan arahan berikut sebagai titik awal, bukan batasan mutlak.

### 4.1 Rasa visual

- Premium, hangat, berani, cerdas, modern, sedikit playful, tetapi tetap bisa dipercaya untuk aplikasi keuangan.
- Ada kedalaman visual dan rasa ruang, bukan kumpulan kartu datar yang semuanya memiliki bentuk sama.
- Perpaduan komposisi editorial yang berani, data visualization yang bersih, lingkungan 3D yang organik, dan interaksi kecil yang terasa halus.
- Prioritaskan hierarchy, whitespace, typographic scale, angka keuangan yang mudah dipindai, kontras tinggi, dan navigasi yang jelas.
- Buat tampilan desktop berkesan saat pertama dibuka, tetapi tetap praktis. Pengguna harus bisa langsung melihat saldo dan memulai pencatatan tanpa perlu menjelajahi animasi panjang.

### 4.2 Identitas maskot

Periksa dahulu logo/mascot/aset yang sudah ada di `public/`. Jangan membuat duplikat baru jika asset saat ini layak dikembangkan. Jika maskot 3D belum tersedia, kembangkan **karakter MAUNG orisinal** yang relevan dengan nama dan identitas produk. Bila arah brand cocok, karakter dapat mengacu secara umum pada siluet harimau bergaya stylized, tetapi harus punya desain baru dan bukan karakter berhak cipta pihak lain.

Karakter harus:
- punya siluet dan ekspresi yang mudah dikenali;
- terasa ramah, meyakinkan, ekspresif, dan cocok menjadi partner pencatatan keuangan;
- tampak baik dari sudut hero dan ukuran kecil di ponsel;
- dibangun memakai mesh/material/lighting yang konsisten, bukan sekadar emoji atau gambar statis yang diputar;
- bereaksi dengan gerak halus dan punya animasi yang sengaja dirancang;
- tetap merupakan bagian dari produk, bukan menutupi saldo, grafik, atau form.

Jangan memakai maskot RAJU atau mengubah burung hantu RAJU menjadi karakter MAUNG. Ciptakan karakter baru.

### 4.3 Palet

Gunakan token design system. Jika tidak ditemukan sistem warna yang matang, uji arah seperti:
- midnight ink / deep navy sebagai warna struktur;
- warm ivory atau white smoke sebagai permukaan terang;
- tiger amber/orange sebagai aksen brand;
- teal/green untuk pemasukan atau status positif;
- coral/red untuk pengeluaran atau status negatif;
- neutral slate untuk border, metadata, serta elemen sekunder.

Warna nominal tidak boleh hanya mengandalkan warna: label, ikon, tanda plus/minus, dan teks harus membantu membedakan pemasukan dan pengeluaran. Pastikan kontras aksesibel. Jangan menggunakan glow, glassmorphism, gradient, atau blur secara berlebihan.

### 4.4 Tipografi

- Pilih maksimal dua keluarga font utama bila memungkinkan.
- Angka saldo harus jelas, punya hierarchy kuat, dan menggunakan format rupiah Indonesia yang konsisten.
- Judul section boleh berkarakter, tetapi body text harus nyaman dibaca.
- Hindari font sangat tipis untuk angka keuangan dan teks kecil berkontras rendah.
- Jangan memuat banyak font eksternal secara sinkron bila menyebabkan render awal lambat.

### 4.5 Yang harus dihindari

- dashboard SaaS generik;
- semua bagian berupa grid kartu identik;
- hero besar tetapi CTA pencatatan sulit ditemukan;
- semua teks dan angka disembunyikan di dalam scene 3D;
- ilustrasi stok generik tanpa hubungan dengan brand;
- ornamen 3D yang tidak memberi konteks pada keuangan;
- animasi tanpa ritme atau semua komponen bergerak serempak;
- angka dummy atau label “AI Insight” yang tidak dihitung dari data riil;
- efek 3D berat yang menghabiskan baterai HP;
- meniru SI-RAJU secara literal.

---

## 5. Pengalaman 3D dan Scroll Storytelling yang Wajib Ada

Ini adalah bagian utama dari tugas. Jangan menganggap sebuah kartu dengan `transform: rotateX()` sudah memenuhi kebutuhan. Buat **scene 3D yang nyata** dengan model/mesh, material, lighting, kamera, dan animasi yang dikendalikan oleh progress scroll.

### 5.1 Pilih teknik berdasarkan repository

Audit versi React/Vite terlebih dahulu, lalu pilih kombinasi yang kompatibel. React Three Fiber + Three.js + Drei layak dipertimbangkan karena SI-RAJU menggunakan pola 3D berbasis R3F. Namun, validasi versi peer dependency dan ukuran bundle sebelum instalasi.

Model boleh dibuat dengan salah satu atau kombinasi:
- model prosedural Three.js/R3F yang dibuat di source code;
- model `.glb`/`.gltf` buatan sendiri dengan file sumber yang dapat diedit bila memungkinkan;
- mesh, material, rig, dan animasi prosedural yang ringan;
- aset eksternal hanya jika lisensinya jelas dan sesuai.

Jangan berhenti karena tidak ada Blender atau model 3D siap pakai. Jika tool aset 3D tidak tersedia, bangun model prosedural dengan siluet, material, pencahayaan, ekspresi dan proporsi yang disengaja. Hasil harus terasa sebagai karakter yang dirancang, bukan sekadar beberapa sphere acak.

### 5.2 Perjalanan scene

Rancang 4–6 babak bermakna. Struktur final boleh menyesuaikan halaman yang ada, tetapi seluruh scene harus menjadi satu pengalaman kontinu dan tidak memisahkan animasi dari produk.

Contoh alur yang disarankan:

1. **Awal — “Kenali uangmu.”** MAUNG muncul sebagai focal point, idle animation halus, kamera perlahan membuka ruang. Identitas produk dan aksi utama “Catat dengan Suara” terlihat segera. Pengguna yang login melihat ringkasan keuangannya yang sebenarnya; pengguna yang belum login diarahkan untuk masuk/daftar dengan jelas.
2. **Voice capture — “Ucapkan, MAUNG catat.”** Gelombang suara atau orbit tipis mengalir dari karakter ke chip transaksi. Gerakan visual menggambarkan suara menjadi teks, lalu teks menjadi transaksi terstruktur. Pastikan visual ini mewakili alur nyata yang tersedia.
3. **Pemasukan dan pengeluaran — “Setiap arus punya arti.”** Dua aliran atau kelompok objek bergerak berbeda untuk inflow/outflow. Data yang ditampilkan berasal dari transaksi pengguna bila ada, bukan angka karangan.
4. **Analitik — “Lihat pola, bukan tebakan.”** Objek atau orbit berubah menjadi komposisi chart/cluster kategori. Jangan menampilkan visual 3D yang mengklaim insight finansial yang tidak dihitung dari data.
5. **Tujuan tabungan — “Sedikit demi sedikit.”** Objek membentuk target/orbit/lingkaran progres. Nilai dan persentase berasal dari tujuan tabungan aktual jika fitur sudah tersedia.
6. **Penutup/quick action — “Keuanganmu, tetap dalam kendalimu.”** Karakter kembali menjadi pemandu, ada CTA nyata untuk merekam transaksi atau melihat ringkasan.

Alur di atas adalah panduan dramaturgi, bukan alasan membuat seluruh halaman menjadi marketing site yang panjang. Integrasikan dengan shell aplikasi yang sudah ada agar pengguna tetap bisa langsung mengakses fitur.

### 5.3 Keterkaitan dengan scroll

- Gunakan progres ternormalisasi `0..1` atau progress babak yang terukur.
- Setiap babak memiliki keyframe/target yang jelas untuk kamera, posisi/rotasi/skala karakter, objek sekitar, lighting atau warna bila relevan.
- Perubahan harus terasa jelas dan mengikuti makna konten: model bergeser, menghadap pengguna, bergerak menuju objek, mengubah pose, objek menyatu/terpisah, scene membuka ruang, atau kamera melakukan transisi.
- Gunakan sticky/pinned scene hanya bila menghasilkan narasi yang memang membutuhkan continuity; jangan membuat scroll-jacking.
- Hindari banyak listener scroll yang berat atau memicu React render per pixel. Gunakan satu sumber progress yang efisien, `requestAnimationFrame` atau sistem library yang sesuai. Simpan nilai untuk `useFrame`/ref bila memungkinkan.
- Ukur ulang babak saat resize/rotasi perangkat; jangan mengunci asumsi ukuran viewport saat load pertama.
- Pastikan restore scroll, navigasi route, dan browser back tidak membuat karakter atau scene berada di posisi salah.
- Scroll progress tidak boleh mengubah atau mengganggu input form.
- Pada mobile, scene harus dibingkai ulang ke ruang kosong yang tersedia; jangan biarkan teks menutupi wajah karakter atau sebaliknya.
- Jangan membuat elemen yang mengikuti pointer menghalangi klik atau scroll sentuh.

### 5.4 Animasi karakter

Tambahkan perilaku yang cocok dan stabil, misalnya:
- idle breathing/body bob;
- head look atau eye tracking yang dibatasi;
- blink bila model mendukung mata;
- tail/ear/wing/arm gesture sesuai bentuk karakter;
- reaksi singkat saat voice capture dimulai/selesai;
- perubahan pose/arah pandang ketika babak berganti;
- gerakan lembut saat sukses menyimpan transaksi.

Animasi harus terasa natural, tidak bergetar, tidak membuat layout shift, dan tidak berjalan agresif di belakang tab yang tidak aktif. Jangan membuat model terus berputar tanpa alasan.

### 5.5 Loading, fallback, dan aksesibilitas

- Gunakan `React.lazy`/dynamic import atau mekanisme lazy loading yang sesuai agar bundle utama tidak langsung membawa seluruh library 3D apabila itu membebani first load.
- Tampilkan loading state yang dirancang dengan baik, bukan canvas kosong atau spinner permanen.
- Sediakan poster/ilustrasi fallback yang menarik jika WebGL gagal, shader tidak tersedia, perangkat sangat terbatas, atau terjadi error pemuatan model.
- Hormati `prefers-reduced-motion: reduce`: kurangi/matikan animasi scroll berat, parallax, gerak kamera besar, dan gerak idle berulang. Konten serta fungsi harus tetap lengkap.
- Jangan memaksa audio autoplay.
- Jangan memindahkan fokus keyboard karena animasi.
- CTA dan aksi pada HUD 3D harus punya padanan nyata yang bisa diakses melalui HTML biasa. Objek dekoratif sebaiknya `aria-hidden`.

---

## 6. Responsif dan Mobile-First

HP bukan versi yang disusutkan dari desktop. Rancang layout mobile dengan hierarki yang jelas, aksi utama mudah dijangkau ibu jari, dan scene 3D yang dikomposisikan khusus.

### Breakpoint/test size minimum

Periksa setidaknya viewport:
- 320 × 720
- 360 × 800
- 390 × 844
- 430 × 932
- 768 × 1024
- 1024 × 768
- 1280 × 800
- 1440 × 900

### Kriteria mobile

- Tidak ada horizontal overflow pada halaman, dialog, chart, tabel, navigation, atau 3D stage.
- Teks tidak terpotong, input tidak keluar layar, dan tombol memiliki target sentuh yang memadai (idealnya sekitar 44 × 44 CSS px).
- Prioritaskan “Catat dengan Suara”/quick add; jangan memaksa scroll jauh untuk memulai transaksi.
- Untuk layar kecil, tumpuk panel dengan urutan logis. Kurangi jumlah kolom, ukuran decorative 3D, efek blur, jumlah partikel, shadows, resolusi renderer, serta durasi pinning jika diperlukan.
- Sidebar desktop harus menjadi bottom navigation, drawer, atau pola mobile yang sesuai; hindari sidebar sempit yang tetap terbuka di HP.
- Modal transaksi/voice tidak boleh lebih tinggi dari viewport tanpa internal scrolling yang jelas. Tangani safe area iOS bila relevan.
- Pastikan `100dvh`/fallback viewport height dipakai dengan hati-hati agar browser address bar tidak mengacaukan layout.
- Text field tetap nyaman ketika keyboard virtual tampil.
- Grafik harus bisa dibaca dan punya ringkasan data/tabel atau bentuk penjelasan alternatif, bukan hanya grafik kecil yang tak terbaca.
- Animasi scroll tidak boleh membuat pengguna terjebak di scene panjang, harus tetap natural pada layar sentuh.

### Kriteria kualitas/performa 3D

- Batasi device pixel ratio secara masuk akal, terutama pada HP; jangan memaksa render retina penuh jika terlalu berat.
- Kurangi geometri, partikel, bayangan real-time, post-processing, dan texture size pada perangkat rendah.
- Pause/suspend loop berat jika tab tidak terlihat atau stage berada jauh di luar viewport, jika arsitektur memungkinkan.
- Bersihkan event listener, observers, RAF, geometry, material, texture dan renderer/resource saat komponen dilepas.
- Hindari membuat ulang material/geometry setiap frame.
- Pakai instancing bila mengulang banyak objek serupa.
- Hindari memory leak saat berpindah route atau membuka/menutup modal berulang kali.
- Verifikasi bahwa halaman tetap bisa digunakan tanpa rendering 3D.

---

## 7. Sistem Desain dan Struktur UI

Bangun/rapikan design tokens yang konsisten, misalnya dalam CSS custom properties:
- warna latar/surface/text/border/brand/semantic;
- ukuran typography dan line-height;
- spacing scale;
- radius dan shadow;
- ukuran navigasi;
- z-index scale;
- easing/duration untuk motion;
- breakpoints/responsive rules bila sesuai.

Pastikan tema dan komponen saling konsisten, tetapi **jangan pakai komponen yang sama persis secara berulang di semua section hanya supaya mudah**. Variasikan komposisi sesuai tujuan konten.

### Dashboard

- Tetap menyajikan saldo, pemasukan, pengeluaran, ringkasan periode dan transaksi terbaru berdasarkan data aktual.
- Tampilkan aksi utama “Catat dengan Suara” dengan prioritas paling tinggi.
- Tambahkan jalur alternatif untuk mengetik transaksi ketika suara tidak didukung atau pengguna tidak dapat berbicara.
- Ringkasan finansial harus terlihat cepat; jangan menaruh informasi terpenting di bawah animasi yang terlalu panjang.
- Wawasan AI harus dihitung dari transaksi real, disertai periode dan basis yang jelas, atau menampilkan empty state yang jujur.

### Transaksi

- Sediakan pencarian, filter tipe, kategori, dan tanggal/periode jika memungkinkan.
- Selesaikan CRUD yang memang dibutuhkan: tambah, edit, hapus dengan konfirmasi bila destruktif, validasi, loading, empty state, error, dan success feedback.
- Gunakan format nominal Rupiah serta locale tanggal Bahasa Indonesia secara konsisten.
- Pastikan kategori dan tipe transaksi yang tersimpan konsisten dengan konstanta/domain di dalam aplikasi.

### Tabungan

- Tujuan tabungan harus benar-benar dapat dibuat dan progresnya memiliki alur yang masuk akal.
- Jika menambahkan kontribusi tabungan, tentukan dan dokumentasikan apakah kontribusi adalah tabel tersendiri, transaksi terkait, atau pembaruan `current_amount`; jangan membuat dua sumber kebenaran yang tidak sinkron.
- Jangan menampilkan progress bar yang berubah hanya pada frontend tetapi tidak persisten.
- Sediakan validasi target, tanggal, nominal kontribusi, dan error states.

### Analitik

- Gunakan transaksi aktual yang diotorisasi untuk pengguna saat ini.
- Tentukan rentang tanggal dan periode dengan logika konsisten.
- Tangani belum ada transaksi, data parsial, timezone, dan bulan tanpa data.
- Wawasan harus berbasis kalkulasi yang dapat dijelaskan.

### AI chat dan voice

- Pertahankan fitur chat jika fungsinya berguna, tetapi jangan berpura-pura bahwa chat dapat menjawab pertanyaan umum bila kode hanya mendukung parsing transaksi.
- Beri pengguna ringkasan parsing: tipe transaksi, nominal, kategori, deskripsi, tanggal, dan confidence/indikasi ketika hasil tidak pasti.
- Sediakan edit sebelum konfirmasi simpan.
- Tangani input yang bukan transaksi dengan balasan jujur dan contoh input yang didukung.
- Jangan menaruh hasil parser yang tidak valid ke database.

### Pengaturan

Implementasikan hanya preferensi yang benar-benar terhubung, seperti nama tampilan, tema, preferensi suara, pengaturan konfirmasi auto-save, atau pengaturan akun. Jangan tampilkan label preferensi yang belum memiliki behavior. Jika scope harus diprioritaskan, pilih sedikit kontrol yang benar-benar bekerja dan dokumentasikan sisanya.

---

## 8. Voice-First: Alur Pencatatan yang Harus Benar-Benar Berfungsi

Voice capture adalah salah satu nilai utama SI-MAUNG. Buat alur yang cepat, tidak menakutkan, toleran terhadap bahasa Indonesia sehari-hari, dan tetap aman terhadap salah tafsir nominal.

### 8.1 Alur pengguna

1. Pengguna menekan mikrofon/“Catat dengan Suara”. Browser meminta izin mikrofon bila dibutuhkan.
2. UI menampilkan state yang terlihat jelas: siap, mendengarkan, memproses, hasil dikenali, gagal, tidak didukung, atau permission ditolak.
3. Ucapan ditranskripsikan melalui Web Speech API jika tersedia, atau melalui backend transcription yang sah bila memang sudah dikonfigurasi dan layak. Jangan menganggap semua browser mendukung Web Speech API.
4. Parser mengekstrak tipe (`income`/`expense`), nominal, deskripsi, kategori, tanggal, dan field lain yang benar-benar didukung schema.
5. Tampilkan hasil dalam transaction preview yang mudah diedit sebelum menyimpan.
6. Pengguna menekan konfirmasi untuk menyimpan, kecuali pilihan auto-save eksplisit sudah dibuat dan parser mempunyai kepastian yang memadai. Default adalah konfirmasi yang jelas.
7. Simpan ke Supabase menggunakan user yang sedang login, tampilkan success/error feedback, dan refresh konteks/dashboard supaya data langsung konsisten.
8. Jika parsing tidak jelas, minta pengguna mengedit teks atau isi form, bukan mengarang nominal/kategori.

### 8.2 Contoh frasa yang perlu ditangani

Gunakan contoh buatan untuk tes parsing, antara lain:
- “Tadi beli nasi goreng dua puluh lima ribu.”
- “Bayar listrik seratus dua puluh lima ribu rupiah.”
- “Gajian tiga juta rupiah hari ini.”
- “Dapat uang freelance satu juta dua ratus ribu.”
- “Beli bensin lima puluh ribu.”
- “Terima transfer dua ratus ribu dari teman.”
- “Kemarin beli buku 45 ribu.”

Ini adalah sample uji, bukan asumsi bahwa semua kalimat langsung sudah didukung. Kembangkan parser dan test yang nyata. Pertimbangkan variasi ucapan: `rb`, `ribu`, `juta`, angka digit, pemisah ribuan, “setengah juta”, kata “pemasukan”, “pengeluaran”, “masuk”, “keluar”, dan konteks tanggal. Jangan menafsirkan unit yang tidak pasti sebagai nominal final.

### 8.3 Parser dan validasi

- Pisahkan parsing ke pure function yang dapat diuji tanpa browser atau Supabase.
- Unit test amount parsing untuk angka digit, kalimat bilangan Indonesia, unit ribu/juta, nilai tidak valid, angka ambigu, dan nominal kosong.
- Validasi nominal finite dan lebih besar dari nol, field wajib, tanggal, tipe, kategori, dan user ownership sesuai model data.
- Jangan hanya bergantung pada `includes()` terhadap satu kata untuk memutuskan semua data transaksi.
- Gunakan aturan deterministik untuk kasus umum dan model AI untuk interpretasi bila benar-benar diperlukan.
- Jika AI memberi JSON, parse dan validasi schema secara ketat; anggap output model sebagai input yang tidak tepercaya.
- Jangan menganggap confidence AI sebagai kepastian yang terkalibrasi jika belum ada pengukuran.
- Simpan mata uang dalam format numerik yang konsisten di database, lalu format menjadi `IDR`/Rupiah di UI.
- Cegah double-submit dan duplikasi transaksi ketika callback speech recognition mengirim hasil yang sama lebih dari sekali.
- Jika voice API tidak didukung, jangan menonaktifkan seluruh fitur pencatatan; sediakan input teks/manual fallback.

### 8.4 Privasi suara

Jelaskan secara singkat kepada pengguna apakah browser memproses suara melalui layanan eksternal atau hanya mengirim transkripsi. Jangan merekam atau menyimpan audio mentah jika tidak diperlukan. Jangan menyalakan microphone tanpa aksi pengguna dan izin eksplisit. Jangan menampilkan API key atau mengirim data pribadi ke penyedia AI tanpa alasan dan dokumentasi yang jelas.

---

## 9. Supabase: Audit, Modifikasi, Keamanan, dan Data

Pengguna memberikan izin kepada Claude untuk memeriksa dan memodifikasi konfigurasi/schema Supabase yang terhubung ke proyek SI-MAUNG. Gunakan akses tersebut dengan hati-hati dan pastikan setiap perubahan berhubungan langsung dengan kebutuhan aplikasi.

### 9.1 Audit awal yang wajib

Jika MCP/connector/CLI Supabase tersedia:
1. Identifikasi project Supabase yang benar-benar terkait SI-MAUNG sebelum melakukan perubahan.
2. Baca schema aktual: tabel, kolom, tipe data, primary/foreign key, unique constraint, index, view, trigger, function, storage bucket, dan policy.
3. Periksa Auth configuration, redirect URLs, provider yang aktif, email/reset flow, dan hubungan profil dengan `auth.users` sesuai akses yang tersedia.
4. Periksa RLS pada tabel yang menyimpan data pengguna. Verifikasi operasi SELECT/INSERT/UPDATE/DELETE untuk user yang benar-benar terautentikasi.
5. Periksa apakah table/field yang dipakai frontend cocok dengan schema aktual. Jangan mengasumsikan nama kolom berdasarkan tebakan atau ringkasan terdahulu.
6. Periksa log/diagnostics seperlunya tanpa menampilkan token, payload sensitif, atau isi transaksi pribadi.
7. Simpan ringkasan schema yang aman di dokumentasi bila bermanfaat, tetapi jangan sertakan secret atau row data pribadi.

Jika akses Supabase tidak tersedia atau project tidak dapat diverifikasi, jangan mengaku sudah menginspeksi database. Tetap buat kode dan migration yang aman, catat prasyarat, dan lanjutkan tugas lain.

### 9.2 Perubahan database yang diizinkan

- Boleh menambahkan atau memperbaiki schema dan policy secara non-destruktif jika memang diperlukan oleh fitur.
- Prioritaskan migration SQL yang dapat diaudit dan diulang, di folder migration yang sesuai dengan tooling project.
- Pertahankan kompatibilitas dengan versi aplikasi yang sedang live selama masa transisi.
- Tambahkan kolom/tabel/index/policy terlebih dahulu; migrasikan data hanya jika mempunyai aturan transformasi yang jelas, aman, dan dapat diverifikasi.
- Jika ada tabel atau kolom duplikat/obsolete, dokumentasikan dan biarkan sampai rencana migrasi aman disepakati.
- Jangan menonaktifkan RLS demi membuat fitur bekerja.
- Jangan memasukkan data finance demo ke database produksi.
- Jangan menghapus, mengosongkan, mengganti owner, atau mengubah nominal transaksi yang telah tersimpan.

### 9.3 Security baseline

- Terapkan least privilege.
- Data personal finance harus dilindungi dengan RLS. Policy sebaiknya membatasi baris pada pemilik yang sesuai dengan `auth.uid()` atau desain kepemilikan yang sah dan diverifikasi. Sesuaikan pada schema nyata, jangan menyalin policy tanpa meneliti tabel.
- INSERT harus menetapkan owner/user_id yang benar; jangan percaya `user_id` dari body client tanpa validasi atau policy.
- UPDATE/DELETE harus memverifikasi ownership.
- Jangan ekspos Supabase `service_role` key di frontend, `VITE_*`, source code, README, logs, screenshots, atau commit. Public/anon key yang memang dibutuhkan frontend bukan pengganti RLS.
- API key AI harus disimpan sebagai server-side secret atau Supabase Edge Function secret; jangan dipaketkan ke aplikasi browser.
- Jika menggunakan Edge Function, validasi JWT/session jika sesuai, input, limit ukuran payload, tipe, dan rate/abuse controls sesuai kemampuan infrastruktur.
- Jangan mengirim seluruh riwayat transaksi ke model jika ringkasan/agregat cukup.
- Jangan log isi ucapan atau transaksi sensitif kecuali benar-benar diperlukan; kalau diperlukan, minimalkan dan redaksi.
- Pastikan kesalahan database tidak membocorkan schema sensitif atau credential.

### 9.4 Operasi yang butuh persetujuan terpisah

Walaupun akses untuk memeriksa dan memodifikasi Supabase diberikan, **berhenti sebelum menjalankan operasi destruktif atau sulit dibatalkan** yang berpotensi menghapus/mengubah data pengguna atau merusak project, termasuk `DROP TABLE/COLUMN`, truncate, delete massal, penggantian data riil, perubahan ownership besar-besaran, mematikan RLS, rotasi credential production, atau menghapus storage bucket. Buat alternatif non-destruktif dan jelaskan dampak yang diperkirakan; minta persetujuan eksplisit sebelum tindakan destruktif.

Jangan berhenti untuk minta izin saat menambahkan migration/policy non-destruktif yang aman dan diperlukan. Tetap jalankan validasi dan jelaskan apa yang diubah.

### 9.5 Database tests

- Buat test dengan akun/data sintetis jika test environment tersedia.
- Verifikasi bahwa user A tidak dapat melihat/mengubah data user B.
- Verifikasi INSERT dan UPDATE owner policy.
- Uji transaction lifecycle dan konsistensi data.
- Jangan gunakan row keuangan real sebagai fixture test.

---

## 10. Integrasi AI dan Arsitektur Backend

Audit semua panggilan AI saat ini. Periksa apakah pemrosesan berlangsung di browser, endpoint backend, atau Edge Function.

- Jika `VITE_OPENAI_KEY` atau secret model lain digunakan di frontend, pindahkan penggunaan secret ke server/Edge Function. Jangan mengandalkan minifikasi sebagai perlindungan.
- Jangan mengubah provider/model hanya untuk tren. Pertahankan yang berjalan atau pilih opsi yang kompatibel dengan konfigurasi yang benar-benar tersedia.
- Jangan membuat UI seolah menggunakan LLM jika fungsi sesungguhnya deterministic/static.
- Implementasikan input/output schema ketat dan validasi payload AI.
- Tangani timeouts, quota errors, rate limit, jaringan putus, invalid JSON, jawaban kosong, dan layanan tidak tersedia.
- Jangan membuat AI chat mengklaim telah menyimpan transaksi sebelum Supabase mengembalikan sukses.
- Jika AI hanya untuk parsing transaksi, berikan label/UX yang jujur. Jangan berpura-pura menjadi financial advisor ahli yang memprediksi masa depan atau memberi rekomendasi berisiko.
- Semua insight, grafik, dan ringkasan finansial harus berasal dari data pengguna aktual atau menyatakan dengan jelas bahwa datanya belum cukup.
- Terapkan redaksi data dan minimisasi prompt. Jangan mengirim nama lengkap, nomor kontak, atau catatan pribadi yang tidak diperlukan untuk parsing.

---

## 11. Arsitektur Frontend dan Kualitas Kode

Pertahankan struktur komponen yang mudah dirawat. Gunakan folder yang sudah ada jika konsisten; jangan melakukan reorganisasi masif hanya demi preferensi pribadi.

### Prinsip

- Pisahkan UI, state, data access, parsing/logic, dan scene 3D.
- Logika domain yang bisa diuji harus berupa fungsi terpisah dari komponen UI.
- Pertahankan provider dan API context bila layak, namun perbaiki kontrak yang tidak cocok.
- Hindari giant components untuk seluruh dashboard dan scroll world; pecah scene/chapter/model menjadi bagian yang jelas.
- Hindari prop drilling yang tidak perlu, tetapi jangan menambahkan state library baru jika context sudah cukup.
- Gunakan nama yang jelas, tipe data domain konsisten, dan error handling eksplisit.
- Jangan menambahkan dependency besar untuk fitur yang bisa dilakukan dengan code kecil dan teruji.
- Jangan meninggalkan `TODO`, `FIXME`, dummy action, disabled CTA yang tanpa alasan, hardcoded dummy data, atau `console.log` pada jalur production setelah menyelesaikan pekerjaan.
- Pastikan listener/modal/voice recognition/3D resources dibersihkan saat component unmount.
- Pastikan React Strict Mode tidak menyebabkan double subscriptions atau duplicate writes.

### State dan data consistency

- Sumber kebenaran transaksi harus jelas. Hindari saldo berbeda antara Dashboard, Analytics, Chat dan Transactions akibat state lokal yang tidak sinkron.
- Setelah insert/update/delete sukses, invalidasi/refetch atau update state bersama secara konsisten.
- Jangan mengubah local state menjadi status sukses sebelum operasi backend selesai.
- Gunakan loading/error/empty/success state pada operasi async.
- Cegah race condition, repeated click, double submit dan duplicate speech results.

---

## 12. Routing dan Deployment

SI-MAUNG memiliki deployment GitHub Pages. Pertahankan deployment yang ada kecuali audit menunjukkan konfigurasi perlu diperbaiki.

- Verifikasi `vite.config.js`, `package.json`, `BrowserRouter`, route path, asset path, auth redirect URL, serta `base` saat build.
- Untuk GitHub Pages yang memakai path `/SI-MAUNG/`, pastikan asset dan route menyadari base path yang sesuai. Jangan menganggap root domain jika aplikasinya dipasang di subpath.
- Pastikan route langsung (misalnya refresh di `/transactions` atau `/analytics`) bekerja dengan strategi hosting yang tersedia. Jika perlu fallback 404 untuk SPA, implementasikan sesuai kebijakan repo dan uji link.
- Jangan menimpa konfigurasi deployment yang tidak berhubungan dengan redesign.
- Jika menggunakan Supabase Auth redirect, dokumentasikan URL localhost dan URL production yang harus dikonfigurasi; jangan menganggapnya otomatis.
- Jangan deploy live, push branch, mengubah setting project cloud atau menerbitkan migration production kecuali workflow/izin yang tersedia jelas. Perubahan lokal dan verifikasi build harus diselesaikan terlebih dahulu.
- Periksa npm scripts sebelum menjalankan. Jangan mengasumsikan nama perintah.

---

## 13. Accessibility, Motion, dan Bahasa

- Bahasa utama UI adalah Bahasa Indonesia yang natural, ringkas, dan konsisten.
- Gunakan istilah konsisten: pemasukan, pengeluaran, saldo, transaksi, tujuan tabungan, dan catat dengan suara.
- Format mata uang menggunakan Rupiah/IDR secara konsisten. Gunakan locale `id-ID` dengan aturan format yang jelas.
- Semua form mempunyai label yang terhubung, error text yang dapat diakses, dan fokus keyboard yang masuk akal.
- Tombol icon-only harus punya accessible name.
- Navigation aktif harus terlihat dan ditandai dengan `aria-current` jika sesuai.
- Jangan hanya memakai warna untuk memaknai positif/negatif/error.
- Pastikan focus ring terlihat, modal mengelola fokus dengan benar, Escape menutup modal bila sesuai, dan fokus dikembalikan ke pemicu.
- Gunakan semantic HTML; hindari seluruh halaman dijadikan canvas.
- Hormati `prefers-reduced-motion` baik pada CSS maupun scene JavaScript/3D.
- Jangan mengandalkan hover pada perangkat sentuh.
- Pastikan seluruh informasi penting tetap tersedia tanpa animasi.
- Jangan menambahkan audio/video autoplay dengan suara.

---

## 14. Audit dan Perbaiki Masalah yang Ditemukan Sebelumnya

Periksa kembali apakah temuan berikut masih terjadi pada code terbaru. Perlakukan ini sebagai daftar verifikasi, bukan fakta yang tidak perlu diuji ulang.

1. **Modal dan tombol dashboard:** pernah ditemukan pemanggilan `openModal` dari `Dashboard.jsx`, sementara `ModalContext` hanya menyediakan fungsi seperti `openVoiceModal`/`closeVoiceModal`. Verifikasi kembali API context yang sesungguhnya; benahi agar setiap tombol mengarah ke modal/action yang tersedia.
2. **Input manual dan edit/hapus transaksi:** service transaksi pernah memiliki fungsi create/update/delete, sementara beberapa jalur UI belum lengkap. Hubungkan operasi yang dibutuhkan dengan validasi serta feedback yang benar.
3. **API key AI di browser:** periksa apakah ada `VITE_OPENAI_KEY` atau kunci rahasia yang digunakan dari frontend. Pindahkan panggilan rahasia ke backend/Edge Function bila masih terjadi.
4. **GitHub Pages base path:** periksa kesesuaian Vite base, React Router dan URL deployment `/SI-MAUNG/`.
5. **AI Insight statis:** pastikan tidak ada klaim angka/persentase hardcoded tanpa perhitungan data yang mendukung.
6. **Progres tabungan:** pastikan kontribusi dan current amount punya alur persistence yang jelas, atau jangan tampilkan progress yang tidak dapat berubah.
7. **Gambar empty state:** verifikasi semua image URL benar-benar ada dan bisa dimuat.
8. **Tombol microphone mobile navbar:** verifikasi tombol melakukan aksi nyata, tidak hanya menulis ke console atau menjadi komentar.
9. **AI chat message lifecycle:** pastikan ID pesan stabil, confirm/cancel tidak menghapus pesan yang salah dan submit tidak membuat duplikat.
10. **Reset password/Auth:** verifikasi callback/token flow sesuai konfigurasi Supabase nyata.
11. **README dan file sementara:** perbarui dokumentasi; identifikasi `tmp_*.py` dan script debug. Jangan menghapus file pengguna secara otomatis: periksa isi dan relevansi, lalu singkirkan hanya bila aman dan tepat.
12. **Folder `retro-future/`:** tentukan apakah ini demo yang masih dipakai. Jangan mencampurnya ke aplikasi utama tanpa alasan. Periksa referensi asset dan lisensi bila dipertahankan.

Bila ditemukan masalah tambahan, perbaiki selama masih dalam scope dan bisa diuji dengan aman.

---

## 15. Pengujian dan Definition of Done

Pekerjaan belum dianggap selesai sampai checklist berikut diverifikasi. Tandai hanya yang benar-benar diperiksa.

### Fungsi inti
- [ ] Login/registrasi/logout dan protected routes bekerja sesuai konfigurasi.
- [ ] Onboarding, reset password dan error state ditangani.
- [ ] Dashboard menampilkan saldo, pemasukan, pengeluaran dan transaksi terbaru dari user yang sedang login.
- [ ] Catat transaksi manual bekerja.
- [ ] Voice capture membuka dan menutup dengan benar, state izin dikenali, fallback tersedia.
- [ ] Parsing ucapan menghasilkan tipe, nominal, kategori, deskripsi dan tanggal yang masuk akal atau meminta koreksi bila ambigu.
- [ ] Pengguna dapat meninjau/mengedit hasil sebelum menyimpan.
- [ ] Tidak ada transaksi duplikat dari satu sesi voice recognition.
- [ ] INSERT transaksi tersimpan di Supabase dan UI diperbarui setelah sukses.
- [ ] Search/filter transaksi berfungsi; edit/hapus berfungsi bila tersedia di UI.
- [ ] Tujuan tabungan dibuat, dibaca, dan progres persisten jika fitur kontribusi dibuat.
- [ ] Grafik analitik menggunakan data aktual dan empty state jujur.
- [ ] Insight AI dihitung dengan data atau menyatakan belum cukup data.
- [ ] Settings hanya menampilkan kontrol yang betul-betul berfungsi.
- [ ] Semua CTA, menu, link, tab, modal, chart control dan tombol icon bekerja.

### 3D dan scroll
- [ ] Model/scene 3D benar-benar dirender dengan geometry/model, material, lighting dan kamera.
- [ ] Karakter memiliki idle motion terarah.
- [ ] Progres scroll mengubah state scene secara nyata pada beberapa babak.
- [ ] Tidak ada horizontal overflow atau elemen 3D yang menutupi teks/CTA.
- [ ] Resize/orientasi mobile/route changes tidak merusak scene.
- [ ] Loading dan error fallback tersedia.
- [ ] `prefers-reduced-motion` dihormati.
- [ ] WebGL fallback tetap memungkinkan akses ke seluruh fungsi penting.
- [ ] Resource/listener dibersihkan dengan baik.

### Security dan Supabase
- [ ] Tidak ada secret yang masuk ke source/client bundle/repository.
- [ ] Panggilan AI dengan secret berjalan di server/Edge Function, bukan dari browser.
- [ ] Tabel finansial mempunyai RLS/policy yang sesuai schema aktual.
- [ ] User tidak bisa membaca atau mengubah data user lain.
- [ ] Tidak ada data keuangan produksi yang dihapus/diubah tanpa rencana aman dan persetujuan.
- [ ] Semua migration atau perubahan database didokumentasikan.

### Responsif dan kualitas
- [ ] Diuji pada width 320, 360, 390, 430, 768, 1024, 1280, 1440 px jika tooling memungkinkan.
- [ ] Tidak ada horizontal overflow.
- [ ] Keyboard mobile tidak menutupi field/action.
- [ ] Reduced-motion, keyboard navigation, focus dan contrast diperiksa.
- [ ] `npm run build` berhasil (atau catat blocker yang bukan berasal dari perubahan).
- [ ] `npm run lint` berhasil atau masalah dituliskan jelas.
- [ ] Tes baru/lama berjalan.
- [ ] Route utama, assets dan auth redirect diperiksa.
- [ ] README dan dokumentasi konfigurasi diperbarui.

**Jika suatu poin tidak bisa diuji karena akses, dependency atau layanan eksternal tidak tersedia, tulis secara eksplisit sebagai belum diverifikasi—jangan centang.**

---

## 16. Dokumentasi yang Harus Ditinggalkan

Perbarui `README.md` sehingga menggambarkan aplikasi sebenarnya, bukan template React + Vite bawaan. Dokumentasikan:
- apa itu SI-MAUNG dan fitur nyata yang tersedia;
- stack utama;
- prasyarat Node/npm dan perintah run/build/lint/test sesuai package scripts;
- env vars dengan nama dan tujuan, **tanpa nilai secret**;
- setup Supabase, migration, RLS dan Edge Function jika dibuat;
- cara menguji voice feature serta fallback browser;
- cara build untuk GitHub Pages dan base path;
- karakteristik 3D, fallback reduced-motion/WebGL, dan strategi responsif;
- masalah yang masih belum selesai jika ada.

Jika perlu dokumentasi tambahan, buat ringkas dan akurat, misalnya `docs/ARCHITECTURE.md`, `docs/SUPABASE.md`, atau `docs/3D-EXPERIENCE.md`. Jangan menulis dokumentasi spekulatif.

---

## 17. Urutan Implementasi yang Disarankan

Gunakan urutan berikut, tetapi ubah jika dependensi nyata dalam repository mengharuskan susunan lain.

1. **Repository & baseline:** git status, source audit, dependency/build baseline, identifikasi alur utama.
2. **Stabilisasi fitur:** perbaiki provider/modal, voice entry point, transaction lifecycle, data consistency, asset errors, dan security issue yang nyata.
3. **Design system:** tetapkan tokens, typography, navigation, base surfaces, responsive behavior.
4. **3D foundation:** siapkan lazy-loaded scene, model MAUNG orisinal, loading/fallback/reduced-motion, resource cleanup.
5. **Scroll choreography:** hubungkan progress scroll dengan babak scene dan section konten bermakna.
6. **Voice-first workflow:** selesaikan state, parser, preview, validation, confirm, persistence dan error handling.
7. **Finance feature polish:** transaction CRUD, analytics, savings workflow, real insights, settings yang benar-benar bekerja.
8. **Supabase & security:** cocokkan frontend ke schema, migrations/policies/edge functions bila diperlukan, test ownership.
9. **Responsive/performance:** test breakpoint dan low-power fallback, optimalkan bundle dan WebGL.
10. **QA/docs:** build, lint, test, review semua UI states, update README dan laporan akhir.

Jangan mengikuti urutan secara kaku bila ditemukan error P0/security yang harus diselesaikan lebih dahulu.

---

## 18. Bentuk Laporan Akhir kepada Pemilik Proyek

Ketika pekerjaan selesai, berikan laporan Bahasa Indonesia yang praktis:

1. **Ringkasan perubahan**: visual, 3D, scroll, fitur finansial, voice, mobile.
2. **Model/scene yang dibangun**: jelaskan apakah procedural atau GLB dan file utama yang memuatnya.
3. **Fitur yang diperbaiki**: cantumkan bug sebelum/sesudah.
4. **Supabase**: tabel/policy/migration/function yang disentuh, apakah perubahan benar-benar berhasil diterapkan, dan test security yang dijalankan. Jangan mencantumkan secret atau row data pengguna.
5. **File penting yang dibuat/diubah**.
6. **Tes yang benar-benar berjalan**: build/lint/test, viewport/browser, dan hasilnya.
7. **Cara menjalankan lokal** dan env vars yang diperlukan (nama saja, tidak ada nilai rahasia).
8. **Yang belum diverifikasi / blocker**. Jangan menutupi hal yang belum berhasil.
9. **Status deployment**: bedakan build lokal berhasil dari deploy live berhasil.

### Instruksi penutup

Berpikir dan bekerja seperti tim senior yang bertanggung jawab atas produk sungguhan. Buat keputusan yang matang, pertahankan data pengguna, jangan puas dengan demo visual dangkal, dan jangan berhenti setelah memberi rencana. Implementasikan pengalaman SI-MAUNG yang original, hidup, cepat, responsif di HP, aman, dan tetap berguna untuk pencatatan uang sehari-hari.
