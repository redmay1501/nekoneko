import { NekoStreak } from '@/components/games/NekoStreak';
import { bestStreakOf, buildStreakItems } from '@/features/games/neko-streak';
import { getLearnerContext } from '@/features/learning/learner-context';

/**
 * Neko Streak — "Mèo nhớ siêu đỉnh!": trắc nghiệm 4 đáp án liên tục, đếm chuỗi đúng và giữ kỷ lục cá nhân.
 * Phạm vi tính lại MỖI lần mở trang theo tiến độ mới nhất của chính người học: kiến thức đã học thuộc ngày 1 → ngày đang học
 * (features/games/neko-streak.ts). Chỉ các mục trong phạm vi được gửi xuống trình duyệt.
 */
export default async function NekoStreakPage() {
  const { catalog, memoryViews, journeyDay, settings, learner } = await getLearnerContext();
  const items = buildStreakItems(catalog, memoryViews, journeyDay);
  return (
    <NekoStreak items={items} initialBest={bestStreakOf(settings.gameRecords)} journeyDay={journeyDay}
      // Khoá lưu phiên (chuỗi đang chạy) theo tài khoản + phạm vi: đổi tài khoản / học thêm ngày → không khôi phục nhầm.
      sessionKey={`neko-streak:${learner.userId}:${journeyDay}`} />
  );
}
