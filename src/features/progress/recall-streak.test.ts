import { describe, expect, it } from 'vitest';
import { appDateKey, summarizeRecallDates } from './recall-streak';

// 2026-10-05 20:00 giờ VN.
const NOW = new Date('2026-10-05T13:00:00.000Z');

describe('appDateKey', () => {
  it('theo giờ Việt Nam, không theo UTC', () => {
    expect(appDateKey(new Date('2026-10-05T17:30:00.000Z'))).toBe('2026-10-06'); // 00:30 sáng 6/10 ở VN
    expect(appDateKey(new Date('2026-10-05T16:59:00.000Z'))).toBe('2026-10-05');
  });
});

describe('summarizeRecallDates', () => {
  it('7 ngày rải rác KHÔNG phải chuỗi 7 ngày', () => {
    const scattered = ['2026-09-10', '2026-09-12', '2026-09-14', '2026-09-16', '2026-09-18', '2026-09-20', '2026-09-22'];
    expect(summarizeRecallDates(scattered, NOW)).toEqual({ recallDays: 7, currentStreak: 0, longestStreak: 1 });
  });

  it('chuỗi liên tiếp tới hôm nay; hôm nay chưa ôn thì vẫn giữ chuỗi tới hôm qua', () => {
    const run = ['2026-09-30', '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04'];
    expect(summarizeRecallDates(run, NOW)).toMatchObject({ currentStreak: 5, longestStreak: 5 });
    expect(summarizeRecallDates([...run, '2026-10-05'], NOW)).toMatchObject({ currentStreak: 6, longestStreak: 6 });
  });

  it('nghỉ một ngày là đứt chuỗi hiện tại, nhưng chuỗi dài nhất vẫn được giữ', () => {
    const old = Array.from({ length: 8 }, (_, index) => `2026-08-${String(index + 1).padStart(2, '0')}`);
    const result = summarizeRecallDates([...old, '2026-10-03'], NOW);
    expect(result).toEqual({ recallDays: 1, currentStreak: 0, longestStreak: 8 });
  });

  it('chuỗi qua ranh giới tháng và ngày trùng lặp', () => {
    expect(summarizeRecallDates(['2026-09-30', '2026-10-01', '2026-10-01'], NOW).longestStreak).toBe(2);
  });

  it('chưa ôn ngày nào', () => {
    expect(summarizeRecallDates([], NOW)).toEqual({ recallDays: 0, currentStreak: 0, longestStreak: 0 });
  });
});
