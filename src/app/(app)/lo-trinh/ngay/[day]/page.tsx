import Link from 'next/link';
import { notFound } from 'next/navigation';
import { NokoMessage } from '@/components/common/NokoMessage';
import { DayKnowledgeBlock } from '@/components/roadmap/DayKnowledgeBlock';
import { CompleteDayButton } from '@/components/roadmap/CompleteDayButton';
import { DayCompletionCard } from '@/components/roadmap/DayCompletionCard';
import { DayTimeline } from '@/components/roadmap/DayTimeline';
import { getLearnerContext } from '@/features/learning/learner-context';
import { buildDayPlan, buildDayStrip } from '@/features/roadmap/day-plan';
import { JOURNEY_TOTAL_DAYS } from '@/features/roadmap/journey';
import { getDayCompletionProgress } from '@/features/roadmap/journey-progress';
import { EmojiIcon } from '@/components/common/EmojiIcon';

/** SC-12 · Một ngày học. */
export default async function JourneyDayPage({ params }: { params: Promise<{ day: string }> }) {
  const requestedDay = Number((await params).day);
  if (!Number.isInteger(requestedDay) || requestedDay < 1 || requestedDay > JOURNEY_TOTAL_DAYS) notFound();

  const { catalog, journeyDay, journey, memoryViews } = await getLearnerContext();
  const plan = buildDayPlan(catalog, requestedDay, journey);
  const completion = getDayCompletionProgress(catalog, memoryViews, plan.day);
  const { day, journeyDay: dayInfo, stage } = plan;

  return (
    <>
      <Link className="link" href="/lo-trinh">← Lộ trình</Link>
      <div className="daystrip">
        {buildDayStrip(day).map((stripDay) => (
          // Ngày kề bên tải sẵn (prefetch đầy đủ) → bấm sang là hiện ngay, không chờ server.
          <Link key={stripDay} href={`/lo-trinh/ngay/${stripDay}`} aria-label={`Ngày ${stripDay}`} prefetch={Math.abs(stripDay - day) <= 1}
            aria-current={stripDay === day ? 'page' : undefined}
            className={`daychip ${stripDay === day ? 'on' : stripDay < journeyDay ? 'past' : ''}`}>
            <b>{stripDay}</b>
            <span>{stripDay === journeyDay ? 'hôm nay' : `T${catalog.content.journeyDays[stripDay - 1].week}`}</span>
          </Link>
        ))}
      </div>

      <section className="dayhero">
        <div className="row wrap" style={{ gap: 7 }}>
          <span className="chip" style={{ background: 'rgba(255,255,255,.7)' }}><EmojiIcon emoji={stage.emoji} size={16} /> {stage.name}</span>
          <span className="chip" style={{ background: 'rgba(255,255,255,.7)' }}>Tuần {dayInfo.week}</span>
          {dayInfo.minna && dayInfo.minna !== '—' ? <span className="chip lav">{dayInfo.minna}</span> : null}
          <span className="chip mint" title="Cả bài theo lộ trình, gồm việc ngoài app">⏱ {plan.totalMinutes} phút cả bài</span>
          {plan.relation === 'today' ? <span className="chip pink">Hôm nay</span> : null}
          {plan.relation === 'past' ? <span className="chip mint">✓ Đã xong</span> : null}
        </div>
        <h1>Ngày {day}</h1>
        <p className="soft sm mt-1">{dayInfo.title}</p>
        <p className="sm mt-2.5">{plan.summary}</p>
        <p className="sm soft mt-1.5"><b>Vì sao học hôm nay?</b> {plan.purpose}</p>
      </section>

      <div className="daygrid mt-4">
        <div>
          <div className="sec-h" style={{ marginTop: 0 }}>
            <h2>Kiến thức của ngày</h2>
            {plan.hasNewKnowledge ? <span className="tiny muted">chạm để xem kỹ</span> : null}
          </div>
          <DayKnowledgeBlock plan={plan} />
          {plan.radicalBridge ? (
            <div className="card tight mt-3" style={{ background: 'var(--lav)', borderColor: 'transparent' }}>
              <p className="sm">
                🔗 Chữ <b className="jp">{plan.radicalBridge.kanji}</b> mang bộ <b className="jp">{plan.radicalBridge.radical}</b>{' '}
                ({plan.radicalBridge.meaning.toLowerCase()}) — bạn đã học bộ này từ ngày {plan.radicalBridge.day}.
              </p>
            </div>
          ) : null}
        </div>
        <div className="mt-4 xl:mt-0">
          <DayTimeline plan={plan} />
        </div>
      </div>

      {plan.relation === 'future' ? (
        <NokoMessage state="idle" text="Chưa tới ngày này đâu. Cứ đi từng ngày một, mình giữ chỗ cho bạn rồi." className="mt-4" />
      ) : plan.relation === 'today' ? (
        <>
          <DayCompletionCard day={day} completion={completion} />
          {completion.metCount < completion.totalCount ? (
            <Link className="btn block mt-3" href="/hoc/day">📘 Học hết ngày {day}</Link>
          ) : (
            <Link className="btn block mt-3" href="/hoc/daily">Bắt đầu học ngày {day}</Link>
          )}
          <CompleteDayButton day={day} remainingCount={completion.totalCount - completion.metCount} />
        </>
      ) : (
        <Link className="btn ghost block mt-4" href="/hoc/rescue">Ôn lại những gì còn mờ</Link>
      )}
      <div className="row mt-3" style={{ gap: 8, justifyContent: 'space-between' }}>
        {day > 1 ? <Link className="btn quiet sm" href={`/lo-trinh/ngay/${day - 1}`} prefetch>← Ngày {day - 1}</Link> : <span />}
        {day < JOURNEY_TOTAL_DAYS ? <Link className="btn quiet sm" href={`/lo-trinh/ngay/${day + 1}`} prefetch>Ngày {day + 1} →</Link> : <span />}
      </div>
    </>
  );
}
