import type { CSSProperties } from 'react';
import { ANIMATED_EMOJI, type AnimatedEmojiName, emojiIconSrc } from './emoji-icons';

interface EmojiIconProps {
  /** Emoji gốc (🧠, 🌸…). Chưa có icon 3D thì hiện chính emoji đó. */
  emoji: string;
  size?: number;
  className?: string;
  style?: CSSProperties;
}

/**
 * Icon 3D thay cho emoji (Microsoft Fluent Emoji). Luôn chỉ để trang trí: chữ đi kèm đã nói nghĩa,
 * nên ảnh có alt rỗng. Emoji chưa có trong bảng → hiện emoji thường, không vỡ giao diện.
 */
export function EmojiIcon({ emoji, size = 22, className = '', style }: EmojiIconProps) {
  const src = emojiIconSrc(emoji);
  if (!src) {
    return <span className={`emoji-icon ${className}`} style={{ fontSize: size * 0.9, lineHeight: 1, ...style }} aria-hidden="true">{emoji}</span>;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- icon tĩnh nhỏ trong public/, không cần next/image tối ưu.
    <img src={src} alt="" aria-hidden="true" width={size} height={size} draggable={false} decoding="async"
      className={`emoji-icon ${className}`} style={style} />
  );
}

/** Emoji động (Google Noto Animated Emoji) cho khoảnh khắc ăn mừng; tải lười — chỉ khi xuất hiện. */
export function AnimatedEmoji({ name, size = 40, className = '' }: { name: AnimatedEmojiName; size?: number; className?: string }) {
  if (!ANIMATED_EMOJI[name]) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- ảnh động WebP, next/image sẽ làm mất chuyển động.
    <img src={`/icons/animated/${name}.webp`} alt="" aria-hidden="true" width={size} height={size} loading="lazy"
      decoding="async" draggable={false} className={`emoji-icon animated ${className}`} />
  );
}
