import type { CSSProperties } from 'react';
import { EmojiIcon } from '@/components/common/EmojiIcon';
import { GardenSummaryCard } from '@/components/home/HomeInsights';
import { ReviewCard } from '@/components/home/ReviewCard';
import { RoadmapStages } from '@/components/home/RoadmapStages';
import { TimeOfDayGreeting } from '@/components/home/TimeOfDayGreeting';
import { TodayLearnCard } from '@/components/home/TodayLearnCard';
import { WelcomeDialog } from '@/components/home/WelcomeDialog';
import { DailyGreetingDialog } from '@/components/home/DailyGreetingDialog';
import { buildDailyGreeting } from '@/features/home/daily-greeting';
import { findResumableSession } from '@/features/learning/session-service';
import { appDateKey } from '@/features/progress/recall-streak';
import { getLearnerContext } from '@/features/learning/learner-context';
import { previewSessionPlan, unmetKnowledgeOfDay } from '@/features/learning/session-engine';
import { SESSION_MODES, SESSION_MODE_CONFIG } from '@/features/learning/session-modes';
import { buildMemoryOverview, forgettingRadarList } from '@/features/memory/memory-overview';
import { displayedDailyMinutes } from '@/features/progress/settings-options';
import { getDayCompletionProgress, isDayReadyToComplete, remainingKnowledgeCount } from '@/features/roadmap/journey-progress';


/** Chữ trang trí quanh lời chào: [chữ, x%, y%, quãng trôi khi cuộn]. */
const HERO_KANA: ReadonlyArray<[string, number, number, number]> = [
  ['あ', 62, 8, -90], ['ね', 78, 42, -140], ['こ', 90, 10, -60], ['ひ', 70, 70, -110], ['さ', 84, 76, -170], ['猫', 96, 46, -80],
];

/**
 * SC-04 · Trang chủ — chỉ 4 thứ: Học hôm nay (kèm kế hoạch phiên) · Gặp lại kiến thức · Lộ trình 90 ngày · Vườn.
 * Các kiểu học khác ở Luyện tập; trí nhớ chi tiết ở Trí nhớ; tiến bộ gần đây ở Tiến độ.
 * Mọi con số đều là dữ liệu thật của người học.
 */
export default async function HomePage() {
  const { catalog, memoryViews, journeyDay, journey, profile, settings, streak, now } = await getLearnerContext();
  const dayCompletion = getDayCompletionProgress(catalog, memoryViews, journeyDay);
  const dailyMinutes = displayedDailyMinutes(settings.dailyMinutes, SESSION_MODE_CONFIG.daily.targetMinutes);
  const overview = buildMemoryOverview(memoryViews);
  // Đếm giống trang Sắp quên: vừa học hôm nay thì chưa tính là sắp quên (FORGETTING_RADAR.MIN_DAYS_SINCE_SEEN).
  const atRiskCount = forgettingRadarList(memoryViews, Number.MAX_SAFE_INTEGER).length;
  const dayTitle = catalog.content.journeyDays[journeyDay - 1]?.title ?? `Ngày ${journeyDay}`;
  // Chào đầu ngày: đã qua lời chào lần đầu, không phải chính ngày đó, và hôm nay (giờ VN) chưa chào.
  const isSameAppDay = (iso: string | null) => iso !== null && appDateKey(new Date(iso)) === appDateKey(now);
  const shouldGreet = settings.welcomedAt !== null && !isSameAppDay(settings.welcomedAt) && !isSameAppDay(settings.greetedAt);
  const resumable = shouldGreet ? await findResumableSession(SESSION_MODES.DAILY) : null;
  const plan = previewSessionPlan({ mode: SESSION_MODES.DAILY, catalog, memoryViews, journeyDay });

  return (
    <div className="dash">
      <div className="dash-hero-bg" aria-hidden="true" data-scene="exit">
        <picture>
          <img src="/brand/home-background-new.jpeg" alt="" fetchPriority="high" />
        </picture>
      </div>

      <header className="dash-hero" data-reveal="light" data-scene="exit">
        {/* Vài chữ kana quanh lời chào — trôi lên và mờ dần khi cuộn qua (theo cuộn, không chuyển động liên tục). */}
        <div className="hero-kana" aria-hidden="true">
          {HERO_KANA.map(([glyph, x, y, speed]) => (
            <span key={glyph} className="jp" style={{ left: `${x}%`, top: `${y}%`, '--speed': `${speed}px` } as CSSProperties}>{glyph}</span>
          ))}
        </div>
        <div className="dash-greeting">
          <TimeOfDayGreeting displayName={profile.displayName} />
          <EmojiIcon emoji="🌸" size={34} />
        </div>
        <p className="dash-greeting-sub">Hôm nay chúng ta cùng học một chút nhé?</p>
      </header>

      <div className="dash-top" data-reveal-stagger>
        <TodayLearnCard
          journeyDay={journeyDay}
          dayTitle={dayTitle}
          dailyMinutes={dailyMinutes}
          nextFaces={unmetKnowledgeOfDay(catalog, memoryViews, journeyDay).map((item) => item.face)}
          pendingCount={remainingKnowledgeCount(dayCompletion)}
          hasNewKnowledge={dayCompletion.hasNewKnowledge}
          isReadyToComplete={isDayReadyToComplete(journey, dayCompletion)}
          plan={plan}
        />
        <ReviewCard atRiskCount={atRiskCount} learnedCount={overview.learnedCount} />
      </div>

      <div className="dash-lower" data-reveal-stagger>
        <RoadmapStages journeyDay={journeyDay} isJourneyComplete={journey.isJourneyComplete} />
        <GardenSummaryCard learnedCount={overview.learnedCount} />
      </div>

      {/* Lần đầu: lời chào 3 bước. Từ đó: lời chào ngắn đầu mỗi ngày, nội dung theo ngày. */}
      {settings.welcomedAt ? (shouldGreet ? (
        <DailyGreetingDialog displayName={profile.displayName} greeting={buildDailyGreeting({
          now, journeyDay, dayTitle, plan, streak, resumable,
          hasNewKnowledge: dayCompletion.hasNewKnowledge, isReadyToComplete: isDayReadyToComplete(journey, dayCompletion),
        })} />
      ) : null) : (
        <WelcomeDialog displayName={profile.displayName} journeyDay={journeyDay} initialDailyMinutes={settings.dailyMinutes} />
      )}
    </div>
  );
}
