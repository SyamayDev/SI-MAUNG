import { useMemo, useState } from "react";
import { useMediaQuery } from "../hooks/useResponsive";
import { useSearchParams } from "react-router-dom";
import { Mic, PenLine, RefreshCw, Search, X } from "lucide-react";
import { useFinance } from "../context/FinanceContext";
import { useModal } from "../context/ModalContext";
import { useToast } from "../context/ToastContext";
import TransactionRow from "../components/transactions/TransactionRow";
import Segmented from "../components/ui/Segmented";
import Select from "../components/ui/Select";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import EmptyState from "../components/ui/EmptyState";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import { CATEGORIES } from "../lib/finance/categories";
import { addMonths, endOfMonth, startOfMonth, toLocalISODate } from "../lib/finance/dates";
import { formatDate, formatRupiah, formatSigned } from "../lib/finance/format";
import { totals } from "../lib/finance/summary";

const PERIODS = [
  { value: "this-month", label: "Bulan ini" },
  { value: "last-month", label: "Bulan lalu" },
  { value: "3m", label: "3 bulan terakhir" },
  { value: "year", label: "Tahun ini" },
  { value: "all", label: "Semua waktu" },
  { value: "custom", label: "Pilih tanggal…" },
];
const SORTS = [
  { value: "newest", label: "Terbaru" },
  { value: "oldest", label: "Terlama" },
  { value: "largest", label: "Nominal terbesar" },
];
const PAGE = 60;

function periodRange(period, from, to, now = new Date()) {
  switch (period) {
    case "this-month":
      return [toLocalISODate(startOfMonth(now)), toLocalISODate(now)];
    case "last-month": {
      const prev = addMonths(now, -1);
      return [toLocalISODate(startOfMonth(prev)), toLocalISODate(endOfMonth(prev))];
    }
    case "3m":
      return [toLocalISODate(startOfMonth(addMonths(now, -2))), toLocalISODate(now)];
    case "year":
      return [`${now.getFullYear()}-01-01`, toLocalISODate(now)];
    case "custom":
      return [from || null, to || null];
    default:
      return [null, null];
  }
}

