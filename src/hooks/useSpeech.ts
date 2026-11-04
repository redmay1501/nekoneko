'use client';

import { useCallback, useSyncExternalStore } from 'react';
import { pickJapaneseVoice } from '@/lib/speech/japanese-voices';
import { useSpeechPreferenceStore } from '@/stores/speech-preference-store';

const JAPANESE_LOCALE = 'ja-JP';
/** Nói chậm hơn bình thường một chút — người mới học nghe rõ hơn. */
const LEARNER_SPEECH_RATE = 0.85;
/** Nút 🐢 "Nghe chậm": ≈ 0.75 lần tốc độ thường (đổi thật tốc độ tổng hợp giọng — không phải nhãn suông). */
export const SLOW_SPEECH_FACTOR = 0.75;
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

/** Lỗi của giọng đọc (không phải do người học / trang huỷ) → thử giọng tiếng Nhật khác một lần. */
const RETRYABLE_ERRORS = new Set(['synthesis-failed', 'synthesis-unavailable', 'network', 'voice-unavailable', 'audio-busy', 'audio-hardware']);
/** Gọi speak() mà sau chừng này vẫn chưa bắt đầu đọc → coi như hỏng (Chrome hay "nuốt" câu khi giọng online không tới được). */
const START_TIMEOUT_MS = 2500;
/**
 * Giữ tham chiếu câu đang đọc: Chrome có lỗi để bộ dọn rác thu hồi SpeechSynthesisUtterance khi đang đọc → không phát / không bao
 * giờ báo "đọc xong" (nút kẹt ở "đang đọc").
 */
let currentUtterance: SpeechSynthesisUtterance | null = null;
const CANCEL_GAP_MS = 60;
/** Thiết bị cảm ứng (iPhone / iPad / Android): Safari iOS chỉ cho phát âm bắt đầu ngay trong thao tác chạm. */
const isTouchDevice = () => window.matchMedia?.('(pointer: coarse)').matches || /iP(hone|ad|od)/.test(navigator.userAgent);
let startWatchdog = 0;

/** Giọng tiếng Nhật dự phòng (khác giọng vừa lỗi), ưu tiên giọng cài sẵn trên máy (không cần mạng). */
function fallbackVoice(failed: SpeechSynthesisVoice | null): SpeechSynthesisVoice | null {
  const candidates = window.speechSynthesis.getVoices().filter((voice) => /^ja/i.test(voice.lang.replace('_', '-')) && voice !== failed && voice.name !== failed?.name);
  return candidates.find((voice) => voice.localService) ?? candidates[0] ?? null;
}

/** Đọc một câu. Lỗi "not-allowed" = trình duyệt chặn tự phát (iOS / chưa chạm màn hình) → ghi nhớ để phát lại khi chạm. */
function speakNow(text: string, voice: SpeechSynthesisVoice | null, isSlow = false, isRetry = false) {
  const store = useSpeechPreferenceStore.getState();
  const synth = window.speechSynthesis;
  // Danh sách giọng đã tải mà không có giọng tiếng Nhật → không đọc bằng giọng tiếng Anh, báo cho người học cách cài giọng.
  if (!voice && synth.getVoices().length > 0 && !synth.getVoices().some((entry) => /^ja/i.test(entry.lang.replace('_', '-')))) {
    store.setSpeechError('no-voice');
    return;
  }
  // Chỉ huỷ khi đang đọc dở: gọi cancel() khi không có gì để huỷ làm Safari phát chậm (hoặc nuốt mất) câu kế tiếp.
  const didCancel = synth.speaking || synth.pending;
  if (didCancel) synth.cancel();
  // Chrome đôi khi kẹt ở trạng thái "tạm dừng" (sau khi tab bị ẩn / huỷ giữa chừng) → mọi câu sau đều im lặng.
  if (synth.paused) synth.resume();
  window.clearTimeout(startWatchdog);
  const utterance = new SpeechSynthesisUtterance(text);
  currentUtterance = utterance;
  utterance.lang = JAPANESE_LOCALE;
  utterance.rate = isSlow ? LEARNER_SPEECH_RATE * SLOW_SPEECH_FACTOR : LEARNER_SPEECH_RATE;
  if (voice) utterance.voice = voice;
  let started = false;
  const retryOrFail = () => {
    window.clearTimeout(startWatchdog);
    if (currentUtterance !== utterance) return; // đã có câu mới thay thế
    if (useSpeechPreferenceStore.getState().speakingText === text) store.setSpeakingText(null);
    const alternative = isRetry ? null : fallbackVoice(voice);
    if (alternative) { speakNow(text, alternative, isSlow, true); return; }
    currentUtterance = null;
    store.setSpeechError('failed');
  };
  utterance.onstart = () => {
    started = true;
    window.clearTimeout(startWatchdog);
    store.setAudioBlocked(null);
    store.setSpeechError(null);
    store.setSpeakingText(text, isSlow);
  };
  utterance.onend = () => {
    window.clearTimeout(startWatchdog);
    if (currentUtterance === utterance) currentUtterance = null;
    if (useSpeechPreferenceStore.getState().speakingText === text) store.setSpeakingText(null);
  };
  utterance.onerror = (event) => {
    if (useSpeechPreferenceStore.getState().speakingText === text) store.setSpeakingText(null);
    if (event.error === 'not-allowed') { window.clearTimeout(startWatchdog); store.setAudioBlocked(text); return; }
    if (RETRYABLE_ERRORS.has(event.error)) { retryOrFail(); return; }
    // interrupted / canceled: do câu mới thay thế hoặc người học bấm dừng — không phải lỗi.
    window.clearTimeout(startWatchdog);
  };
  startWatchdog = window.setTimeout(() => { if (!started && currentUtterance === utterance) { synth.cancel(); retryOrFail(); } }, START_TIMEOUT_MS);
  // Chrome (Mac / Windows) hay "nuốt" câu gọi speak() NGAY sau cancel() — máy tính chờ một nhịp ngắn rồi mới đọc.
  // Thiết bị cảm ứng (Safari iOS) thì phải đọc ngay trong lượt chạm, nên không chờ.
  if (didCancel && !isTouchDevice()) window.setTimeout(() => { if (currentUtterance === utterance) synth.speak(utterance); }, CANCEL_GAP_MS);
  else synth.speak(utterance);
}

