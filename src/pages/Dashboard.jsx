/**
 * Beranda — the signed-in dashboard as a six-chapter scroll story. Every
 * chapter is real product UI fed by the user's own data; the 3D MAUNG world
 * behind it reacts to the same figures (lib/sceneStore → three/world).
 * Balance and the record button are on the first screen, no scrolling needed.
 */
import { useEffect, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowDownLeft, ArrowRight, ArrowUpRight, BarChart3, Bot, History, Keyboard, LayoutGrid, Mic, PenLine, PiggyBank, RefreshCw, Settings, Wallet } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useFinance } from "../context/FinanceContext";
import { useModal } from "../context/ModalContext";
import ChapterRail, { Chapter, Deck, Kicker, Step, StepDots } from "../components/story/ChapterRail";
import TransactionRow from "../components/transactions/TransactionRow";
import CategoryIcon from "../components/ui/CategoryIcon";
import ProgressRing from "../components/ui/ProgressRing";
import Button from "../components/ui/Button";
import { startStory } from "../lib/scrollStory";
import { setScene } from "../lib/sceneStore";
import { buildInsights, categoryBreakdown, goalsProgress, inRange, monthSummary } from "../lib/finance/summary";
import { categoryColor } from "../lib/finance/categories";
import { formatPercent, formatRupiah, formatSigned } from "../lib/finance/format";
import { EXAMPLE_PHRASES } from "../lib/finance/examples";

const LABELS = ["Ringkasan", "Suara", "Arus", "Analitik", "Tabungan", "Menu"];

function greeting(now = new Date()) {
  const h = now.getHours();
  if (h < 11) return "Selamat pagi";
  if (h < 15) return "Selamat siang";
  if (h < 19) return "Selamat sore";
  return "Selamat malam";
}

function Skeleton({ w = "100%", h = 18, style }) {
  return <span className="skeleton" style={{ display: "block", width: w, height: h, ...style }} aria-hidden="true" />;
}

