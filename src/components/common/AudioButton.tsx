'use client';

import { useSpeech } from '@/hooks/useSpeech';
import { EmojiIcon } from '@/components/common/EmojiIcon';
import { useSpeechPreferenceStore } from '@/stores/speech-preference-store';

interface AudioButtonProps {
  text: string;
  label?: string;
  className?: string;
  /** Hiện chữ "Nghe" cạnh loa — nút to, dễ bấm bằng ngón cái. */
  showText?: boolean;
}

/** Nút 🔊 phát âm tiếng Nhật (giọng đọc của trình duyệt). Đang đọc thì nút sáng lên — bấm lần nữa là DỪNG. */
export function AudioButton({ text, label = 'Nghe phát âm', className = 'btn ghost sm', showText = false }: AudioButtonProps) {
  const { toggle, isSupported, lacksJapaneseVoice } = useSpeech();
  const isSpeaking = useSpeechPreferenceStore((store) => store.speakingText === text && !store.isSpeakingSlow);
  const unavailable = !isSupported || lacksJapaneseVoice;
  return (
    <button
      type="button"
      className={`${className}${isSpeaking ? ' is-speaking' : ''}`}
      onClick={() => toggle(text)}
      aria-label={isSpeaking ? 'Dừng đọc' : label}
      aria-pressed={isSpeaking}
      title={unavailable ? 'Máy này chưa có giọng đọc tiếng Nhật' : isSpeaking ? 'Dừng đọc' : label}
    >
      <EmojiIcon emoji="🔊" size={20} />{showText ? <span className="audio-text">{isSpeaking ? 'Dừng' : 'Nghe'}</span> : null}
    </button>
  );
}

/**
 * Mặt chữ lớn bấm được để nghe — chỗ ngón tay chạm tự nhiên nhất khi đang nhìn chữ.
 * Có gợi ý nhỏ "chạm để nghe" cho người mới.
 */
export function SpeakableFace({ text, face, className, style }: { text: string; face: string; className?: string; style?: React.CSSProperties }) {
  const { speak } = useSpeech();
  const isSpeaking = useSpeechPreferenceStore((store) => store.speakingText === text);
  return (
    <button type="button" className={`speakable-face ${className ?? ''}${isSpeaking ? ' is-speaking' : ''}`} style={style}
      onClick={() => speak(text)} aria-label={`${face} — chạm để nghe`} title="Chạm để nghe">
      {face}
    </button>
  );
}
