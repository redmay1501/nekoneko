import { describe, expect, it } from 'vitest';
import { stageOfDay, stageProgress, JOURNEY_STAGES } from './journey';
import { buildJourneyMapLayout } from './journey-map-layout';

describe('chặng đường', () => {
  it('bốn chặng nối liền nhau từ 1 tới 90', () => {
    expect(JOURNEY_STAGES[0].from).toBe(1);
    expect(JOURNEY_STAGES.at(-1)?.to).toBe(90);
    expect(stageOfDay(14).name).toBe('Bảng chữ cái');
    expect(stageOfDay(15).name).toBe('Nền tảng');
    expect(stageOfDay(78).name).toBe('Chinh phục N5');
  });
  it('tiến độ chặng tính đúng', () => {
    expect(stageProgress(JOURNEY_STAGES[1], 23)).toEqual({ done: 9, total: 31 });
  });
});

describe('buildJourneyMapLayout', () => {
  it('có đủ 90 chấm, đúng một chấm hôm nay', () => {
    const layout = buildJourneyMapLayout(23);
    expect(layout.nodes).toHaveLength(90);
    expect(layout.nodes.filter((node) => node.state === 'today').map((node) => node.day)).toEqual([23]);
    expect(layout.nodes.filter((node) => node.state === 'done')).toHaveLength(22);
  });
});

describe('trạng thái ngày trên bản đồ (audit hoàn thành ngày)', () => {
  it('ngày chỉ "đã qua" khi currentDay vượt qua nó — không theo ngày lịch; ngày còn học bù hiện partial', async () => {
    const { buildJourneyMapLayout, NODE_RADIUS } = await import('./journey-map-layout');
    const layout = buildJourneyMapLayout(3, false, (day) => day !== 2);
    const state = (day: number) => layout.nodes[day - 1].state;
    expect([state(1), state(2), state(3), state(4)]).toEqual(['done', 'partial', 'today', 'upcoming']);
    // Không có thông tin học bù → giữ cách cũ (mọi ngày đã qua là done).
    expect(buildJourneyMapLayout(3).nodes[1].state).toBe('done');
    // Xong cả lộ trình → không ngày nào là "hôm nay".
    expect(buildJourneyMapLayout(90, true).nodes.every((node) => node.state === 'done')).toBe(true);
    // Đủ rộng cho số hai chữ số.
    expect(Math.min(...layout.nodes.map((node) => node.radius))).toBeGreaterThanOrEqual(NODE_RADIUS.NORMAL);
  });
});
