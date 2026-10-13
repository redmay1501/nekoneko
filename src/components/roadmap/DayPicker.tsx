'use client';

import Link from 'next/link';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ModalPortal } from '@/components/common/ModalPortal';
import { JOURNEY_STAGES } from '@/features/roadmap/journey';
import type { DayStatusView } from '@/features/roadmap/journey-progress';

const STATUS_LABEL = { done: 'Đã học', partial: 'Đang học', todo: 'Chưa học' } as const;

interface DayPickerProps {
  days: DayStatusView[];
  /** Ngày đang xem. */
  day: number;
  /** Ngày đang học theo lộ trình ("hôm nay"). */
  today: number;
}

/**
 * Chọn ngày học:
 *  - dải ngang ĐỦ 90 ngày (trước đây chỉ dựng 7 ngày quanh ngày đang xem nên vuốt không đi đâu được) — vuốt / lăn ngang tự nhiên,
 *    mở trang là cuộn sẵn tới ngày đang xem; chỉ ngày kề bên được tải sẵn;
 *  - nút "Tất cả ngày" mở bảng lưới chia theo chặng — nhảy tới ngày bất kỳ bằng một chạm, có trạng thái đã học / đang học / chưa học.
 */
export function DayPicker({ days, day, today }: DayPickerProps) {
  const stripRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  // Cuộn dải ngày (chỉ chiều ngang của chính dải — không kéo cả trang) để ngày đang xem nằm giữa.
  useLayoutEffect(() => {
    const strip = stripRef.current;
    const chip = strip?.querySelector<HTMLElement>('[aria-current="page"]');
    if (strip && chip) strip.scrollLeft = chip.offsetLeft - strip.clientWidth / 2 + chip.offsetWidth / 2;
  }, [day]);

  return (
    <div className="daypicker">
      <div className="daypicker-top">
        <Link className="link" href="/lo-trinh">← Lộ trình</Link>
        <button type="button" className="btn ghost sm daypicker-open" onClick={() => setIsOpen(true)} aria-haspopup="dialog">
          📅 Tất cả ngày
        </button>
      </div>
      <div className="daystrip" ref={stripRef} role="list" aria-label="Các ngày học">
        {days.map((entry) => (
          <Link key={entry.day} role="listitem" href={`/lo-trinh/ngay/${entry.day}`} prefetch={Math.abs(entry.day - day) <= 1}
            aria-label={`Ngày ${entry.day} — ${STATUS_LABEL[entry.status]}${entry.day === today ? ', hôm nay' : ''}`}
            aria-current={entry.day === day ? 'page' : undefined}
            className={`daychip is-${entry.status} ${entry.day === day ? 'on' : ''} ${entry.day === today ? 'is-today' : ''}`}>
            <b>{entry.day}</b>
            <span>{entry.day === today ? 'hôm nay' : entry.week ? `T${entry.week}` : ''}</span>
          </Link>
        ))}
      </div>
      {isOpen ? <DayGridSheet days={days} day={day} today={today} onClose={() => setIsOpen(false)} /> : null}
    </div>
  );
}

function DayGridSheet({ days, day, today, onClose }: DayPickerProps & { onClose: () => void }) {
  const gridRef = useRef<HTMLDivElement>(null);
  // Mở bảng là thấy ngay ngày đang xem (cuộn trong khay, không cuộn trang).
  useEffect(() => {
    gridRef.current?.querySelector<HTMLElement>('[aria-current="page"]')?.scrollIntoView({ block: 'center' });
  }, []);
  return (
    <ModalPortal className="sheet on daygrid-sheet" labelledBy="daygrid-title" onEscape={onClose}>
      <button type="button" className="sheet-close" onClick={onClose} aria-label="Đóng">✕</button>
      <h2 id="daygrid-title" style={{ fontSize: 18 }}>Chọn ngày học</h2>
      <p className="tiny muted mt-1 daygrid-legend">
        <span className="dot is-done" /> Đã học <span className="dot is-partial" /> Đang học <span className="dot is-todo" /> Chưa học
      </p>
      <div ref={gridRef}>
        {JOURNEY_STAGES.map((stage) => (
          <section key={stage.name} className="mt-3.5" aria-label={stage.name}>
            <b className="sm">{stage.emoji} {stage.name} <span className="muted" style={{ fontWeight: 400 }}>· ngày {stage.from}–{stage.to}</span></b>
            <div className="daypick-grid mt-2">
              {days.filter((entry) => entry.day >= stage.from && entry.day <= stage.to).map((entry) => (
                <Link key={entry.day} href={`/lo-trinh/ngay/${entry.day}`} prefetch={false} onClick={onClose}
                  aria-current={entry.day === day ? 'page' : undefined}
                  aria-label={`Ngày ${entry.day} — ${STATUS_LABEL[entry.status]}${entry.day === today ? ', hôm nay' : ''}`}
                  className={`daygrid-cell is-${entry.status} ${entry.day === day ? 'on' : ''} ${entry.day === today ? 'is-today' : ''}`}>
                  <b>{entry.day}</b>
                  <span className="dot" aria-hidden="true" />
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </ModalPortal>
  );
}
