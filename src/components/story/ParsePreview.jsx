import { useMemo, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, CalendarDays, Lightbulb, Tag } from "lucide-react";
import { parseTransactionText } from "../../lib/finance/parseTransaction";
import { categoryLabel } from "../../lib/finance/categories";
import { formatDate, formatRupiah } from "../../lib/finance/format";
import { EXAMPLE_PHRASES } from "../../lib/finance/examples";

/** Live, on-device preview of the sentence parser. Nothing is sent or saved. */
export default function ParsePreview() {
  const [text, setText] = useState(EXAMPLE_PHRASES[0]);
  const result = useMemo(() => parseTransactionText(text), [text]);
  const d = result.draft;

  return (
    <div className="parse-preview">
      <label className="field__label" htmlFor="parse-demo">
        Ketik kalimat transaksi
      </label>
      <input id="parse-demo" className="input" value={text} onChange={(e) => setText(e.target.value)} maxLength={200} autoComplete="off" />
      <div className="row" style={{ gap: "var(--sp-2)" }}>
        {EXAMPLE_PHRASES.slice(1, 3).map((p) => (
          <button key={p} type="button" className="chip" onClick={() => setText(p)}>
            {p}
          </button>
        ))}
      </div>
      <div className="parse-preview__result" aria-live="polite">
        {result.intent === "transaction" && d ? (
          <>
            <p className={`parse-preview__amount ${d.type === "income" ? "text-income" : "text-expense"}`}>
              {d.type === "income" ? <ArrowDownLeft size={18} aria-hidden="true" /> : <ArrowUpRight size={18} aria-hidden="true" />}
              {d.type === "income" ? "Pemasukan" : "Pengeluaran"} · {d.amount ? formatRupiah(d.amount) : "nominal belum terdengar"}
            </p>
            <p className="parse-preview__desc">{d.description}</p>
            <p className="row" style={{ gap: "var(--sp-2)" }}>
              <span className="chip">
                <Tag size={13} aria-hidden="true" /> {categoryLabel(d.category)}
              </span>
              <span className="chip">
                <CalendarDays size={13} aria-hidden="true" /> {formatDate(d.transaction_date)}
              </span>
            </p>
            {result.issues.map((i) => (
              <p key={i.field} className="field__review">
                <Lightbulb size={14} aria-hidden="true" /> {i.message}
              </p>
            ))}
          </>
        ) : (
          <p className="muted">
            {result.intent === "question"
              ? "Itu pertanyaan — setelah masuk, Asisten bisa menjawabnya dari catatanmu."
              : "Belum terbaca sebagai transaksi. Sebutkan apa transaksinya dan nominalnya."}
          </p>
        )}
      </div>
      <p className="field__hint">Diproses di perangkatmu — tidak ada yang dikirim atau disimpan dari demo ini.</p>
    </div>
  );
}
