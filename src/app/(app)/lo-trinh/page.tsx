import Link from 'next/link';
import { ProgressBar } from '@/components/common/ProgressBar';
import { JourneyMap } from '@/components/roadmap/JourneyMap';
import { getLearnerContext } from '@/features/learning/learner-context';
import { JOURNEY_STAGES, JOURNEY_TOTAL_DAYS, stageProgress } from '@/features/roadmap/journey';
import { completedDayCount } from '@/features/roadmap/journey-progress';
import { formatVietnameseDate } from '@/lib/utils/format';
import { percentOf } from '@/lib/utils/text';
import { EmojiIcon } from '@/components/common/EmojiIcon';

/** SC-11 · Lộ trình 90 ngày — một con đường, bốn chặng, kết thúc ở kỳ thi. */
export default async function RoadmapPage() {
  const { journeyDay, journey, profile } = await getLearnerContext();
  const completedDays = completedDayCount(journey);
  const daysLeft = JOURNEY_TOTAL_DAYS - completedDays;

  return (
    <>
      <div className="between mb-1">
        <h1>Lộ trình JLPT N5</h1>
        <span className="chip pink">Ngày {journeyDay} / {JOURNEY_TOTAL_DAYS}</span>
      </div>
      <p className="soft sm mb-4">
        Một con đường, bốn chặng, kết thúc ở kỳ thi. Chạm vào một ngày bất kỳ để xem việc cần làm. Học xong ngày nào, bấm Hoàn thành là ngày sau mở ngay — nghỉ vài hôm cũng không bị trôi lộ trình.
      </p>
      <JourneyMap currentDay={journeyDay} startDateLabel={formatVietnameseDate(profile.startDate)} isJourneyComplete={journey.isJourneyComplete} />

      <div className="sec-h"><h2>Bốn chặng đường</h2></div>
      <div className="grid two">
        {JOURNEY_STAGES.map((stage) => {
          const { done, total } = stageProgress(stage, completedDays);
          const targetDay = Math.min(Math.max(journeyDay, stage.from), stage.to);
          return (
            <Link key={stage.name} href={`/lo-trinh/ngay/${targetDay}`} className="card tight block" style={{ textAlign: 'left' }}>
              <div className="row">
                <EmojiIcon emoji={stage.emoji} size={30} />
                <div style={{ flex: 1 }}>
                  <b>{stage.name}</b>
                  <div className="tiny muted">Ngày {stage.from}–{stage.to} · {stage.subtitle}</div>
                </div>
                <span className="tiny muted">{done}/{total}</span>
              </div>
              <ProgressBar percent={percentOf(done, total)} variant="thin-mint" label={`Tiến độ chặng ${stage.name}`} className="mt-2" />
            </Link>
          );
        })}
      </div>

      <div className="card mt-4" style={{ background: 'var(--cream)', borderColor: '#F3E4CC' }}>
        <div className="row">
          <span style={{ fontSize: 22 }} aria-hidden="true">🏆</span>
          <div>
            <b>Ngày {JOURNEY_TOTAL_DAYS} · Kỳ thi JLPT N5</b>
            <div className="sm soft">
              {journey.isJourneyComplete ? 'Bạn đã đi hết 90 ngày 🌸 ' : `Còn ${daysLeft} ngày học.`}
              {profile.examDate ? ` Ngày thi dự kiến ${formatVietnameseDate(profile.examDate)}.` : ''}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
