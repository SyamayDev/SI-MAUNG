import { createContext, useContext, useState } from 'react';
import VoiceTransactionModal from '../components/voice/VoiceTransactionModal';

const ModalContext = createContext();

export const useModal = () => useContext(ModalContext);

export const ModalProvider = ({ children }) => {
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);

  const openVoiceModal = () => setIsVoiceModalOpen(true);
  const closeVoiceModal = () => setIsVoiceModalOpen(false);

  return (
    <ModalContext.Provider value={{ openVoiceModal, closeVoiceModal }}>
      {children}
      <VoiceTransactionModal isOpen={isVoiceModalOpen} onClose={closeVoiceModal} />
    </ModalContext.Provider>
  );
};
