import Link from 'next/link';
import { SpriteIcon } from '@/components/common/SpriteIcon';
import { getLearnerContext } from '@/features/learning/learner-context';
import { startOfAppDay } from '@/features/progress/recall-streak';

/** SC-09 · Nghỉ ngơi — cho phép dừng mà không thấy có lỗi. */
export default async function RestPage() {
  const { source, learner, now } = await getLearnerContext();
  // "Hôm nay" = từ 0 giờ theo giờ Việt Nam.
  const activity = await source.summarizeActivity(learner.userId, startOfAppDay(now).toISOString());
  return (
    <div className="session center" style={{ paddingTop: 20 }}>
      <SpriteIcon name="noko" size={110} className="mx-auto" />
      <h1 className="mt-2.5">Nghỉ thôi 🌸</h1>
      <p className="soft mt-2">Ngày mai Neko Neko sẽ biết nên đưa gì cho bạn.</p>
      <div className="card mt-4" style={{ textAlign: 'left' }}>
        <p className="sm">Kiến thức cần một chút thời gian để ở lại. Trong lúc bạn nghỉ, nó vẫn đang lắng xuống.</p>
        <p className="sm soft mt-2">
          {describeToday(activity.revisitedCount, activity.discoveredCount)}
        </p>
      </div>
      <Link className="btn ghost block mt-4" href="/vuon">🌸 Nhìn vườn một chút</Link>
      <Link className="btn quiet block mt-2" href="/">Về trang chủ</Link>
    </div>
  );
}

function describeToday(revisited: number, discovered: number): string {
  if (!revisited && !discovered) return 'Hôm nay bạn chưa học gì — không sao, mai mình gặp lại nhé.';
  const parts = [discovered ? `gieo thêm ${discovered} thứ mới` : '', revisited ? `gặp lại ${revisited} thứ cũ` : ''].filter(Boolean);
  return `Hôm nay bạn đã ${parts.join(' và ')}.`;
}
