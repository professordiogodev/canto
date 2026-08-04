let voicesPromise: Promise<SpeechSynthesisVoice[]> | null = null;

function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  if (voicesPromise) return voicesPromise;
  voicesPromise = new Promise((resolve) => {
    const existing = window.speechSynthesis.getVoices();
    if (existing.length > 0) {
      resolve(existing);
      return;
    }
    window.speechSynthesis.onvoiceschanged = () => {
      resolve(window.speechSynthesis.getVoices());
    };
    // Some browsers never fire the event if voices were already ready.
    setTimeout(() => resolve(window.speechSynthesis.getVoices()), 500);
  });
  return voicesPromise;
}

// Prefer a Cantonese (Hong Kong) voice, then any Chinese voice, then let the
// browser fall back to its default for the requested lang.
function pickVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const cantonese = voices.find((v) => /^zh-hk/i.test(v.lang) || /yue/i.test(v.lang));
  if (cantonese) return cantonese;
  const anyChinese = voices.find((v) => /^zh/i.test(v.lang));
  return anyChinese || null;
}

export function canSpeak(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export async function speak(text: string) {
  if (!canSpeak()) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "zh-HK";
  utterance.rate = 0.85;
  const voice = pickVoice(await loadVoices());
  if (voice) utterance.voice = voice;
  window.speechSynthesis.speak(utterance);
}
