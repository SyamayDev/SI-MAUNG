import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import VoiceRecorder from './VoiceRecorder';
import { useAIChat } from '../../hooks/useAIChat';
import LoadingSpinner from '../ui/LoadingSpinner';
import TransactionConfirmation from '../ai/TransactionConfirmation';
import { useToast } from '../../context/ToastContext';

const VoiceTransactionModal = ({ isOpen, onClose }) => {
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedTransaction, setParsedTransaction] = useState(null);
  const [parseError, setParseError] = useState('');
  const { parseTransaction, loading } = useAIChat();
  const showToast = useToast();

  useEffect(() => {
    if (transcript) {
      handleParse();
    }
  }, [transcript]);

  const handleTranscript = (text) => {
    setTranscript(text);
    setParseError('');
  };

  const handleParse = async () => {
    if (!transcript) return;
    setIsProcessing(true);
    setParseError('');

    const result = await parseTransaction(transcript);
    setIsProcessing(false);

    if (result?.intent === 'create_transaction') {
      setParsedTransaction(result);
      return;
    }

    const message = result?.intent === 'create_savings_goal'
      ? 'Saya mendeteksi tujuan tabungan, tetapi fitur ini akan hadir segera.'
      : 'Maaf, saya belum bisa mengenali transaksi tersebut. Silakan coba lagi atau ketik manual.';

    setParseError(message);
    showToast(message, { type: 'error' });
  };

  const handleClose = () => {
    setTranscript('');
    setIsProcessing(false);
    setParsedTransaction(null);
    setParseError('');
    onClose();
  };

  const handleSaved = () => {
    showToast('Transaksi tersimpan.', { type: 'success' });
    handleClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Talk to MoneyTalk">
      {isProcessing || loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <LoadingSpinner />
          <p style={{ marginTop: '1rem', color: 'var(--text-secondary)'}}>Menganalisis permintaan suara...</p>
        </div>
      ) : parsedTransaction ? (
        <TransactionConfirmation 
          transaction={parsedTransaction}
          onClose={handleClose}
          onSaved={handleSaved}
        />
      ) : (
        <div>
          <div style={{ marginBottom: 18, textAlign: 'center' }}>
            <p style={{ margin: 0, fontWeight: 700, fontSize: '1rem' }}>Berbicara atau rekam transaksi</p>
            <p style={{ margin: '0.5rem 0 0', color: 'var(--text-secondary)' }}>
              Ucapkan seperti "Aku beli kopi 15 ribu" untuk langsung mendapatkan ringkasan transaksi.
            </p>
          </div>
          <VoiceRecorder onTranscript={handleTranscript} />
          {transcript && (
            <div style={{ marginTop: 20, padding: '1rem', borderRadius: '18px', background: 'var(--surface-soft)', border: '1px solid var(--border)' }}>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Teks terdeteksi</p>
              <p style={{ margin: '0.5rem 0 0', fontWeight: 600 }}>{transcript}</p>
            </div>
          )}

          {parseError && (
            <p style={{ marginTop: 14, color: 'var(--expense)', textAlign: 'center' }}>{parseError}</p>
          )}
        </div>
      )}
    </Modal>
  );
};

export default VoiceTransactionModal;
