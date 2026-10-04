'use client';

import { useEffect } from 'react';
import type { VoiceGender } from '@/lib/speech/japanese-voices';
import { useSpeechPreferenceStore } from '@/stores/speech-preference-store';

/** Đưa giọng đọc đã lưu (user_settings) vào store dùng chung cho mọi nút 🔊. Không hiển thị gì. */
export function SpeechPreferenceSync({ voiceGender }: { voiceGender: VoiceGender }) {
  const setVoiceGender = useSpeechPreferenceStore((store) => store.setVoiceGender);
  useEffect(() => setVoiceGender(voiceGender), [voiceGender, setVoiceGender]);
  return null;
}
