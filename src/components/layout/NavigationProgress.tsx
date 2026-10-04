'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { useNavigationProgressStore } from '@/stores/navigation-progress-store';

/** Mạng chậm đến mấy thì sau chừng này thanh cũng tự tắt, không treo mãi. */
const SAFETY_TIMEOUT_MS = 12_000;

/** Link nội bộ dẫn tới một trang KHÁC trang hiện tại, mở trong cùng tab. */
function isInternalNavigation(event: MouseEvent): boolean {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
  const anchor = (event.target as Element | null)?.closest?.('a[href]');
  if (!(anchor instanceof HTMLAnchorElement) || anchor.target === '_blank' || anchor.hasAttribute('download')) return false;
  const url = new URL(anchor.href, window.location.href);
  if (url.origin !== window.location.origin) return false;
  return url.pathname !== window.location.pathname || url.search !== window.location.search;
}

/**
 * Thanh mảnh trên cùng màn hình, hiện ngay khi người học bấm chuyển trang
 * — để họ biết app đang làm việc chứ không phải bị đơ. Khi trang mới bắt đầu hiện (skeleton
 * từ loading.tsx hoặc nội dung thật) thì đường dẫn đổi và thanh tắt.
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isNavigating, startNavigation, finishNavigation } = useNavigationProgressStore();

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (isInternalNavigation(event)) startNavigation();
    };
    // Pha bắt (capture) để chạy trước khi Link của Next.js xử lý cú bấm.
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [startNavigation]);

  useEffect(() => {
    finishNavigation();
  }, [pathname, searchParams, finishNavigation]);

  useEffect(() => {
    if (!isNavigating) return;
    const timer = window.setTimeout(finishNavigation, SAFETY_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [isNavigating, finishNavigation]);

  return (
    <div className={`nav-progress ${isNavigating ? 'on' : ''}`} role="progressbar" aria-hidden={!isNavigating} aria-label="Đang chuyển trang">
      <i />
    </div>
  );
}
