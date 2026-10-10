import Link from 'next/link';
import { focusSessionHref } from '@/features/learning/session-modes';
import type { StudyActions } from '@/features/learning/study-actions';

/**
 * Thanh hành động của một trang Học tập: người học bắt đầu học / ôn / kiểm tra NGAY tại đây, không phải chờ lộ trình.
 * Chỉ hiện nút có việc thật để làm (ví dụ chưa học gì thì không có "Kiểm tra").
 */
export function StudyActionBar({ actions, unit }: { actions: StudyActions; unit: string }) {
  const { next, review, test, learned, total, isFirstStart } = actions;
  return (
    <section className="card tight study-actions mb-3.5" aria-label="Học ngay">
      <div className="between">
        <b className="sm">🎯 Học ngay tại đây</b>
        <span className="tiny muted">Đã học {learned}/{total} {unit}</span>
      </div>
      <div className="row wrap mt-2.5" style={{ gap: 8 }}>
        {next.length ? (
          <Link className="btn sm" href={focusSessionHref(next)}>
            ▶ {isFirstStart ? 'Bắt đầu học' : 'Học tiếp'} {next.length} {unit}
          </Link>
        ) : null}
        {review.length ? <Link className="btn ghost sm" href={focusSessionHref(review)}>🔁 Ôn {review.length} {unit} cần ôn</Link> : null}
        {test.length ? <Link className="btn ghost sm" href={focusSessionHref(test)}>✅ Kiểm tra {test.length} {unit} đã học</Link> : null}
        {!next.length && !review.length && !test.length ? <span className="sm soft">Bạn đã gặp hết rồi 🌸</span> : null}
      </div>
    </section>
  );
}
