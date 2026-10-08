import { ProgressBar } from '@/components/common/ProgressBar';
import { type DayCompletionProgress, estimateMinutesToFinishDay, remainingKnowledgeCount } from '@/features/roadmap/journey-progress';
import { percentOf } from '@/lib/utils/text';

/** Ngày đang học đã đi được bao xa. Sang ngày sau do người học tự xác nhận (nút Hoàn thành ngày). */
export function DayCompletionCard({ day, completion }: { day: number; completion: DayCompletionProgress }) {
  return (
    <div className="card tight mt-4">
      <div className="between">
        <b className="sm">Tiến độ ngày {day}</b>
        {completion.hasNewKnowledge ? <span className="tiny muted">{completion.metCount}/{completion.totalCount} kiến thức</span> : null}
      </div>
      {completion.hasNewKnowledge ? (
        <>
          <ProgressBar percent={percentOf(completion.metCount, completion.totalCount)} variant="thin-mint" label={`Đã gặp kiến thức ngày ${day}`} className="my-2" />
          <p className="tiny muted">
            {remainingKnowledgeCount(completion) > 0
              ? `Trong app còn ${remainingKnowledgeCount(completion)} kiến thức · khoảng ${estimateMinutesToFinishDay(completion)} phút. Học hết rồi bấm Hoàn thành để sang ngày tiếp theo.`
              : 'Bạn đã học hết kiến thức của ngày. Thấy thuộc rồi thì bấm Hoàn thành ngày bên dưới.'}
          </p>
        </>
      ) : (
        <p className="tiny muted mt-1">Hôm nay không có kiến thức mới. Ôn xong thì bấm hoàn thành để sang ngày tiếp theo nhé.</p>
      )}
    </div>
  );
}
