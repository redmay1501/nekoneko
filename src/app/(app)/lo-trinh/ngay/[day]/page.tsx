import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DayKnowledgeBlock } from '@/components/roadmap/DayKnowledgeBlock';
import { DayCompletionCard } from '@/components/roadmap/DayCompletionCard';
import { DayTimeline } from '@/components/roadmap/DayTimeline';
import { getLearnerContext } from '@/features/learning/learner-context';
import { buildDayPlan } from '@/features/roadmap/day-plan';
import { JOURNEY_TOTAL_DAYS } from '@/features/roadmap/journey';
import { buildDayStatuses, getDayCompletionProgress } from '@/features/roadmap/journey-progress';
import { DayPicker } from '@/components/roadmap/DayPicker';
import { focusSessionHref } from '@/features/learning/session-modes';
import { DayActions } from '@/components/roadmap/DayActions';
import { DayReviewVocabulary } from '@/components/roadmap/DayReviewVocabulary';
import { EmojiIcon } from '@/components/common/EmojiIcon';

/** SC-12 · Một ngày học. */
export default async function JourneyDayPage({ params }: { params: Promise<{ day: string }> }) {
  const requestedDay = Number((await params).day);
  if (!Number.isInteger(requestedDay) || requestedDay < 1 || requestedDay > JOURNEY_TOTAL_DAYS) notFound();

  const { catalog, journeyDay, journey, memoryViews } = await getLearnerContext();
  const plan = buildDayPlan(catalog, requestedDay, journey);
  const completion = getDayCompletionProgress(catalog, memoryViews, plan.day);
  const { day, journeyDay: dayInfo, stage } = plan;
  const { knowledge } = plan;
  const hasDayStudy = knowledge.vocabulary.length + knowledge.grammar.length + knowledge.radicals.length + knowledge.kanji.length > 0;
  // Nút "Học lại / Học trước ngày N" luôn mở đúng kiến thức của ngày: trang học của ngày → chữ cái của ngày → kiến thức của tuần (ngày ôn).
  const studyHref = hasDayStudy ? `/lo-trinh/ngay/${day}/hoc`
    : knowledge.kana.length ? focusSessionHref(knowledge.kana.map((item) => item.key))
      : plan.reviewWindow ? focusSessionHref(plan.reviewWindow.keys) : null;

  return (
    <>
      <DayPicker days={buildDayStatuses(catalog, memoryViews, journeyDay)} day={day} today={journeyDay} />

      <section className="dayhero">
        <div className="row wrap" style={{ gap: 7 }}>
          <span className="chip" style={{ background: 'rgba(255,255,255,.7)' }}><EmojiIcon emoji={stage.emoji} size={16} /> {stage.name}</span>
          <span className="chip" style={{ background: 'rgba(255,255,255,.7)' }}>Tuần {dayInfo.week}</span>
          {dayInfo.minna && dayInfo.minna !== '—' ? <span className="chip lav">{dayInfo.minna}</span> : null}
          {plan.relation === 'today' ? <span className="chip pink">Hôm nay</span> : null}
          {plan.relation === 'past' ? <span className="chip mint">✓ Đã xong</span> : null}
        </div>
        <h1>Ngày {day}</h1>
        <p className="soft sm mt-1">{dayInfo.title}</p>
        <p className="sm mt-2.5">{plan.summary}</p>
        <p className="sm soft mt-1.5"><b>Vì sao học hôm nay?</b> {plan.purpose}</p>
        {/* Hành động chính của ngày — ngay đầu trang, theo trạng thái thật (học hết ≠ đã hoàn thành ngày). */}
        <DayActions day={day} relation={plan.relation} remainingCount={completion.totalCount - completion.metCount} hasNewKnowledge={completion.hasNewKnowledge}
          hasDayStudy={hasDayStudy} studyHref={studyHref} />
      </section>

      <div className="daygrid mt-4">
        <div>
          <div className="sec-h" style={{ marginTop: 0 }}>
            <h2>Kiến thức của ngày</h2>
            {plan.hasNewKnowledge ? <span className="tiny muted">chạm để xem kỹ</span> : null}
          </div>
          <DayKnowledgeBlock plan={plan} />
          {plan.reviewVocabulary.length ? <DayReviewVocabulary words={plan.reviewVocabulary} /> : null}
          {plan.radicalBridge ? (
            <div className="card tight mt-3" style={{ background: 'var(--lav)', borderColor: 'transparent' }}>
              <p className="sm">
                🔗 {plan.radicalBridge.isPrimary ? (
                  <>Chữ <b className="jp">{plan.radicalBridge.kanji}</b> mang bộ <b className="jp">{plan.radicalBridge.radical}</b>{' '}
                    ({plan.radicalBridge.meaning.toLowerCase()}) — bạn đã học bộ này từ ngày {plan.radicalBridge.day}.</>
                ) : (
                  <>Trong chữ <b className="jp">{plan.radicalBridge.kanji}</b> có hình <b className="jp">{plan.radicalBridge.radical}</b>{' '}
                    ({plan.radicalBridge.meaning.toLowerCase()}) bạn đã học ngày {plan.radicalBridge.day}.</>
                )}
              </p>
            </div>
          ) : null}
        </div>
        <div className="mt-4 xl:mt-0">
          <DayTimeline plan={plan} />
        </div>
      </div>

      {plan.relation === 'today' ? <DayCompletionCard day={day} completion={completion} /> : null}
      <div className="row mt-3" style={{ gap: 8, justifyContent: 'space-between' }}>
        {day > 1 ? <Link className="btn quiet sm" href={`/lo-trinh/ngay/${day - 1}`} prefetch>← Ngày {day - 1}</Link> : <span />}
        {day < JOURNEY_TOTAL_DAYS ? <Link className="btn quiet sm" href={`/lo-trinh/ngay/${day + 1}`} prefetch>Ngày {day + 1} →</Link> : <span />}
      </div>
    </>
  );
}
