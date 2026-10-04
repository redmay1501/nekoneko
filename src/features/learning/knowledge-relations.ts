import type {
  GrammarContent,
  KanjiContent,
  RadicalContent,
  VocabularyContent,
} from '@/types/content';
import type { KnowledgeCatalog } from './knowledge-catalog';

/**
 * Mạng kiến thức: Bộ thủ ↔ Kanji ↔ Từ vựng ↔ Câu.
 * Đây là "first-class feature" của Neko Neko — mọi màn chi tiết và bước Khám phá
 * đều hỏi các quan hệ ở đây, không tự tính lại.
 */

const MAX_RELATED_VOCABULARY = 8;
const MAX_RELATED_GRAMMAR = 3;

function kanjiByCharacter(catalog: KnowledgeCatalog): Map<string, KanjiContent> {
  return new Map(catalog.content.kanji.map((kanji) => [kanji.character, kanji]));
}

/** Kanji chứa bộ thủ này — theo cột "Kanji chứa bộ này" của lộ trình. */
export function kanjiContainingRadical(catalog: KnowledgeCatalog, radical: RadicalContent): KanjiContent[] {
  const lookup = kanjiByCharacter(catalog);
  return radical.kanjiList
    .split(/[・,\s]+/)
    .filter(Boolean)
    .map((character) => lookup.get(character))
    .filter((kanji): kanji is KanjiContent => Boolean(kanji));
}

/** Bộ thủ tạo nên chữ Kanji này. */
export function radicalsOfKanji(catalog: KnowledgeCatalog, kanji: KanjiContent): RadicalContent[] {
  return catalog.content.radicals.filter((radical) => radical.kanjiList.includes(kanji.character));
}

/** Từ vựng N5 có chứa chữ Kanji này. */
export function vocabularyContainingKanji(catalog: KnowledgeCatalog, kanji: KanjiContent): VocabularyContent[] {
  return catalog.content.vocabulary
    .filter((word) => word.kanji.includes(kanji.character))
    .slice(0, MAX_RELATED_VOCABULARY);
}

/** Các chữ Kanji xuất hiện trong một từ vựng. */
export function kanjiInVocabulary(catalog: KnowledgeCatalog, word: VocabularyContent): KanjiContent[] {
  const lookup = kanjiByCharacter(catalog);
  return [...new Set(word.kanji.split(''))]
    .map((character) => lookup.get(character))
    .filter((kanji): kanji is KanjiContent => Boolean(kanji));
}

/** Mẫu ngữ pháp có câu ví dụ dùng từ này. */
export function grammarUsingVocabulary(catalog: KnowledgeCatalog, word: VocabularyContent): GrammarContent[] {
  return catalog.content.grammar
    .filter((pattern) => (word.kanji && pattern.exampleJp.includes(word.kanji)) || pattern.exampleJp.includes(word.kana))
    .slice(0, MAX_RELATED_GRAMMAR);
}
