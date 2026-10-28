/**
 * Public landing — the same six-chapter MAUNG story as the dashboard, in
 * "illustration" mode: the 3D shows motion, never figures. The voice chapter
 * runs the real on-device parser so visitors can try it before signing up.
 */
import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { BarChart3, CalendarClock, Keyboard, LogIn, Mic, PiggyBank, ShieldCheck, Sparkles, Target, TrendingUp, UserPlus, Wallet } from "lucide-react";
import ThemeToggle from "../components/ui/ThemeToggle";
import FullscreenToggle from "../components/ui/FullscreenToggle";
import LandingMenu from "../components/layouts/LandingMenu";
import ChapterRail, { Chapter, Deck, Kicker, Step, StepDots } from "../components/story/ChapterRail";
import ParsePreview from "../components/story/ParsePreview";
import Logo from "../components/ui/Logo";
import { startStory } from "../lib/scrollStory";
import { setScene } from "../lib/sceneStore";

const LABELS = ["Mulai", "Suara", "Arus", "Analitik", "Tabungan", "Privasi"];

export default function Landing() {
  const storyRef = useRef(null);

  useEffect(() => {
    setScene({ data: { flow: null, categories: [], goal: null, demo: true } });
    const stop = startStory(storyRef.current);
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
        <Link to="/" className="landing__brand" aria-label="SI MAUNG — Beranda">
          <Logo size={36} />
        </Link>
        <div className="landing__actions">
          <div className="landing__auth">
            <Link to="/login" className="btn">
              <LogIn size={18} aria-hidden="true" /> Masuk
            </Link>
            <Link to="/register" className="btn btn--amber">
              <UserPlus size={18} aria-hidden="true" /> Daftar gratis
            </Link>
          </div>
          <div className="round-group">
            <ThemeToggle />
            <FullscreenToggle />
            <LandingMenu />
          </div>
        </div>
      </header>

      <main className="story story--landing" ref={storyRef} id="mulai">
        <ChapterRail labels={LABELS} />

        <Chapter index={0} labelledBy="l-hero" className="on-stage">
          <p className="eyebrow reveal">
            <Sparkles size={14} aria-hidden="true" /> Pencatat keuangan pribadi
          </p>
          <h1 id="l-hero" className="chapter__title display reveal" style={{ "--i": 1, fontSize: "var(--fs-display)" }}>
            Catat uang, <span className="accent-italic">cukup ngomong.</span>
          </h1>
          <p className="chapter__lead reveal" style={{ "--i": 2 }}>
            Bilang “beli bensin 50 ribu”. MAUNG mengisi nominal, kategori, dan tanggalnya. Kamu cek sebentar, lalu simpan.
          </p>
          <div className="hero__actions reveal" style={{ "--i": 3 }}>
            <Link to="/register" className="btn btn--amber btn--lg">
              <Mic size={20} aria-hidden="true" /> Mulai mencatat
            </Link>
            <Link to="/login" className="btn btn--lg">
              <LogIn size={19} aria-hidden="true" /> Sudah punya akun
            </Link>
          </div>
        </Chapter>

        <Chapter index={1} steps={2} labelledBy="l-voice" className="on-stage">
          <Kicker n={2} icon={Mic}>
            Catat dengan suara
          </Kicker>
          <h2 id="l-voice" className="chapter__title display reveal" style={{ "--i": 1 }}>
            Bilang saja, <span className="accent-italic">MAUNG yang menulis.</span>
          </h2>
          <StepDots labels={["Cara kerja", "Coba sendiri"]} />
          <Deck>
            <Step n={0}>
              <div className="panel">
                <p className="deck__title">
                  <span className="deck__icon" aria-hidden="true">
                    <Sparkles size={16} />
                  </span>
                  Pakai bahasa sehari-hari
                </p>
                <p className="muted">“25rb”, “dua puluh lima ribu”, atau “1,5 juta” sama-sama terbaca. Kata seperti “kemarin” dan “tadi pagi” langsung jadi tanggal.</p>
                <ul className="landing__promises" style={{ marginTop: "var(--sp-3)" }}>
                  <li>
                    <Mic size={18} aria-hidden="true" /> Bicara lewat mikrofon, atau ketik kalimatnya.
                  </li>
                  <li>
                    <ShieldCheck size={18} aria-hidden="true" /> Bagian yang belum jelas ditandai. Kamu yang memutuskan.
                  </li>
                </ul>
              </div>
            </Step>
            <Step n={1}>
              <div className="panel">
                <ParsePreview />
              </div>
            </Step>
          </Deck>
        </Chapter>

        <Chapter index={2} labelledBy="l-flow" className="on-stage">
          <Kicker n={3} icon={Wallet}>
            Pemasukan & pengeluaran
          </Kicker>
          <h2 id="l-flow" className="chapter__title display reveal" style={{ "--i": 1 }}>
            Masuk dan keluar, <span className="accent-italic">kelihatan jelas.</span>
          </h2>
          <p className="chapter__lead reveal" style={{ "--i": 2 }}>
            Setiap catatan diberi tanda plus atau minus, ikon, dan label. Saldo dan total bulanan dihitung dari catatanmu sendiri.
          </p>
          <ul className="feature-list reveal" style={{ "--i": 3 }}>
            <li>
              <TrendingUp size={18} aria-hidden="true" /> Selisih bulan ini langsung terlihat
            </li>
            <li>
              <Keyboard size={18} aria-hidden="true" /> Ubah atau hapus catatan kapan saja
            </li>
          </ul>
          <p className="chip reveal" style={{ "--i": 4, marginTop: "var(--sp-4)" }}>
            Animasi di sini contoh. Setelah masuk, alirannya mengikuti datamu.
          </p>
        </Chapter>

        <Chapter index={3} labelledBy="l-pattern" className="on-stage">
          <Kicker n={4} icon={BarChart3}>
            Analitik
          </Kicker>
          <h2 id="l-pattern" className="chapter__title display reveal" style={{ "--i": 1 }}>
            Tahu ke mana <span className="accent-italic">uangmu pergi.</span>
          </h2>
          <p className="chapter__lead reveal" style={{ "--i": 2 }}>
            Lihat kategori yang paling banyak makan biaya, bandingkan dengan bulan lalu, dan cek rata-rata harian. Setiap angka disertai cara menghitungnya.
          </p>
          <ul className="feature-list reveal" style={{ "--i": 3 }}>
            <li>
              <BarChart3 size={18} aria-hidden="true" /> Grafik bulanan dan rincian per kategori
            </li>
            <li>
              <CalendarClock size={18} aria-hidden="true" /> Pilih rentang 3, 6, atau 12 bulan
            </li>
          </ul>
        </Chapter>

        <Chapter index={4} labelledBy="l-savings" className="on-stage">
          <Kicker n={5} icon={PiggyBank}>
            Tabungan
          </Kicker>
          <h2 id="l-savings" className="chapter__title display reveal" style={{ "--i": 1 }}>
            Nabung untuk <span className="accent-italic">yang kamu incar.</span>
          </h2>
          <p className="chapter__lead reveal" style={{ "--i": 2 }}>
            Tulis targetnya dan kapan ingin tercapai. MAUNG menghitung sisanya dan berapa yang perlu disisihkan tiap bulan.
          </p>
          <ul className="feature-list reveal" style={{ "--i": 3 }}>
            <li>
              <Target size={18} aria-hidden="true" /> Beberapa target sekaligus
            </li>
            <li>
              <PiggyBank size={18} aria-hidden="true" /> Setor dan tarik, progres tersimpan di akunmu
            </li>
          </ul>
        </Chapter>

        <Chapter index={5} steps={2} labelledBy="l-control" className="on-stage">
          <Kicker n={6} icon={ShieldCheck}>
            Privasi
          </Kicker>
          <h2 id="l-control" className="chapter__title display reveal" style={{ "--i": 1 }}>
            Datamu tetap <span className="accent-italic">milikmu.</span>
          </h2>
          <Deck>
            <Step n={0}>
              <ul className="landing__promises">
                <li>
                  <Mic size={18} aria-hidden="true" /> Suaramu tidak direkam atau disimpan. Kalimatnya dibaca langsung di perangkat.
                </li>
                <li>
                  <ShieldCheck size={18} aria-hidden="true" /> Tidak ada transaksi yang tersimpan sebelum kamu cek, kecuali kamu sendiri menyalakan simpan otomatis.
                </li>
                <li>
                  <Keyboard size={18} aria-hidden="true" /> Tidak bisa pakai suara? Ketik kalimatnya atau isi formulir.
                </li>
              </ul>
            </Step>
            <Step n={1}>
              <p className="chapter__lead" style={{ marginTop: 0 }}>
                Gratis. Daftar pakai email, lalu coba catat transaksi pertamamu.
              </p>
              <div className="hero__actions">
                <Link to="/register" className="btn btn--amber btn--lg">
                  <UserPlus size={19} aria-hidden="true" /> Daftar gratis
                </Link>
                <Link to="/login" className="btn btn--lg">
                  <LogIn size={19} aria-hidden="true" /> Masuk
                </Link>
              </div>
              <p className="story-footer">SI-MAUNG · Sistem Informasi Manajemen Keuangan</p>
            </Step>
          </Deck>
        </Chapter>
      </main>
    </div>
  );
}
