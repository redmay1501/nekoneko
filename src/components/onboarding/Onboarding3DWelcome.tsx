'use client';

import { useMutation } from '@tanstack/react-query';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { WelcomeDialog } from '@/components/home/WelcomeDialog';
import {
  buildOnboardingSrc,
  ONBOARDING_READY_TIMEOUT_MS,
  parseOnboardingMessage,
  type OnboardingDoneAction,
} from '@/features/onboarding/onboarding-messages';
import { updateSettings, type SettingsPatch } from '@/features/progress/settings-api';
import { startNavigation } from '@/stores/navigation-progress-store';

const subscribeNothing = () => () => undefined;

/** Phủ toàn màn hình, trên thanh bên (z 40), thanh dưới (z 50), hộp thoại (z 70) — dưới thanh tải trang (z 100). Nền trùng màu trời của trang 3D để lúc tải không bị chớp trắng. */
const OVERLAY_STYLE = { position: 'fixed', inset: 0, zIndex: 90, background: 'linear-gradient(180deg,#FFE3E8 0%,#FFF1E8 55%,#FFF8EF 100%)' } as const;
const FRAME_STYLE = { display: 'block', width: '100%', height: '100%', border: 0 } as const;

interface Onboarding3DWelcomeProps {
  displayName: string;
  journeyDay: number;
  initialDailyMinutes: number;
  /**
   * Xem lại (mở từ nút "Khám phá NekoNeko"): trang 3D chạy mode=replay — không hỏi mục tiêu, KHÔNG ghi gì vào cài đặt
   * (welcomed_at, mục tiêu giữ nguyên); bấm "Xong" / "Đóng" → gọi onClose, người học ở lại trang đang xem.
   */
  replay?: boolean;
  onClose?: () => void;
}

/**
 * Lời chào lần đầu bản 3D: trang tĩnh public/onboarding-3d/ chạy trong iframe toàn màn hình (Three.js không vào bundle của app).
 * Trang 3D báo kết quả bằng postMessage → ở đây ghi welcomed_at (+ mục tiêu mỗi ngày) giống hệt WelcomeDialog.
 * Trang 3D không báo "ready" kịp (mạng hỏng, file thiếu, middleware chặn) → dùng lại WelcomeDialog 2D.
 */
export function Onboarding3DWelcome({ displayName, journeyDay, initialDailyMinutes, replay = false, onClose }: Onboarding3DWelcomeProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isClient = useSyncExternalStore(subscribeNothing, () => true, () => false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'fallback' | 'closed'>('loading');
  const [src] = useState(() => buildOnboardingSrc({ dailyMinutes: initialDailyMinutes, replay }));

  const mutation = useMutation({
    mutationFn: (patch: SettingsPatch) => updateSettings({ ...patch, welcomed: true }),
  });
  const { mutateAsync } = mutation;

  const finish = useCallback(async (action: OnboardingDoneAction, dailyMinutes: number | null) => {
    const patch: SettingsPatch = action !== 'skip' && dailyMinutes !== null ? { dailyMinutes } : {};
    try {
      await mutateAsync(patch);
    } catch {
      // Giống WelcomeDialog: bỏ qua mà lưu hỏng thì vẫn đóng (lần sau chào lại cũng không sao); hai nút còn lại báo để thử lại.
      if (action !== 'skip') {
        iframeRef.current?.contentWindow?.postMessage({ source: 'nekoneko-app', type: 'save-failed' }, window.location.origin);
        return;
      }
    }
    setStatus('closed');
    // "Bắt đầu học" → buổi học đầu tiên; "Về Trang chủ" / "Bỏ qua" → Trang chủ (hướng dẫn có thể mở ở bất kỳ trang nào).
    const destination = action === 'learn' ? '/hoc/daily' : '/';
    if (pathname !== destination) {
      startNavigation();
      router.push(destination);
    }
    // Layout đọc lại welcomed_at (không chào lại, hiện nút "Khám phá NekoNeko"); mục tiêu mới hiện đúng ở thanh trên.
    router.refresh();
  }, [mutateAsync, pathname, router]);

  const close = useCallback(() => {
    setStatus('closed');
    onClose?.();
  }, [onClose]);

  useEffect(() => {
    if (!isClient) return;
    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      if (!iframeRef.current || event.source !== iframeRef.current.contentWindow) return;
      const message = parseOnboardingMessage(event.data);
      if (!message) return;
      if (message.type === 'ready') {
        setStatus((current) => (current === 'loading' ? 'ready' : current));
        iframeRef.current.focus({ preventScroll: true });
      } else if (message.type === 'done') {
        // Xem lại không bao giờ ghi cài đặt — kể cả khi có tin 'done' lạ.
        if (!replay) void finish(message.action, message.dailyMinutes);
      } else if (message.type === 'close') {
        // 'close' chỉ có ở mode=replay; lời chào lần đầu bỏ qua tin này (phải lưu welcomed_at mới được đóng).
        if (replay) close();
      }
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [isClient, finish, close, replay]);

  // Xem lại mà trang 3D không tải được → đóng hẳn (báo cho nút mở lại biết), không treo lớp phủ trống.
  useEffect(() => {
    if (replay && status === 'fallback') onClose?.();
  }, [replay, status, onClose]);

  // Xem lại: Esc đóng hướng dẫn (khi focus đang ở trang ngoài iframe).
  useEffect(() => {
    if (!replay || !isClient) return undefined;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [replay, isClient, close]);

  useEffect(() => {
    if (status !== 'loading') return;
    const timer = window.setTimeout(() => setStatus((current) => (current === 'loading' ? 'fallback' : current)), ONBOARDING_READY_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [status]);

  // Khoá cuộn trang phía sau trong lúc iframe phủ toàn màn hình.
  useEffect(() => {
    if (!isClient || (status !== 'loading' && status !== 'ready')) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isClient, status]);

  if (status === 'fallback') {
    // Xem lại mà trang 3D không tải được: chỉ đóng (WelcomeDialog sẽ ghi welcomed_at — không dùng cho xem lại).
    if (replay) return null;
    return <WelcomeDialog displayName={displayName} journeyDay={journeyDay} initialDailyMinutes={initialDailyMinutes} />;
  }
  if (!isClient || status === 'closed') return null;

  return createPortal(
    <div className="onboarding-3d" data-status={status} style={OVERLAY_STYLE}>
      <iframe
        ref={iframeRef}
        src={src}
        title="Hướng dẫn nhanh NekoNeko (3D)"
        style={FRAME_STYLE}
        allow="fullscreen"
        onError={() => setStatus('fallback')}
      />
    </div>,
    document.body,
  );
}