export default function Transactions() {
  const { transactions, txStatus, txError, refreshTransactions, removeTransaction } = useFinance();
  const { openCapture, openManual, openEdit } = useModal();
  const showToast = useToast();
  const [params, setParams] = useSearchParams();
  const [limit, setLimit] = useState(PAGE);
  const [toDelete, setToDelete] = useState(null);
  const wide = useMediaQuery("(min-width: 768px)");
  const [moreOpen, setMoreOpen] = useState(null); // null = follow screen size
  const [deleting, setDeleting] = useState(false);

  // The search box keeps its own state (URL updates are async; typing must never lose characters).
  const [q, setQ] = useState(() => params.get("q") || "");
  const type = params.get("type") || "all";
  const category = params.get("cat") || "all";
  const period = params.get("period") || "all";
  const sort = params.get("sort") || "newest";
  const from = params.get("from") || "";
  const to = params.get("to") || "";

  const setParam = (key, value, fallback) => {
    setParams(
      (p) => {
        const next = new URLSearchParams(p);
        if (!value || value === fallback) next.delete(key);
        else next.set(key, value);
        return next;
      },
      { replace: true }
    );
    setLimit(PAGE);
  };

  const filtered = useMemo(() => {
    const [start, end] = periodRange(period, from, to);
    const needle = q.trim().toLowerCase();
    const rows = transactions.filter((t) => {
      if (type !== "all" && t.type !== type) return false;
      if (category !== "all" && t.category !== category) return false;
      const d = String(t.transaction_date).slice(0, 10);
      if (start && d < start) return false;
      if (end && d > end) return false;
      if (needle && !`${t.description} ${t.notes || ""}`.toLowerCase().includes(needle)) return false;
      return true;
    });
    if (sort === "oldest") rows.reverse();
    if (sort === "largest") rows.sort((a, b) => Number(b.amount) - Number(a.amount));
    return rows;
  }, [transactions, q, type, category, period, from, to, sort]);

  const sum = useMemo(() => totals(filtered), [filtered]);
  const visible = filtered.slice(0, limit);
  const groups = useMemo(() => {
    if (sort === "largest") return [{ date: null, rows: visible }];
    const map = new Map();
    for (const t of visible) {
      const d = String(t.transaction_date).slice(0, 10);
      if (!map.has(d)) map.set(d, []);
      map.get(d).push(t);
    }
    return [...map.entries()].map(([date, rows]) => ({ date, rows, ...totals(rows) }));
  }, [visible, sort]);

  const filtersActive = q || type !== "all" || category !== "all" || period !== "all";
  const clearFilters = () => {
    setQ("");
    setParams({}, { replace: true });
  };
  const loading = txStatus === "loading" || txStatus === "idle";

  const confirmDelete = async () => {
    setDeleting(true);
    const { error } = await removeTransaction(toDelete.id);
    setDeleting(false);
    if (error) showToast(error, { type: "error" });
    else showToast("Transaksi dihapus.", { type: "success" });
    setToDelete(null);
  };

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">Riwayat</p>
          <h1 className="page-head__title">Semua transaksi</h1>
          <p className="page-head__desc">Cari, saring, ubah, atau hapus catatanmu.</p>
        </div>
        <div className="row">
          <Button variant="amber" onClick={() => openCapture()}>
            <Mic size={18} aria-hidden="true" /> Catat
          </Button>
          <Button onClick={() => openManual()}>
            <PenLine size={18} aria-hidden="true" /> Manual
          </Button>
        </div>
      </header>

      <section className="filters panel" aria-label="Saring transaksi">
        <div className="filters__search">
          <Search size={18} aria-hidden="true" className="filters__search-icon" />
          <Input id="tx-search" type="search" label="Cari" placeholder="Cari keterangan atau catatan" value={q} onChange={(e) => {
              setQ(e.target.value);
              setParam("q", e.target.value);
            }} fieldClassName="grow" className="filters__search-input" />
        </div>
        <Segmented
          label="Jenis transaksi"
          value={type}
          onChange={(v) => setParam("type", v, "all")}
          options={[
            { value: "all", label: "Semua" },
            { value: "income", label: "Masuk", tone: "income" },
            { value: "expense", label: "Keluar", tone: "expense" },
          ]}
        />
        <details className="disclosure filters__more" open={moreOpen ?? wide} onToggle={(e) => setMoreOpen(e.currentTarget.open)}>
          <summary>
            Kategori, periode & urutan
            {(category !== "all" || period !== "all" || sort !== "newest") && <span className="chip chip--amber">aktif</span>}
          </summary>
        <div className="filters__selects">
          <Select id="tx-cat" label="Kategori" value={category} onChange={(e) => setParam("cat", e.target.value, "all")} options={[{ value: "all", label: "Semua kategori" }, ...CATEGORIES.map((c) => ({ value: c.value, label: c.label }))]} />
          <Select id="tx-period" label="Periode" value={period} onChange={(e) => setParam("period", e.target.value, "all")} options={PERIODS} />
          <Select id="tx-sort" label="Urutkan" value={sort} onChange={(e) => setParam("sort", e.target.value, "newest")} options={SORTS} />
        </div>
        {period === "custom" && (
          <div className="filters__selects">
            <Input id="tx-from" type="date" label="Dari" value={from} max={to || toLocalISODate()} onChange={(e) => setParam("from", e.target.value)} />
            <Input id="tx-to" type="date" label="Sampai" value={to} min={from || undefined} max={toLocalISODate()} onChange={(e) => setParam("to", e.target.value)} />
          </div>
        )}
        </details>
        {filtersActive && (
          <button type="button" className="link-btn" style={{ justifySelf: "start" }} onClick={clearFilters}>
            <X size={14} aria-hidden="true" style={{ display: "inline", verticalAlign: "-2px" }} /> Hapus semua saringan
          </button>
        )}
      </section>

      {txStatus === "error" ? (
        <div className="callout callout--error" role="alert" style={{ marginTop: "var(--sp-5)" }}>
          <span className="grow">{txError}</span>
          <Button size="sm" onClick={refreshTransactions}>
            <RefreshCw size={14} aria-hidden="true" /> Coba lagi
          </Button>
        </div>
      ) : loading ? (
        <div className="panel stack" style={{ marginTop: "var(--sp-5)" }} aria-busy="true">
          {[0, 1, 2, 3, 4].map((i) => (
            <span key={i} className="skeleton" style={{ height: 52 }} />
          ))}
        </div>
      ) : transactions.length === 0 ? (
        <EmptyState
          title="Belum ada transaksi"
          message="Mulai dengan satu kalimat, misalnya “makan siang 25 ribu”."
          action={
            <Button variant="amber" onClick={() => openCapture()}>
              <Mic size={18} aria-hidden="true" /> Catat transaksi pertama
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          compact
          title="Tidak ada yang cocok"
          message="Tidak ada transaksi untuk saringan ini."
          action={
            <Button onClick={clearFilters}>Hapus saringan</Button>
          }
        />
      ) : (
        <>
          <p className="result-summary" aria-live="polite">
            <span>{filtered.length} transaksi</span>
            <span className="text-income num">{formatSigned(sum.income, "income")}</span>
            <span className="text-expense num">{formatSigned(sum.expense, "expense")}</span>
            <span className="num">Selisih {formatRupiah(sum.net)}</span>
          </p>
          <div className="stack">
            {groups.map((g) => (
              <section key={g.date || "all"} className="panel tx-group" aria-label={g.date ? formatDate(g.date, "long") : "Hasil"}>
                {g.date && (
                  <header className="tx-group__head">
                    <h2>{formatDate(g.date, "long")}</h2>
                    <p className="num">
                      {g.income > 0 && <span className="text-income">{formatSigned(g.income, "income")}</span>}
                      {g.expense > 0 && <span className="text-expense">{formatSigned(g.expense, "expense")}</span>}
                    </p>
                  </header>
                )}
                <ul className="tx-list">
                  {g.rows.map((tx) => (
                    <TransactionRow key={tx.id} tx={tx} showDate={!g.date} onEdit={openEdit} onDelete={setToDelete} />
                  ))}
                </ul>
              </section>
            ))}
          </div>
          {filtered.length > limit && (
            <div className="row" style={{ justifyContent: "center", marginTop: "var(--sp-5)" }}>
              <Button onClick={() => setLimit((l) => l + PAGE)}>Tampilkan lebih banyak ({filtered.length - limit} lagi)</Button>
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Hapus transaksi?"
        message={toDelete ? `“${toDelete.description}” (${formatSigned(toDelete.amount, toDelete.type)}) akan dihapus permanen.` : ""}
        confirmLabel="Hapus"
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
