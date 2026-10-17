'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { installSpeechUnlock, stopSpeech } from '@/hooks/useSpeech';
import { type VoiceGender, pickJapaneseVoice } from '@/lib/speech/japanese-voices';
import { useSpeechPreferenceStore } from '@/stores/speech-preference-store';

/**
 * Đưa thiết lập âm thanh đã lưu (user_settings) vào store dùng chung cho mọi nút 🔊 và phần tự phát âm,
 * mở khoá giọng đọc ở lần chạm đầu tiên và dừng giọng đọc khi đổi trang. Không hiển thị gì.
 */
export function SpeechPreferenceSync({ voiceGender, autoplayAudio }: { voiceGender: VoiceGender; autoplayAudio: boolean }) {
  const setVoiceGender = useSpeechPreferenceStore((store) => store.setVoiceGender);
  const setAutoplayAudio = useSpeechPreferenceStore((store) => store.setAutoplayAudio);
  useEffect(() => setVoiceGender(voiceGender), [voiceGender, setVoiceGender]);
  useEffect(() => setAutoplayAudio(autoplayAudio), [autoplayAudio, setAutoplayAudio]);
  // Đổi trang → dừng câu đang đọc dở (không để tiếng của trang cũ đọc tiếp, không chồng tiếng với trang mới).
  const pathname = usePathname();
  useEffect(() => stopSpeech, [pathname]);
  useEffect(() => installSpeechUnlock(() =>
    pickJapaneseVoice(window.speechSynthesis.getVoices(), useSpeechPreferenceStore.getState().voiceGender)?.voice ?? null), []);
  return null;
}
