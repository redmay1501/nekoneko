import Link from 'next/link';
import Image from 'next/image';
import { APP_NAME } from '@/config/brand';
import { NavigationList } from './NavigationList';
import { SidebarGreeting } from './SidebarGreeting';

/** Thanh bên — chỉ hiện từ 1200px (CSS .sidebar). */
export function Sidebar() {
  return (
    <aside className="sidebar">
      <Link href="/" className="brand" aria-label={`${APP_NAME} — về trang chủ`}>
        <Image src="/brand/logotest.png" alt={APP_NAME} width={600} height={200} className="brand-logo sidebar-logo" priority />
      </Link>
      <NavigationList />
      <div className="sidebar-art-wrap" aria-hidden="true">
        <Image src="/illustrations/home-sidebar.webp" alt="" width={500} height={582} className="sidebar-art" />
        <SidebarGreeting />
      </div>
    </aside>
  );
}
