import { ArrowDownLeft, ArrowUpRight, Mic, Pencil, Trash2 } from "lucide-react";
import CategoryIcon from "../ui/CategoryIcon";
import { categoryLabel } from "../../lib/finance/categories";
import { formatDate, formatSigned } from "../../lib/finance/format";

/**
 * One transaction. Income/expense is conveyed by sign, arrow icon and the
 * accessible label — not by colour alone.
 */
export default function TransactionRow({ tx, onEdit, onDelete, showDate = true }) {
  const income = tx.type === "income";
  const Arrow = income ? ArrowDownLeft : ArrowUpRight;
  return (
    <li className="tx-row">
      <CategoryIcon category={tx.category} />
      <div className="tx-row__main">
        <p className="tx-row__title">{tx.description}</p>
        <p className="tx-row__meta">
          <span>{categoryLabel(tx.category)}</span>
          {showDate && <span>· {formatDate(tx.transaction_date)}</span>}
          {tx.source === "voice" && (
            <span title="Dicatat dengan suara">
              · <Mic size={11} aria-hidden="true" style={{ display: "inline", verticalAlign: "-1px" }} /> suara
            </span>
          )}
        </p>
      </div>
      <div>
        <p className={`tx-row__amount tx-row__amount--${tx.type}`}>
          <Arrow size={14} aria-hidden="true" style={{ display: "inline", verticalAlign: "-2px", marginRight: 2 }} />
          <span className="sr-only">{income ? "Pemasukan" : "Pengeluaran"} </span>
          {formatSigned(tx.amount, tx.type)}
        </p>
        {(onEdit || onDelete) && (
          <div className="tx-row__actions">
            {onEdit && (
              <button type="button" className="icon-btn" onClick={() => onEdit(tx)} aria-label={`Ubah transaksi ${tx.description}`}>
                <Pencil size={17} aria-hidden="true" />
              </button>
            )}
            {onDelete && (
              <button type="button" className="icon-btn icon-btn--danger" onClick={() => onDelete(tx)} aria-label={`Hapus transaksi ${tx.description}`}>
                <Trash2 size={17} aria-hidden="true" />
              </button>
            )}
          </div>
        )}
      </div>
    </li>
  );
}
