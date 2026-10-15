import type { GrammarContent, KanjiContent, ReadingPassage } from '@/types/content';
import type { MemoryView } from '@/features/memory/memory-types';
import { pickDeterministic, shuffleDeterministic } from '@/lib/utils/deterministic-random';
import { type KnowledgeCatalog, itemsOfType } from './knowledge-catalog';
import { type ContentKey, toContentKey } from './knowledge-types';
import { knowledgeGroups } from './study-actions';
import { lessonNumber } from '@/lib/utils/lesson';

/**
 * Dữ liệu cho 4 màn kỹ năng (SC-24…27). Bài nghe từ vựng được ghi vào trí nhớ (server chấm — /api/memory/practice);
 * nói / đọc / viết là luyện tự do, không có đáp án gắn với một kiến thức nên không ghi.
 * Bài nghe: người học chọn phạm vi — theo lộ trình (mặc định), tất cả, hoặc từng bài (kể cả bài chưa học tới).
 * Nói, đọc, viết chỉ mở phần đã tới ngày.
 */

type Views = ReadonlyMap<ContentKey, MemoryView>;

const LISTENING_WORDS = 8;
const SPEAKING_SENTENCES = 10;
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

export interface ListeningRange {
  id: string;
  label: string;
}

export interface ListeningPracticeData {
  /** Phạm vi đang chọn và các phạm vi chọn được (theo lộ trình, tất cả, từng bài). */
  range: string;
  ranges: ListeningRange[];
  questions: ListeningQuestion[];
}

export function buildListeningPractice(
  catalog: KnowledgeCatalog, _views: Views, journeyDay: number, requestedRange?: string, seed = 'listening',
): ListeningPracticeData {
  const vocabulary = itemsOfType(catalog, 'vocabulary');
  const lessons = knowledgeGroups('vocabulary', vocabulary);
  const ranges: ListeningRange[] = [
    { id: 'lo-trinh', label: 'Theo lộ trình' },
    { id: 'tat-ca', label: 'Tất cả' },
    ...lessons.map((group) => ({ id: group.id, label: group.label })),
  ];
  const range = ranges.some((option) => option.id === requestedRange) ? requestedRange! : 'lo-trinh';
  // Theo lộ trình: từ đã tới ngày (はい, テレビ, lời chào có bài khi tới ngày của từ). Phạm vi khác: không cần học tới.
  const pool = range === 'lo-trinh'
    ? vocabulary.filter((item) => item.day !== null && item.day <= journeyDay)
    : range === 'tat-ca' ? vocabulary : lessons.find((group) => group.id === range)?.items ?? [];
  // Phương án nhiễu trong cùng phạm vi; phạm vi quá nhỏ thì mượn cả kho.
  const distractorPool = pool.length > DISTRACTORS * 2 ? pool : vocabulary;
  return {
    range,
    ranges,
    questions: pickDeterministic(pool, LISTENING_WORDS, `${seed}:${range}`).map((item) => ({
      contentKey: item.key,
      audioText: item.type === 'vocabulary' ? item.content.kana : item.face,
      answer: item.meaning,
      options: shuffleDeterministic(
        [item.meaning, ...pickDeterministic(distractorPool.filter((other) => other.key !== item.key && other.meaning !== item.meaning).map((other) => other.meaning), DISTRACTORS, `${seed}:options:${item.id}`)],
        `${seed}:order:${item.id}`,
      ),
    })),
  };
}

/** Phạm vi luyện theo bài: theo lộ trình (mặc định) · tất cả · Bài 1…25 — không khoá theo ngày. */
export interface PracticeRange {
  id: string;
  label: string;
}

const LESSON_COUNT = 25;
export const ROADMAP_RANGE = 'lo-trinh';
export const ALL_RANGE = 'tat-ca';

