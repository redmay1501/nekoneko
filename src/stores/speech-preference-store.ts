'use client';

import { create } from 'zustand';
import type { VoiceGender } from '@/lib/speech/japanese-voices';

/**
 * Giọng đọc người học chọn trong Cài đặt — mọi nút 🔊 trong app đều đọc theo.
 * Giá trị đầu lấy từ user_settings (AppShell → SpeechPreferenceSync); Cài đặt cập nhật khi người học đổi.
 */
interface SpeechPreferenceStore {
  voiceGender: VoiceGender;
  setVoiceGender: (voiceGender: VoiceGender) => void;
}

export const useSpeechPreferenceStore = create<SpeechPreferenceStore>((set) => ({
  voiceGender: 'female',
  setVoiceGender: (voiceGender) => set({ voiceGender }),
}));
