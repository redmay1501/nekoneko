import { describe, expect, it, vi } from 'vitest';

vi.mock('next/link', () => ({ default: () => null }));
const { starsOf } = await import('./MatchGame');

describe('chấm 1–5 sao theo độ chính xác', () => {
  it.each([[100, 5], [95, 4], [90, 4], [80, 3], [75, 3], [60, 2], [50, 2], [49, 1], [10, 1]])('%i%% → %i sao', (accuracy, stars) => {
    expect(starsOf(accuracy)).toBe(stars);
  });
});