export function lessonPracticeRanges(): PracticeRange[] {
  return [
    { id: ROADMAP_RANGE, label: 'Theo lộ trình' },
    { id: ALL_RANGE, label: 'Tất cả' },
    ...Array.from({ length: LESSON_COUNT }, (_, index) => ({ id: `bai-${index + 1}`, label: `Bài ${index + 1}` })),
  ];
}

/**
 * Chọn phạm vi + nội dung. Phạm vi lạ → theo lộ trình; theo lộ trình mà chưa học tới gì (trước ngày có mẫu câu)
 * → Bài 1 thay vì để trống (không khoá kỹ năng).
 */
function resolveRange<T>(requested: string | undefined, poolOf: (range: string) => T[]): { range: string; pool: T[] } {
  const known = lessonPracticeRanges().some((option) => option.id === requested);
  const range = known ? requested! : ROADMAP_RANGE;
  const pool = poolOf(range);
  return range === ROADMAP_RANGE && !pool.length ? { range: 'bai-1', pool: poolOf('bai-1') } : { range, pool };
}

const lessonOfRange = (range: string) => (range.startsWith('bai-') ? Number(range.slice(4)) : null);

function grammarPool(catalog: KnowledgeCatalog, journeyDay: number, range: string): GrammarContent[] {
  if (range === ROADMAP_RANGE) return learnedGrammar(catalog, journeyDay);
  if (range === ALL_RANGE) return catalog.content.grammar;
  return catalog.content.grammar.filter((pattern) => lessonNumber(pattern.lesson) === lessonOfRange(range));
}

export interface SpeakingPracticeData {
  range: string;
  ranges: PracticeRange[];
  sentences: GrammarContent[];
}

/** Luyện nói: theo lộ trình / tất cả → vài câu ngẫu nhiên; một bài → mọi mẫu câu của bài đó. */
export function buildSpeakingPractice(catalog: KnowledgeCatalog, journeyDay: number, requestedRange?: string, seed = 'speaking'): SpeakingPracticeData {
  const { range, pool } = resolveRange(requestedRange, (candidate) => grammarPool(catalog, journeyDay, candidate));
  return {
    range,
    ranges: lessonPracticeRanges(),
    sentences: lessonOfRange(range) ? pool : pickDeterministic(pool, SPEAKING_SENTENCES, `${seed}:${range}`),
  };
}

/** Các đoạn đọc hiểu, theo ngày gợi ý — không khoá theo ngày (đoạn chưa tới ngày thì ghi rõ là gợi ý cho sau). */
export function buildReadingPractice(catalog: KnowledgeCatalog): ReadingPassage[] {
  return [...catalog.content.readingPassages].sort((left, right) => left.day - right.day);
}

export interface WritingPracticeData {
  focus: KanjiContent;
  focusKey: ContentKey;
  /** Các chữ cùng nhóm 10 với chữ đang luyện. */
  others: Array<{ contentKey: ContentKey; character: string; id: number }>;
  /** Nhóm Kanji (10 chữ / nhóm) — chọn nhóm để luyện, không khoá theo ngày. */
  groups: Array<{ id: string; label: string; first: string; firstId: number; isCurrent: boolean }>;
}

/**
 * Luyện viết Kanji: mặc định chữ mới nhất đã tới ngày học; `requested` (?chu=日, từ trang chi tiết Kanji) cho phép
 * luyện BẤT KỲ Kanji N5 nào — người học chủ động, không bị khoá theo lộ trình.
 */
