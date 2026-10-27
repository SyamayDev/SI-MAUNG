import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CalendarClock, Minus, Pencil, PiggyBank, Plus, RefreshCw, Trash2 } from "lucide-react";
import { useFinance } from "../context/FinanceContext";
import { useToast } from "../context/ToastContext";
import Button from "../components/ui/Button";
import Dialog from "../components/ui/Dialog";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import EmptyState from "../components/ui/EmptyState";
import Input from "../components/ui/Input";
import MoneyInput from "../components/ui/MoneyInput";
import Segmented from "../components/ui/Segmented";
import ProgressRing from "../components/ui/ProgressRing";
import { validateContribution, validateGoal } from "../lib/finance/validate";
import { goalsProgress, monthlyNeed } from "../lib/finance/summary";
import { formatDate, formatPercent, formatRupiah } from "../lib/finance/format";
import { toLocalISODate } from "../lib/finance/dates";

function GoalEditor({ goal, onDone }) {
  const { addGoal, editGoal } = useFinance();
  const showToast = useToast();
  const [form, setForm] = useState({ name: goal?.name || "", target_amount: goal ? Number(goal.target_amount) : null, deadline: goal?.deadline || "" });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    const v = validateGoal(form);
    setErrors(v.errors);
    if (!v.valid) return;
    setBusy(true);
    setError("");
    const { error: err } = goal ? await editGoal(goal.id, v.value) : await addGoal(v.value);
    setBusy(false);
    if (err) setError(err);
    else {
      showToast(goal ? "Tujuan diperbarui." : "Tujuan tabungan dibuat.", { type: "success" });
      onDone();
    }
  };

  return (
    <form className="stack" onSubmit={submit} noValidate>
      <Input id="goal-name" label="Nama tujuan" placeholder="Contoh: Dana darurat" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} error={errors.name} maxLength={60} autoComplete="off" />
      <MoneyInput id="goal-target" label="Target" value={form.target_amount} onChange={(v) => setForm((f) => ({ ...f, target_amount: v }))} error={errors.target_amount} />
      <Input
        id="goal-deadline"
        type="date"
        label="Batas waktu (opsional)"
        min={toLocalISODate()}
        value={form.deadline || ""}
        onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
        error={errors.deadline}
        hint="Dipakai untuk menghitung setoran per bulan."
      />
      {error && (
        <p className="callout callout--error" role="alert">
          {error}
        </p>
      )}
      <div className="dialog__actions">
        <Button onClick={onDone}>Batal</Button>
        <Button type="submit" variant="primary" loading={busy}>
          {goal ? "Simpan perubahan" : "Buat tujuan"}
        </Button>
      </div>
    </form>
  );
}

function ContributionForm({ goal, onDone }) {
  const { contributeGoal } = useFinance();
  const showToast = useToast();
  const [direction, setDirection] = useState("deposit");
  const [amount, setAmount] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const current = Number(goal.current_amount) || 0;

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    const v = validateContribution({ amount, direction }, current);
    if (!v.valid) {
      setError(v.error);
      return;
    }
    setBusy(true);
    setError("");
    const { error: err } = await contributeGoal(goal.id, v.delta);
    setBusy(false);
    if (err) setError(err);
    else {
      showToast(direction === "deposit" ? `${formatRupiah(amount)} disetor ke “${goal.name}”.` : `${formatRupiah(amount)} ditarik dari “${goal.name}”.`, { type: "success" });
      onDone();
    }
  };

  return (
    <form className="stack" onSubmit={submit} noValidate>
      <Segmented
        label="Jenis"
        value={direction}
        onChange={(v) => {
          setDirection(v);
          setError("");
        }}
        options={[
          { value: "deposit", label: "Setor", icon: Plus, tone: "income" },
          { value: "withdraw", label: "Tarik", icon: Minus, tone: "expense" },
        ]}
        className="tx-editor__type"
      />
      <MoneyInput id="contrib-amount" label="Nominal" value={amount} onChange={setAmount} error={error} data-autofocus />
      <p className="field__hint">
        Terkumpul saat ini {formatRupiah(current)} dari {formatRupiah(goal.target_amount)}. Setoran hanya mengubah progres tujuan ini dan tidak tercatat sebagai transaksi.
      </p>
      <div className="dialog__actions">
        <Button onClick={onDone}>Batal</Button>
        <Button type="submit" variant="primary" loading={busy}>
          {direction === "deposit" ? "Setor" : "Tarik"}
        </Button>
      </div>
    </form>
  );
}

