'use client';

import { type MouseEvent, type ReactNode, useEffect, useRef } from 'react';

interface BottomSheetProps {
  isOpen: boolean;
  label: string;
  onClose: () => void;
  children: ReactNode;
}

/**
 * Khay trượt từ dưới lên (prototype: .scrim + .sheet).
 * Đóng bằng nút ✕ (luôn thấy ở góc trên), chạm nền, phím Esc, hoặc bấm một liên kết trong khay. Đưa focus vào khay khi mở để dùng được bằng bàn phím.
 */
export function BottomSheet({ isOpen, label, onClose, children }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    sheetRef.current?.focus({ preventScroll: true });
    // Khoá cuộn trang phía sau: cuộn trong khay không kéo trang nền theo.
    document.documentElement.classList.add('sheet-open');
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.documentElement.classList.remove('sheet-open');
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [isOpen, onClose]);

  /** Bấm một liên kết trong khay (Luyện viết, từ liên quan…) → đóng khay, kể cả khi chỉ đổi ?tham-số trên cùng trang. */
  function closeOnLinkClick(event: MouseEvent<HTMLDivElement>) {
    if (event.target instanceof Element && event.target.closest('a[href]')) onClose();
  }

  return (
    <>
      <div className={`scrim ${isOpen ? 'on' : ''}`} onClick={onClose} aria-hidden="true" />
      <div
        ref={sheetRef}
        className={`sheet ${isOpen ? 'on' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        aria-hidden={!isOpen}
        tabIndex={-1}
        onClick={closeOnLinkClick}
      >
        {isOpen ? <button type="button" className="sheet-close" onClick={onClose} aria-label="Đóng">✕</button> : null}
        <div className="grab" />
        {isOpen ? children : null}
      </div>
    </>
  );
}
