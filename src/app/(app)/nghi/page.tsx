import Link from 'next/link';
import { SpriteIcon } from '@/components/common/SpriteIcon';
import { getLearnerContext } from '@/features/learning/learner-context';
import { addDays } from '@/lib/utils/dates';

/** SC-09 · Nghỉ ngơi — cho phép dừng mà không thấy có lỗi. */
export default async function RestPage() {
  const { source, learner, now } = await getLearnerContext();
  // "Hôm nay" tính là 24 giờ qua: server không biết nửa đêm theo múi giờ của người học.
  const activity = await source.summarizeActivity(learner.userId, addDays(now, -1).toISOString());
  return (
    <div className="session center" style={{ paddingTop: 20 }}>
      <SpriteIcon name="noko" size={110} className="mx-auto" />
      <h1 className="mt-2.5">Nghỉ thôi 🌸</h1>
      <p className="soft mt-2">Ngày mai Neko Neko sẽ biết nên đưa gì cho bạn.</p>
      <div className="card mt-4" style={{ textAlign: 'left' }}>
        <p className="sm">Kiến thức cần một chút thời gian để ở lại. Trong lúc bạn nghỉ, nó vẫn đang lắng xuống.</p>
        <p className="sm soft mt-2">
          Hôm nay bạn đã gặp lại {activity.revisitedCount} thứ cũ và gieo thêm {activity.discoveredCount} thứ mới.
        </p>
      </div>
      <Link className="btn ghost block mt-4" href="/vuon">🌸 Nhìn vườn một chút</Link>
      <Link className="btn quiet block mt-2" href="/">Về trang chủ</Link>
    </div>
  );
}
