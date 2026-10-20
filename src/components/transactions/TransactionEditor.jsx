import { useRef, useState } from "react";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import Input, { TextArea } from "../ui/Input";
import Select from "../ui/Select";
import MoneyInput from "../ui/MoneyInput";
import Segmented from "../ui/Segmented";
import Button from "../ui/Button";
import { categoriesFor, getCategory } from "../../lib/finance/categories";
import { validateTransaction } from "../../lib/finance/validate";
import { formatRupiah } from "../../lib/finance/format";
import { toLocalISODate } from "../../lib/finance/dates";
import { emptyDraft } from "../../lib/finance/draft";

const TYPE_OPTIONS = [
  { value: "expense", label: "Pengeluaran", icon: ArrowUpRight, tone: "expense" },
  { value: "income", label: "Pemasukan", icon: ArrowDownLeft, tone: "income" },
];


/**
 * Transaction form used for manual entry, reviewing a parsed sentence, and edits.
 * `review` = { field: message } hints from the parser that the user should check.
 * `onSubmit(value)` must resolve to { error?: string }.
 */
export default function TransactionEditor({ initial, review = {}, suggestion = null, submitLabel = "Simpan transaksi", onSubmit, secondary }) {
  const [form, setForm] = useState(() => ({ ...emptyDraft(), ...initial, notes: initial?.notes || "" }));
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const submitting = useRef(false);

  const set = (field, value) => {
    setForm((f) => {
      const next = { ...f, [field]: value };
      if (field === "type" && !getCategory(f.category).kinds.includes(value)) next.category = "other";
      return next;
    });
    setTouched((t) => ({ ...t, [field]: true }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const hint = (field) => (touched[field] ? undefined : review[field]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting.current) return; // no double submit
    const result = validateTransaction(form);
    if (!result.valid) {
      setErrors(result.errors);
      const first = Object.keys(result.errors)[0];
      document.getElementById(`tx-${first}`)?.focus();
      return;
    }
    submitting.current = true;
    setBusy(true);
    setSubmitError("");
    const { error } = (await onSubmit(result.value)) || {};
    submitting.current = false;
    setBusy(false);
    if (error) setSubmitError(error);
  };

  const categoryOptions = categoriesFor(form.type).map((c) => ({ value: c.value, label: c.label }));

  return (
    <form className="tx-editor" onSubmit={handleSubmit} noValidate>
      <Segmented label="Jenis transaksi" value={form.type} onChange={(v) => set("type", v)} options={TYPE_OPTIONS} className="tx-editor__type" id="tx-type" />
      {hint("type") && <p className="field__review">{hint("type")}</p>}

      <MoneyInput
        id="tx-amount"
        label="Nominal"
        value={form.amount}
        onChange={(v) => set("amount", v)}
        placeholder="0"
        error={errors.amount}
        review={hint("amount")}
        data-autofocus={form.amount ? undefined : true}
      />
      {suggestion && !touched.amount && form.amount !== suggestion && (
        <button type="button" className="chip chip--amber tx-editor__suggest" onClick={() => set("amount", suggestion)}>
          Ganti ke {formatRupiah(suggestion)}
        </button>
      )}

      <Input
        id="tx-description"
        label="Keterangan"
        value={form.description}
        onChange={(e) => set("description", e.target.value)}
        placeholder="Contoh: Makan siang"
        maxLength={120}
        autoComplete="off"
        error={errors.description}
      />

      <div className="tx-editor__pair">
        <Select
          id="tx-category"
          label="Kategori"
          value={form.category}
          onChange={(e) => set("category", e.target.value)}
          options={categoryOptions}
          error={errors.category}
          review={hint("category")}
        />
        <Input
          id="tx-transaction_date"
          label="Tanggal"
          type="date"
          value={form.transaction_date}
          max={toLocalISODate()}
          onChange={(e) => set("transaction_date", e.target.value)}
          error={errors.transaction_date}
          review={hint("transaction_date")}
        />
      </div>

      <details className="disclosure" open={Boolean(form.notes)}>
        <summary>Catatan (opsional)</summary>
        <TextArea id="tx-notes" label="Catatan" value={form.notes} onChange={(e) => set("notes", e.target.value)} maxLength={500} rows={3} error={errors.notes} />
      </details>

      {submitError && (
        <p className="callout callout--error" role="alert">
          {submitError}
        </p>
      )}

      <div className="dialog__actions">
        {secondary}
        <Button type="submit" variant="primary" loading={busy}>
          {busy ? "Menyimpan…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
