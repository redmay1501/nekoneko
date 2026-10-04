'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FOOTER_NAVIGATION, MAIN_NAVIGATION, type NavigationItem, isActivePath, isInLearningSection } from './navigation-items';
import { EmojiIcon } from '@/components/common/EmojiIcon';

function NavigationLink({ item, isActive, onNavigate }: { item: NavigationItem; isActive: boolean; onNavigate?: () => void }) {
  return (
    <Link href={item.href} className={`nav-i ${isActive ? 'on' : ''}`} aria-current={isActive ? 'page' : undefined} onClick={onNavigate}>
      <span className="ic"><EmojiIcon emoji={item.icon} size={item.icon.startsWith('neko:') ? 30 : 22} /></span>
      {item.label}
    </Link>
  );
}

interface NavigationListProps {
  /** Trong khay điều hướng trên mobile thì luôn mở nhóm Học tập (giống prototype). */
  alwaysExpandLearning?: boolean;
  onNavigate?: () => void;
}

/** Danh sách điều hướng dùng chung cho thanh bên (desktop) và khay ☰ (mobile). */
export function NavigationList({ alwaysExpandLearning = false, onNavigate }: NavigationListProps) {
  const pathname = usePathname();
  const showLearningLinks = alwaysExpandLearning || isInLearningSection(pathname);
  return (
    <nav aria-label="Điều hướng chính">
      {MAIN_NAVIGATION.map((item) => (
        <div key={item.href}>
          <NavigationLink item={item} isActive={pathname === item.href || (item.href !== '/hoc-tap' && isActivePath(pathname, item.href))} onNavigate={onNavigate} />
          {item.children && showLearningLinks ? (
            <div className="nav-sub">
              {item.children.map((child) => (
                <NavigationLink key={child.href} item={child} isActive={isActivePath(pathname, child.href)} onNavigate={onNavigate} />
              ))}
            </div>
          ) : null}
        </div>
      ))}
      <div className="nav-sep" />
      {FOOTER_NAVIGATION.map((item) => (
        <NavigationLink key={item.href} item={item} isActive={isActivePath(pathname, item.href)} onNavigate={onNavigate} />
      ))}
    </nav>
  );
}
