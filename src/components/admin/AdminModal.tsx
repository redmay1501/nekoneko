'use client';

import { type ReactNode, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Hộp thoại dùng chung trong /admin: gắn vào <body>, khoá cuộn nền, focus vào ô đầu tiên, giữ Tab trong hộp,
 * Esc / bấm nền để đóng (trừ khi đang lưu), đóng xong trả focus về nút đã mở.
 */
export function AdminModal({ title, onClose, isBusy = false, wide = false, footer, children }: {
  title: ReactNode;
  onClose: () => void;
  isBusy?: boolean;
  wide?: boolean;
  footer?: ReactNode;
  children: ReactNode;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  const busyRef = useRef(isBusy);
  closeRef.current = onClose;
  busyRef.current = isBusy;

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const dialog = dialogRef.current;
    (dialog?.querySelector<HTMLElement>('[data-autofocus]') ?? dialog?.querySelector<HTMLElement>('input:not([disabled]), select:not([disabled]), textarea:not([disabled])')
      ?? dialog?.querySelector<HTMLElement>(FOCUSABLE))?.focus({ preventScroll: true });
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape' && !busyRef.current) { event.stopPropagation(); closeRef.current(); return; }
      if (event.key !== 'Tab' || !dialog) return;
      const items = [...dialog.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((item) => item.offsetParent !== null);
      if (!items.length) return;
      const [first, last] = [items[0], items[items.length - 1]];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
      opener?.focus?.({ preventScroll: true });
    };
  }, []);

  return createPortal(
    <div className="adm-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget && !busyRef.current) onClose(); }}>
      <div ref={dialogRef} className={`adm-dialog ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true" aria-labelledby="adm-modal-title" aria-busy={isBusy}>
        <div className="adm-modal-head">
          <h2 id="adm-modal-title">{title}</h2>
          <button type="button" className="adm-btn ghost sm" onClick={onClose} disabled={isBusy} aria-label="Đóng">✕</button>
        </div>
        {children}
        {footer ? <div className="adm-dialog-actions">{footer}</div> : null}
      </div>
    </div>,
    document.body,
  );
}
