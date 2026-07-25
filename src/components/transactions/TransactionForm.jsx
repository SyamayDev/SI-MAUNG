import { useState } from "react";
import {
  transactionCategories,
  transactionTypes,
} from "../../utils/categoryUtils.jsx";

function TransactionForm({ onSubmit, loading, initialData }) {
  const [form, setForm] = useState({
    type: initialData?.type || "expense",
    amount: initialData?.amount ?? "",
    description: initialData?.description || "",
    category: initialData?.category || "food",
    transaction_date:
      initialData?.transaction_date || new Date().toISOString().slice(0, 10),
    notes: initialData?.notes || "",
  });
  const [error, setError] = useState("");

  const handleChange = (event) => {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.description.trim()) {
      setError("Deskripsi wajib diisi.");
      return;
    }

    if (!form.amount || Number(form.amount) <= 0) {
      setError("Masukkan jumlah yang valid lebih dari 0.");
      return;
    }

    await onSubmit({
      ...form,
      amount: Number(form.amount),
    });
  };

  return (
    <form className="transaction-form" onSubmit={handleSubmit}>
      <div className="field-row">
        <label>Jenis transaksi</label>
        <select name="type" value={form.type} onChange={handleChange}>
          {transactionTypes.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="field-row">
        <label>Jumlah</label>
        <input
          type="number"
          name="amount"
          value={form.amount}
          onChange={handleChange}
          placeholder="Rp"
          min="1"
          step="1000"
        />
      </div>

      <div className="field-row">
        <label>Deskripsi</label>
        <input
          type="text"
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Contoh: Beli kopi"
        />
      </div>

      <div className="field-row">
        <label>Kategori</label>
        <select name="category" value={form.category} onChange={handleChange}>
          {transactionCategories.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="field-row">
        <label>Tanggal</label>
        <input
          type="date"
          name="transaction_date"
          value={form.transaction_date}
          onChange={handleChange}
        />
      </div>

      <div className="field-row">
        <label>Catatan (opsional)</label>
        <textarea
          name="notes"
          value={form.notes}
          onChange={handleChange}
          placeholder="Catatan tambahan"
          rows="3"
        />
      </div>

      {error && <div className="auth-error">{error}</div>}

      <button type="submit" disabled={loading}>
        {loading ? "Menyimpan..." : "Simpan Transaksi"}
      </button>
    </form>
  );
}

export default TransactionForm;
