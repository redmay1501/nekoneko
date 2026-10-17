'use client';

import Link from 'next/link';
import { type ReactNode, useEffect, useId, useState } from 'react';

const STORAGE_PREFIX = 'day-step-collapsed:';

/**
 * Một nhóm trong "Kiến thức của ngày" (từ vựng, Kanji, ngữ pháp…) thu gọn / mở rộng độc lập.
 * Trạng thái nhớ trong phiên (sessionStorage, theo loại nhóm) — đóng "Từ vựng" ở ngày này thì sang ngày khác vẫn đóng.
 * Chỉ ẩn / hiện giao diện: không gọi API, không đổi trạng thái học hay trí nhớ.
 */
export function CollapsibleStep({ step, label, note, href, children }: {
  step: string;
  label: string;
  note?: string;
  /** "Thẻ & kiểm tra" của đúng phần này. */
  href: string;
  children: ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const bodyId = useId();
  useEffect(() => {
    try { if (sessionStorage.getItem(STORAGE_PREFIX + step) === '1') setIsOpen(false); } catch { /* bị chặn lưu → mở */ }
  }, [step]);
  function toggle() {
    const next = !isOpen;
    setIsOpen(next);
    try { sessionStorage.setItem(STORAGE_PREFIX + step, next ? '0' : '1'); } catch { /* bỏ qua */ }
  }
  return (
    <section className={`day-step${isOpen ? '' : ' is-collapsed'}`}>
      <div className="day-step-head">
        <button type="button" className="day-step-toggle" aria-expanded={isOpen} aria-controls={bodyId} onClick={toggle}>
          <svg className="day-step-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"
            strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
          <span className="day-step-label">{label}{note ? <span className="tiny muted"> · {note}</span> : null}</span>
        </button>
        <Link className="day-step-link" href={href}>Thẻ & kiểm tra →</Link>
      </div>
      <div id={bodyId} hidden={!isOpen}>{children}</div>
    </section>
  );
}
