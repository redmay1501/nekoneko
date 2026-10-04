'use client';

import { type ReactNode, useEffect, useRef } from 'react';

interface BottomSheetProps {
  isOpen: boolean;
  label: string;
  onClose: () => void;
  children: ReactNode;
}

/**
 * Khay trượt từ dưới lên (prototype: .scrim + .sheet).
 * Đóng bằng chạm nền, phím Esc. Đưa focus vào khay khi mở để dùng được bằng bàn phím.
 */
export function BottomSheet({ isOpen, label, onClose, children }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    sheetRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [isOpen, onClose]);

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
      >
        <div className="grab" />
        {isOpen ? children : null}
      </div>
    </>
  );
}
