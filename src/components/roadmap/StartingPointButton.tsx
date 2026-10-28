'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { BusyOverlay } from '@/components/common/BusyOverlay';
import { ModalPortal } from '@/components/common/ModalPortal';
import { setJourneyStartingPoint } from '@/features/roadmap/journey-api';
import { JOURNEY_STAGES, JOURNEY_TOTAL_DAYS } from '@/features/roadmap/journey';
import type { DayStatusView } from '@/features/roadmap/journey-progress';
import { startNavigation } from '@/stores/navigation-progress-store';

interface StartingPointButtonProps {
  days: DayStatusView[];
  currentDay: number;
}

/** Cho người học chọn mốc đã học bằng cùng dạng lịch ngày của lộ trình. */
export function StartingPointButton({ days, currentDay }: StartingPointButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const sendingRef = useRef(false);
  const [completedThroughDay, setCompletedThroughDay] = useState(Math.max(1, Math.min(currentDay - 1, JOURNEY_TOTAL_DAYS - 1)));
  useEffect(() => {
    if (isOpen) document.querySelector<HTMLElement>('.starting-point-calendar [aria-pressed="true"]')?.scrollIntoView({ block: 'center' });
  }, [isOpen]);
  const mutation = useMutation({
    mutationFn: () => setJourneyStartingPoint(completedThroughDay),
    onSuccess: (result) => {
      if (!result.hasAdvanced) return;
      startNavigation();
      router.push(`/lo-trinh/ngay/${result.currentDay}`);
      router.refresh();
    },
  });

  if (!isOpen) {
    return (
      <button type="button" className="btn quiet sm mb-3" onClick={() => setIsOpen(true)}>
        Đã học trước đây? Chọn ngày bắt đầu nhanh
      </button>
    );
  }

  const nextDay = completedThroughDay + 1;
  // Thành công thì giữ bận tới khi ngày mới mở ra; máy chủ trả "không đổi được" thì thả ra để người học thử lại.
  const isBusy = mutation.isPending || (mutation.isSuccess && mutation.data.hasAdvanced);
  return (
    <ModalPortal className="sheet on daygrid-sheet starting-point-sheet" labelledBy="journey-starting-point-title" onEscape={() => setIsOpen(false)}>
      <button type="button" className="sheet-close" onClick={() => setIsOpen(false)} aria-label="Đóng">✕</button>
      <h2 id="journey-starting-point-title" style={{ fontSize: 18 }}>Chọn mốc đã học</h2>
      <p className="tiny soft mt-1">Bạn đã có kiến thức đến ngày nào? Chọn ngày cuối đã hoàn thành để mở ngày học tiếp theo.</p>
      <p className="tiny sm mt-2">Chọn ngày cuối cùng bạn đã học xong</p>
      <p className="tiny muted mt-1 daygrid-legend" aria-label="Chú thích trạng thái ngày">
        <span className="dot is-done" /> Đã học <span className="dot is-partial" /> Đang học <span className="dot is-todo" /> Chưa học
      </p>
      <div className="starting-point-calendar mt-2">
        {JOURNEY_STAGES.map((stage) => (
          <section key={stage.name} className="mt-3" aria-label={stage.name}>
            <b className="sm">{stage.emoji} {stage.name} <span className="muted" style={{ fontWeight: 400 }}>· ngày {stage.from}–{stage.to}</span></b>
            <div className="daypick-grid mt-2">
              {days.filter((entry) => entry.day >= stage.from && entry.day <= stage.to && entry.day < JOURNEY_TOTAL_DAYS).map((entry) => (
                <button key={entry.day} type="button" aria-pressed={completedThroughDay === entry.day}
                  aria-label={`Đã học xong đến ngày ${entry.day}${entry.day === currentDay ? ', ngày đang học' : ''}`}
                  className={`daygrid-cell is-${entry.status} ${completedThroughDay === entry.day ? 'on' : ''} ${entry.day === currentDay ? 'is-today' : ''}`}
                  onClick={() => setCompletedThroughDay(entry.day)}>
                  {entry.day === currentDay ? <span className="daygrid-today" aria-hidden="true">♥</span> : null}
                  <b>{entry.day}</b><span className="dot" aria-hidden="true" />
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
      <div className="starting-point-footer busy-host" aria-busy={isBusy}>
        <p className="tiny muted">Các ngày trước được đánh dấu hoàn thành; dữ liệu trí nhớ của tài khoản cũ không được chuyển.</p>
        <div className="row mt-2.5" style={{ gap: 8 }}>
          <button type="button" className="btn sm" disabled={isBusy} aria-busy={isBusy} onClick={() => {
            if (sendingRef.current) return;
            sendingRef.current = true;
            mutation.mutate(undefined, { onSettled: (result) => { if (!result?.hasAdvanced) sendingRef.current = false; } });
          }}>
            Bắt đầu từ ngày {nextDay}
          </button>
          <button type="button" className="btn quiet sm" disabled={isBusy} onClick={() => setIsOpen(false)}>Để sau</button>
        </div>
        {isBusy ? <BusyOverlay label={`Đang mở ngày ${nextDay}…`} /> : null}
        {mutation.data && !mutation.data.hasAdvanced ? <p className="sm mt-2" role="alert">Không thể cập nhật mốc ngày. Hãy thử tải lại trang.</p> : null}
        {mutation.isError ? <p className="sm mt-2" role="alert">{mutation.error.message}</p> : null}
      </div>
    </ModalPortal>
  );
}
