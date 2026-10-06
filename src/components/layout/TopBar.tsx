'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSheetStore } from '@/stores/sheet-store';
import { EmojiIcon } from '@/components/common/EmojiIcon';
import { BrandLogo } from '@/components/common/BrandLogo';
import { APP_NAME } from '@/config/brand';
import { UserMenu } from './UserMenu';

interface TopBarProps {
  displayName: string;
  level: number;
  recallDays: number;
  /** Chế độ nhẹ nhàng: không đếm chuỗi ngày (cài đặt của người học). */
  isGentleMode: boolean;
  isDemo: boolean;
}

export function TopBar({ displayName, level, recallDays, isGentleMode, isDemo }: TopBarProps) {
  const { openNavigation, openSearch } = useSheetStore();
  const pathname = usePathname();
  const [query, setQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    function updateScrollState() {
      setIsScrolled(window.scrollY > 8);
    }
    updateScrollState();
    window.addEventListener('scroll', updateScrollState, { passive: true });
    return () => window.removeEventListener('scroll', updateScrollState);
  }, []);

  return (
    <header className={`topbar${pathname === '/' ? ' home-topbar' : ''}${isScrolled ? ' scrolled' : ''}`}>
      <button type="button" className="nav-burger" onClick={openNavigation} aria-label="Mở menu">
        ☰
      </button>
      <Link href="/" className="row topbrand" aria-label={`${APP_NAME} — về trang chủ`}>
        <BrandLogo width={100} />
      </Link>
      <div style={{ flex: 1 }} />
      <form
        className="topsearch"
        role="search"
        style={{ position: 'relative', maxWidth: 300, flex: 1 }}
        onSubmit={(event) => {
          event.preventDefault();
          if (query.trim()) openSearch(query.trim());
        }}
      >
        <input
          className="input"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Tìm chữ, từ, mẫu câu…"
          aria-label="Tìm kiếm"
          style={{ padding: '9px 14px 9px 34px', borderRadius: 999, fontSize: 13.5 }}
        />
        <span style={{ position: 'absolute', left: 12, top: 10, fontSize: 13, opacity: 0.5 }} aria-hidden="true">🔍</span>
      </form>
      {isGentleMode ? null : (
        <Link href="/theo-doi?tab=tri-nho" className="chip recall-chip" title="Số ngày bạn đã ôn tập trong 30 ngày gần đây">
          <EmojiIcon emoji="🧠" size={16} /> Đã ôn {recallDays} ngày
        </Link>
      )}
      <UserMenu displayName={displayName} level={level} isDemo={isDemo} />
    </header>
  );
}
