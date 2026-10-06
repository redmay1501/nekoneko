import { describe, expect, it } from 'vitest';
import { summarizeActivityEvents } from './activity-summary';

describe('summarizeActivityEvents', () => {
  it('ngày 1: học 10 chữ + luyện ngay → 10 mới, 0 thứ cũ (không đếm lượt)', () => {
    const events = Array.from({ length: 10 }, (_, index) => [
      { eventType: 'discover' as const, itemId: `k${index}` },
      { eventType: 'recall' as const, itemId: `k${index}` },
      ...(index < 3 ? [{ eventType: 'recall' as const, itemId: `k${index}` }] : []),
    ]).flat();
    expect(summarizeActivityEvents(events)).toEqual({ revisitedCount: 0, discoveredCount: 10 });
  });

  it('thứ cũ gặp lại nhiều lần vẫn tính một', () => {
    expect(summarizeActivityEvents([
      { eventType: 'recall', itemId: 'old' }, { eventType: 'surprise', itemId: 'old' }, { eventType: 'discover', itemId: 'new' },
    ])).toEqual({ revisitedCount: 1, discoveredCount: 1 });
  });
});
