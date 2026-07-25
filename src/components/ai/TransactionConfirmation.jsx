import { useState } from "react";
import { createTransaction } from "../../services/transactionService";
import { useAuth } from "../../context/AuthContext";
import { useFinance } from "../../context/FinanceContext";
import Button from '../ui/Button';
import styles from './AI.module.css';
import { formatCurrency } from "../../utils/formatCurrency";

function TransactionConfirmation({ transaction, onClose, onSaved }) {
  const { user } = useAuth();
  const { refreshFinanceData } = useFinance();
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!user) return; // Should not happen if this component is shown
    setSaving(true);
    
    const txData = {
      user_id: user.id,
      type: transaction.type,
      amount: transaction.amount,
      description: transaction.description,
      category: transaction.category,
      transaction_date: transaction.transaction_date,
      source: 'ai',
    };

    const { error } = await createTransaction(txData);
    setSaving(false);

    if (error) {
      alert("Failed to save transaction."); // Replace with a proper toast later
      console.error(error);
    } else {
      await refreshFinanceData();
      if (onSaved) onSaved();
    }
  };

  return (
    <div className={styles.confirmationContainer}>
      <h4 className={styles.confirmationTitle}>Confirm Transaction</h4>
      <div className={styles.detailsGrid}>
        <span>Description</span><strong>{transaction.description}</strong>
        <span>Amount</span><strong className={transaction.type === 'income' ? styles.income : styles.expense}>{formatCurrency(transaction.amount)}</strong>
        <span>Category</span><strong>{transaction.category}</strong>
        <span>Date</span><strong>{new Date(transaction.transaction_date).toLocaleDateString('id-ID')}</strong>
      </div>
      <div className={styles.buttonGroup}>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Transaction"}
        </Button>
      </div>
    </div>
  );
}

export default TransactionConfirmation;
