import type { GrammarContent, KanjiContent, RadicalContent, VocabularyContent } from '@/types/content';
import type { MemoryView } from '@/features/memory/memory-types';
import { extractLessonNumber } from '@/lib/utils/text';
import type { KnowledgeCatalog } from './knowledge-catalog';
import { type ChainNode, buildKnowledgeChain } from './knowledge-presenter';
import {
  grammarUsingVocabulary,
  kanjiContainingRadical,
  kanjiInVocabulary,
  radicalsOfKanji,
  vocabularyContainingKanji,
} from './knowledge-relations';
import type { KnowledgeItem } from './knowledge-types';

/** Mọi thứ khay "Chi tiết kiến thức" cần — dựng ở server, gửi một lần. */
export interface KnowledgeDetailView {
  item: KnowledgeItem;
  memory: MemoryView;
  chain: ChainNode[];
  related: {
    radicals: RadicalContent[];
    kanji: KanjiContent[];
    vocabulary: VocabularyContent[];
    grammar: GrammarContent[];
  };
  /** Ngữ pháp: "Lỗi thường gặp" — mượn ghi chú của bài Minna (sheet 7, hạng mục Văn bản). */
  commonMistake: string | null;
}

const DEFAULT_MISTAKE_NOTE = 'Đọc kỹ ví dụ và tự đặt một câu của riêng bạn — đó là cách nhớ lâu nhất.';

export function buildKnowledgeDetail(item: KnowledgeItem, memory: MemoryView, catalog: KnowledgeCatalog): KnowledgeDetailView {
  const related: KnowledgeDetailView['related'] = { radicals: [], kanji: [], vocabulary: [], grammar: [] };
  let commonMistake: string | null = null;

  if (item.type === 'radical') related.kanji = kanjiContainingRadical(catalog, item.content);
  if (item.type === 'kanji') {
    related.radicals = radicalsOfKanji(catalog, item.content);
    related.vocabulary = vocabularyContainingKanji(catalog, item.content);
  }
  if (item.type === 'vocabulary') {
    related.kanji = kanjiInVocabulary(catalog, item.content);
    related.grammar = grammarUsingVocabulary(catalog, item.content);
  }
  if (item.type === 'grammar') {
    const lessonNumber = extractLessonNumber(item.content.lesson);
    const lesson = catalog.content.lessons.find((candidate) => extractLessonNumber(candidate.id) === lessonNumber);
    commonMistake = lesson?.note || DEFAULT_MISTAKE_NOTE;
  }

  return { item, memory, chain: buildKnowledgeChain(item, catalog), related, commonMistake };
}
