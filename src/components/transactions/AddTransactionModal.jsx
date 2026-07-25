import TransactionForm from "./TransactionForm";

function AddTransactionModal({ open, onClose, onSave, loading, initialData }) {
  if (!open) return null;

  const isEdit = Boolean(initialData && initialData.id);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>{isEdit ? "Edit Transaksi" : "Tambah Transaksi"}</h2>
            <p>
              {isEdit
                ? "Ubah detail transaksi."
                : "Catat pemasukan atau pengeluaran baru secara manual."}
            </p>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <TransactionForm
          onSubmit={onSave}
          loading={loading}
          initialData={initialData}
        />
      </div>
    </div>
  );
}

export default AddTransactionModal;
