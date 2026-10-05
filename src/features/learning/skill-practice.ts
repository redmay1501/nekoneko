import type { GrammarContent, KanjiContent, ReadingPassage, StudyResource } from '@/types/content';
import type { MemoryView } from '@/features/memory/memory-types';
import { pickDeterministic, shuffleDeterministic } from '@/lib/utils/deterministic-random';
import { type KnowledgeCatalog, itemsOfType } from './knowledge-catalog';
import { type ContentKey, toContentKey } from './knowledge-types';

/**
 * Dữ liệu cho 4 màn kỹ năng (SC-24…27). Bài nghe từ vựng được ghi vào trí nhớ (server chấm — /api/memory/practice);
 * nói / đọc / viết là luyện tự do, không có đáp án gắn với một kiến thức nên không ghi.
 * Chỉ dùng kiến thức đã học tới ngày hiện tại để không đổ ập thứ chưa gặp.
 */

type Views = ReadonlyMap<ContentKey, MemoryView>;

const LISTENING_WORDS = 5;
const SHADOWING_SENTENCES = 3;
const SPEAKING_SENTENCES = 4;
const LISTENING_RESOURCES = 4;
const WRITING_KANJI_CHIPS = 8;
const DISTRACTORS = 3;

function learnedGrammar(catalog: KnowledgeCatalog, journeyDay: number): GrammarContent[] {
  return catalog.content.grammar.filter((pattern) => pattern.day !== null && pattern.day <= journeyDay);
}

export interface ListeningQuestion {
  contentKey: ContentKey;
  audioText: string;
  answer: string;
  options: string[];
}

export interface ListeningPracticeData {
  questions: ListeningQuestion[];
  shadowing: GrammarContent[];
  resources: StudyResource[];
}

export function buildListeningPractice(catalog: KnowledgeCatalog, views: Views, journeyDay: number): ListeningPracticeData {
  const vocabulary = itemsOfType(catalog, 'vocabulary');
  const learned = vocabulary.filter((item) => views.get(item.key)?.isLearned);
  return {
    questions: pickDeterministic(learned, LISTENING_WORDS, 'listening').map((item) => ({
      contentKey: item.key,
      audioText: item.content.kana,
      answer: item.meaning,
      options: shuffleDeterministic(
        [item.meaning, ...pickDeterministic(vocabulary.filter((other) => other.key !== item.key && other.meaning !== item.meaning).map((other) => other.meaning), DISTRACTORS, `listening-options:${item.id}`)],
        `listening-order:${item.id}`,
      ),
    })),
    shadowing: pickDeterministic(learnedGrammar(catalog, journeyDay), SHADOWING_SENTENCES, 'shadowing'),
    resources: catalog.content.studyResources.filter((resource) => resource.usedFor.includes('Nghe')).slice(0, LISTENING_RESOURCES),
  };
}

export function buildSpeakingPractice(catalog: KnowledgeCatalog, journeyDay: number): GrammarContent[] {
  return pickDeterministic(learnedGrammar(catalog, journeyDay), SPEAKING_SENTENCES, 'speaking');
}

/** Đoạn đọc mới nhất mà người học đã đủ kiến thức để đọc. */
export function buildReadingPractice(catalog: KnowledgeCatalog, journeyDay: number): ReadingPassage | null {
  return [...catalog.content.readingPassages].filter((passage) => passage.day <= journeyDay).sort((left, right) => right.day - left.day)[0] ?? null;
}

export interface WritingPracticeData {
  focus: KanjiContent;
  focusKey: ContentKey;
  others: Array<{ contentKey: ContentKey; character: string }>;
}

export function buildWritingPractice(catalog: KnowledgeCatalog, journeyDay: number): WritingPracticeData | null {
  const learnedKanji = catalog.content.kanji.filter((kanji) => kanji.day !== null && kanji.day <= journeyDay);
  const focus = learnedKanji.at(-1);
  if (!focus) return null;
  return {
    focus,
    focusKey: toContentKey('kanji', focus.id),
    others: pickDeterministic(learnedKanji, WRITING_KANJI_CHIPS, 'writing').map((kanji) => ({
      contentKey: toContentKey('kanji', kanji.id), character: kanji.character,
    })),
  };
}
