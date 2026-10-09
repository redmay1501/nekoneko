'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { APP_NAME } from '@/config/brand';
import { NavigationList } from './NavigationList';
import { SidebarGreeting } from './SidebarGreeting';

/** Thanh bên chỉ hiện từ 1200px. Ảnh không được đưa vào HTML trước khi biết màn hình, kẻo điện thoại vẫn tải. */
function useSidebarVisible() {
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const query = window.matchMedia('(min-width: 1200px)');
    const update = () => setIsVisible(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return isVisible;
}

/** Thanh bên — chỉ hiện từ 1200px (CSS .sidebar). */
export function Sidebar() {
  const isVisible = useSidebarVisible();
  return (
    <aside className="sidebar">
      <Link href="/" className="brand" aria-label={`${APP_NAME} — về trang chủ`} style={{ minHeight: 72 }}>
        {isVisible ? <Image src="/brand/logo-sidebar.webp" alt={APP_NAME} width={600} height={200} sizes="216px" className="brand-logo sidebar-logo" /> : null}
      </Link>
      <NavigationList />
      {isVisible ? (
        <div className="sidebar-art-wrap" aria-hidden="true">
          <Image src="/illustrations/home-sidebar.webp" alt="" width={500} height={582} sizes="145px" className="sidebar-art" />
          <SidebarGreeting />
        </div>
      ) : null}
    </aside>
  );
}
