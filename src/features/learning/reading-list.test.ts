import { describe, expect, it } from 'vitest';
import { READING_PASSAGES } from '@/lib/data/reading-passages';
import { buildReadingList, nextReadingId } from './reading-list';

const record = (bestAccuracy: number) => ({ bestAccuracy, bestTimeMs: 60_000, plays: 1, lastPlayedAt: '2026-10-14T00:00:00Z' });

describe('danh sách bài đọc', () => {
  it('gợi ý bài chưa làm đầu tiên đã tới ngày học; làm xong thì sang bài sau', () => {
    const first = READING_PASSAGES[0];
    expect(buildReadingList(READING_PASSAGES, {}, 30).suggestedId).toBe(first.id);
    const afterFirst = buildReadingList(READING_PASSAGES, { [`doc:bai-${first.id}`]: record(67) }, 30);
    expect(afterFirst.doneCount).toBe(1);
    expect(afterFirst.suggestedId).toBe(READING_PASSAGES[1].id);
    expect(afterFirst.items[0].bestAccuracy).toBe(67);
  });

  it('chưa tới ngày của bài nào thì vẫn gợi ý bài đầu tiên (không khoá), bài sau ngày học được đánh dấu', () => {
    const list = buildReadingList(READING_PASSAGES, {}, 5);
    expect(list.suggestedId).toBe(READING_PASSAGES[0].id);
    expect(list.items.every((item) => item.isAhead)).toBe(true);
  });

  it('bài tiếp theo theo thứ tự lộ trình; bài cuối thì không có', () => {
    expect(nextReadingId(READING_PASSAGES, READING_PASSAGES[0].id)).toBe(READING_PASSAGES[1].id);
    expect(nextReadingId(READING_PASSAGES, READING_PASSAGES.at(-1)!.id)).toBeNull();
  });
});
