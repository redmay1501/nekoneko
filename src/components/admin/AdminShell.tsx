'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { type ReactNode, useEffect, useState } from 'react';
import { ADMIN_NAV, isAdminNavActive } from './admin-nav';
import { AdminUiProvider } from './AdminUi';

/** Khung /admin: thanh bên (thu gọn thành ngăn kéo trên điện thoại) + header. Quyền đã kiểm ở layout server. */
export function AdminShell({ email, isDemo, children }: { email: string | null; isDemo: boolean; children: ReactNode }) {
  const pathname = usePathname();
  const [isNavOpen, setIsNavOpen] = useState(false);
  useEffect(() => setIsNavOpen(false), [pathname]);

  return (
    <AdminUiProvider>
      <div className={`adm ${isNavOpen ? 'nav-open' : ''}`}>
        <aside className="adm-side" aria-label="Điều hướng admin">
          <Link href="/admin" className="adm-brand"><span aria-hidden="true">🐾</span><span>NekoNeko<small>Admin Studio</small></span></Link>
          <nav className="adm-nav">
            {ADMIN_NAV.map((group) => (
              <div key={group.group}>
                <p className="adm-nav-group">{group.group}</p>
                {group.items.map((item) => (
                  <Link key={item.href} href={item.href} aria-current={isAdminNavActive(pathname, item.href) ? 'page' : undefined}>
                    <span className="adm-nav-icon" aria-hidden="true">{item.icon}</span>{item.label}
                  </Link>
                ))}
              </div>
            ))}
          </nav>
          <div className="adm-side-foot"><Link href="/">← Trở về học tập</Link></div>
        </aside>
        {isNavOpen ? <button type="button" className="adm-overlay" style={{ zIndex: 50 }} aria-label="Đóng menu" onClick={() => setIsNavOpen(false)} /> : null}
        <div className="adm-main">
          <header className="adm-header">
            <button type="button" className="adm-menu-btn" aria-label="Mở menu" aria-expanded={isNavOpen} onClick={() => setIsNavOpen(true)}>☰</button>
            <b>Admin Studio</b>
            {isDemo ? <span className="adm-badge review">Demo · chỉ xem</span> : null}
            <div className="adm-header-user">
              <span className="adm-badge pink">admin</span>
              {email ? <span className="adm-email">{email}</span> : null}
              <Link className="adm-btn ghost sm" href="/">← Trở về học tập</Link>
              <form action="/auth/dang-xuat" method="post"><button type="submit" className="adm-btn ghost sm">Đăng xuất</button></form>
            </div>
          </header>
          <main id="noi-dung" className="adm-content">{children}</main>
        </div>
      </div>
    </AdminUiProvider>
  );
}