function GoalCard({ goal, onContribute, onEdit, onDelete }) {
  const current = Number(goal.current_amount) || 0;
  const target = Number(goal.target_amount) || 0;
  const ratio = target > 0 ? Math.min(1, current / target) : 0;
  const need = monthlyNeed(goal);
  const overdue = goal.deadline && goal.deadline < toLocalISODate() && ratio < 1;
  return (
    <article className="panel goal-card">
      <div className="goal-card__head">
        <ProgressRing value={ratio} size={64} label={`${goal.name}: ${formatPercent(ratio)}`} />
        <div className="grow" style={{ minWidth: 0 }}>
          <h2 className="goal-card__name">{goal.name}</h2>
          <p className="goal-card__amount num">
            {formatRupiah(current)} <span className="muted">/ {formatRupiah(target)}</span>
          </p>
        </div>
      </div>
      <div className={`progress ${ratio >= 1 ? "progress--done" : ""}`} aria-hidden="true">
        <div className="progress__bar" style={{ width: `${ratio * 100}%` }} />
      </div>
      <p className="goal-card__meta">
        <CalendarClock size={15} aria-hidden="true" />
        {ratio >= 1
          ? "Target tercapai!"
          : goal.deadline
            ? overdue
              ? `Lewat batas ${formatDate(goal.deadline)}, kurang ${formatRupiah(target - current)}`
              : need
                ? `${formatRupiah(need.perMonth)}/bulan hingga ${formatDate(goal.deadline)}`
                : `Batas ${formatDate(goal.deadline)}`
            : `Kurang ${formatRupiah(Math.max(0, target - current))} · tanpa batas waktu`}
      </p>
      <div className="goal-card__actions">
        <Button variant="primary" onClick={() => onContribute(goal)}>
          <Plus size={16} aria-hidden="true" /> Setor / tarik
        </Button>
        <button type="button" className="icon-btn" onClick={() => onEdit(goal)} aria-label={`Ubah tujuan ${goal.name}`}>
          <Pencil size={18} aria-hidden="true" />
        </button>
        <button type="button" className="icon-btn icon-btn--danger" onClick={() => onDelete(goal)} aria-label={`Hapus tujuan ${goal.name}`}>
          <Trash2 size={18} aria-hidden="true" />
        </button>
      </div>
    </article>
  );
}

export default function SavingsGoals() {
  const { goals, goalsStatus, goalsError, refreshGoals, removeGoal } = useFinance();
  const showToast = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [editor, setEditor] = useState(() => (location.state?.create ? { goal: null } : null));
  const [contribute, setContribute] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const progress = goalsProgress(goals);

  const closeEditor = () => {
    setEditor(null);
    if (location.state?.create) navigate(location.pathname, { replace: true, state: null });
  };

  const confirmDelete = async () => {
    setDeleting(true);
    const { error } = await removeGoal(toDelete.id);
    setDeleting(false);
    showToast(error || "Tujuan dihapus.", { type: error ? "error" : "success" });
    setToDelete(null);
  };

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">Tabungan</p>
          <h1 className="page-head__title">Tujuan tabungan</h1>
          <p className="page-head__desc">
            {progress ? `Total terkumpul ${formatRupiah(progress.current)} dari ${formatRupiah(progress.target)} (${formatPercent(progress.ratio)}).` : "Sedikit demi sedikit, lama-lama jadi bukit."}
          </p>
        </div>
        <Button variant="amber" onClick={() => setEditor({ goal: null })}>
          <Plus size={18} aria-hidden="true" /> Tujuan baru
        </Button>
      </header>

      {goalsStatus === "error" ? (
        <div className="callout callout--error" role="alert">
          <span className="grow">{goalsError}</span>
          <Button size="sm" onClick={refreshGoals}>
            <RefreshCw size={14} aria-hidden="true" /> Coba lagi
          </Button>
        </div>
      ) : goalsStatus !== "ready" ? (
        <div className="goal-grid">
          {[0, 1].map((i) => (
            <span key={i} className="skeleton" style={{ height: 200 }} />
          ))}
        </div>
      ) : goals.length === 0 ? (
        <EmptyState
          title="Belum ada tujuan tabungan"
          message="Dana darurat, laptop baru, atau liburan. Tulis targetnya, nanti MAUNG hitungkan setoran bulanannya."
          art="images/onboarding-goals.webp"
          action={
            <Button variant="amber" onClick={() => setEditor({ goal: null })}>
              <PiggyBank size={18} aria-hidden="true" /> Buat tujuan pertama
            </Button>
          }
        />
      ) : (
        <div className="goal-grid">
          {goals.map((g) => (
            <GoalCard key={g.id} goal={g} onContribute={setContribute} onEdit={(goal) => setEditor({ goal })} onDelete={setToDelete} />
          ))}
        </div>
      )}

      <Dialog open={Boolean(editor)} onClose={closeEditor} title={editor?.goal ? "Ubah tujuan" : "Tujuan tabungan baru"} width={480}>
        {editor && <GoalEditor goal={editor.goal} onDone={closeEditor} />}
      </Dialog>
      <Dialog open={Boolean(contribute)} onClose={() => setContribute(null)} title={contribute ? `Tabungan: ${contribute.name}` : ""} width={480}>
        {contribute && <ContributionForm goal={contribute} onDone={() => setContribute(null)} />}
      </Dialog>
      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Hapus tujuan ini?"
        message={toDelete ? `“${toDelete.name}” beserta progresnya (${formatRupiah(toDelete.current_amount)}) akan dihapus. Transaksi tidak terpengaruh.` : ""}
        confirmLabel="Hapus"
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
