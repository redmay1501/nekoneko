import { describe, expect, it } from 'vitest';
import { EMPTY_INK, inkReducer, normalizePoint, shouldAddPoint, strokePath } from './ink';

const stroke = (cellId: string, x = 0.5) => ({ cellId, points: [[x, 0.1], [x, 0.9]] as Array<readonly [number, number]> });

describe('inkReducer', () => {
  it('thêm nét, hoàn tác, làm lại', () => {
    let state = inkReducer(EMPTY_INK, { type: 'add', stroke: stroke('a') });
    state = inkReducer(state, { type: 'add', stroke: stroke('b') });
    state = inkReducer(state, { type: 'undo' });
    expect(state.strokes.map((item) => item.cellId)).toEqual(['a']);
    state = inkReducer(state, { type: 'redo' });
    expect(state.strokes.map((item) => item.cellId)).toEqual(['a', 'b']);
  });
  it('viết nét mới sau khi hoàn tác thì không làm lại được nét cũ', () => {
    let state = inkReducer(EMPTY_INK, { type: 'add', stroke: stroke('a') });
    state = inkReducer(state, { type: 'undo' });
    state = inkReducer(state, { type: 'add', stroke: stroke('c') });
    expect(inkReducer(state, { type: 'redo' })).toBe(state);
  });
  it('xoá một ô chỉ xoá nét của ô đó; xoá trang xoá hết', () => {
    let state = inkReducer(EMPTY_INK, { type: 'add', stroke: stroke('a') });
    state = inkReducer(state, { type: 'add', stroke: stroke('b') });
    state = inkReducer(state, { type: 'add', stroke: stroke('a', 0.3) });
    expect(inkReducer(state, { type: 'clear-cell', cellId: 'a' }).strokes.map((item) => item.cellId)).toEqual(['b']);
    expect(inkReducer(state, { type: 'clear-all' }).strokes).toEqual([]);
  });
  it('Xoá hết rồi Hoàn tác → cả trang trở lại; viết nét mới thì không lấy lại được nữa', () => {
    let state = inkReducer(EMPTY_INK, { type: 'add', stroke: stroke('a') });
    state = inkReducer(state, { type: 'add', stroke: stroke('b') });
    const cleared = inkReducer(state, { type: 'clear-all' });
    expect(cleared.strokes).toEqual([]);
    expect(inkReducer(cleared, { type: 'undo' }).strokes.map((item) => item.cellId)).toEqual(['a', 'b']);
    const rewritten = inkReducer(cleared, { type: 'add', stroke: stroke('c') });
    expect(inkReducer(inkReducer(rewritten, { type: 'undo' }), { type: 'undo' }).strokes).toEqual([]);
  });
  it('hoàn tác khi chưa có nét → không đổi; nét rỗng bị bỏ', () => {
    expect(inkReducer(EMPTY_INK, { type: 'undo' })).toBe(EMPTY_INK);
    expect(inkReducer(EMPTY_INK, { type: 'add', stroke: { cellId: 'a', points: [] } })).toBe(EMPTY_INK);
  });
});

describe('toạ độ không lệch khi đổi cỡ / cuộn', () => {
  it('cùng vị trí tương đối trong ô → cùng toạ độ chuẩn hoá, bất kể ô to nhỏ hay đã cuộn', () => {
    const small = normalizePoint(110, 230, { left: 100, top: 200, width: 40, height: 40 });
    const scrolled = normalizePoint(125, -925, { left: 100, top: -1000, width: 100, height: 100 });
    expect(small).toEqual([0.25, 0.75]);
    expect(scrolled).toEqual([0.25, 0.75]);
  });
  it('kẹp trong ô khi con trỏ trượt ra ngoài', () => {
    expect(normalizePoint(0, 1000, { left: 100, top: 100, width: 50, height: 50 })).toEqual([0, 1]);
  });
  it('vẽ lại theo cỡ hiện tại', () => {
    expect(strokePath([[0.1, 0.2], [0.5, 0.5], [0.9, 0.8]], 100)).toBe('M10 20Q50 50 70 65L90 80');
    expect(strokePath([[0.5, 0.5]], 100)).toBe('M50 50l0.01 0');
    expect(strokePath([])).toBe('');
  });
  it('bỏ điểm rung quá sát', () => {
    expect(shouldAddPoint([0.5, 0.5], [0.501, 0.5])).toBe(false);
    expect(shouldAddPoint([0.5, 0.5], [0.52, 0.5])).toBe(true);
  });
});
