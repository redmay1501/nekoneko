import { LessonVocabularyList } from '@/components/learning/LessonVocabularyList';
import { countLearnedOfType, vocabularyRows } from '@/features/learning/knowledge-library';
import { getLearnerContext } from '@/features/learning/learner-context';

/** SC-20 · Từ vựng N5, lọc theo bài Minna. */
export default async function VocabularyPage() {
  const { catalog, memoryViews } = await getLearnerContext();
  const { learned, total } = countLearnedOfType(catalog, memoryViews, 'vocabulary');
  return (
    <>
      <div className="between"><h1>Từ vựng N5</h1><span className="chip sky">{learned}/{total}</span></div>
      <p className="soft sm" style={{ margin: '4px 0 12px' }}>350 từ trọng tâm theo Minna no Nihongo I, bài 1–25.</p>
      <LessonVocabularyList rows={vocabularyRows(catalog, memoryViews)} lessons={catalog.content.lessons} />
    </>
  );
}
