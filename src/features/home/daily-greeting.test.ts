import { describe, expect, it } from 'vitest';
import { buildDailyGreeting, type DailyGreetingInput } from './daily-greeting';

const base: DailyGreetingInput = {
  now: new Date('2026-10-06T02:00:00.000Z'), // 9h sáng 6/10 giờ VN
  journeyDay: 3, dayTitle: 'Hiragana hàng さ', hasNewKnowledge: true, isReadyToComplete: false,
  plan: { review: 4, backlog: 0, new: 10, use: 0 },
  streak: { recallDays: 2, currentStreak: 2, longestStreak: 2, lastRecallDay: '2026-10-05' },
};

describe('buildDailyGreeting', () => {
  it('nội dung theo tình hình thật: chuỗi ngày, kế hoạch hôm nay', () => {
    const greeting = buildDailyGreeting(base);
    expect(greeting.dateKey).toBe('2026-10-06');
    expect(greeting.message).toContain('Chuỗi 2 ngày');
    expect(greeting.todayLine).toBe('Hôm nay: 10 thứ mới · ôn 4 thứ đã học');
  });

  it('quay lại sau mấy ngày nghỉ', () => {
    expect(buildDailyGreeting({ ...base, streak: { ...base.streak, currentStreak: 0, lastRecallDay: '2026-10-01' } }).message).toContain('5 ngày');
  });

  it('người mới ngày 1, đã học hết ngày', () => {
    const fresh = { ...base, journeyDay: 1, streak: { recallDays: 0, currentStreak: 0, longestStreak: 0, lastRecallDay: null } };
    expect(buildDailyGreeting(fresh).message).toContain('ngày đầu tiên');
    expect(buildDailyGreeting({ ...base, isReadyToComplete: true }).message).toContain('học hết ngày 3');
  });

  it('câu tiếng Nhật đổi theo ngày', () => {
    const today = buildDailyGreeting(base).phrase;
    const tomorrow = buildDailyGreeting({ ...base, now: new Date('2026-10-07T02:00:00.000Z') }).phrase;
    expect(tomorrow).not.toEqual(today);
  });
});
