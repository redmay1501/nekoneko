import Link from 'next/link';
import { FilterableKnowledgeList } from '@/components/learning/FilterableKnowledgeList';
import { TestPicker } from '@/components/learning/TestPicker';
import { itemsOfType } from '@/features/learning/knowledge-catalog';
import { buildTestGroups } from '@/features/learning/study-actions';
import { countLearnedOfType, kanjiRows } from '@/features/learning/knowledge-library';
import { getLearnerContext } from '@/features/learning/learner-context';

/** SC-18 · Kanji N5 — xếp theo bài (Kanji học cùng từ vựng), xem / nghe ở thẻ chi tiết, luyện viết, kiểm tra toàn bộ hoặc chữ đã học. */
export default async function KanjiPage() {
  const { catalog, memoryViews } = await getLearnerContext();
  const testGroups = buildTestGroups('kanji', itemsOfType(catalog, 'kanji'), memoryViews);
  const { learned, total } = countLearnedOfType(catalog, memoryViews, 'kanji');
  return (
    <>
      <div className="title-count"><h1>Kanji N5</h1><span className="chip mint">{learned}/{total}</span></div>
      <p className="soft sm" style={{ margin: '4px 0 12px' }}>
        103 chữ Kanji của kỳ thi N5, kèm âm Hán Việt — cách nhớ nhanh nhất cho người Việt.
      </p>
      <div className="row wrap" style={{ gap: 8 }}>
        <TestPicker groups={testGroups} unit="chữ" />
        <Link className="btn ghost sm" href="/luyen-tap/viet?muc=kanji">✍️ Luyện viết Kanji</Link>
      </div>
      <FilterableKnowledgeList rows={kanjiRows(catalog, memoryViews)} />
    </>
  );
}
