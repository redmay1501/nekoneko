import { EmojiIcon } from '@/components/common/EmojiIcon';
import { GardenSummaryCard } from '@/components/home/HomeInsights';
import { ReviewCard } from '@/components/home/ReviewCard';
import { RoadmapStages } from '@/components/home/RoadmapStages';
import { TimeOfDayGreeting } from '@/components/home/TimeOfDayGreeting';
import { TodayLearnCard } from '@/components/home/TodayLearnCard';
import { WelcomeDialog } from '@/components/home/WelcomeDialog';
import { getLearnerContext } from '@/features/learning/learner-context';
import { previewSessionPlan, unmetKnowledgeOfDay } from '@/features/learning/session-engine';
import { DAY_CHUNK_SIZE, SESSION_MODES, SESSION_MODE_CONFIG } from '@/features/learning/session-modes';
import { buildMemoryOverview, forgettingRadarList } from '@/features/memory/memory-overview';
import { displayedDailyMinutes } from '@/features/progress/settings-options';
import { estimateMinutesToFinishDay, getDayCompletionProgress, isDayReadyToComplete, remainingKnowledgeCount } from '@/features/roadmap/journey-progress';


/**
 * SC-04 · Trang chủ — chỉ 4 thứ: Học hôm nay (kèm kế hoạch phiên) · Gặp lại kiến thức · Lộ trình 90 ngày · Vườn.
 * Các kiểu học khác ở Luyện tập; trí nhớ chi tiết ở Trí nhớ; tiến bộ gần đây ở Tiến độ.
 * Mọi con số đều là dữ liệu thật của người học.
 */
export default async function HomePage() {
  const { catalog, memoryViews, journeyDay, journey, profile, settings } = await getLearnerContext();
  const dayCompletion = getDayCompletionProgress(catalog, memoryViews, journeyDay);
  const dailyMinutes = displayedDailyMinutes(settings.dailyMinutes, SESSION_MODE_CONFIG.daily.targetMinutes);
  const overview = buildMemoryOverview(memoryViews);
  // Đếm giống trang Sắp quên: vừa học hôm nay thì chưa tính là sắp quên (FORGETTING_RADAR.MIN_DAYS_SINCE_SEEN).
  const atRiskCount = forgettingRadarList(memoryViews, Number.MAX_SAFE_INTEGER).length;
  const plan = previewSessionPlan({ mode: SESSION_MODES.DAILY, catalog, memoryViews, journeyDay });

  return (
    <div className="dash">
      <div className="dash-hero-bg" aria-hidden="true">
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
          plan={plan}
        />
        <ReviewCard atRiskCount={atRiskCount} learnedCount={overview.learnedCount} />
      </div>

      <div className="dash-lower">
        <RoadmapStages journeyDay={journeyDay} isJourneyComplete={journey.isJourneyComplete} />
        <GardenSummaryCard learnedCount={overview.learnedCount} />
      </div>

      {settings.welcomedAt ? null : (
        <WelcomeDialog displayName={profile.displayName} journeyDay={journeyDay} initialDailyMinutes={settings.dailyMinutes} />
      )}
    </div>
  );
}
