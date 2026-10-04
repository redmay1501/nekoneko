import { KnowledgeListRow } from '@/components/learning/KnowledgeListRow';
import { countLearnedOfType, grammarGroups } from '@/features/learning/knowledge-library';
import { getLearnerContext } from '@/features/learning/learner-context';

/** SC-22 · Ngữ pháp N5 — 112 mẫu câu nhóm theo bài. */
export default async function GrammarPage() {
  const { catalog, memoryViews } = await getLearnerContext();
  const { learned, total } = countLearnedOfType(catalog, memoryViews, 'grammar');
  return (
    <>
      <div className="between"><h1>Ngữ pháp N5</h1><span className="chip pink">{learned}/{total}</span></div>
      <p className="soft sm" style={{ margin: '4px 0 14px' }}>
        112 mẫu câu theo Minna bài 1–25. Mỗi mẫu đi kèm một câu thật để bạn dùng được ngay.
      </p>
      {grammarGroups(catalog, memoryViews).map((group) => (
        <section key={group.lesson}>
          <div className="sec-h"><h2 style={{ fontSize: 15 }}>{group.lesson}</h2><span className="tiny muted">{group.rows.length} mẫu</span></div>
          <div className="list-grid stack" style={{ gap: 9 }}>
            {group.rows.map((row) => <KnowledgeListRow key={row.contentKey} row={row} />)}
          </div>
        </section>
      ))}
    </>
  );
}
