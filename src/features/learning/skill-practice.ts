import type { GrammarContent, KanjiContent, ReadingPassage, StudyResource } from '@/types/content';
import type { MemoryView } from '@/features/memory/memory-types';
import { pickDeterministic, shuffleDeterministic } from '@/lib/utils/deterministic-random';
import { type KnowledgeCatalog, itemsOfType } from './knowledge-catalog';
import { type ContentKey, toContentKey } from './knowledge-types';

/**
 * Dữ liệu cho 4 màn kỹ năng (SC-24…27). Bài nghe từ vựng được ghi vào trí nhớ (server chấm — /api/memory/practice);
 * nói / đọc / viết là luyện tự do, không có đáp án gắn với một kiến thức nên không ghi.
 * Bài nghe lấy từ đã tới ngày trên lộ trình. Nói, đọc, viết chỉ mở phần đã tới ngày, không đổ ập thứ chưa gặp.
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

export function buildListeningPractice(catalog: KnowledgeCatalog, _views: Views, journeyDay: number): ListeningPracticeData {
  const vocabulary = itemsOfType(catalog, 'vocabulary');
  // Nghe theo ngày trên lộ trình: はい, テレビ, lời chào có bài khi tới ngày của từ, không đợi ngày 15.
  const available = vocabulary.filter((item) => item.day !== null && item.day <= journeyDay);
  return {
    questions: pickDeterministic(available, LISTENING_WORDS, 'listening').map((item) => ({
      contentKey: item.key,
      audioText: item.content.kana,
      answer: item.meaning,
      options: shuffleDeterministic(
        [item.meaning, ...pickDeterministic(available.filter((other) => other.key !== item.key && other.meaning !== item.meaning).map((other) => other.meaning), DISTRACTORS, `listening-options:${item.id}`)],
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

export interface DictationItem {
  /** Kiến thức của câu (từ vựng / mẫu câu) — để ghi trí nhớ khi là từ vựng đã học. */
  contentKey: ContentKey;
  /** Câu / từ phát âm cho người học nghe. */
  audioText: string;
  /** Gợi ý nghĩa tiếng Việt. */
  hint: string;
  /** Các đáp án chấp nhận được (chữ Hán + cách đọc kana). */
  accepted: string[];
  /** Đáp án hiển thị khi xem kết quả. */
  display: string;
}

const DICTATION_WORDS = 10;
const DICTATION_SENTENCES = 6;

/**
 * Nghe – gõ (kiểu dictation): chỉ dùng thứ ĐÃ HỌC.
 *  - Từ: từ vựng đã học (nghe cách đọc + gợi ý nghĩa → gõ chữ Hán hoặc kana đều đúng).
 *  - Câu: câu ví dụ của các mẫu câu đã tới lịch (có cách đọc để chấp nhận khi gõ toàn kana).
 * Tất định theo `seed` (đổi mỗi ngày) để cùng một ngày làm lại vẫn là cùng bài.
 */
export function buildDictationPractice(catalog: KnowledgeCatalog, views: Views, journeyDay: number, seed: string): { words: DictationItem[]; sentences: DictationItem[] } {
  const learnedWords = itemsOfType(catalog, 'vocabulary').filter((item) => views.get(item.key)?.isLearned);
  const words = pickDeterministic(learnedWords, DICTATION_WORDS, `dictation-words:${seed}`).map((item) => ({
    contentKey: item.key,
    audioText: item.content.kana,
    hint: item.meaning,
    accepted: [item.content.kana, item.content.kanji].filter(Boolean),
    display: item.content.kanji ? `${item.content.kanji}（${item.content.kana}）` : item.content.kana,
  }));
  const isSentence = (text: string) => text && !/[→/／]/.test(text);
  const sentencePool = learnedGrammar(catalog, journeyDay).flatMap((pattern) => [
    { pattern, jp: pattern.exampleJp, reading: pattern.exampleReading, vi: pattern.exampleVi },
    { pattern, jp: pattern.example2Jp, reading: pattern.example2Reading, vi: pattern.example2Vi },
  ]).filter((sentence) => isSentence(sentence.jp));
  const sentences = pickDeterministic(sentencePool, DICTATION_SENTENCES, `dictation-sentences:${seed}`).map((sentence) => ({
    contentKey: toContentKey('grammar', sentence.pattern.id),
    audioText: sentence.jp,
    hint: sentence.vi,
    accepted: [sentence.jp, sentence.reading].filter(Boolean),
    display: sentence.jp,
  }));
  return { words, sentences };
}
