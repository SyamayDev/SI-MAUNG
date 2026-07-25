import AIChat from "../components/ai/AIChat";
import ChatInput from "../components/ai/ChatInput";
import TransactionConfirmation from "../components/ai/TransactionConfirmation";
import VoiceTransactionModal from "../components/voice/VoiceTransactionModal";
import { useState } from "react";
import { useToast } from "../context/ToastContext";

function AIChatPage() {
  const [parsedTx, setParsedTx] = useState(null);
  const [showVoice, setShowVoice] = useState(false);
  const showToast = useToast();

  return (
    <div className="page-shell">
      <div className="dashboard-header">
        <div>
          <p className="dashboard-subtitle">AI Assistant</p>
          <h1>Catat transaksi dengan AI atau suara</h1>
        </div>
        <div>
          <button className="button-secondary" onClick={() => setShowVoice(true)}>
            Rekam Suara
          </button>
        </div>
      </div>

      <AIChat parsedTx={parsedTx} onClear={() => setParsedTx(null)} />

      <ChatInput
        onParsed={(tx) => setParsedTx(tx)}
        onError={(msg) => showToast(msg, { type: "error" })}
      />

      {parsedTx && (
        <TransactionConfirmation
          transaction={parsedTx}
          onClose={() => setParsedTx(null)}
          onSaved={() => {
            setParsedTx(null);
            showToast("Transaksi disimpan.", { type: "success" });
          }}
        />
      )}

      <VoiceTransactionModal
        isOpen={showVoice}
        onClose={() => setShowVoice(false)}
      />
    </div>
  );
}

export default AIChatPage;
