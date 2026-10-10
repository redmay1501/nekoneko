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

/** Đọc một câu. Lỗi "not-allowed" = trình duyệt chặn tự phát (iOS / chưa chạm màn hình) → ghi nhớ để phát lại khi chạm. */
function speakNow(text: string, voice: SpeechSynthesisVoice | null) {
  const store = useSpeechPreferenceStore.getState();
  // Chỉ huỷ khi đang đọc dở: gọi cancel() khi không có gì để huỷ làm Safari phát chậm (hoặc nuốt mất) câu kế tiếp.
  if (window.speechSynthesis.speaking || window.speechSynthesis.pending) window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = JAPANESE_LOCALE;
  utterance.rate = LEARNER_SPEECH_RATE;
  if (voice) utterance.voice = voice;
  utterance.onstart = () => { store.setAudioBlocked(null); store.setSpeakingText(text); };
  utterance.onend = () => { if (useSpeechPreferenceStore.getState().speakingText === text) store.setSpeakingText(null); };
  utterance.onerror = (event) => {
    if (useSpeechPreferenceStore.getState().speakingText === text) store.setSpeakingText(null);
    if (event.error === 'not-allowed') store.setAudioBlocked(text);
  };
  window.speechSynthesis.speak(utterance);
}

let isUnlocked = false;
/**
 * Mở khoá giọng đọc ở lần chạm / phím ĐẦU TIÊN (Safari iOS chỉ cho phát âm bắt đầu từ một thao tác người dùng).
 * Có câu đang chờ vì bị chặn → phát luôn trong chính thao tác đó. Gọi một lần ở AppShell.
 */
export function installSpeechUnlock(getVoice: () => SpeechSynthesisVoice | null): () => void {
  if (!hasSpeech()) return () => undefined;
  const unlock = () => {
    const { pendingText } = useSpeechPreferenceStore.getState();
    if (pendingText) {
      speakNow(pendingText, getVoice());
    } else if (!isUnlocked) {
      const silent = new SpeechSynthesisUtterance(' ');
      silent.volume = 0;
      window.speechSynthesis.speak(silent);
    }
    isUnlocked = true;
  };
  window.addEventListener('pointerdown', unlock, { capture: true });
  window.addEventListener('keydown', unlock, { capture: true });
  return () => {
    window.removeEventListener('pointerdown', unlock, { capture: true });
    window.removeEventListener('keydown', unlock, { capture: true });
  };
}

/**
 * Phát âm tiếng Nhật bằng giọng có sẵn trên máy (Web Speech API), đúng giọng nam/nữ người học chọn.
 * Luôn chỉ định rõ một giọng tiếng Nhật — không để trình duyệt tự chọn (có máy sẽ đọc bằng giọng tiếng Anh).
 * Mỗi lần đọc huỷ câu đang đọc → không bao giờ chồng tiếng khi chuyển nhanh giữa các từ.
 * Trình duyệt không hỗ trợ thì nút vẫn hiện nhưng không phát — không làm hỏng luồng học.
 */
export function useSpeech() {
  const isSupported = useSyncExternalStore(() => () => undefined, hasSpeech, () => false);
  const voices = useSyncExternalStore(subscribeVoices, getVoices, getServerVoices);
  const voiceGender = useSpeechPreferenceStore((store) => store.voiceGender);
  const choice = pickJapaneseVoice(voices, voiceGender);
  const voice = choice?.voice ?? null;

  const speak = useCallback((text: string) => {
    if (!hasSpeech() || !text) return;
    speakNow(text, voice);
  }, [voice]);

  const stop = useCallback(() => {
    if (!hasSpeech()) return;
    window.speechSynthesis.cancel();
    useSpeechPreferenceStore.getState().setSpeakingText(null);
  }, []);

  return {
    speak,
    stop,
    isSupported,
    voiceChoice: choice,
    hasVoiceList: voices.length > 0,
    /** Danh sách giọng đã tải mà không có giọng tiếng Nhật → nút 🔊 không phát được tiếng Nhật trên máy này. */
    lacksJapaneseVoice: voices.length > 0 && !choice,
  };
}
