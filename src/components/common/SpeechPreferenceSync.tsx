'use client';

import { useEffect } from 'react';
import { installSpeechUnlock } from '@/hooks/useSpeech';
import { type VoiceGender, pickJapaneseVoice } from '@/lib/speech/japanese-voices';
import { useSpeechPreferenceStore } from '@/stores/speech-preference-store';

/**
 * Đưa thiết lập âm thanh đã lưu (user_settings) vào store dùng chung cho mọi nút 🔊 và phần tự phát âm,
 * và mở khoá giọng đọc ở lần chạm đầu tiên. Không hiển thị gì.
 */
export function SpeechPreferenceSync({ voiceGender, autoplayAudio }: { voiceGender: VoiceGender; autoplayAudio: boolean }) {
  const setVoiceGender = useSpeechPreferenceStore((store) => store.setVoiceGender);
  const setAutoplayAudio = useSpeechPreferenceStore((store) => store.setAutoplayAudio);
  useEffect(() => setVoiceGender(voiceGender), [voiceGender, setVoiceGender]);
  useEffect(() => setAutoplayAudio(autoplayAudio), [autoplayAudio, setAutoplayAudio]);
  useEffect(() => installSpeechUnlock(() =>
    pickJapaneseVoice(window.speechSynthesis.getVoices(), useSpeechPreferenceStore.getState().voiceGender)?.voice ?? null), []);
  return null;
}
