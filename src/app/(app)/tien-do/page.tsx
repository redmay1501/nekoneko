import { ProgressBar } from '@/components/common/ProgressBar';
import { MotivationCard, type ProgressMoment, ProgressFeed } from '@/components/home/HomeInsights';
import { addDays } from '@/lib/utils/dates';
import { getLearnerContext } from '@/features/learning/learner-context';
import { buildProgressRows } from '@/features/progress/progress-summary';
import { percentOf } from '@/lib/utils/text';

/** SC-35 · Tiến độ — tiến bộ gần đây (chuyển từ Trang chủ) và bám theo đúng lộ trình 90 ngày. */
export default async function ProgressPage() {
  const { catalog, memoryViews, journey, journeyDay, recallDays, streak, source, learner, now } = await getLearnerContext();
  const activity = await source.summarizeActivity(learner.userId, addDays(now, -1).toISOString());
  const moments: ProgressMoment[] = [
    activity.discoveredCount > 0 ? { emoji: '🌱', title: `+${activity.discoveredCount} kiến thức mới`, detail: 'Vừa gieo xuống vườn của bạn', when: '24 giờ qua' } : null,
    activity.revisitedCount > 0 ? { emoji: '🧠', title: `Gặp lại ${activity.revisitedCount} lần`, detail: 'Trí nhớ vừa được làm mới', when: '24 giờ qua' } : null,
    journeyDay > 1 ? { emoji: '✅', title: `Hoàn thành ngày ${journeyDay - 1}`, detail: catalog.content.journeyDays[journeyDay - 2]?.title ?? '', when: 'Lộ trình' } : null,
    streak.currentStreak >= 2 ? { emoji: '🔥', title: `Chuỗi ${streak.currentStreak} ngày liên tiếp`, detail: 'Ngày nào cũng gặp lại một chút', when: 'Đến hôm nay' } : null,
    recallDays > 0 ? { emoji: '🧠', title: `Đã ôn ${recallDays} ngày`, detail: 'Trí nhớ vừa được làm mới', when: '30 ngày qua' } : null,
  ].filter((moment): moment is ProgressMoment => moment !== null);
  return (
    <>
      <h1>Tiến độ</h1>
      <p className="soft sm" style={{ margin: '4px 0 14px' }}>Bám theo đúng lộ trình 90 ngày của bạn.</p>
      <div className="mb-3.5"><ProgressFeed moments={moments} /></div>
      <div className="stack">
        {buildProgressRows(catalog, memoryViews, journey).map((row) => (
          <div key={row.label} className="card tight">
            <div className="between"><b className="sm">{row.label}</b><span className="tiny muted">{row.done}/{row.total} · {percentOf(row.done, row.total)}%</span></div>
            <ProgressBar percent={percentOf(row.done, row.total)} variant="thin" label={row.label} className="mt-2" />
          </div>
        ))}
      </div>
      <div className="mt-3.5"><MotivationCard /></div>
    </>
  );
}