export function buildWritingPractice(catalog: KnowledgeCatalog, journeyDay: number, requested?: string): WritingPracticeData {
  const learnedKanji = catalog.content.kanji.filter((kanji) => kanji.day !== null && kanji.day <= journeyDay);
  // Chưa tới ngày có Kanji → vẫn luyện được, bắt đầu từ chữ đầu tiên của lộ trình (không khoá).
  // ?chu= nhận id (chu=12 — đường dẫn chỉ chữ Latinh) hoặc chính chữ Kanji (link cũ ?chu=日).
  const focus = catalog.content.kanji.find((kanji) => String(kanji.id) === requested || kanji.character === requested) ?? learnedKanji.at(-1) ?? firstKanjiOf(catalog);
  const groups = knowledgeGroups('kanji', itemsOfType(catalog, 'kanji'));
  const group = groups.find((candidate) => candidate.items.some((item) => item.face === focus.character)) ?? groups[0];
  return {
    focus,
    focusKey: toContentKey('kanji', focus.id),
    others: group.items.map((item) => ({ contentKey: item.key, character: item.face, id: item.id })),
    groups: groups.map((candidate) => ({ id: candidate.id, label: candidate.label, first: candidate.items[0].face, firstId: candidate.items[0].id, isCurrent: candidate.id === group.id })),
  };
}

