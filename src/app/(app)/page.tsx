import { EmojiIcon } from '@/components/common/EmojiIcon';
import { GardenSummaryCard, MemorySummaryCard, MotivationCard, type ProgressMoment, ProgressFeed, type WeakKnowledge } from '@/components/home/HomeInsights';
import { QuickModes } from '@/components/home/QuickModes';
import { ReviewCard } from '@/components/home/ReviewCard';
import { RoadmapStages } from '@/components/home/RoadmapStages';
import { TimeOfDayGreeting } from '@/components/home/TimeOfDayGreeting';
import { TodayLearnCard } from '@/components/home/TodayLearnCard';
import { WelcomeDialog } from '@/components/home/WelcomeDialog';
import { getLearnerContext } from '@/features/learning/learner-context';
import { unmetKnowledgeOfDay } from '@/features/learning/session-engine';
import { DAY_CHUNK_SIZE, SESSION_MODE_CONFIG } from '@/features/learning/session-modes';
import { buildMemoryOverview, forgettingRadarList } from '@/features/memory/memory-overview';
import { displayedDailyMinutes } from '@/features/progress/settings-options';
import { estimateMinutesToFinishDay, getDayCompletionProgress, isDayReadyToComplete, remainingKnowledgeCount } from '@/features/roadmap/journey-progress';
import { addDays } from '@/lib/utils/dates';

const WEAKEST_SHOWN = 3;

/**
 * SC-04 · Trang chủ — bảng điều khiển theo thiết kế home.png:
 * lời chào trên nền tranh · Học hôm nay + Gặp lại · các kiểu học · Lộ trình · Tiến bộ · Trí nhớ · Vườn.
 * Mọi con số đều là dữ liệu thật của người học.
 */
export default async function HomePage() {
  const { catalog, memoryViews, journeyDay, journey, profile, settings, recallDays, source, learner, now } = await getLearnerContext();
  const dayCompletion = getDayCompletionProgress(catalog, memoryViews, journeyDay);
  const dailyMinutes = displayedDailyMinutes(settings.dailyMinutes, SESSION_MODE_CONFIG.daily.targetMinutes);
  const overview = buildMemoryOverview(memoryViews);
  // Đếm giống trang Sắp quên: vừa học hôm nay thì chưa tính là sắp quên (FORGETTING_RADAR.MIN_DAYS_SINCE_SEEN).
  const atRiskCount = forgettingRadarList(memoryViews, Number.MAX_SAFE_INTEGER).length;
  const activity = await source.summarizeActivity(learner.userId, addDays(now, -1).toISOString());

  const weakest: WeakKnowledge[] = [...memoryViews.values()]
    .filter((view) => view.isLearned)
    .sort((left, right) => left.memoryScore - right.memoryScore)
    .slice(0, WEAKEST_SHOWN)
    .flatMap((view) => {
      const item = catalog.byKey.get(view.contentKey);
      return item ? [{ key: item.key, face: item.face, reading: item.reading, memoryScore: view.memoryScore }] : [];
    });

  const moments: ProgressMoment[] = [
    activity.discoveredCount > 0 ? { emoji: '🌱', title: `+${activity.discoveredCount} kiến thức mới`, detail: 'Vừa gieo xuống vườn của bạn', when: '24 giờ qua' } : null,
    activity.revisitedCount > 0 ? { emoji: '🧠', title: `Gặp lại ${activity.revisitedCount} lần`, detail: 'Trí nhớ vừa được làm mới', when: '24 giờ qua' } : null,
    journeyDay > 1 ? { emoji: '✅', title: `Hoàn thành ngày ${journeyDay - 1}`, detail: catalog.content.journeyDays[journeyDay - 2]?.title ?? '', when: 'Lộ trình' } : null,
    recallDays > 0 ? { emoji: '🧠', title: `Đã ôn ${recallDays} ngày`, detail: 'Trí nhớ vừa được làm mới', when: '30 ngày qua' } : null,
  ].filter((moment): moment is ProgressMoment => moment !== null);

  return (
    <div className="dash">
      <div className="dash-hero-bg" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element -- ảnh nền WebP responsive cho desktop và màn nhỏ. */}
        <picture>
          <img src="/brand/home-background-new.jpeg" alt="" fetchPriority="high" />
        </picture>
      </div>

      <header className="dash-hero">
        <div className="dash-greeting">
          <TimeOfDayGreeting displayName={profile.displayName} />
          <EmojiIcon emoji="🌸" size={34} />
        </div>
        <p className="dash-greeting-sub">Hôm nay chúng ta cùng học một chút nhé?</p>
      </header>

      <div className="dash-top">
        <TodayLearnCard
          journeyDay={journeyDay}
          dayTitle={catalog.content.journeyDays[journeyDay - 1]?.title ?? `Ngày ${journeyDay}`}
          dailyMinutes={dailyMinutes}
          nextFaces={unmetKnowledgeOfDay(catalog, memoryViews, journeyDay).slice(0, DAY_CHUNK_SIZE).map((item) => item.face)}
          pendingCount={remainingKnowledgeCount(dayCompletion)}
          hasNewKnowledge={dayCompletion.hasNewKnowledge}
          isReadyToComplete={isDayReadyToComplete(journey, dayCompletion)}
          minutesToFinishDay={estimateMinutesToFinishDay(dayCompletion)}
          canFinishDayInOneGo={remainingKnowledgeCount(dayCompletion) > DAY_CHUNK_SIZE}
        />
        <ReviewCard atRiskCount={atRiskCount} learnedCount={overview.learnedCount} />
      </div>

      <QuickModes />

      <div className="dash-lower">
        <div className="dash-col">
          <RoadmapStages journeyDay={journeyDay} isJourneyComplete={journey.isJourneyComplete} />
          <div className="dash-pair">
            <MemorySummaryCard health={overview.health} healthLabel={overview.learnedCount ? 'Sức khoẻ trí nhớ' : 'Chưa có dữ liệu'} weakest={weakest} />
            <GardenSummaryCard learnedCount={overview.learnedCount} />
          </div>
        </div>
        <div className="dash-col">
          <ProgressFeed moments={moments} />
          <MotivationCard />
        </div>
      </div>

      {settings.welcomedAt ? null : (
        <WelcomeDialog displayName={profile.displayName} journeyDay={journeyDay} initialDailyMinutes={settings.dailyMinutes} />
      )}
    </div>
  );
}
