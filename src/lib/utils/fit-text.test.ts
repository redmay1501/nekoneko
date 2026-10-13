import { describe, expect, it } from 'vitest';
import { fitTextStyle, textEmWidth } from './fit-text';

describe('fit text', () => {
  it('đo chữ Nhật toàn khổ rộng hơn chữ Latin', () => {
    expect(textEmWidth('エレベーター')).toBe(6);
    expect(textEmWidth('私')).toBe(1);
    expect(textEmWidth('CD')).toBeCloseTo(1.16);
  });
  it('trả biến CSS kẹp cỡ chữ', () => {
    expect(fitTextStyle('おじいさん / おばあさん', 42, 24)).toEqual({ '--fit-em': '11.18', '--fit-max': '42px', '--fit-min': '24px' });
  });
});
