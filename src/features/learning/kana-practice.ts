import type { KanaContent } from '@/types/content';
import type { MemoryStatus, MemoryView } from '@/features/memory/memory-types';
import { hashToUnitInterval, pickDeterministic, shuffleDeterministic } from '@/lib/utils/deterministic-random';
import { BASIC_KANA_COUNT } from './knowledge-filters';
import { type ContentKey, toContentKey } from './knowledge-types';

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

export interface KanaPracticeData {
  kind: KanaKind;
  cells: KanaCell[];
  learnedCount: number;
  writing: { character: string; romaji: string; tip: string };
  listening: KanaQuestion[];
  quiz: KanaQuestion[];
}

const LISTENING_COUNT = 6;
const QUIZ_COUNT = 8;
const DISTRACTOR_COUNT = 3;

export function buildKanaPractice(kind: KanaKind, kana: readonly KanaContent[], views: ReadonlyMap<ContentKey, MemoryView>, seed: string): KanaPracticeData {
  const characterOf = (entry: KanaContent) => (kind === 'hiragana' ? entry.hiragana : entry.katakana);
  const cells = kana.map((entry) => {
    const contentKey = toContentKey(kind, entry.id);
    return { contentKey, character: characterOf(entry), romaji: entry.romaji, status: views.get(contentKey)?.status ?? 'new' };
  });
  const basic = kana.slice(0, BASIC_KANA_COUNT);
  const writingKana = basic[Math.floor(hashToUnitInterval(`write:${seed}`) * basic.length)];

  const listening = pickDeterministic(basic, LISTENING_COUNT, `listen:${kind}`).map((entry) => ({
    character: characterOf(entry),
    answer: characterOf(entry),
    options: shuffleDeterministic(
      [entry, ...pickDeterministic(basic.filter((other) => other.id !== entry.id), DISTRACTOR_COUNT, `listen-options:${entry.id}`)].map(characterOf),
      `listen-order:${entry.id}`,
    ),
  }));

  const quiz = pickDeterministic(basic, QUIZ_COUNT, `quiz:${kind}`).map((entry) => ({
    character: characterOf(entry),
    answer: entry.romaji,
    options: shuffleDeterministic(
      [entry.romaji, ...pickDeterministic(basic.filter((other) => other.romaji !== entry.romaji).map((other) => other.romaji), DISTRACTOR_COUNT, `quiz-options:${entry.id}`)],
      `quiz-order:${entry.id}`,
    ),
  }));

  return {
    kind,
    cells,
    learnedCount: cells.filter((cell) => cell.status !== 'new').length,
    writing: { character: characterOf(writingKana), romaji: writingKana.romaji, tip: writingKana.tip },
    listening,
    quiz,
  };
}
