'use client';

import { useSpeech } from '@/hooks/useSpeech';
import { EmojiIcon } from '@/components/common/EmojiIcon';
import { useSpeechPreferenceStore } from '@/stores/speech-preference-store';

interface AudioButtonProps {
  text: string;
  label?: string;
  className?: string;
}

/** Nút 🔊 phát âm tiếng Nhật (giọng đọc của trình duyệt). Bấm lại để nghe lại; đang đọc thì nút sáng lên. */
export function AudioButton({ text, label = 'Nghe phát âm', className = 'btn ghost sm' }: AudioButtonProps) {
  const { speak, isSupported, lacksJapaneseVoice } = useSpeech();
  const isSpeaking = useSpeechPreferenceStore((store) => store.speakingText === text);
  const unavailable = !isSupported || lacksJapaneseVoice;
  return (
    <button
      type="button"
      className={`${className}${isSpeaking ? ' is-speaking' : ''}`}
      onClick={() => speak(text)}
      aria-label={label}
      title={unavailable ? 'Máy này chưa có giọng đọc tiếng Nhật' : label}
    >
      <EmojiIcon emoji="🔊" size={20} />
    </button>
  );
}
