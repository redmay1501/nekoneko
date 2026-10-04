import Link from 'next/link';
import Image from 'next/image';
import { EmojiIcon } from '@/components/common/EmojiIcon';

/* Các thẻ "nhìn lại" ở nửa dưới Trang chủ — chỉ hiển thị, dữ liệu dựng sẵn ở page.tsx. */

export interface ProgressMoment {
  emoji: string;
  title: string;
  detail: string;
  when: string;
}

/** "Khoảnh khắc tiến bộ" — những điều đã làm được gần đây, viết như lời khen nhỏ. */
export function ProgressFeed({ moments }: { moments: ProgressMoment[] }) {
  return (
    <section className="dash-card dash-feed" aria-labelledby="dash-feed-title">
      <h2 id="dash-feed-title" className="dash-card-title"><EmojiIcon emoji="📊" size={26} /> Khoảnh khắc tiến bộ</h2>
      {moments.length ? (
        <ul>
          {moments.map((moment) => (
            <li key={moment.title}>
              <span className="dash-feed-icon"><EmojiIcon emoji={moment.emoji} size={24} /></span>
              <span className="dash-feed-text"><b>{moment.title}</b><span>{moment.detail}</span></span>
              <span className="dash-feed-when">{moment.when}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="dash-empty">Học phiên đầu tiên để thấy tiến bộ của bạn ở đây 🌱</p>
      )}
    </section>
  );
}

export interface WeakKnowledge {
  key: string;
  face: string;
  reading: string;
  memoryScore: number;
}

const RING_RADIUS = 40;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

/** "Trí nhớ của bạn" — vòng sức khoẻ trí nhớ + vài thứ có sức nhớ thấp nhất. */
export function MemorySummaryCard({ health, healthLabel, weakest }: { health: number; healthLabel: string; weakest: WeakKnowledge[] }) {
  return (
    <section className="dash-card dash-memory" aria-labelledby="dash-memory-title">
      <h2 id="dash-memory-title" className="dash-card-title"><EmojiIcon emoji="neko:memory" size={30} /> Trí nhớ của bạn</h2>
      <div className="dash-memory-body">
        <div className="dash-ring" role="img" aria-label={`Sức khoẻ trí nhớ ${health} phần trăm`}>
          <svg viewBox="0 0 100 100" width="104" height="104" aria-hidden="true">
            <circle cx="50" cy="50" r={RING_RADIUS} fill="none" stroke="#EEF3EC" strokeWidth="11" />
            <circle cx="50" cy="50" r={RING_RADIUS} fill="none" stroke="url(#dash-ring-fill)" strokeWidth="11" strokeLinecap="round"
              strokeDasharray={RING_LENGTH} strokeDashoffset={RING_LENGTH * (1 - health / 100)} transform="rotate(-90 50 50)" />
            <defs><linearGradient id="dash-ring-fill" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#8FD3A2" /><stop offset="1" stopColor="#4FA96B" /></linearGradient></defs>
          </svg>
          <b>{health}%</b>
          <span>{healthLabel}</span>
        </div>
        <div className="dash-weak">
          <Link href="/tri-nho" className="dash-weak-head"><b>Cần ôn sớm</b> <span aria-hidden="true">›</span></Link>
          {weakest.length ? (
            <ul>
              {weakest.map((item) => (
                <li key={item.key}>
                  <span className="jp">{item.face}</span>
                  <span className="dash-weak-reading">{item.reading}</span>
                  <span className="dash-weak-bar" aria-hidden="true"><i style={{ width: `${item.memoryScore}%` }} /></span>
                  <span className="dash-weak-score">{item.memoryScore}%</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="dash-empty">Chưa có gì để nhắc — học vài chữ đầu tiên nhé.</p>
          )}
        </div>
      </div>
    </section>
  );
}

/** "Vườn tri thức" — mỗi kiến thức đã nhớ là một hạt giống đã gieo. */
export function GardenSummaryCard({ learnedCount }: { learnedCount: number }) {
  return (
    <Link href="/vuon" className="dash-card dash-garden" aria-label={`Vườn tri thức — đã trồng ${learnedCount} hạt kiến thức`}>
      <Image src="/illustrations/home-garden.webp" alt="" width={620} height={414} className="dash-garden-bg" />
      <span className="dash-garden-text">
        <span className="dash-card-title"><EmojiIcon emoji="🌸" size={26} /> Vườn tri thức</span>
        <span className="dash-meta">Bạn đã trồng</span>
        <b className="dash-garden-count">{learnedCount} hạt kiến thức</b>
        <span className="dash-meta">Hãy tiếp tục để vườn thêm xanh nhé! 🌱</span>
      </span>
    </Link>
  );
}

/** Lời động viên nhỏ cuối trang. */
export function MotivationCard() {
  return (
    <aside className="dash-card dash-motivation">
      <p>Không cần học thật nhiều.<br />Chỉ cần học đều mỗi ngày.<br />Bạn sẽ đi rất xa. 🌸</p>
      <EmojiIcon emoji="neko:review" size={96} className="dash-motivation-mascot" />
    </aside>
  );
}