/** Dừng hẳn mọi câu đang đọc và câu đang chờ trong hàng đợi của trình duyệt. */
export function stopSpeech() {
  if (!hasSpeech()) return;
  window.clearTimeout(startWatchdog);
  currentUtterance = null;
  window.speechSynthesis.cancel();
  useSpeechPreferenceStore.getState().setSpeakingText(null);
}

let isUnlocked = false;
/**
 * Mở khoá giọng đọc ở lần chạm / phím ĐẦU TIÊN (Safari iOS chỉ cho phát âm bắt đầu từ một thao tác người dùng).
 * Có câu đang chờ vì bị chặn → phát luôn trong chính thao tác đó. Gọi một lần ở AppShell.
 */
export function installSpeechUnlock(getVoice: () => SpeechSynthesisVoice | null): () => void {
  if (!hasSpeech()) return () => undefined;
  // Câu "im lặng" mở khoá chỉ cần cho thiết bị cảm ứng (Safari iOS / iPadOS). Trên PC nó còn hại: ngay sau đó bấm 🔊 thì câu
  // im lặng đang đọc bị cancel() và Chrome hay nuốt luôn câu thật vừa gọi.
  const needsWarmUp = isTouchDevice();
  const unlock = () => {
    const { pendingText } = useSpeechPreferenceStore.getState();
    if (pendingText) {
      speakNow(pendingText, getVoice());
    } else if (!isUnlocked && needsWarmUp) {
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

  const speak = useCallback((text: string, options?: { slow?: boolean }) => {
    if (!hasSpeech() || !text) return;
    speakNow(text, voice, options?.slow ?? false);
  }, [voice]);

  const stop = useCallback(() => stopSpeech(), []);

  /** Nút loa: đang đọc đúng câu này (cùng tốc độ) thì DỪNG; còn lại thì đọc. */
  const toggle = useCallback((text: string, options?: { slow?: boolean }) => {
    const { speakingText, isSpeakingSlow } = useSpeechPreferenceStore.getState();
    // Trạng thái "đang đọc" chỉ tin khi trình duyệt thật sự đang đọc (Chrome có lúc không báo "đọc xong" → nút kẹt ở Dừng).
    const isReallySpeaking = window.speechSynthesis.speaking || window.speechSynthesis.pending;
    if (speakingText === text && isSpeakingSlow === (options?.slow ?? false) && isReallySpeaking) stopSpeech();
    else speak(text, options);
  }, [speak]);

  return {
    speak,
    stop,
    toggle,
    isSupported,
    voiceChoice: choice,
    hasVoiceList: voices.length > 0,
    /** Danh sách giọng đã tải mà không có giọng tiếng Nhật → nút 🔊 không phát được tiếng Nhật trên máy này. */
    lacksJapaneseVoice: voices.length > 0 && !choice,
  };
}
