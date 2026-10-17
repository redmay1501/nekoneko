import { describe, expect, it } from 'vitest';
import { stageOfDay, stageProgress, JOURNEY_STAGES } from './journey';
import { buildJourneyMapLayout } from './journey-map-layout';

describe('chặng đường', () => {
  it('bốn chặng nối liền nhau từ 1 tới 90', () => {
    expect(JOURNEY_STAGES[0].from).toBe(1);
    expect(JOURNEY_STAGES.at(-1)?.to).toBe(90);
    expect(stageOfDay(14).name).toBe('Bảng chữ cái');
    expect(stageOfDay(15).name).toBe('Bộ thủ');
    expect(stageOfDay(17).name).toBe('Bộ thủ');
    expect(stageOfDay(18).name).toBe('Giáo trình');
    expect(stageOfDay(81).name).toBe('Giáo trình');
    expect(stageOfDay(82).name).toBe('Chinh phục N5');
    JOURNEY_STAGES.slice(1).forEach((stage, index) => expect(stage.from).toBe(JOURNEY_STAGES[index].to + 1));
  });
  it('tiến độ chặng tính đúng', () => {
    expect(stageProgress(JOURNEY_STAGES[2], 23)).toEqual({ done: 6, total: 64 });
    expect(stageProgress(JOURNEY_STAGES[1], 23)).toEqual({ done: 3, total: 3 });
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
