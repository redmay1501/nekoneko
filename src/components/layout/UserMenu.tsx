'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { EmojiIcon } from '@/components/common/EmojiIcon';

interface UserMenuProps {
  displayName: string;
  level: number;
  /** Chế độ demo không có tài khoản → không có Đăng xuất. */
  isDemo: boolean;
}

/**
 * Ô người dùng ở góc trên bên phải: bấm vào mở menu nhỏ (Hồ sơ · Cài đặt · Đăng xuất).
 * Đóng khi bấm ra ngoài, nhấn Esc, hoặc chuyển trang.
 */
export function UserMenu({ displayName, level, isDemo }: UserMenuProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Chuyển trang (bấm Hồ sơ / Cài đặt trong menu) → đóng menu.
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isOpen) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setIsOpen(false);
      buttonRef.current?.focus();
    };
    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [isOpen]);

  return (
    <div className="user-menu" ref={rootRef}>
      <button ref={buttonRef} type="button" className="user-menu-trigger" onClick={() => setIsOpen((value) => !value)}
        aria-haspopup="menu" aria-expanded={isOpen} aria-label={`Tài khoản của ${displayName}`}>
        <span className="user-avatar"><EmojiIcon emoji="neko:profile" size={30} /></span>
        <span className="userbox">
          <b>{displayName}</b>
          <span className="tiny muted">Cấp {level}</span>
        </span>
        <svg className="user-menu-caret" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
          strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
      </button>

      {isOpen ? (
        <div className="user-menu-panel" role="menu" aria-label="Tài khoản">
          <div className="user-menu-head">
            <EmojiIcon emoji="neko:profile" size={40} />
            <span><b>{displayName}</b><span className="tiny muted">Cấp {level}{isDemo ? ' · chế độ demo' : ''}</span></span>
          </div>
          <Link href="/ho-so" role="menuitem" className="user-menu-item"><EmojiIcon emoji="neko:profile" size={24} /> Hồ sơ</Link>
          <Link href="/cai-dat" role="menuitem" className="user-menu-item"><EmojiIcon emoji="neko:settings" size={24} /> Cài đặt</Link>
          {isDemo ? null : (
            <form action="/auth/dang-xuat" method="post" onSubmit={() => setIsSigningOut(true)}>
              <button type="submit" role="menuitem" className="user-menu-item danger" disabled={isSigningOut} aria-busy={isSigningOut}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"
                  strokeLinejoin="round" aria-hidden="true"><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l5-5-5-5M15 12H4" /></svg>
                {isSigningOut ? 'Đang đăng xuất…' : 'Đăng xuất'}
              </button>
            </form>
          )}
        </div>
      ) : null}
    </div>
  );
}
