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
