import { useState } from "react";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import { useAIChat } from "../hooks/useAIChat";

import AIChat from "../components/ai/AIChat";
import ChatInput from "../components/ai/ChatInput";
import TransactionConfirmation from "../components/ai/TransactionConfirmation";
import Button from "../components/ui/Button";

function AIChatPage() {
  const { user } = useAuth();
  const showToast = useToast();
  const { parseTransaction, loading: isAIThinking } = useAIChat();
  
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      content: `Hello ${user?.user_metadata?.full_name || 'there'}! How can I help you manage your finances today? You can ask me questions or just type a transaction like "bought a large pizza for 120k".`
    }
  ]);

  const handleSendMessage = async (text) => {
    const newUserMessage = {
      id: Date.now(),
      role: 'user',
      content: text,
    };
    setMessages(prev => [...prev, newUserMessage]);

    const result = await parseTransaction(text);

    let assistantMessageContent;

    if (result?.intent === 'create_transaction') {
      assistantMessageContent = (
        <TransactionConfirmation 
          transaction={result}
          onClose={() => {
            setMessages(prev => prev.filter(msg => msg.id !== Date.now()));
            showToast('Transaction cancelled.', { type: 'info' });
          }}
          onSaved={() => {
            const newMessages = messages.filter(msg => msg.id !== Date.now());
            setMessages([...newMessages, {
              id: Date.now() + 1,
              role: 'assistant',
              content: `Great! I've saved the transaction for "${result.description}".`
            }]);
            showToast('Transaction saved successfully!', { type: 'success' });
          }}
        />
      );
    } else {
      // This is where you would integrate a more general-purpose AI chat response.
      // For now, we'll just give a default response if it's not a transaction.
      assistantMessageContent = "I'm not sure how to handle that, but I've been designed to understand transaction inputs like 'bought coffee 20k'. Please try something like that!";
    }
    
    const newAssistantMessage = {
      id: Date.now() + 1, // Ensure unique key
      role: 'assistant',
      content: assistantMessageContent,
    };

    setMessages(prev => [...prev, newAssistantMessage]);
  };

  return (
    <div className="page-shell">
      <div className="dashboard-header" style={{ alignItems: 'flex-start' }}>
        <div>
          <p className="dashboard-subtitle">AI Assistant</p>
          <h1>Your Personal Finance Chat</h1>
        </div>
      </div>

      <AIChat messages={messages} isThinking={isAIThinking} />

      <ChatInput onSendMessage={handleSendMessage} disabled={isAIThinking} />
      
    </div>
  );
}

export default AIChatPage;
