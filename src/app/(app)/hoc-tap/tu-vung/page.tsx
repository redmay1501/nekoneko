import { LessonVocabularyList, KANA_PERIOD_TAB } from '@/components/learning/LessonVocabularyList';
import { VocabularySelfTest } from '@/components/learning/VocabularySelfTest';
import { countLearnedOfType, vocabularyRows } from '@/features/learning/knowledge-library';
import { getLearnerContext } from '@/features/learning/learner-context';
import { lessonNumber } from '@/lib/utils/lesson';

/** SC-20 · Từ vựng N5, lọc theo bài Minna — mở sẵn bài đang học. */
export default async function VocabularyPage() {
  const { catalog, memoryViews, journeyDay } = await getLearnerContext();
  const { learned, total } = countLearnedOfType(catalog, memoryViews, 'vocabulary');
  // Bài đang học = bài của từ vựng gần nhất đã tới lịch (≤ ngày đang học); chưa tới bài 1 thì là tab "Chữ cái".
  const scheduled = catalog.content.vocabulary.filter((word) => word.day !== null && word.day <= journeyDay);
  const latest = scheduled.sort((left, right) => (right.day ?? 0) - (left.day ?? 0))[0];
  const latestLesson = latest ? lessonNumber(latest.lesson) : Number.POSITIVE_INFINITY;
  const rows = vocabularyRows(catalog, memoryViews);
  const currentTab = latest ? (Number.isFinite(latestLesson) ? `Bài ${latestLesson}` : KANA_PERIOD_TAB) : '';
  return (
    <>
      <div className="between"><h1>Từ vựng N5</h1><span className="chip sky">{learned}/{total}</span></div>
      <p className="soft sm" style={{ margin: '4px 0 12px' }}>
        {total} từ: theo Minna no Nihongo I bài 1–25, cộng từ N5 bổ sung và từ của giai đoạn bảng chữ cái.
      </p>
      <div className="mb-4"><VocabularySelfTest rows={rows} /></div>
      <LessonVocabularyList rows={rows} lessons={catalog.content.lessons} currentTab={currentTab} />
    </>
  );
}
