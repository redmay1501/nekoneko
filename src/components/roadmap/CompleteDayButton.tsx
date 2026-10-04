'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
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
    <div className="card tight mt-2.5" role="group" aria-label={`Xác nhận hoàn thành ngày ${day}`}>
      <p className="sm">
        {isLastDay
          ? 'Bạn đã học xong ngày cuối cùng? Bấm xác nhận để khép lại lộ trình 90 ngày.'
          : remainingCount > 0
            ? `Ngày ${day} còn ${remainingCount} kiến thức bạn chưa học trong app. Vẫn sang ngày ${day + 1}? (Xem lại lúc nào cũng được trong Lộ trình.)`
            : `Bạn thấy đã thuộc ngày ${day}? Ngày ${day + 1} sẽ mở ngay.`}
      </p>
      <div className="row mt-2.5" style={{ gap: 8 }}>
        <button type="button" className="btn sm" style={{ flex: 1 }} disabled={isBusy} aria-busy={isBusy} onClick={() => mutation.mutate()}>
          {isLastDay ? '🏆 Hoàn thành lộ trình' : `Xong, mở ngày ${day + 1}`}
        </button>
        <button type="button" className="btn quiet sm" disabled={isBusy} onClick={() => setIsConfirming(false)}>Chưa</button>
      </div>
      {mutation.isError ? <p className="sm mt-2" role="alert">{mutation.error.message}</p> : null}
    </div>
  );
}
