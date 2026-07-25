import React, { useEffect } from 'react';
import useVoiceRecognition from '../../hooks/useVoiceRecognition';
import VoiceVisualizer from './VoiceVisualizer';
import { Mic, MicOff } from 'lucide-react';
import styles from './Voice.module.css';

const VoiceRecorder = ({ onTranscript }) => {
  const { isListening, transcript, start, stop, error, isSupported } = useVoiceRecognition();

  useEffect(() => {
    if (!isListening && transcript) {
      onTranscript(transcript);
    }
  }, [isListening, transcript, onTranscript]);

  if (!isSupported) {
    return (
      <div className={styles.voiceContainer}>
        <p className={styles.errorText}>
          Sorry, your browser does not support voice recognition. Try using Chrome or Safari.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.voiceContainer}>
      <p className={styles.instructionText}>
        {isListening ? "I'm listening..." : "Press the button and start speaking."}
      </p>

      <div 
        className={`${styles.micButton} ${isListening ? styles.listening : ''}`}
        onClick={isListening ? stop : start}
      >
        {isListening ? <MicOff size={40} /> : <Mic size={40} />}
      </div>
      
      {isListening && <VoiceVisualizer />}

      <p className={styles.transcriptText}>{transcript}</p>

      {error && <p className={styles.errorText}>{error}</p>}
    </div>
  );
};

export default VoiceRecorder;