export default function Dashboard() {
  const storyRef = useRef(null);
  const navigate = useNavigate();
  const { displayName } = useAuth();
  const { openCapture, openManual, openEdit } = useModal();
  const { transactions, txStatus, txError, refreshTransactions, goals, goalsStatus, balance } = useFinance();

  const now = useMemo(() => new Date(), []);
  const month = useMemo(() => monthSummary(transactions, now), [transactions, now]);
  const monthTx = useMemo(() => inRange(transactions, month.from, month.to), [transactions, month.from, month.to]);
  const categories = useMemo(() => categoryBreakdown(monthTx, "expense"), [monthTx]);
  const insights = useMemo(() => buildInsights(transactions, now).slice(0, 3), [transactions, now]);
  const progress = useMemo(() => goalsProgress(goals), [goals]);
  const voiceTx = useMemo(() => transactions.filter((t) => t.source === "voice").slice(0, 3), [transactions]);
  const recent = transactions.slice(0, 5);
  const loading = txStatus === "loading" || txStatus === "idle";

  useEffect(() => startStory(storyRef.current), []);

  // Feed the 3D world the same figures the panels show (nothing invented).
  useEffect(() => {
    setScene({
      data: {
        flow: month.income + month.expense > 0 ? { income: month.income, expense: month.expense } : null,
        categories: categories.slice(0, 5).map((c) => ({ share: c.share, color: categoryColor(c.category) })),
        goal: progress ? progress.ratio : null,
        demo: false,
      },
    });
  }, [month.income, month.expense, categories, progress]);
  useEffect(() => () => setScene({ data: { flow: null, categories: [], goal: null, demo: false }, mood: "idle" }), []);

  const maxFlow = Math.max(month.income, month.expense, 1);
  const firstName = (displayName || "").split(" ")[0];

  return (
    <div className="story story--dash" ref={storyRef}>
      <ChapterRail labels={LABELS} />

      {/* 01 — balance and the record button, first screen */}
      <Chapter index={0} labelledBy="ch-hero" className="chapter--hero on-stage">
        <p className="hero__hello reveal">
          {greeting(now)}
          {firstName ? `, ${firstName}` : ""}.
        </p>
        <h1 id="ch-hero" className="chapter__title display reveal" style={{ "--i": 1 }}>
          Ringkasan <span className="accent-italic">uangmu.</span>
        </h1>

        <p className="hero__balance-label reveal" style={{ "--i": 2 }}>
          Saldo tercatat
        </p>
        {loading ? (
          <Skeleton w="70%" h={56} style={{ background: "rgb(255 255 255 / 0.08)", marginTop: 6 }} />
        ) : (
          <p className={`hero__balance reveal ${balance < 0 ? "is-negative" : ""}`} style={{ "--i": 2 }}>
            {formatRupiah(balance)}
          </p>
        )}
        <p className="hero__note reveal" style={{ "--i": 3 }}>
          Total pemasukan dikurangi pengeluaran dari semua catatanmu.
        </p>

        <div className="hero__month reveal" style={{ "--i": 3 }}>
          <div className="stat-night">
            <p className="stat-night__label">
              <ArrowDownLeft size={14} aria-hidden="true" /> Masuk · {month.label}
            </p>
            <p className="stat-night__value stat-night__value--income">{loading ? "…" : formatSigned(month.income, "income")}</p>
          </div>
          <div className="stat-night">
            <p className="stat-night__label">
              <ArrowUpRight size={14} aria-hidden="true" /> Keluar · {month.label}
            </p>
            <p className="stat-night__value stat-night__value--expense">{loading ? "…" : formatSigned(month.expense, "expense")}</p>
          </div>
        </div>

        {txStatus === "error" && (
          <div className="callout callout--error" role="alert" style={{ marginTop: "var(--sp-4)" }}>
            <span className="grow">{txError}</span>
            <Button size="sm" onClick={refreshTransactions}>
              <RefreshCw size={14} aria-hidden="true" /> Coba lagi
            </Button>
          </div>
        )}

        <div className="hero__actions reveal" style={{ "--i": 4 }}>
          <Button variant="amber" size="lg" onClick={() => openCapture()}>
            <Mic size={20} aria-hidden="true" /> Catat dengan suara
          </Button>
          <Button size="lg" onClick={() => openCapture({ mode: "text" })}>
            <Keyboard size={18} aria-hidden="true" /> Ketik
          </Button>
          <Button size="lg" onClick={() => openManual()}>
            <PenLine size={18} aria-hidden="true" /> Manual
          </Button>
        </div>
      </Chapter>

      {/* 02 — voice: three steps that take turns in place */}
      <Chapter index={1} steps={3} labelledBy="ch-voice" className="on-stage">
        <Kicker n={2} icon={Mic}>
          Catat dengan suara
        </Kicker>
        <h2 id="ch-voice" className="chapter__title display reveal" style={{ "--i": 1 }}>
          Bilang saja, <span className="accent-italic">MAUNG yang menulis.</span>
        </h2>
        <StepDots labels={["Ucapkan", "Periksa", "Simpan"]} />
        <Deck>
          <Step n={0}>
            <div className="panel">
              <p className="deck__title">
                <b>1</b> Ucapkan
              </p>
              <p className="muted">Contohnya “kemarin beli buku 45 ribu”. Atau pilih salah satu kalimat ini:</p>
              <div className="row" style={{ marginTop: "var(--sp-3)", gap: "var(--sp-2)" }}>
                {EXAMPLE_PHRASES.slice(0, 3).map((p) => (
                  <button key={p} type="button" className="chip" onClick={() => openCapture({ mode: "text", text: p })}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </Step>
          <Step n={1}>
            <div className="panel">
              <p className="deck__title">
                <b>2</b> Periksa
              </p>
              <p className="muted">MAUNG mengisi nominal, jenis, kategori, dan tanggal. Bagian yang belum pasti ditandai supaya bisa kamu ubah. Tidak ada yang tersimpan sebelum kamu setuju.</p>
              <div className="deck__more">
                <Button onClick={() => openCapture({ mode: "text" })}>
                  <Keyboard size={16} aria-hidden="true" /> Coba ketik kalimat
                </Button>
              </div>
            </div>
          </Step>
          <Step n={2}>
            <div className="panel">
              <p className="deck__title">
                <b>3</b> Simpan
              </p>
              <p className="muted">Begitu kamu tekan Simpan, catatannya masuk ke akunmu.</p>
              <p className="field__label" style={{ marginTop: "var(--sp-3)" }}>
                Terakhir dicatat lewat suara
              </p>
              {voiceTx.length ? (
                <ul className="tx-list">
                  {voiceTx.slice(0, 1).map((tx) => (
                    <TransactionRow key={tx.id} tx={tx} />
                  ))}
                </ul>
              ) : (
                <p className="muted" style={{ fontSize: "var(--fs-sm)", marginTop: "var(--sp-1)" }}>
                  Belum ada catatan suara.{" "}
                  <button type="button" className="link-btn" onClick={() => openCapture()}>
                    Coba sekarang
                  </button>
                </p>
              )}
            </div>
          </Step>
        </Deck>
      </Chapter>

      {/* 03 — inflow / outflow this month, then the latest records */}
      <Chapter index={2} steps={2} labelledBy="ch-flow" className="on-stage">
        <Kicker n={3} icon={Wallet}>
          Arus {month.label}
        </Kicker>
        <h2 id="ch-flow" className="chapter__title display reveal" style={{ "--i": 1 }}>
          Masuk dan keluar <span className="accent-italic">bulan ini.</span>
        </h2>
        <StepDots labels={["Masuk & keluar", "Transaksi terbaru"]} />
        <Deck>
          <Step n={0}>
            <div className="panel">
              {loading ? (
                <div className="stack">
                  <Skeleton h={22} />
                  <Skeleton h={22} />
                </div>
              ) : (
                <div className="flow-compare" aria-label={`Arus ${month.label}`}>
                  <div className="flow-bar">
                    <div className="flow-bar__head">
                      <span>
                        <ArrowDownLeft size={14} aria-hidden="true" style={{ display: "inline", verticalAlign: "-2px" }} /> Pemasukan
                      </span>
                      <span className="text-income num">{formatSigned(month.income, "income")}</span>
                    </div>
                    <div className="flow-bar__track">
                      <div className="flow-bar__fill flow-bar__fill--income" style={{ width: `${(month.income / maxFlow) * 100}%` }} />
                    </div>
                  </div>
                  <div className="flow-bar">
                    <div className="flow-bar__head">
                      <span>
                        <ArrowUpRight size={14} aria-hidden="true" style={{ display: "inline", verticalAlign: "-2px" }} /> Pengeluaran
                      </span>
                      <span className="text-expense num">{formatSigned(month.expense, "expense")}</span>
                    </div>
                    <div className="flow-bar__track">
                      <div className="flow-bar__fill flow-bar__fill--expense" style={{ width: `${(month.expense / maxFlow) * 100}%` }} />
                    </div>
                  </div>
                  <p className="net-line">
                    <span>Selisih {month.label}</span>
                    <span className={`num ${month.net >= 0 ? "text-income" : "text-expense"}`}>{formatRupiah(month.net)}</span>
                  </p>
                </div>
              )}
            </div>
          </Step>
          <Step n={1}>
            <div className="panel">
              <div className="panel__head" style={{ marginBottom: 0 }}>
                <h3 className="panel__title" style={{ fontSize: "var(--fs-md)" }}>
                  Transaksi terbaru
                </h3>
                <Link to="/transactions" className="link-btn" style={{ fontSize: "var(--fs-sm)" }}>
                  Semua riwayat
                </Link>
              </div>
              {recent.length ? (
                <ul className="tx-list">
                  {recent.slice(0, 3).map((tx) => (
                    <TransactionRow key={tx.id} tx={tx} onEdit={openEdit} />
                  ))}
                </ul>
              ) : (
                <p className="muted" style={{ fontSize: "var(--fs-sm)", marginTop: "var(--sp-2)" }}>
                  {loading ? "Memuat…" : "Belum ada transaksi. Coba catat uang makan hari ini."}
                </p>
              )}
            </div>
          </Step>
        </Deck>
      </Chapter>

      {/* 04 — patterns: categories, then the computed insights */}
      <Chapter index={3} steps={categories.length && insights.length ? 2 : 1} labelledBy="ch-pattern" className="on-stage">
        <Kicker n={4} icon={BarChart3}>
          Pengeluaran
        </Kicker>
        <h2 id="ch-pattern" className="chapter__title display reveal" style={{ "--i": 1 }}>
          Ke mana <span className="accent-italic">uangmu pergi.</span>
        </h2>
        {categories.length > 0 && insights.length > 0 && <StepDots labels={["Kategori", "Wawasan"]} />}
        <Deck>
          <Step n={0}>
            <div className="panel">
              {categories.length ? (
                <>
                  <p className="panel__sub" style={{ marginBottom: "var(--sp-3)" }}>
                    Pengeluaran per kategori, {month.label}
                  </p>
                  <ul className="cat-bars">
                    {categories.slice(0, 5).map((c) => (
                      <li key={c.category} className="cat-bar">
                        <CategoryIcon category={c.category} size={18} />
                        <div className="cat-bar__body">
                          <div className="cat-bar__head">
                            <strong>{c.label}</strong>
                            <span>
                              {formatRupiah(c.amount)} · {formatPercent(c.share)}
                            </span>
                          </div>
                          <div className="cat-bar__track">
                            <div className="cat-bar__fill" style={{ width: `${c.share * 100}%`, "--cat": categoryColor(c.category) }} />
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="muted">{loading ? "Memuat…" : `Belum ada pengeluaran di ${month.label}. Setelah kamu mencatat beberapa pengeluaran, rinciannya muncul di sini.`}</p>
              )}
              {!(categories.length && insights.length) && (
                <div className="deck__more">
                  <Button onClick={() => navigate("/analytics")}>
                    <BarChart3 size={16} aria-hidden="true" /> Buka analitik
                  </Button>
                </div>
              )}
            </div>
          </Step>
          {categories.length > 0 && insights.length > 0 && (
            <Step n={1}>
              <div className="panel">
                <div className="stack" style={{ gap: "var(--sp-2)" }}>
                  {insights.slice(0, 2).map((i) => (
                    <div key={i.id} className={`insight insight--${i.tone}`}>
                      <p className="insight__title">{i.title}</p>
                      <p className="insight__detail">{i.detail}</p>
                      <p className="insight__basis">Dasar: {i.basis}</p>
                    </div>
                  ))}
                </div>
                <div className="deck__more">
                  <Button onClick={() => navigate("/analytics")}>
                    <BarChart3 size={16} aria-hidden="true" /> Buka analitik
                  </Button>
                </div>
              </div>
            </Step>
          )}
        </Deck>
      </Chapter>

      {/* 05 — savings goals */}
      <Chapter index={4} labelledBy="ch-savings" className="on-stage">
        <Kicker n={5} icon={PiggyBank}>
          Tujuan tabungan
        </Kicker>
        <h2 id="ch-savings" className="chapter__title display reveal" style={{ "--i": 1 }}>
          Tabunganmu <span className="accent-italic">sejauh ini.</span>
        </h2>
        <div className="panel reveal" style={{ "--i": 2 }}>
          {goalsStatus === "error" ? (
            <p className="callout callout--error">Tujuan tabungan gagal dimuat.</p>
          ) : progress ? (
            <>
              <div className="overall-ring">
                <ProgressRing value={progress.ratio} label={`Progres total ${formatPercent(progress.ratio)}`} />
                <div>
                  <p style={{ fontWeight: 800 }}>
                    {formatRupiah(progress.current)} <span className="muted">dari {formatRupiah(progress.target)}</span>
                  </p>
                  <p className="muted" style={{ fontSize: "var(--fs-sm)" }}>
                    Gabungan {goals.length} tujuan tabungan
                  </p>
                </div>
              </div>
              {goals.slice(0, 2).map((g) => {
                const ratio = Math.min(1, (Number(g.current_amount) || 0) / (Number(g.target_amount) || 1));
                return (
                  <div key={g.id} className="goal-mini">
                    <div className="goal-mini__head">
                      <strong>{g.name}</strong>
                      <span>{formatPercent(ratio)}</span>
                    </div>
                    <div className={`progress ${ratio >= 1 ? "progress--done" : ""}`}>
                      <div className="progress__bar" style={{ width: `${ratio * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </>
          ) : (
            <p className="muted">{goalsStatus === "ready" ? "Belum ada tujuan tabungan. Buat satu target, nanti MAUNG menghitung berapa yang perlu disisihkan tiap bulan." : "Memuat…"}</p>
          )}
          <div className="deck__more">
            <Button variant="primary" onClick={() => navigate("/savings", { state: progress ? undefined : { create: true } })}>
              <PiggyBank size={16} aria-hidden="true" /> {progress ? "Kelola tabungan" : "Buat tujuan"}
            </Button>
          </div>
        </div>
      </Chapter>

      {/* 06 — quick actions */}
      <Chapter index={5} labelledBy="ch-control" className="on-stage">
        <Kicker n={6} icon={LayoutGrid}>
          Menu cepat
        </Kicker>
        <h2 id="ch-control" className="chapter__title display reveal" style={{ "--i": 1 }}>
          Mau lanjut <span className="accent-italic">ke mana?</span>
        </h2>
        <div className="quick-grid reveal" style={{ "--i": 2, marginTop: "var(--sp-5)" }}>
          <button type="button" className="quick-card quick-card--amber" onClick={() => openCapture()}>
            <Mic size={22} aria-hidden="true" />
            Catat
            <small>Satu kalimat, langsung jadi catatan.</small>
          </button>
          <Link to="/transactions" className="quick-card">
            <History size={22} aria-hidden="true" />
            Riwayat
            <small>Cari, ubah, atau hapus catatan.</small>
          </Link>
          <Link to="/analytics" className="quick-card">
            <BarChart3 size={22} aria-hidden="true" />
            Analitik
            <small>Tren bulanan dan kategori.</small>
          </Link>
          <Link to="/ai" className="quick-card">
            <Bot size={22} aria-hidden="true" />
            Asisten
            <small>Tanya ringkasan catatanmu.</small>
          </Link>
          <Link to="/savings" className="quick-card">
            <PiggyBank size={22} aria-hidden="true" />
            Tabungan
            <small>Setor ke tujuanmu.</small>
          </Link>
          <Link to="/settings" className="quick-card">
            <Settings size={22} aria-hidden="true" />
            Pengaturan
            <small>Profil, suara, tampilan.</small>
          </Link>
        </div>
        <p className="story-footer" style={{ padding: "var(--sp-5) 0 0", textAlign: "left" }}>
          <ArrowRight size={12} aria-hidden="true" style={{ display: "inline" }} /> Tombol mikrofon selalu ada. Di ponsel, letaknya di tengah bawah.
        </p>
      </Chapter>
    </div>
  );
}
