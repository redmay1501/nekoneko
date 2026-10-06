import { RadicalExpandable } from '@/components/learning/RadicalExpandable';
import { countLearnedOfType } from '@/features/learning/knowledge-library';
import { getLearnerContext } from '@/features/learning/learner-context';
import { toRadicalExpandable } from '@/features/learning/radical-view';

/** SC-16 · Bộ thủ — mảnh ghép tạo nên Kanji. Bấm một bộ để mở mẹo nhớ ngay tại chỗ. */
export default async function RadicalsPage() {
  const { catalog, memoryViews } = await getLearnerContext();
  const { learned, total } = countLearnedOfType(catalog, memoryViews, 'radical');
  const radicals = [...catalog.content.radicals].sort((left, right) => (left.day ?? 999) - (right.day ?? 999) || left.id - right.id);
  const scheduled = radicals.filter((radical) => radical.day !== null);
  const reference = radicals.filter((radical) => radical.day === null);
  return (
    <>
      <div className="between"><h1>Bộ thủ</h1><span className="chip lav">{learned}/{scheduled.length}</span></div>
      <p className="soft sm" style={{ margin: '4px 0 10px' }}>
        Bộ thủ là mảnh ghép tạo nên Kanji. Không cần học thuộc trước — khi gặp Kanji mới, nhìn bộ thủ để đoán nghĩa và nhớ lâu hơn.
      </p>
      <p className="sm mb-3">💡 Bấm vào bộ thủ để xem mẹo nhớ</p>
      <div className="stack" style={{ gap: 8 }}>
        {scheduled.map((radical) => <RadicalExpandable key={radical.id} radical={toRadicalExpandable(catalog, radical)} />)}
      </div>
      {reference.length ? (
        <>
          <div className="sec-h"><h2>Bộ tham khảo</h2><span className="tiny muted">{reference.length} bộ</span></div>
          <p className="sm soft mb-2.5">Bộ chính của một số Kanji N5 — không có ngày học riêng, bạn gặp chúng khi học Kanji.</p>
          <div className="stack" style={{ gap: 8 }}>
            {reference.map((radical) => <RadicalExpandable key={radical.id} radical={toRadicalExpandable(catalog, radical)} />)}
          </div>
        </>
      ) : null}
      <p className="tiny muted center mt-3.5">{total} bộ · {learned} đã gặp</p>
    </>
  );
}
