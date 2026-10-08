import Link from 'next/link';
import Image from 'next/image';
import { EmojiIcon } from '@/components/common/EmojiIcon';

/* Các thẻ "nhìn lại": Vườn (Trang chủ), Khoảnh khắc tiến bộ + lời động viên (Tiến độ) — chỉ hiển thị, dữ liệu dựng sẵn ở page. */

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

/** "Vườn tri thức" — mỗi kiến thức đã nhớ là một hạt giống đã gieo. */
export function GardenSummaryCard({ learnedCount }: { learnedCount: number }) {
  return (
    <Link href="/vuon" className="dash-card dash-garden" aria-label={`Vườn tri thức — đã trồng ${learnedCount} hạt kiến thức`}>
      <Image src="/illustrations/home-garden.webp" alt="" width={620} height={414} sizes="(min-width: 1100px) 370px, (min-width: 768px) 720px, 100vw" className="dash-garden-bg" />
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
