import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import VoiceRecorder from './VoiceRecorder';
import { useAIChat } from '../../hooks/useAIChat';
import LoadingSpinner from '../ui/LoadingSpinner';
import TransactionConfirmation from '../ai/TransactionConfirmation';
import { useToast } from '../../context/ToastContext';
import styles from './VoiceTransactionModal.module.css';

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  
  const renderContent = () => {
    if (isProcessing || loading) {
      return (
        <div className={styles.processing}>
          <LoadingSpinner message="Menganalisis permintaan suara..." />
        </div>
      );
    }

    if (parsedTransaction) {
      return (
        <div className={styles.confirmation}>
          <TransactionConfirmation 
            transaction={parsedTransaction}
            onClose={handleClose}
            onSaved={handleSaved}
          />
        </div>
      );
    }

    return (
      <div className={styles.modalContent}>
        <div className={styles.header}>
          <p className={styles.headerTitle}>Berbicara atau rekam transaksi</p>
          <p className={styles.headerSubtitle}>
            Ucapkan seperti "Aku beli kopi 15 ribu" untuk langsung mendapatkan ringkasan transaksi.
          </p>
        </div>
        
        <VoiceRecorder onTranscript={handleTranscript} />
        
        {transcript && (
          <div className={styles.transcriptBox}>
            <p className={styles.transcriptLabel}>Teks terdeteksi</p>
            <p className={styles.transcriptText}>{transcript}</p>
          </div>
        )}

        {parseError && (
          <p className={styles.parseError}>{parseError}</p>
        )}
      </div>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Talk to SI MAUNG">
      {renderContent()}
    </Modal>
  );
};

export default VoiceTransactionModal;
