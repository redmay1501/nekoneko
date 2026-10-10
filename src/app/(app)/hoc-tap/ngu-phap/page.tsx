import Link from 'next/link';
import { KnowledgeListRow } from '@/components/learning/KnowledgeListRow';
import { StudyActionBar } from '@/components/learning/StudyActionBar';
import { itemsOfType } from '@/features/learning/knowledge-catalog';
import { focusSessionHref } from '@/features/learning/session-modes';
import { buildStudyActions } from '@/features/learning/study-actions';
import { toIsoDate } from '@/lib/utils/dates';
import { countLearnedOfType, grammarGroups } from '@/features/learning/knowledge-library';
import { getLearnerContext } from '@/features/learning/learner-context';

/** SC-22 · Ngữ pháp N5 — 112 mẫu câu nhóm theo bài. */
export default async function GrammarPage() {
  const { catalog, memoryViews, now } = await getLearnerContext();
  const actions = buildStudyActions(itemsOfType(catalog, 'grammar'), memoryViews, toIsoDate(now));
  const { learned, total } = countLearnedOfType(catalog, memoryViews, 'grammar');
  return (
    <>
      <div className="between"><h1>Ngữ pháp N5</h1><span className="chip pink">{learned}/{total}</span></div>
      <p className="soft sm" style={{ margin: '4px 0 14px' }}>
        112 mẫu câu theo Minna bài 1–25. Mỗi mẫu đi kèm một câu thật để bạn dùng được ngay.
      </p>
      <StudyActionBar actions={actions} unit="mẫu" />
      {grammarGroups(catalog, memoryViews).map((group) => {
        // Học / kiểm tra cả bài: mẫu chưa học → học; mẫu đã học → chọn câu đúng.
        const unlearned = group.rows.filter((row) => row.status === 'new').map((row) => row.contentKey);
        const learned = group.rows.filter((row) => row.status !== 'new').map((row) => row.contentKey);
        return (
        <section key={group.lesson} data-reveal>
          <div className="sec-h"><h2 style={{ fontSize: 15 }}>{group.lesson}</h2><span className="tiny muted">{group.rows.length} mẫu</span></div>
          <div className="row wrap mb-2" style={{ gap: 8 }}>
            {unlearned.length ? <Link className="btn ghost sm" href={focusSessionHref(unlearned)}>▶ Học {unlearned.length} mẫu</Link> : null}
            {learned.length ? <Link className="btn ghost sm" href={focusSessionHref(learned)}>✅ Kiểm tra {learned.length} mẫu</Link> : null}
          </div>
          <div className="list-grid stack" style={{ gap: 9 }}>
            {group.rows.map((row) => <KnowledgeListRow key={row.contentKey} row={row} />)}
          </div>
        </section>
        );
      })}
    </>
  );
}
