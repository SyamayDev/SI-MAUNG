import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Mic, RefreshCw } from "lucide-react";
import { useFinance } from "../context/FinanceContext";
import { useModal } from "../context/ModalContext";
import Segmented from "../components/ui/Segmented";
import Button from "../components/ui/Button";
import EmptyState from "../components/ui/EmptyState";
import CategoryIcon from "../components/ui/CategoryIcon";
import { addMonths, startOfMonth, toLocalISODate } from "../lib/finance/dates";
import { buildInsights, categoryBreakdown, inRange, monthlySeries, totals } from "../lib/finance/summary";
import { categoryColor } from "../lib/finance/categories";
import { formatCompactRupiah, formatDate, formatPercent, formatRupiah } from "../lib/finance/format";

const RANGES = [
  { value: "3", label: "3 bln" },
  { value: "6", label: "6 bln" },
  { value: "12", label: "12 bln" },
];
const INCOME = "#14a07c";
const EXPENSE = "#e2564b";

function MoneyTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tip">
      <p className="chart-tip__label">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: <strong>{formatRupiah(p.value)}</strong>
        </p>
      ))}
    </div>
  );
}

export default function Analytics() {
  const { transactions, txStatus, txError, refreshTransactions } = useFinance();
  const { openCapture } = useModal();
  const [range, setRange] = useState("6");
  const now = useMemo(() => new Date(), []);

  const fromDate = useMemo(() => startOfMonth(addMonths(now, -(Number(range) - 1))), [now, range]);
  const from = toLocalISODate(fromDate);
  const to = toLocalISODate(now);
  const scoped = useMemo(() => inRange(transactions, from, to), [transactions, from, to]);
  const series = useMemo(() => monthlySeries(transactions, fromDate, now), [transactions, fromDate, now]);
  const sum = useMemo(() => totals(scoped), [scoped]);
  const cats = useMemo(() => categoryBreakdown(scoped, "expense"), [scoped]);
  const incomeCats = useMemo(() => categoryBreakdown(scoped, "income"), [scoped]);
  const insights = useMemo(() => buildInsights(transactions, now), [transactions, now]);
  const monthsWithData = series.filter((r) => r.income || r.expense).length;
  const loading = txStatus === "loading" || txStatus === "idle";
  const periodLabel = `${formatDate(from)} – ${formatDate(to)}`;

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">Analitik</p>
          <h1 className="page-head__title">Pola keuanganmu</h1>
          <p className="page-head__desc">Semua angka dihitung dari transaksi yang kamu catat, pada periode {periodLabel}.</p>
        </div>
        <Segmented label="Rentang waktu" value={range} onChange={setRange} options={RANGES} />
      </header>

      {txStatus === "error" ? (
        <div className="callout callout--error" role="alert">
          <span className="grow">{txError}</span>
          <Button size="sm" onClick={refreshTransactions}>
            <RefreshCw size={14} aria-hidden="true" /> Coba lagi
          </Button>
        </div>
      ) : loading ? (
        <div className="analytics-grid">
          <span className="skeleton" style={{ height: 320 }} />
          <span className="skeleton" style={{ height: 320 }} />
        </div>
      ) : scoped.length === 0 ? (
        <EmptyState
          title="Belum ada data di periode ini"
          message="Grafik dan wawasan muncul setelah ada transaksi tercatat. Tidak ada angka yang dikarang."
          action={
            <Button variant="amber" onClick={() => openCapture()}>
              <Mic size={18} aria-hidden="true" /> Catat transaksi
            </Button>
          }
        />
      ) : (
        <>
          <section className="kpis" aria-label="Ringkasan periode">
            <div className="kpi">
              <p className="kpi__label">Pemasukan</p>
              <p className="kpi__value text-income num">{formatRupiah(sum.income)}</p>
            </div>
            <div className="kpi">
              <p className="kpi__label">Pengeluaran</p>
              <p className="kpi__value text-expense num">{formatRupiah(sum.expense)}</p>
            </div>
            <div className="kpi">
              <p className="kpi__label">Selisih</p>
              <p className={`kpi__value num ${sum.net < 0 ? "text-expense" : ""}`}>{formatRupiah(sum.net)}</p>
            </div>
            <div className="kpi">
              <p className="kpi__label">Rata-rata pengeluaran / bulan</p>
              <p className="kpi__value num">{monthsWithData ? formatRupiah(sum.expense / Number(range)) : "—"}</p>
              <p className="kpi__basis">Total ÷ {range} bulan</p>
            </div>
          </section>

          <div className="analytics-grid">
            <section className="panel" aria-labelledby="chart-monthly">
              <div className="panel__head">
                <div>
                  <h2 className="panel__title" id="chart-monthly">
                    Pemasukan vs pengeluaran
                  </h2>
                  <p className="panel__sub">Per bulan · bulan tanpa catatan bernilai 0</p>
                </div>
              </div>
              <div className="chart" aria-hidden="true">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={series} margin={{ top: 8, right: 4, left: 0, bottom: 0 }} barGap={2}>
                    <CartesianGrid vertical={false} stroke="#e6dbc6" />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#5f6686" }} />
                    <YAxis tickFormatter={(v) => formatCompactRupiah(v).replace("Rp ", "")} tickLine={false} axisLine={false} width={56} tick={{ fontSize: 12, fill: "#5f6686" }} />
                    <Tooltip content={<MoneyTooltip />} cursor={{ fill: "rgb(14 21 51 / 0.05)" }} />
                    <Bar dataKey="income" name="Pemasukan" fill={INCOME} radius={[6, 6, 0, 0]} maxBarSize={28} />
                    <Bar dataKey="expense" name="Pengeluaran" fill={EXPENSE} radius={[6, 6, 0, 0]} maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="chart-legend">
                <span>
                  <i style={{ background: INCOME }} /> Pemasukan
                </span>
                <span>
                  <i style={{ background: EXPENSE }} /> Pengeluaran
                </span>
              </p>
              <details className="disclosure">
                <summary>Lihat sebagai tabel</summary>
                <div className="table-wrap">
                  <table className="data-table">
                    <caption className="sr-only">Pemasukan dan pengeluaran per bulan</caption>
                    <thead>
                      <tr>
                        <th scope="col">Bulan</th>
                        <th scope="col">Pemasukan</th>
                        <th scope="col">Pengeluaran</th>
                        <th scope="col">Selisih</th>
                      </tr>
                    </thead>
                    <tbody>
                      {series.map((r) => (
                        <tr key={r.key}>
                          <th scope="row">{r.label}</th>
                          <td className="num">{formatRupiah(r.income)}</td>
                          <td className="num">{formatRupiah(r.expense)}</td>
                          <td className="num">{formatRupiah(r.net)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            </section>

            <section className="panel" aria-labelledby="chart-cats">
              <div className="panel__head">
                <div>
                  <h2 className="panel__title" id="chart-cats">
                    Pengeluaran per kategori
                  </h2>
                  <p className="panel__sub">{cats.length ? `${cats.length} kategori · ${formatRupiah(sum.expense)}` : "Belum ada pengeluaran"}</p>
                </div>
              </div>
              {cats.length ? (
                <div className="donut">
                  <div className="donut__chart" aria-hidden="true">
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={cats} dataKey="amount" nameKey="label" innerRadius="58%" outerRadius="92%" paddingAngle={2} stroke="none" isAnimationActive={false}>
                          {cats.map((c) => (
                            <Cell key={c.category} fill={categoryColor(c.category)} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v) => formatRupiah(v)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <ul className="cat-bars">
                    {cats.map((c) => (
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
                </div>
              ) : (
                <p className="muted">Belum ada pengeluaran di periode ini.</p>
              )}
              {incomeCats.length > 0 && (
                <>
                  <hr className="divider" />
                  <p className="field__label">Sumber pemasukan</p>
                  <ul className="income-sources">
                    {incomeCats.map((c) => (
                      <li key={c.category}>
                        <span>{c.label}</span>
                        <strong className="text-income num">{formatRupiah(c.amount)}</strong>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </section>
          </div>

          <section className="panel" aria-labelledby="insights-title" style={{ marginTop: "var(--sp-5)" }}>
            <div className="panel__head">
              <div>
                <h2 className="panel__title" id="insights-title">
                  Wawasan bulan ini
                </h2>
                <p className="panel__sub">Dihitung dari catatanmu; setiap poin menyebut dasarnya.</p>
              </div>
            </div>
            {insights.length ? (
              <div className="insight-grid">
                {insights.map((i) => (
                  <div key={i.id} className={`insight insight--${i.tone}`}>
                    <p className="insight__title">{i.title}</p>
                    <p className="insight__detail">{i.detail}</p>
                    <p className="insight__basis">Dasar: {i.basis}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted">Belum cukup data bulan ini untuk wawasan. Catat beberapa transaksi dulu.</p>
            )}
          </section>
        </>
      )}
    </div>
  );
}
