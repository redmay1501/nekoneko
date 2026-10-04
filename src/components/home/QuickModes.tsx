import Link from 'next/link';
import { EmojiIcon } from '@/components/common/EmojiIcon';
import type { SessionMode } from '@/features/learning/session-modes';

const QUICK_MODES: { mode: SessionMode; emoji: string; title: string; subtitle: string; tint: string }[] = [
  { mode: 'quick5', emoji: '⚡', title: 'Học nhanh', subtitle: '5 phút', tint: '#FFF0D9' },
  { mode: 'random', emoji: '🎲', title: 'Học ngẫu nhiên', subtitle: 'Bất ngờ mỗi ngày', tint: '#FCE6F1' },
  { mode: 'discover', emoji: '🧭', title: 'Khám phá', subtitle: 'Vài thứ mới, nhỏ thôi', tint: '#E1F4E6' },
  { mode: 'more', emoji: '🌱', title: 'Học thêm', subtitle: 'Mở rộng kiến thức', tint: '#E9F5DC' },
  { mode: 'use', emoji: '🎯', title: 'Thực hành', subtitle: 'Dùng trong câu', tint: '#FFE9DE' },
];

/** Hàng lối tắt các kiểu học khác — mỗi ô là một chế độ của Session Engine. */
export function QuickModes() {
  return (
    <nav className="dash-modes" aria-label="Các kiểu học khác">
      {QUICK_MODES.map((item) => (
        <Link key={item.mode} href={`/hoc/${item.mode}`} className="dash-mode">
          <span className="dash-mode-icon" style={{ background: item.tint }}><EmojiIcon emoji={item.emoji} size={28} /></span>
          <span><b>{item.title}</b><span>{item.subtitle}</span></span>
        </Link>
      ))}
    </nav>
  );
}
