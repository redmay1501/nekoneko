'use client';

import { useSpeech } from '@/hooks/useSpeech';
import { useSpeechPreferenceStore } from '@/stores/speech-preference-store';

/**
 * Nút nghe trong Sổ luyện viết — loa vẽ nét mảnh (SVG) cho gọn, hợp với giấy tập viết; đang đọc thì hiện sóng âm và
 * nền hồng. Dùng chung giọng đọc tiếng Nhật của app (useSpeech) như các nút Nghe khác.
 */
export function ListenButton({ text, label, className = '' }: { text: string; label: string; className?: string }) {
  const { speak, isSupported, lacksJapaneseVoice } = useSpeech();
  const isSpeaking = useSpeechPreferenceStore((store) => store.speakingText === text);
  const unavailable = !isSupported || lacksJapaneseVoice;
  return (
    <button type="button" className={`nb-listen ${isSpeaking ? 'is-speaking' : ''} ${className}`} onClick={() => speak(text)}
      aria-label={label} title={unavailable ? 'Máy này chưa có giọng đọc tiếng Nhật' : label}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4z" fill="currentColor" fillOpacity=".18" />
        <path className="nb-listen-wave nb-listen-wave-1" d="M15.5 9.2a4 4 0 0 1 0 5.6" />
        <path className="nb-listen-wave nb-listen-wave-2" d="M18.3 6.6a7.6 7.6 0 0 1 0 10.8" />
      </svg>
    </button>
  );
}
