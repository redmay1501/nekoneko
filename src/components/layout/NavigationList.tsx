'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { footerNavigation, NAVIGATION_GROUPS, type NavigationItem, isActivePath, isInSection } from './navigation-items';
import { useIsAdmin } from './AdminFlag';
import { EmojiIcon } from '@/components/common/EmojiIcon';

function ItemIcon({ icon }: { icon: string }) {
  return <span className="ic"><EmojiIcon emoji={icon} size={icon.startsWith('neko:') ? 30 : 22} /></span>;
}

function NavigationLink({ item, isActive, onNavigate }: { item: NavigationItem; isActive: boolean; onNavigate?: () => void }) {
  return (
    <Link href={item.href} className={`nav-i ${isActive ? 'on' : ''}`} aria-current={isActive ? 'page' : undefined} onClick={onNavigate}>
      <ItemIcon icon={item.icon} />
      {item.label}
    </Link>
  );
}

interface NavigationListProps {
  /** Khay ☰ trên điện thoại (đóng khay khi chuyển trang). */
  alwaysExpandLearning?: boolean;
  onNavigate?: () => void;
}

/**
 * Danh sách điều hướng dùng chung cho thanh bên (desktop) và khay ☰ (mobile).
 * Mục có danh sách con (Học tập, Luyện tập) là NÚT mở / đóng — bấm không chuyển trang (không còn trang tổng quan).
 * Mặc định mở mục đang đứng trong đó.
 */
export function NavigationList({ onNavigate }: NavigationListProps) {
  const pathname = usePathname();
  const isAdmin = useIsAdmin();
  const [toggled, setToggled] = useState<Record<string, boolean>>({});
  const isExpanded = (item: NavigationItem) => toggled[item.href] ?? isInSection(pathname, item);
  const toggle = (item: NavigationItem) => setToggled((current) => ({ ...current, [item.href]: !isExpanded(item) }));

  return (
    <nav aria-label="Điều hướng chính">
      {NAVIGATION_GROUPS.map((group) => (
        <div key={group.label} className="nav-group" role="group" aria-label={group.label}>
          <p className="nav-group-label" aria-hidden="true">{group.label}</p>
          {group.items.map((item) => {
            if (!item.children) {
              return <NavigationLink key={item.href} item={item} isActive={isActivePath(pathname, item.href)} onNavigate={onNavigate} />;
            }
            const expanded = isExpanded(item);
            const subId = `nav-sub-${item.href.slice(1)}`;
            return (
              <div key={item.href}>
                <button type="button" className={`nav-i nav-parent ${isInSection(pathname, item) ? 'in-section' : ''}`}
                  aria-expanded={expanded} aria-controls={subId} onClick={() => toggle(item)}>
                  <ItemIcon icon={item.icon} />
                  {item.label}
                  <span className="nav-caret" aria-hidden="true">{expanded ? '▾' : '▸'}</span>
                </button>
                {expanded ? (
                  <div className="nav-sub" id={subId}>
                    {item.children.map((child) => (
                      <NavigationLink key={child.href} item={child} isActive={isActivePath(pathname, child.href)} onNavigate={onNavigate} />
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ))}
      <div className="nav-sep" />
      {footerNavigation(isAdmin).map((item) => (
        <NavigationLink key={item.href} item={item} isActive={isActivePath(pathname, item.href)} onNavigate={onNavigate} />
      ))}
    </nav>
  );
}
