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
  writing: { character: string; romaji: string; tip: string; strokes: number | undefined };
  listening: KanaQuestion[];
  quiz: KanaQuestion[];
}

const LISTENING_COUNT = 6;
const QUIZ_COUNT = 8;
const DISTRACTOR_COUNT = 3;

const KANA_STROKES: Readonly<Record<string, number>> = {
  あ: 3, い: 2, う: 2, え: 2, お: 3, か: 3, き: 4, く: 1, け: 3, こ: 2,
  さ: 3, し: 1, す: 2, せ: 3, そ: 1, た: 4, ち: 2, つ: 1, て: 1, と: 2,
  な: 4, に: 3, ぬ: 2, ね: 2, の: 1, は: 3, ひ: 1, ふ: 4, へ: 1, ほ: 4,
  ま: 3, み: 2, む: 3, め: 2, も: 3, や: 3, ゆ: 2, よ: 2, ら: 2, り: 2,
  る: 1, れ: 2, ろ: 1, わ: 2, を: 3, ん: 1,
  ア: 2, イ: 2, ウ: 3, エ: 3, オ: 3, カ: 2, キ: 3, ク: 2, ケ: 3, コ: 2,
  サ: 3, シ: 3, ス: 2, セ: 2, ソ: 2, タ: 3, チ: 3, ツ: 3, テ: 3, ト: 2,
  ナ: 2, ニ: 2, ヌ: 2, ネ: 4, ノ: 1, ハ: 2, ヒ: 2, フ: 1, ヘ: 1, ホ: 4,
  マ: 2, ミ: 3, ム: 2, メ: 2, モ: 3, ヤ: 2, ユ: 2, ヨ: 2, ラ: 2, リ: 2,
  ル: 2, レ: 1, ロ: 3, ワ: 2, ヲ: 3, ン: 2,
};

export function buildKanaPractice(kind: KanaKind, kana: readonly KanaContent[], views: ReadonlyMap<ContentKey, MemoryView>, seed: string): KanaPracticeData {
  const characterOf = (entry: KanaContent) => (kind === 'hiragana' ? entry.hiragana : entry.katakana);
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
    writing: { character: characterOf(writingKana), romaji: writingKana.romaji, tip: writingKana.tip, strokes: KANA_STROKES[characterOf(writingKana)] },
    listening,
    quiz,
  };
}