function firstKanjiOf(catalog: KnowledgeCatalog): KanjiContent {
  return [...catalog.content.kanji].sort((left, right) => (left.day ?? 999) - (right.day ?? 999) || left.id - right.id)[0];
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
export interface DictationPracticeData {
  range: string;
  ranges: PracticeRange[];
  words: DictationItem[];
  sentences: DictationItem[];
}

/**
 * Nghe – gõ: theo lộ trình = từ đã học + câu của mẫu đã tới ngày; tất cả / một bài = không cần học tới
 * (chỉ từ ĐÃ HỌC mới được ghi vào trí nhớ — server kiểm tra ở /api/memory/practice).
 */
export function buildDictationPractice(catalog: KnowledgeCatalog, views: Views, journeyDay: number, seed: string, requestedRange?: string): DictationPracticeData {
  const vocabulary = itemsOfType(catalog, 'vocabulary');
  const wordPool = (range: string) => (range === ROADMAP_RANGE ? vocabulary.filter((item) => views.get(item.key)?.isLearned)
    : range === ALL_RANGE ? vocabulary : vocabulary.filter((item) => item.type === 'vocabulary' && lessonNumber(item.content.lesson) === lessonOfRange(range)));
  const { range, pool: learnedWords } = resolveRange(requestedRange, wordPool);
  const words = pickDeterministic(learnedWords, DICTATION_WORDS, `dictation-words:${seed}`).map((item) => ({
    contentKey: item.key,
    audioText: item.content.kana,
    hint: item.meaning,
    accepted: [item.content.kana, item.content.kanji].filter(Boolean),
    display: item.content.kanji ? `${item.content.kanji}（${item.content.kana}）` : item.content.kana,
  }));
  const isSentence = (text: string) => text && !/[→/／]/.test(text);
  const sentencePool = grammarPool(catalog, journeyDay, range).flatMap((pattern) => [
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
  return { range, ranges: lessonPracticeRanges(), words, sentences };
}

// ─── Kho cho các trang đổi phạm vi NGAY TRONG TRÌNH DUYỆT (Luyện nghe, Luyện viết) ─────────────────────────────────
// Server gửi một lần: mọi mục + danh sách mục của từng phạm vi. Đổi phạm vi / "Bài khác" chỉ chọn lại ở trình duyệt —
// không chuyển trang (đổi tham số trên cùng trang đôi khi bị treo — xem docs/REFACTOR_CHANGELOG.md, 2026-10-13).

export interface RangePool {
  id: string;
  label: string;
  /** Khoá các mục thuộc phạm vi. */
  keys: string[];
}

export interface ListeningWord {
  key: string;
  audioText: string;
  meaning: string;
}

export interface ListeningPools {
  defaultRange: string;
  ranges: RangePool[];
  words: Record<string, ListeningWord>;
}

/** Luyện nghe: theo lộ trình (từ đã tới ngày) · tất cả · từng bài từ vựng. */
export function buildListeningPools(catalog: KnowledgeCatalog, journeyDay: number): ListeningPools {
  const vocabulary = itemsOfType(catalog, 'vocabulary');
  const lessons = knowledgeGroups('vocabulary', vocabulary);
  const roadmap = vocabulary.filter((item) => item.day !== null && item.day <= journeyDay);
  const ranges: RangePool[] = [
    { id: ROADMAP_RANGE, label: 'Theo lộ trình', keys: roadmap.map((item) => item.key) },
    { id: ALL_RANGE, label: 'Tất cả', keys: vocabulary.map((item) => item.key) },
    ...lessons.map((group) => ({ id: group.id, label: group.label, keys: group.items.map((item) => item.key) })),
  ];
  return {
    defaultRange: roadmap.length ? ROADMAP_RANGE : lessons[0]?.id ?? ALL_RANGE,
    ranges,
    words: Object.fromEntries(vocabulary.map((item) => [item.key, {
      key: item.key, audioText: item.type === 'vocabulary' ? item.content.kana : item.face, meaning: item.meaning,
    }])),
  };
}

export interface DictationPools {
  defaultRange: string;
  ranges: Array<{ id: string; label: string; wordKeys: string[]; sentenceIds: string[] }>;
  words: Record<string, DictationItem>;
  sentences: Record<string, DictationItem>;
}

/** Nghe – gõ: theo lộ trình (từ đã học + câu của mẫu đã tới ngày) · tất cả · Bài 1–25. */
export function buildDictationPools(catalog: KnowledgeCatalog, views: Views, journeyDay: number): DictationPools {
  const vocabulary = itemsOfType(catalog, 'vocabulary');
  const isSentence = (text: string) => Boolean(text) && !/[→/／]/.test(text);
  const sentenceEntries = catalog.content.grammar.flatMap((pattern) => [
    { id: `${pattern.id}-1`, pattern, jp: pattern.exampleJp, reading: pattern.exampleReading, vi: pattern.exampleVi },
    { id: `${pattern.id}-2`, pattern, jp: pattern.example2Jp, reading: pattern.example2Reading, vi: pattern.example2Vi },
  ]).filter((sentence) => isSentence(sentence.jp));
  const wordKeysOf = (range: string) => (range === ROADMAP_RANGE ? vocabulary.filter((item) => views.get(item.key)?.isLearned)
    : range === ALL_RANGE ? vocabulary : vocabulary.filter((item) => item.type === 'vocabulary' && lessonNumber(item.content.lesson) === lessonOfRange(range)))
    .map((item) => item.key);
  const sentenceIdsOf = (range: string) => {
    const patterns = new Set(grammarPool(catalog, journeyDay, range).map((pattern) => pattern.id));
    return sentenceEntries.filter((sentence) => patterns.has(sentence.pattern.id)).map((sentence) => sentence.id);
  };
  const ranges = lessonPracticeRanges().map((range) => ({ ...range, wordKeys: wordKeysOf(range.id), sentenceIds: sentenceIdsOf(range.id) }));
  const roadmap = ranges[0];
  return {
    defaultRange: roadmap.wordKeys.length || roadmap.sentenceIds.length ? ROADMAP_RANGE : 'bai-1',
    ranges,
    words: Object.fromEntries(vocabulary.map((item) => [item.key, {
      contentKey: item.key, audioText: item.type === 'vocabulary' ? item.content.kana : item.face, hint: item.meaning,
      accepted: item.type === 'vocabulary' ? [item.content.kana, item.content.kanji].filter(Boolean) : [item.face],
      display: item.type === 'vocabulary' && item.content.kanji ? `${item.content.kanji}（${item.content.kana}）` : item.face,
    }])),
    sentences: Object.fromEntries(sentenceEntries.map((sentence) => [sentence.id, {
      contentKey: toContentKey('grammar', sentence.pattern.id), audioText: sentence.jp, hint: sentence.vi,
      accepted: [sentence.jp, sentence.reading].filter(Boolean), display: sentence.jp,
    }])),
  };
}
