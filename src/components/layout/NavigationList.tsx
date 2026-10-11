'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { type MouseEvent, useState } from 'react';
import { FOOTER_NAVIGATION, NAVIGATION_GROUPS, type NavigationItem, isActivePath, isInSection } from './navigation-items';
import { EmojiIcon } from '@/components/common/EmojiIcon';

function NavigationLink({ item, isActive, onNavigate, onClick, isExpanded }: {
  item: NavigationItem;
  isActive: boolean;
  onNavigate?: () => void;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
  /** Mục có danh sách con: đang mở hay đóng (mũi tên ▾ / ▸). */
  isExpanded?: boolean;
}) {
  return (
    <Link href={item.href} className={`nav-i ${isActive ? 'on' : ''}`} aria-current={isActive ? 'page' : undefined}
      aria-expanded={isExpanded} onClick={(event) => { onClick?.(event); if (!event.defaultPrevented) onNavigate?.(); }}>
      <span className="ic"><EmojiIcon emoji={item.icon} size={item.icon.startsWith('neko:') ? 30 : 22} /></span>
      {item.label}
      {isExpanded !== undefined ? <span className="nav-caret" aria-hidden="true">{isExpanded ? '▾' : '▸'}</span> : null}
    </Link>
  );
}

interface NavigationListProps {
  /** Khay ☰ trên điện thoại: mục cha chỉ mở / đóng danh sách con, kèm dòng "Xem tất cả". */
  alwaysExpandLearning?: boolean;
  onNavigate?: () => void;
}

/** Danh sách điều hướng dùng chung cho thanh bên (desktop) và khay ☰ (mobile). */
export function NavigationList({ alwaysExpandLearning = false, onNavigate }: NavigationListProps) {
  const pathname = usePathname();
  // Mục có danh sách con (Học tập, Luyện tập): bấm lần đầu → mở (và tới trang đó); bấm lần nữa → đóng lại.
  // Mặc định mở mục đang đứng trong đó; trong khay ☰ trên điện thoại thì mặc định mở hết như trước.
  const [toggled, setToggled] = useState<Record<string, boolean>>({});
  // Khay ☰: bấm mục cha chỉ mở / đóng (chuyển trang thì khay đóng mất, không kịp thấy mục con) — có dòng "Xem tất cả".
  const isExpanded = (item: NavigationItem) => toggled[item.href] ?? isInSection(pathname, item);
  function toggleSection(item: NavigationItem, event: MouseEvent<HTMLAnchorElement>) {
    const expanded = isExpanded(item);
    if (expanded || alwaysExpandLearning) event.preventDefault(); // Đang mở → chỉ đóng lại, không chuyển trang.
    setToggled((current) => ({ ...current, [item.href]: !expanded }));
  }
  return (
    <nav aria-label="Điều hướng chính">
      {NAVIGATION_GROUPS.map((group) => (
        <div key={group.label} className="nav-group" role="group" aria-label={group.label}>
          <p className="nav-group-label" aria-hidden="true">{group.label}</p>
          {group.items.map((item) => (
            <div key={item.href}>
              <NavigationLink item={item} isActive={pathname === item.href || (!item.children && isActivePath(pathname, item.href))} onNavigate={onNavigate}
                isExpanded={item.children ? isExpanded(item) : undefined}
                onClick={item.children ? (event) => toggleSection(item, event) : undefined} />
              {item.children && isExpanded(item) ? (
                <div className="nav-sub">
                  {alwaysExpandLearning ? (
                    <NavigationLink item={{ href: item.href, icon: '📚', label: `Xem tất cả · ${item.label}` }} isActive={pathname === item.href} onNavigate={onNavigate} />
                  ) : null}
                  {item.children.map((child) => (
                    <NavigationLink key={child.href} item={child} isActive={isActivePath(pathname, child.href)} onNavigate={onNavigate} />
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ))}
      <div className="nav-sep" />
      {FOOTER_NAVIGATION.map((item) => (
        <NavigationLink key={item.href} item={item} isActive={isActivePath(pathname, item.href)} onNavigate={onNavigate} />
      ))}
    </nav>
  );
}
