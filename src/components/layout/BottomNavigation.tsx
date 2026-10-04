'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSheetStore } from '@/stores/sheet-store';
import { BOTTOM_NAVIGATION, isActivePath } from './navigation-items';
import { EmojiIcon } from '@/components/common/EmojiIcon';

/** Thanh dưới (mobile/iPad) — nút ＋ Học ngay ở giữa mở khay chọn kiểu học. */
export function BottomNavigation() {
  const pathname = usePathname();
  const openModes = useSheetStore((state) => state.openModes);
  const [first, second, ...rest] = BOTTOM_NAVIGATION;

  const renderLink = (item: (typeof BOTTOM_NAVIGATION)[number]) => {
    const isActive = isActivePath(pathname, item.href);
    return (
      <Link key={item.href} href={item.href} className={`bn ${isActive ? 'on' : ''}`} aria-current={isActive ? 'page' : undefined}>
        <span className="ic"><EmojiIcon emoji={item.icon} size={30} /></span>
        <span>{item.label}</span>
      </Link>
    );
  };

  return (
    <nav className="bottomnav" aria-label="Điều hướng nhanh">
      {renderLink(first)}
      {renderLink(second)}
      <button type="button" className="bn" onClick={openModes} aria-label="Học ngay">
        <span className="bn-fab" aria-hidden="true">＋</span>
        <span>Học ngay</span>
      </button>
      {rest.map(renderLink)}
    </nav>
  );
}
