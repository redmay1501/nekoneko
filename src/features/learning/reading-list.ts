import type { GameRecords } from '@/features/games/match-game';
import { readingRecordOf } from '@/features/games/reading-progress';
import type { ReadingPassage } from '@/types/content';

export interface ReadingListItem {
  id: number;
  lesson: string;
  title: string;
  day: number;
  questionCount: number;
  /** Điểm cao nhất (%) — null khi chưa làm. */
  bestAccuracy: number | null;
  plays: number;
  /** Bài dành cho sau ngày đang học (vẫn làm được, chỉ ghi chú). */
  isAhead: boolean;
}

export interface ReadingList {
  items: ReadingListItem[];
  doneCount: number;
  /** Bài nên làm tiếp: bài chưa làm đầu tiên đã tới ngày học; hết thì bài chưa làm đầu tiên; làm hết thì null. */
  suggestedId: number | null;
}

export function buildReadingList(passages: readonly ReadingPassage[], records: GameRecords, journeyDay: number): ReadingList {
  const items = [...passages].sort((left, right) => left.day - right.day || left.id - right.id).map((passage): ReadingListItem => {
    const record = readingRecordOf(records, passage.id);
    return {
      id: passage.id, lesson: passage.lesson, title: passage.title, day: passage.day, questionCount: passage.questions.length,
      bestAccuracy: record?.bestAccuracy ?? null, plays: record?.plays ?? 0, isAhead: passage.day > journeyDay,
    };
  });
  const notDone = items.filter((item) => item.bestAccuracy === null);
  const suggested = notDone.find((item) => !item.isAhead) ?? notDone[0] ?? null;
  return { items, doneCount: items.length - notDone.length, suggestedId: suggested?.id ?? null };
}

/** Bài kế tiếp trong danh sách (theo thứ tự lộ trình) — null nếu là bài cuối. */
export function nextReadingId(passages: readonly ReadingPassage[], id: number): number | null {
  const ordered = [...passages].sort((left, right) => left.day - right.day || left.id - right.id);
  const index = ordered.findIndex((passage) => passage.id === id);
  return index >= 0 && index + 1 < ordered.length ? ordered[index + 1].id : null;
}
