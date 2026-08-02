import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import { createSavingsGoal } from '../../services/savingsService';
import { useToast } from '../../context/ToastContext';

const CreateGoalModal = ({ isOpen, onClose, onGoalCreated }) => {
  const { user } = useAuth();
  const showToast = useToast();
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !targetAmount) {
      showToast('Harap isi nama dan jumlah target.', { type: 'error' });
      return;
    }
    
    setLoading(true);
    const { error } = await createSavingsGoal({
      user_id: user.id,
      name,
      target_amount: parseFloat(targetAmount),
      deadline: deadline || null,
    });
    setLoading(false);

    if (error) {
      showToast('Gagal membuat tujuan tabungan.', { type: 'error' });
      console.error(error);
    } else {
      showToast('Tujuan tabungan baru dibuat!', { type: 'success' });
      onGoalCreated(); // This will trigger a refresh on the parent page
      handleClose();
    }
  };

  const handleClose = () => {
    // Reset form state
    setName('');
    setTargetAmount('');
    setDeadline('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Buat Tujuan Tabungan Baru">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <Input
          label="Nama Tujuan"
          id="goal-name"
          placeholder="contoh: PC Gaming Baru"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Input
          label="Jumlah Target"
          id="target-amount"
          type="number"
          placeholder="contoh: 20000000"
          value={targetAmount}
          onChange={(e) => setTargetAmount(e.target.value)}
          required
        />
        <Input
          label="Batas Waktu (Opsional)"
          id="deadline"
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
          <Button type="button" variant="secondary" onClick={handleClose}>
            Batal
          </Button>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? 'Membuat...' : 'Buat Tujuan'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateGoalModal;
