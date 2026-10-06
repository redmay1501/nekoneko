'use client';

import { type ReactNode, type KeyboardEvent, useEffect, useRef, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';

const subscribeNothing = () => () => undefined;

/**
 * Khung hộp thoại dùng chung: gắn thẳng vào <body> (portal) để CSS của trang (ví dụ `.dash>*{position:relative}`)
 * không kéo nó ra khỏi giữa màn hình; khoá cuộn trang khi mở; focus vào hộp thoại mà KHÔNG cuộn trang
 * (trước đây focus làm trang chủ nhảy xuống ~250px trên iPad).
 */
export function ModalPortal({ className, labelledBy, onEscape, children }: {
  className: string;
  labelledBy: string;
  onEscape?: () => void;
  children: ReactNode;
}) {
  const isClient = useSyncExternalStore(subscribeNothing, () => true, () => false);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isClient) return;
    dialogRef.current?.focus({ preventScroll: true });
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isClient]);

  if (!isClient) return null;
  return createPortal(
    <>
      <div className="scrim on" aria-hidden="true" />
      <div ref={dialogRef} className={className} role="dialog" aria-modal="true" aria-labelledby={labelledBy} tabIndex={-1}
        onKeyDown={(event: KeyboardEvent) => { if (event.key === 'Escape') onEscape?.(); }}>
        {children}
      </div>
    </>,
    document.body,
  );
}
