import { useState, useEffect } from "react";
import { transactionCategories, transactionTypes } from "../../lib/constants";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Select from "../ui/Select";
import styles from './Transactions.module.css';

function TransactionForm({ onSubmit, loading, initialData }) {
  const [form, setForm] = useState({
    type: "expense",
    amount: "",
    description: "",
    category: "food",
    transaction_date: new Date().toISOString().slice(0, 10),
    notes: "",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setForm({
        type: initialData.type || "expense",
        amount: initialData.amount?.toString() || "",
        description: initialData.description || "",
        category: initialData.category || "food",
        transaction_date:
          initialData.transaction_date || new Date().toISOString().slice(0, 10),
        notes: initialData.notes || "",
      });
    }
  }, [initialData]);

  const validate = () => {
    const newErrors = {};
    if (!form.description.trim()) {
      newErrors.description = "Deskripsi wajib diisi.";
    }
    if (!form.amount || Number(form.amount) <= 0) {
      newErrors.amount = "Masukkan jumlah yang valid.";
    }
    if (!form.transaction_date) {
      newErrors.transaction_date = "Tanggal wajib diisi.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm({
      ...form,
      [name]: value,
    });
    // Clear error on change
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) {
      return;
    }

    await onSubmit({
      ...form,
      amount: Number(form.amount),
    });
  };

  return (
    <form className={styles.transactionForm} onSubmit={handleSubmit} noValidate>
      <Select
        id="type"
        label="Jenis Transaksi"
        name="type"
        value={form.type}
        onChange={handleChange}
        options={transactionTypes}
      />

      <Input
        id="amount"
        label="Jumlah"
        type="number"
        name="amount"
        value={form.amount}
        onChange={handleChange}
        placeholder="0"
        error={errors.amount}
      />

      <Input
        id="description"
        label="Deskripsi"
        type="text"
        name="description"
        value={form.description}
        onChange={handleChange}
        placeholder="Contoh: Beli kopi"
        error={errors.description}
      />

      <Select
        id="category"
        label="Kategori"
        name="category"
        value={form.category}
        onChange={handleChange}
        options={transactionCategories}
      />

      <Input
        id="transaction_date"
        label="Tanggal"
        type="date"
        name="transaction_date"
        value={form.transaction_date}
        onChange={handleChange}
        error={errors.transaction_date}
      />

      <Input
        id="notes"
        label="Catatan (opsional)"
        as="textarea"
        name="notes"
        value={form.notes}
        onChange={handleChange}
        placeholder="Catatan tambahan..."
        rows="3"
      />

      <div className={styles.formActions}>
        <Button type="submit" variant="primary" size="lg" disabled={loading} className={styles.submitButton}>
          {loading ? "Menyimpan..." : "Simpan Transaksi"}
        </Button>
      </div>
    </form>
  );
}

export default TransactionForm;
