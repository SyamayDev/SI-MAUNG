/**
 * Public landing — the same six-chapter MAUNG story as the dashboard, in
 * "illustration" mode: the 3D shows motion, never figures. The voice chapter
 * runs the real on-device parser so visitors can try it before signing up.
 */
import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BarChart3, LogIn, Mic, PiggyBank, ShieldCheck, Sparkles } from "lucide-react";
import ThemeToggle from "../components/ui/ThemeToggle";
import ChapterRail, { Chapter, Kicker } from "../components/story/ChapterRail";
import ParsePreview from "../components/story/ParsePreview";
import Logo from "../components/ui/Logo";
import { startStory } from "../lib/scrollStory";
import { setScene } from "../lib/sceneStore";

const LABELS = ["Mulai", "Suara", "Arus", "Pola", "Tabungan", "Kendali"];

export default function Landing() {
  const storyRef = useRef(null);

  useEffect(() => {
    setScene({ data: { flow: null, categories: [], goal: null, demo: true } });
    const stop = startStory(storyRef.current, { headerOffset: () => 64 });
    return () => {
      stop();
      setScene({ data: { flow: null, categories: [], goal: null, demo: false } });
    };
  }, []);

  return (
    <div className="landing">
      <a href="#mulai" className="skip-link">
        Lewati ke konten
      </a>
      <header className="landing__bar on-stage">
        <Link to="/" aria-label="SI-MAUNG — Beranda">
          <Logo size={36} />
        </Link>
        <nav className="landing__actions" aria-label="Akun dan tampilan">
          <ThemeToggle />
          <Link to="/login" className="btn btn--sm">
            <LogIn size={15} aria-hidden="true" /> Masuk
          </Link>
          <Link to="/register" className="btn btn--sm btn--amber">
            Daftar
          </Link>
        </nav>
      </header>

      <main className="story story--landing" ref={storyRef} id="mulai">
        <ChapterRail labels={LABELS} />

        <Chapter index={0} labelledBy="l-hero" className="on-stage">
          <p className="eyebrow reveal">
            <Sparkles size={14} aria-hidden="true" /> Sistem Informasi Manajemen Keuangan
          </p>
          <h1 id="l-hero" className="chapter__title display reveal" style={{ "--i": 1, fontSize: "var(--fs-display)" }}>
            Kenali <span className="accent-italic">uangmu.</span>
          </h1>
          <p className="chapter__lead reveal" style={{ "--i": 2 }}>
            SI-MAUNG mencatat pemasukan dan pengeluaranmu cukup dari satu kalimat. Bilang “beli bensin 50 ribu”, periksa, simpan — selesai.
          </p>
          <div className="hero__actions reveal" style={{ "--i": 3 }}>
            <Link to="/register" className="btn btn--amber btn--lg">
              <Mic size={20} aria-hidden="true" /> Mulai mencatat — gratis
            </Link>
            <Link to="/login" className="btn btn--lg">
              Saya sudah punya akun
            </Link>
          </div>
        </Chapter>

        <Chapter index={1} labelledBy="l-voice" className="on-stage">
          <Kicker n={2}>Catat dengan suara</Kicker>
          <h2 id="l-voice" className="chapter__title display reveal" style={{ "--i": 1 }}>
            Ucapkan, <span className="accent-italic">MAUNG catat.</span>
          </h2>
          <p className="chapter__lead reveal" style={{ "--i": 2 }}>
            Bahasa sehari-hari: “dua puluh lima ribu”, “25rb”, “1,5 juta”, “kemarin”. Coba sendiri di bawah.
          </p>
          <div className="panel reveal" style={{ "--i": 3 }}>
            <ParsePreview />
          </div>
        </Chapter>

        <Chapter index={2} labelledBy="l-flow" className="on-stage">
          <Kicker n={3}>Pemasukan & pengeluaran</Kicker>
          <h2 id="l-flow" className="chapter__title display reveal" style={{ "--i": 1 }}>
            Setiap arus <span className="accent-italic">punya arti.</span>
          </h2>
          <p className="chapter__lead reveal" style={{ "--i": 2 }}>
            Uang masuk dan keluar dipisahkan jelas — dengan tanda, ikon, dan label, bukan hanya warna. Saldo, total bulanan, dan riwayat selalu dihitung dari catatanmu sendiri.
          </p>
          <p className="chip reveal" style={{ "--i": 3, marginTop: "var(--sp-4)" }}>
            Animasi di sini ilustrasi — setelah masuk, alirannya mengikuti data bulananmu.
          </p>
        </Chapter>

        <Chapter index={3} labelledBy="l-pattern" className="on-stage">
          <Kicker n={4}>Analitik</Kicker>
          <h2 id="l-pattern" className="chapter__title display reveal" style={{ "--i": 1 }}>
            Lihat pola, <span className="accent-italic">bukan tebakan.</span>
          </h2>
          <p className="chapter__lead reveal" style={{ "--i": 2 }}>
            Kategori terbesar, perbandingan dengan bulan lalu pada rentang tanggal yang sama, rata-rata harian. Setiap wawasan menyebut dasar perhitungannya — dan tidak muncul bila datanya belum cukup.
          </p>
          <p className="row reveal" style={{ "--i": 3, marginTop: "var(--sp-4)" }}>
            <BarChart3 size={18} aria-hidden="true" /> Grafik bulanan, rincian kategori, dan tabel ringkas.
          </p>
        </Chapter>

        <Chapter index={4} labelledBy="l-savings" className="on-stage">
          <Kicker n={5}>Tujuan tabungan</Kicker>
          <h2 id="l-savings" className="chapter__title display reveal" style={{ "--i": 1 }}>
            Sedikit demi <span className="accent-italic">sedikit.</span>
          </h2>
          <p className="chapter__lead reveal" style={{ "--i": 2 }}>
            Tetapkan target dan batas waktu, setor kapan saja. MAUNG menghitung sisa dan berapa yang perlu disisihkan tiap bulan.
          </p>
          <p className="row reveal" style={{ "--i": 3, marginTop: "var(--sp-4)" }}>
            <PiggyBank size={18} aria-hidden="true" /> Progres tersimpan di akunmu, bukan sekadar animasi.
          </p>
        </Chapter>

        <Chapter index={5} labelledBy="l-control" className="on-stage">
          <Kicker n={6}>Kendali</Kicker>
          <h2 id="l-control" className="chapter__title display reveal" style={{ "--i": 1 }}>
            Keuanganmu, <span className="accent-italic">tetap dalam kendalimu.</span>
          </h2>
          <ul className="landing__promises reveal" style={{ "--i": 2 }}>
            <li>
              <ShieldCheck size={18} aria-hidden="true" /> Audio tidak direkam atau disimpan; kalimatmu dibaca di perangkat.
            </li>
            <li>
              <ShieldCheck size={18} aria-hidden="true" /> Tidak ada transaksi yang tersimpan tanpa kamu periksa dulu (kecuali kamu menyalakan simpan otomatis).
            </li>
            <li>
              <ShieldCheck size={18} aria-hidden="true" /> Tetap bisa dipakai tanpa suara: ketik kalimat atau isi formulir.
            </li>
          </ul>
          <div className="hero__actions reveal" style={{ "--i": 3 }}>
            <Link to="/register" className="btn btn--amber btn--lg">
              Buat akun <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <Link to="/login" className="btn btn--lg">
              Masuk
            </Link>
          </div>
        </Chapter>
        <footer className="story-footer">SI-MAUNG · Sistem Informasi Manajemen Keuangan</footer>
      </main>
    </div>
  );
}
