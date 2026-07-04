// ============================================
// LexiFlow — Text-to-Speech Wrapper
// ============================================
// Uses the Web Speech API (free, no API key required)

/**
 * Speak a word using Web Speech API.
 * Prefers US English voice, falls back to any English voice.
 */
export function speak(text: string, lang: string = 'en-US'): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    console.warn('Web Speech API not supported');
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 0.9; // Slightly slower for learning
  utterance.pitch = 1;
  utterance.volume = 1;

  // Try to find a good English voice
  const voices = window.speechSynthesis.getVoices();
  const preferredVoice = voices.find(
    (v) => v.lang === 'en-US' && v.name.includes('Google')
  ) ||
    voices.find((v) => v.lang === 'en-US') ||
    voices.find((v) => v.lang.startsWith('en'));

  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }

  window.speechSynthesis.speak(utterance);
}

/**
 * Check if TTS is available in the current browser.
 */
export function isTTSAvailable(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/**
 * Get available English voices.
 */
export function getEnglishVoices(): SpeechSynthesisVoice[] {
  if (!isTTSAvailable()) return [];
  return window.speechSynthesis
    .getVoices()
    .filter((v) => v.lang.startsWith('en'));
}
