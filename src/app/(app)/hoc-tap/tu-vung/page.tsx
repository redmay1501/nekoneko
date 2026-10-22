import { CafeVocabularyFrame } from '@/components/learning/CafeVocabularyFrame';
import { TestPicker } from '@/components/learning/TestPicker';
import { itemsOfType } from '@/features/learning/knowledge-catalog';
import { buildTestGroups } from '@/features/learning/study-actions';
import { countLearnedOfType } from '@/features/learning/knowledge-library';
import { getContextIndex } from '@/features/learning/context-index';
import { getLearnerContext } from '@/features/learning/learner-context';
import { grammarUsingVocabulary, kanjiInVocabulary } from '@/features/learning/knowledge-relations';
import { toContentKey } from '@/features/learning/knowledge-types';
import { learnerImageOf } from '@/features/learning/vocabulary-images';
import { lessonNumber } from '@/lib/utils/lesson';
import { vocabularyRomaji } from '@/lib/utils/romaji';

/** Từ vựng N5 trong sổ quán cà phê; nội dung, tiến độ và kiểm tra lấy từ kho học thật. */
export default async function VocabularyPage() {
  const { catalog, memoryViews, journeyDay } = await getLearnerContext();
  const vocabulary = catalog.content.vocabulary;
  const contextIndex = getContextIndex(catalog);
  const testGroups = buildTestGroups('vocabulary', itemsOfType(catalog, 'vocabulary'), memoryViews);
  const { learned, total } = countLearnedOfType(catalog, memoryViews, 'vocabulary');
  const items = vocabulary.map((word) => {
    const key = toContentKey('vocabulary', word.id);
    const view = memoryViews.get(key);
    const image = learnerImageOf('vocabulary', word);
    const sentences = contextIndex.sentencesFor(key).slice().sort((left, right) => left.jp.length - right.jp.length).slice(0, 3);
    // Dùng cùng ví dụ Minna với bảng chi tiết; tránh để thẻ chính và sheet hiện hai bộ câu khác nhau.
    const lessonExamples = grammarUsingVocabulary(catalog, word).map(({ exampleJp, exampleVi }) => ({ jp: exampleJp, vi: exampleVi }));
    return {
      contentKey: key,
      kana: word.kana,
      kanji: word.kanji,
      romaji: vocabularyRomaji(word),
      meaning: word.meaning,
      tip: word.tip,
      lesson: Number.isFinite(lessonNumber(word.lesson)) ? `Bài ${lessonNumber(word.lesson)}` : 'Chào hỏi & Katakana',
      icon: image?.url ?? '',
      learned: view?.isLearned ?? false,
      examples: lessonExamples.length ? lessonExamples : sentences.map(({ jp, vi }) => ({ jp, vi })),
      kanjiParts: kanjiInVocabulary(catalog, word).map((kanji) => ({
        contentKey: toContentKey('kanji', kanji.id), character: kanji.character, meaning: kanji.meaning,
      })),
    };
  });
  const latest = [...vocabulary]
    .filter((word) => word.day !== null && word.day <= journeyDay)
    .sort((left, right) => (right.day ?? 0) - (left.day ?? 0))[0];

  return (
    <CafeVocabularyFrame items={items} count={`${learned}/${total}`} initialContentKey={latest ? toContentKey('vocabulary', latest.id) : undefined}>
      <TestPicker groups={testGroups} unit="từ" partUnit="bài" />
    </CafeVocabularyFrame>
  );
}
