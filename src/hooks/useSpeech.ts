'use client';

import { useCallback, useSyncExternalStore } from 'react';
import { pickJapaneseVoice } from '@/lib/speech/japanese-voices';
import { useSpeechPreferenceStore } from '@/stores/speech-preference-store';

const JAPANESE_LOCALE = 'ja-JP';
/** Nói chậm hơn bình thường một chút — người mới học nghe rõ hơn. */
const LEARNER_SPEECH_RATE = 0.85;
const NO_VOICES: SpeechSynthesisVoice[] = [];

const hasSpeech = () => typeof window !== 'undefined' && 'speechSynthesis' in window;

/**
 * Danh sách giọng của trình duyệt tải không đồng bộ (Chrome trả rỗng lúc đầu) → nghe sự kiện voiceschanged.
 * Dùng chung MỘT lần đăng ký cho mọi nút 🔊 trên trang.
 */
let cachedVoices: SpeechSynthesisVoice[] = NO_VOICES;
const voiceListeners = new Set<() => void>();
function refreshVoices() {
  cachedVoices = window.speechSynthesis.getVoices();
  for (const listener of voiceListeners) listener();
}
function subscribeVoices(onChange: () => void): () => void {
  if (!hasSpeech()) return () => undefined;
  if (voiceListeners.size === 0) {
    window.speechSynthesis.addEventListener('voiceschanged', refreshVoices);
    cachedVoices = window.speechSynthesis.getVoices();
  }
  voiceListeners.add(onChange);
  return () => {
    voiceListeners.delete(onChange);
    if (voiceListeners.size === 0) window.speechSynthesis.removeEventListener('voiceschanged', refreshVoices);
  };
}
const getVoices = () => cachedVoices;
const getServerVoices = () => NO_VOICES;

/**
 * Phát âm tiếng Nhật bằng giọng có sẵn trên máy (Web Speech API), đúng giọng nam/nữ người học chọn.
 * Luôn chỉ định rõ một giọng tiếng Nhật — không để trình duyệt tự chọn (có máy sẽ đọc bằng giọng tiếng Anh).
 * Trình duyệt không hỗ trợ thì nút vẫn hiện nhưng không phát — không làm hỏng luồng học.
 */
export function useSpeech() {
  const isSupported = useSyncExternalStore(() => () => undefined, hasSpeech, () => false);
  const voices = useSyncExternalStore(subscribeVoices, getVoices, getServerVoices);
  const voiceGender = useSpeechPreferenceStore((store) => store.voiceGender);
  const choice = pickJapaneseVoice(voices, voiceGender);

  const speak = useCallback((text: string) => {
    if (!hasSpeech() || !text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = JAPANESE_LOCALE;
    utterance.rate = LEARNER_SPEECH_RATE;
    if (choice) utterance.voice = choice.voice;
    window.speechSynthesis.speak(utterance);
  }, [choice]);

  return { speak, isSupported, voiceChoice: choice, hasVoiceList: voices.length > 0 };
}
