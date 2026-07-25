import { useEffect, useRef, useState, useCallback } from "react";

const useVoiceRecognition = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState("");
  const [isSupported, setIsSupported] = useState(false);

  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setIsSupported(true);
      recognitionRef.current = new SpeechRecognition();
      const recognition = recognitionRef.current;
      recognition.lang = "id-ID";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event) => {
        const text = event.results[0][0].transcript;
        setTranscript(text);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = (event) => {
        setError(`Voice recognition error: ${event.error}`);
        setIsListening(false);
      };
    } else {
      setIsSupported(false);
    }
  }, []);

  const start = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        setTranscript("");
        setError("");
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        setError(`Could not start recognition: ${e.message}`);
        setIsListening(false);
      }
    }
  }, [isListening]);

  const stop = useCallback(() => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
        setIsListening(false);
      } catch (e) {
        setError(`Could not stop recognition: ${e.message}`);
        setIsListening(false);
      }
    }
  }, [isListening]);

  return { isListening, transcript, start, stop, error, isSupported };
};

export default useVoiceRecognition;
