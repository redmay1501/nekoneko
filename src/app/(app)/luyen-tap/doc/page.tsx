import { HeroAnimal } from '@/components/common/HeroAnimal';
import Link from 'next/link';
import { NekoButton } from '@/components/common/NekoButton';
import { EmptyState } from '@/components/common/StateViews';
import { getLearnerContext } from '@/features/learning/learner-context';
import { buildReadingList } from '@/features/learning/reading-list';

/**
 * SC-26 · Đọc hiểu — mỗi bài Minna một bài đọc ngắn (Neko soạn). Danh sách có tiến độ (đã làm, điểm cao nhất) và
 * "Làm tiếp" tới bài nên làm. Không khoá theo ngày: bài cho ngày chưa tới vẫn mở được, chỉ ghi chú.
 */
export default async function ReadingPage() {
  const { catalog, journeyDay, settings } = await getLearnerContext();
  const list = buildReadingList(catalog.content.readingPassages, settings.gameRecords, journeyDay);
  const suggested = list.items.find((item) => item.id === list.suggestedId);
  return (
    <>
      <div className="page-hero-cat">
      <h1>Đọc hiểu</h1>
      <p className="soft sm" style={{ margin: '4px 0 12px' }}>
        {list.items.length} bài đọc theo bài Minna · đã làm <b>{list.doneCount}/{list.items.length}</b>. Đọc to, rồi trả lời câu hỏi.
      </p>
        <HeroAnimal src="/animations/reading-giraffe.json" stillFrame={45} />
      </div>
      {suggested ? (
        <div className="card tight reading-next">
          <span className="sm">Làm tiếp: <b>{suggested.lesson} — {suggested.title}</b></span>
          <NekoButton href={`/luyen-tap/doc/${suggested.id}`} catPose="none">▶ Bắt đầu</NekoButton>
        </div>
      ) : list.items.length ? <p className="chip mint">🎉 Bạn đã làm hết các bài — làm lại để phá điểm cũ nhé.</p> : null}
      {list.items.length ? (
        <div className="reading-list mt-3">
          {list.items.map((item) => (
            <Link key={item.id} href={`/luyen-tap/doc/${item.id}`} className={`list-row reading-row ${item.id === list.suggestedId ? 'is-next' : ''}`}>
              <span className="reading-status" aria-hidden="true">{item.bestAccuracy === null ? '○' : item.bestAccuracy === 100 ? '★' : '✓'}</span>
              <span className="mid">
                <b>{item.lesson} · {item.title}</b>
                <span>
                  {item.questionCount} câu · {item.bestAccuracy === null ? 'chưa làm' : `điểm cao nhất ${item.bestAccuracy}%`}
                  {item.isAhead ? ` · dành cho sau ngày ${item.day}` : ''}
                </span>
              </span>
              <span className="end tiny muted" aria-hidden="true">›</span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-3"><EmptyState message="Chưa có đoạn đọc nào." hint="Đoạn đọc sẽ được bổ sung dần." /></div>
      )}
    </>
  );
}
