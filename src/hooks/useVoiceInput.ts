import { useState, useCallback } from 'react';

export const useVoiceInput = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');

  const startListening = useCallback(async () => {
    setIsListening(true);
    setTranscript('');
  }, []);

  const stopListening = useCallback(async () => {
    setIsListening(false);
  }, []);

  const cancelListening = useCallback(() => {
    setIsListening(false);
    setTranscript('');
  }, []);

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    cancelListening,
    hasPermission: false,
    requestPermission: async () => false,
  };
};