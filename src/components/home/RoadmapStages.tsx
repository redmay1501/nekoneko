import Link from 'next/link';
import Image from 'next/image';
import { EmojiIcon } from '@/components/common/EmojiIcon';
import { JOURNEY_STAGES, JOURNEY_TOTAL_DAYS } from '@/features/roadmap/journey';

const STAGE_IMAGES = [
  '/illustrations/home-journey-1.webp',
  '/illustrations/home-journey-2.webp',
  '/illustrations/home-journey-3.webp',
  '/illustrations/home-journey-4.webp',
] as const;

interface RoadmapStagesProps {
  journeyDay: number;
  isJourneyComplete: boolean;
}

/** "Lộ trình 90 ngày · N5" — bốn chặng nối nhau bằng đường chấm, chặng đang học được đánh dấu "Bạn ở đây". */
export function RoadmapStages({ journeyDay, isJourneyComplete }: RoadmapStagesProps) {
  return (
    <section className="dash-card dash-roadmap" aria-labelledby="dash-roadmap-title">
      <div className="between">
        <h2 id="dash-roadmap-title" className="dash-card-title"><EmojiIcon emoji="neko:roadmap" size={30} /> Lộ trình {JOURNEY_TOTAL_DAYS} ngày · N5</h2>
        <Link href="/lo-trinh" className="dash-pill-link">Bạn đang ở ngày {journeyDay} <span aria-hidden="true">›</span></Link>
      </div>
      <div className="dash-roadmap-map">
        <svg className="dash-stage-path dash-stage-path-wide" viewBox="0 0 1000 220" preserveAspectRatio="none" aria-hidden="true">
          <path d="M125 54 C205 54 295 104 375 104" stroke="#EF9AA8" />
          <path d="M375 104 C455 104 545 54 625 54" stroke="#91BD97" />
          <path d="M625 54 C705 54 795 104 875 104" stroke="#79B9C8" />
        </svg>
        <svg className="dash-stage-path dash-stage-path-narrow" viewBox="0 0 400 280" preserveAspectRatio="none" aria-hidden="true">
          <path d="M100 52 C155 16 245 16 300 52" stroke="#EF9AA8" />
          <path d="M300 52 C370 106 30 154 100 216" stroke="#91BD97" />
          <path d="M100 216 C155 180 245 180 300 216" stroke="#79B9C8" />
        </svg>
        <ol className="dash-stages">
          {JOURNEY_STAGES.map((stage, index) => {
            const isDone = isJourneyComplete || journeyDay > stage.to;
            const isCurrent = !isJourneyComplete && journeyDay >= stage.from && journeyDay <= stage.to;
            return (
              <li key={stage.name} className={`dash-stage ${isCurrent ? 'current' : ''} ${isDone ? 'done' : ''}`}>
                {isCurrent ? <span className="dash-stage-badge">Bạn ở đây</span> : null}
                <span className="dash-stage-island">
                  <Image src={STAGE_IMAGES[index]} alt="" width={620} height={500} className="dash-stage-image" />
                </span>
                <span className="dash-stage-label">
                  <b>{isDone ? '✓ ' : ''}{stage.name}</b>
                  <span>Ngày {stage.from}–{stage.to}</span>
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
