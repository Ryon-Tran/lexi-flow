'use client';

import { useCallback, useEffect, useState } from 'react';
import { speak, isTTSAvailable } from '@/lib/tts';

/** Hook for text-to-speech functionality */
export function useTTS() {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setIsAvailable(isTTSAvailable());

      // Load voices (some browsers load async)
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = () => {
          setIsAvailable(true);
        };
      }
    }, 0);
  }, []);

  const playWord = useCallback((word: string) => {
    if (!isAvailable) return;
    setIsSpeaking(true);

    speak(word);

    // Estimate speech duration
    const duration = Math.max(500, word.length * 80);
    setTimeout(() => setIsSpeaking(false), duration);
  }, [isAvailable]);

  return { isAvailable, isSpeaking, playWord };
}
