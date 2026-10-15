import { afterEach, describe, expect, it, vi } from 'vitest';
import { DemoDataSource } from './demo-data-source';

/**
 * Audit "hoàn thành ngày": ngày học chỉ tăng khi người học bấm Hoàn thành ĐÚNG ngày đang học.
 * Thời gian trôi (sang ngày lịch mới), mở lại / tải lại hồ sơ không tự hoàn thành ngày nào.
 */
describe('tiến độ lộ trình không tự hoàn thành theo ngày lịch', () => {
  afterEach(() => { vi.useRealTimers(); });

  it('hoàn thành ngày 1 → ngày 2; qua 3 ngày lịch không bấm gì → vẫn ở ngày 2', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-01T09:00:00+07:00'));
    const source = new DemoDataSource();
    const userId = `audit-${Math.random()}`;
    expect((await source.getProfile(userId)).currentDay).toBe(1);
    expect(await source.advanceJourneyDay(userId, 1)).toMatchObject({ hasAdvanced: true, currentDay: 2 });

    vi.setSystemTime(new Date('2026-10-04T09:00:00+07:00'));
    expect((await source.getProfile(userId)).currentDay).toBe(2);
  });

  it('không nhảy cóc, không hoàn thành lại ngày đã qua', async () => {
    const source = new DemoDataSource();
    const userId = `audit-${Math.random()}`;
    await source.advanceJourneyDay(userId, 1);
    expect(await source.advanceJourneyDay(userId, 3)).toMatchObject({ hasAdvanced: false, currentDay: 2 });
    expect(await source.advanceJourneyDay(userId, 1)).toMatchObject({ hasAdvanced: false, currentDay: 2 });
  });
});
