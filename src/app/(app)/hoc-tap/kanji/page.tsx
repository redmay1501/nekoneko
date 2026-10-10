import { FilterableKnowledgeList } from '@/components/learning/FilterableKnowledgeList';
import { StudyActionBar } from '@/components/learning/StudyActionBar';
import { itemsOfType } from '@/features/learning/knowledge-catalog';
import { buildStudyParts } from '@/features/learning/study-actions';
import { countLearnedOfType, kanjiRows } from '@/features/learning/knowledge-library';
import { getLearnerContext } from '@/features/learning/learner-context';

/** SC-18 · Kanji N5, lọc theo trạng thái trí nhớ. */
export default async function KanjiPage() {
  const { catalog, memoryViews } = await getLearnerContext();
  const parts = buildStudyParts('kanji', itemsOfType(catalog, 'kanji'), memoryViews);
  const { learned, total } = countLearnedOfType(catalog, memoryViews, 'kanji');
  return (
    <>
      <div className="between"><h1>Kanji N5</h1><span className="chip mint">{learned}/{total}</span></div>
      <p className="soft sm" style={{ margin: '4px 0 12px' }}>
        103 chữ Kanji của kỳ thi N5, kèm âm Hán Việt — cách nhớ nhanh nhất cho người Việt.
      </p>
      <StudyActionBar parts={parts} unit="chữ" />
      <FilterableKnowledgeList rows={kanjiRows(catalog, memoryViews)} unit="chữ" />
    </>
  );
}
