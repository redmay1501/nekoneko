'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
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
  isAdmin?: boolean;
}

export function TopBar({ displayName, level, recallDays, isGentleMode, isDemo, isAdmin = false }: TopBarProps) {
  const { openNavigation, openSearch, close, activeSheet } = useSheetStore();
  const isMenuOpen = activeSheet.kind === 'navigation';
  const pathname = usePathname();
  const [query, setQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  // Chiều cao thật của header (đổi theo cỡ màn hình, safe-area, ô tiêu đề xuống dòng) → biến CSS --topbar-h,
  // để các trang toàn màn hình (lớp học, vườn) canh nội dung theo header thật thay vì số cố định.
  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    const root = document.documentElement;
    const publish = () => root.style.setProperty('--topbar-h', `${Math.round(header.getBoundingClientRect().height)}px`);
    publish();
    const observer = new ResizeObserver(publish);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    function updateScrollState() {
      setIsScrolled(window.scrollY > 8);
    }
    updateScrollState();
    window.addEventListener('scroll', updateScrollState, { passive: true });
    return () => window.removeEventListener('scroll', updateScrollState);
  }, []);

  return (
    <header ref={headerRef} className={`topbar${pathname === '/' ? ' home-topbar' : ''}${isScrolled ? ' scrolled' : ''}${isMenuOpen ? ' menu-open' : ''}`}>
      <button type="button" className={`nav-burger${isMenuOpen ? ' on' : ''}`} onClick={isMenuOpen ? close : openNavigation}
        aria-label={isMenuOpen ? 'Đóng menu' : 'Mở menu'} aria-expanded={isMenuOpen}>
        ☰
      </button>
      <Link href="/" className="row topbrand" aria-label={`${APP_NAME} — về trang chủ`}>
        <BrandLogo width={100} priority={pathname !== '/'} />
      </Link>
      <div className="topbar-knowledge-slot" aria-live="polite" />
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
        <Link href="/theo-doi?tab=tri-nho" className="chip recall-chip" title="Số ngày bạn đã ôn tập trong 30 ngày gần đây"
          aria-label={`Đã ôn ${recallDays} ngày trong 30 ngày gần đây`}>
          <EmojiIcon emoji="🧠" size={16} /> <span className="recall-chip-word">Đã ôn </span>{recallDays}<span className="recall-chip-word"> ngày</span>
        </Link>
      )}
      <UserMenu displayName={displayName} level={level} isDemo={isDemo} isAdmin={isAdmin} />
    </header>
  );
}
