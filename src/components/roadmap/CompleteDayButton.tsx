'use client';

import { BusyOverlay } from '@/components/common/BusyOverlay';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { completeJourneyDay } from '@/features/roadmap/journey-api';
import { JOURNEY_TOTAL_DAYS } from '@/features/roadmap/journey';
import { startNavigation } from '@/stores/navigation-progress-store';

interface CompleteDayButtonProps {
  day: number;
  /** Kiến thức của ngày chưa học trong app — nhắc trước khi xác nhận. */
  remainingCount?: number;
  /** Nút chính (to, màu) khi app đang MỜI hoàn thành ngày; mặc định là nút phụ. */
  isPrimary?: boolean;
}

/**
 * "Hoàn thành ngày X" — cách DUY NHẤT để sang ngày mới (app không tự chuyển ngày).
 * Hỏi lại một lần cho chắc, vì bấm xong là mở ngày kế tiếp ngay.
 */
export function CompleteDayButton({ day, remainingCount = 0, isPrimary = false }: CompleteDayButtonProps) {
  const router = useRouter();
  const [isConfirming, setIsConfirming] = useState(false);
  // Khoá đồng bộ: bấm dồn nhiều lần trước khi nút kịp chuyển sang "bận" vẫn chỉ gửi MỘT yêu cầu.
  const sendingRef = useRef(false);
  const isLastDay = day >= JOURNEY_TOTAL_DAYS;
  const mutation = useMutation({
    mutationFn: () => completeJourneyDay(day),
    onSuccess: (result) => {
      startNavigation();
      router.push(result.isJourneyComplete ? '/lo-trinh' : `/lo-trinh/ngay/${result.currentDay}`);
      router.refresh();
    },
  });

  // Xong rồi vẫn giữ trạng thái bận cho tới khi ngày mới mở ra.
  const isBusy = mutation.isPending || mutation.isSuccess;

  if (!isConfirming) {
    return (
      <button type="button" className={`btn block ${isPrimary ? 'today-cta' : 'ghost mt-2.5'}`} onClick={() => setIsConfirming(true)}>
        ✓ Hoàn thành ngày {day}
      </button>
    );
  }
  return (
    <div className="card tight mt-2.5 busy-host" role="group" aria-label={`Xác nhận hoàn thành ngày ${day}`} aria-busy={isBusy}>
      <p className="sm">
        {isLastDay
          ? 'Bạn đã học xong ngày cuối cùng? Bấm xác nhận để khép lại lộ trình 90 ngày.'
          : remainingCount > 0
            ? `Ngày ${day} còn ${remainingCount} kiến thức bạn chưa học. Sang ngày ${day + 1} thì chúng chuyển vào phần Học bù — Neko sẽ đưa lại từng chút, không mất đâu.`
            : `Bạn thấy đã thuộc ngày ${day}? Ngày ${day + 1} sẽ mở ngay.`}
      </p>
      <div className="row mt-2.5" style={{ gap: 8 }}>
        <button type="button" className="btn sm" style={{ flex: 1 }} disabled={isBusy} aria-busy={isBusy} onClick={() => {
          if (sendingRef.current) return;
          sendingRef.current = true;
          mutation.mutate(undefined, { onError: () => { sendingRef.current = false; } });
        }}>
          {isLastDay ? '🏆 Hoàn thành lộ trình' : `Xong, mở ngày ${day + 1}`}
        </button>
        <button type="button" className="btn quiet sm" disabled={isBusy} onClick={() => setIsConfirming(false)}>Chưa</button>
      </div>
      {isBusy ? <BusyOverlay label={isLastDay ? 'Đang khép lại lộ trình…' : `Đang lưu tiến độ, mở ngày ${day + 1}…`} /> : null}
      {mutation.isError ? <p className="sm mt-2" role="alert">Chưa lưu được tiến độ: {mutation.error.message}<br /><span className="tiny muted">Bấm lại để thử nhé.</span></p> : null}
    </div>
  );
}
