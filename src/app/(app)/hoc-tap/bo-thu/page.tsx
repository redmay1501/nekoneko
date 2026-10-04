import { KnowledgeListRow } from '@/components/learning/KnowledgeListRow';
import { countLearnedOfType, radicalRows } from '@/features/learning/knowledge-library';
import { getLearnerContext } from '@/features/learning/learner-context';

/** SC-16 · Bộ thủ — mảnh ghép tạo nên Kanji. */
export default async function RadicalsPage() {
  const { catalog, memoryViews } = await getLearnerContext();
  const { learned, total } = countLearnedOfType(catalog, memoryViews, 'radical');
  return (
    <>
      <div className="between"><h1>Bộ thủ</h1><span className="chip lav">{learned}/{total}</span></div>
      <p className="soft sm" style={{ margin: '4px 0 14px' }}>
        Bộ thủ là mảnh ghép tạo nên Kanji. Hiểu bộ thủ, bạn đoán được nghĩa của chữ chưa từng gặp.
      </p>
      <div className="card tight mb-3.5" style={{ background: 'var(--lav)', borderColor: '#DDD3F2' }}>
        <p className="sm">
          <b className="jp">亻 → 休 → 休む → 今日は休みです。</b><br />
          <span className="soft">Một bộ thủ mở ra cả một chuỗi: chữ → từ → câu.</span>
        </p>
      </div>
      <div className="list-grid stack" style={{ gap: 9 }}>
        {radicalRows(catalog, memoryViews).map((row) => <KnowledgeListRow key={row.contentKey} row={row} />)}
      </div>
    </>
  );
}
