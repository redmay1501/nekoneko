'use client';

import { useSpeech } from '@/hooks/useSpeech';
import { EmojiIcon } from '@/components/common/EmojiIcon';

interface AudioButtonProps {
  text: string;
  label?: string;
  className?: string;
}

/** Nút 🔊 phát âm tiếng Nhật. MVP dùng giọng đọc của trình duyệt (sheet 15, mục C). */
export function AudioButton({ text, label = 'Nghe phát âm', className = 'btn ghost sm' }: AudioButtonProps) {
  const { speak, isSupported } = useSpeech();
  return (
    <button
      type="button"
      className={className}
      onClick={() => speak(text)}
      aria-label={label}
      title={isSupported ? label : 'Trình duyệt này chưa hỗ trợ phát âm'}
    >
      <EmojiIcon emoji="🔊" size={20} />
    </button>
  );
}
