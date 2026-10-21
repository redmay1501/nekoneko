import { KnowledgeListRow } from '@/components/learning/KnowledgeListRow';
import Link from 'next/link';
import { lessonNumber } from '@/lib/utils/lesson';
import { countLearnedOfType, grammarGroups } from '@/features/learning/knowledge-library';
import { getLearnerContext } from '@/features/learning/learner-context';

/** SC-22 · Ngữ pháp N5 — các mẫu câu nhóm theo bài. */
export default async function GrammarPage() {
  const { catalog, memoryViews } = await getLearnerContext();
  const { learned, total } = countLearnedOfType(catalog, memoryViews, 'grammar');
  return (
    <>
      <div className="title-count"><h1>Ngữ pháp N5</h1><span className="chip pink">{learned}/{total}</span></div>
      <p className="soft sm" style={{ margin: '4px 0 14px' }}>
        {total} mẫu câu theo bài 1–25. Mỗi mẫu đi kèm một câu thật để bạn dùng được ngay.
      </p>
      <div className="row wrap" style={{ gap: 8 }}>
        <Link href="/hoc-tap/ngu-phap/luyen-tap" className="btn sm">📝 Luyện tập ngữ pháp</Link>
        <Link href="/hoc-tap/ngu-phap/bai-tap" className="btn ghost sm">✍️ Bài tập luyện tập</Link>
      </div>
      {grammarGroups(catalog, memoryViews).map((group) => {
        return (
        <section key={group.lesson} data-reveal>
          <div className="sec-h"><h2 style={{ fontSize: 15 }}>{group.lesson}</h2>
            <span className="tiny muted">{group.rows.length} mẫu{Number.isFinite(lessonNumber(group.lesson)) ? (
              <> · <Link className="link" href={`/hoc-tap/ngu-phap/luyen-tap?pham=theo-bai&bai=${lessonNumber(group.lesson)}`}>Luyện bài này</Link>
                {' · '}<Link className="link" href={`/hoc-tap/ngu-phap/bai-tap?bai=${lessonNumber(group.lesson)}`}>Bài tập</Link></>
            ) : null}</span></div>
          <div className="list-grid stack" style={{ gap: 9 }}>
            {group.rows.map((row) => <KnowledgeListRow key={row.contentKey} row={row} />)}
          </div>
        </section>
        );
      })}
    </>
  );
}
