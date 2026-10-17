'use client';

import { create } from 'zustand';
import type { VoiceGender } from '@/lib/speech/japanese-voices';

/**
 * Âm thanh của người học — mọi nút 🔊 và phần tự phát âm trong app đều đọc theo.
 * Giá trị đầu lấy từ user_settings (AppShell → SpeechPreferenceSync); Cài đặt và nút 🔊/🔇 trong phiên học cập nhật.
 */
interface SpeechPreferenceStore {
  voiceGender: VoiceGender;
  /** "Tự phát âm thanh": thẻ từ mới và đáp án trong phiên học, thẻ chi tiết kiến thức. */
  autoplayAudio: boolean;
  /** Trình duyệt chặn tự phát (chưa có thao tác chạm) — chờ lần chạm tới để phát lại `pendingText`. */
  isAudioBlocked: boolean;
  pendingText: string | null;
  /** Câu đang được đọc — để nút 🔊 hiện trạng thái "đang phát". */
  speakingText: string | null;
  /** Câu đang đọc ở tốc độ chậm (nút 🐢) — để nút đúng là nút sáng lên. */
  isSpeakingSlow: boolean;
  setVoiceGender: (voiceGender: VoiceGender) => void;
  setAutoplayAudio: (autoplayAudio: boolean) => void;
  setAudioBlocked: (pendingText: string | null) => void;
  setSpeakingText: (speakingText: string | null, isSlow?: boolean) => void;
}

export const useSpeechPreferenceStore = create<SpeechPreferenceStore>((set) => ({
  voiceGender: 'female',
  autoplayAudio: true,
  isAudioBlocked: false,
  pendingText: null,
  speakingText: null,
  isSpeakingSlow: false,
  setVoiceGender: (voiceGender) => set({ voiceGender }),
  setAutoplayAudio: (autoplayAudio) => set({ autoplayAudio }),
  setAudioBlocked: (pendingText) => set({ isAudioBlocked: pendingText !== null, pendingText }),
  setSpeakingText: (speakingText, isSlow = false) => set({ speakingText, isSpeakingSlow: speakingText ? isSlow : false }),
}));
