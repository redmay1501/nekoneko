import type { KanaContent } from '@/types/content';
import type { MemoryStatus, MemoryView } from '@/features/memory/memory-types';
import { hashToUnitInterval, pickDeterministic, shuffleDeterministic } from '@/lib/utils/deterministic-random';
import { BASIC_KANA_COUNT } from './knowledge-filters';
import { type ContentKey, toContentKey } from './knowledge-types';
import { strokeCountOf } from './stroke-order';

/** Dữ liệu cho màn Hiragana / Katakana: Học · Luyện viết · Luyện nghe · Kiểm tra. */

export type KanaKind = 'hiragana' | 'katakana';

export interface KanaCell {
  contentKey: ContentKey;
  character: string;
  romaji: string;
  status: MemoryStatus;
}

export interface KanaQuestion {
  character: string;
  answer: string;
  options: string[];
}

export interface KanaWritingChoice {
  character: string;
  romaji: string;
  tip: string;
  /** Số nét theo KanjiVG; undefined khi chưa có dữ liệu. */
  strokes: number | undefined;
}

export interface KanaPracticeData {
  kind: KanaKind;
  cells: KanaCell[];
  learnedCount: number;
  writing: KanaWritingChoice;
  /** Mọi chữ đơn (cơ bản + âm đục; âm ghép viết từng chữ) — người học tự chọn chữ muốn luyện viết. */
  writingChoices: KanaWritingChoice[];
  listening: KanaQuestion[];
  quiz: KanaQuestion[];
}

const LISTENING_COUNT = 6;
const QUIZ_COUNT = 8;
const DISTRACTOR_COUNT = 3;

export function buildKanaPractice(kind: KanaKind, kana: readonly KanaContent[], views: ReadonlyMap<ContentKey, MemoryView>, seed: string): KanaPracticeData {
  const characterOf = (entry: KanaContent) => (kind === 'hiragana' ? entry.hiragana : entry.katakana);
  const writingChoiceOf = (entry: KanaContent): KanaWritingChoice => ({
    character: characterOf(entry), romaji: entry.romaji, tip: entry.tip, strokes: strokeCountOf(characterOf(entry)),
  });
  const cells = kana.map((entry) => {
    const contentKey = toContentKey(kind, entry.id);
    return { contentKey, character: characterOf(entry), romaji: entry.romaji, status: views.get(contentKey)?.status ?? 'new' };
  });
  const basic = kana.slice(0, BASIC_KANA_COUNT);
  const learned = basic.filter((entry) => views.get(toContentKey(kind, entry.id))?.isLearned);
  const writingPool = learned.length ? learned : basic;
  const writingKana = writingPool[Math.floor(hashToUnitInterval(`write:${seed}`) * writingPool.length)];

  const listening = pickDeterministic(learned.length > 1 ? learned : [], LISTENING_COUNT, `listen:${kind}`).map((entry) => ({
    character: characterOf(entry),
    answer: characterOf(entry),
    options: shuffleDeterministic(
      [entry, ...pickDeterministic(learned.filter((other) => other.id !== entry.id), Math.min(DISTRACTOR_COUNT, learned.length - 1), `listen-options:${entry.id}`)].map(characterOf),
      `listen-order:${entry.id}`,
    ),
  }));

  const quiz = pickDeterministic(learned.length > 1 ? learned : [], QUIZ_COUNT, `quiz:${kind}`).map((entry) => ({
    character: characterOf(entry),
    answer: entry.romaji,
    options: shuffleDeterministic(
      [entry.romaji, ...pickDeterministic(learned.filter((other) => other.romaji !== entry.romaji).map((other) => other.romaji), Math.min(DISTRACTOR_COUNT, learned.length - 1), `quiz-options:${entry.id}`)],
      `quiz-order:${entry.id}`,
    ),
  }));

  return {
    kind,
    cells,
    learnedCount: cells.filter((cell) => cell.status !== 'new').length,
    writing: writingChoiceOf(writingKana),
    writingChoices: kana.filter((entry) => [...characterOf(entry)].length === 1).map(writingChoiceOf),
    listening,
    quiz,
  };
}
