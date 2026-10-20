'use client';

import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Onboarding3DWelcome } from '@/components/onboarding/Onboarding3DWelcome';
import { readGuideBannerCollapsed, shouldShowGuideBanner, writeGuideBannerCollapsed } from '@/features/onboarding/guide-banner';

interface GuideFloatingBannerProps {
  /** welcomed_at đã có (server đọc ở layout) — chưa xem hướng dẫn lần đầu thì không hiện nút này. */
  isWelcomed: boolean;
  displayName: string;
  journeyDay: number;
  dailyMinutes: number;
  /** Nhãn môi trường (Chế độ demo) đang ở góc dưới phải trên mobile → đẩy nút lên để không đè. */
  isRaised: boolean;
}


/**
 * Nút nổi "Khám phá Neko" ở góc dưới phải: mở lại CHÍNH trang hướng dẫn 3D (mode=replay) bất cứ lúc nào.
 * Xem lại không ghi gì vào cài đặt (welcomed_at, mục tiêu giữ nguyên); đóng → ở lại trang đang xem.
 * Thu gọn thành icon tròn (nhớ bằng localStorage — chỉ là tuỳ chọn giao diện). Render một lần trong AppShell.
 */
export function GuideFloatingBanner({ isWelcomed, displayName, journeyDay, dailyMinutes, isRaised }: GuideFloatingBannerProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Đọc tuỳ chọn thu gọn sau khi mount (server không có localStorage) → không lệch hydration.
  useEffect(() => {
    setIsCollapsed(readGuideBannerCollapsed(typeof window === 'undefined' ? null : window.localStorage));
    setIsHydrated(true);
  }, []);

  const setCollapsed = useCallback((collapsed: boolean) => {
    setIsCollapsed(collapsed);
    writeGuideBannerCollapsed(window.localStorage, collapsed);
  }, []);
  const closeGuide = useCallback(() => setIsGuideOpen(false), []);

  const isVisible = isHydrated && shouldShowGuideBanner({ pathname, isWelcomed, isGuideOpen });

  return (
    <>
      {isVisible ? (
        <aside className={`guide-fab${isCollapsed ? ' is-collapsed' : ''}${isRaised ? ' is-raised' : ''}`} aria-label="Hướng dẫn NekoNeko">
          {isCollapsed ? (
            <button type="button" className="guide-fab-bubble" onClick={() => setCollapsed(false)}
              aria-label="Mở lại biển Khám phá Neko" title="Khám phá Neko">
              <span className="guide-fab-bubble-face" aria-hidden="true" />
            </button>
          ) : (
            <div className="guide-fab-shell">
              {/* Biển gỗ "Khám phá Neko" (public/illustrations/guide-sign.webp) — cả biển là nút mở lại hướng dẫn. */}
              <button type="button" className="guide-sign" onClick={() => setIsGuideOpen(true)} aria-label="Khám phá Neko — mở lại hướng dẫn NekoNeko" />
              <button type="button" className="guide-fab-close" onClick={() => setCollapsed(true)} aria-label="Thu gọn biển Khám phá Neko">
                <svg viewBox="0 0 24 24" width="11" height="11" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" /></svg>
              </button>
            </div>
          )}
        </aside>
      ) : null}
      {isGuideOpen ? (
        <Onboarding3DWelcome replay displayName={displayName} journeyDay={journeyDay} initialDailyMinutes={dailyMinutes} onClose={closeGuide} />
      ) : null}
    </>
  );
}
