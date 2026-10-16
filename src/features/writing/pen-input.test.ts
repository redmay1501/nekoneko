import { describe, expect, it } from 'vitest';
import { decidePointer, isLikelyPalmStroke, isPenOnly, RECENT_PALM_MS } from './pen-input';
import { EMPTY_INK, inkReducer } from './ink';

const base = { mode: 'auto' as const, penSeen: false, activePointerType: null };

describe('chống tì tay khi viết bằng bút', () => {
  it('chưa dùng bút: tay, chuột, bút đều viết được', () => {
    expect(decidePointer({ ...base, pointerType: 'touch' })).toBe('start');
    expect(decidePointer({ ...base, pointerType: 'mouse' })).toBe('start');
    expect(decidePointer({ ...base, pointerType: 'pen' })).toBe('start');
  });
  it('đã dùng bút (auto): chạm tay bị bỏ qua, bút và chuột vẫn viết', () => {
    expect(decidePointer({ ...base, penSeen: true, pointerType: 'touch' })).toBe('ignore');
    expect(decidePointer({ ...base, penSeen: true, pointerType: 'pen' })).toBe('start');
    expect(decidePointer({ ...base, penSeen: true, pointerType: 'mouse' })).toBe('start');
  });
  it('lòng bàn tay chạm trước, bút chạm sau → huỷ nét của tay, nhường bút', () => {
    expect(decidePointer({ ...base, pointerType: 'pen', activePointerType: 'touch' })).toBe('replace');
  });
  it('đang vẽ bằng bút: chạm tay thứ hai / ngón khác bị bỏ qua', () => {
    expect(decidePointer({ ...base, penSeen: true, pointerType: 'touch', activePointerType: 'pen' })).toBe('ignore');
    expect(decidePointer({ ...base, mode: 'all', penSeen: true, pointerType: 'touch', activePointerType: 'pen' })).toBe('ignore');
  });
  it('chế độ "Chỉ nhận bút": tay không bao giờ vẽ; "Nhận cả tay": tay luôn vẽ', () => {
    expect(decidePointer({ ...base, mode: 'pen', pointerType: 'touch' })).toBe('ignore');
    expect(decidePointer({ ...base, mode: 'all', penSeen: true, pointerType: 'touch' })).toBe('start');
    expect(decidePointer({ ...base, mode: 'all', pointerType: 'pen', activePointerType: 'touch' })).toBe('ignore');
  });
  it('isPenOnly', () => {
    expect(isPenOnly({ mode: 'auto', penSeen: false })).toBe(false);
    expect(isPenOnly({ mode: 'auto', penSeen: true })).toBe(true);
    expect(isPenOnly({ mode: 'all', penSeen: true })).toBe(false);
    expect(isPenOnly({ mode: 'pen', penSeen: false })).toBe(true);
  });
});

describe('vùng chạm lớn và vệt lòng bàn tay', () => {
  it('chưa thấy bút: vùng chạm to như lòng bàn tay bị bỏ qua, đầu ngón vẫn viết', () => {
    expect(decidePointer({ ...base, pointerType: 'touch', contactWidth: 140, contactHeight: 110 })).toBe('ignore');
    expect(decidePointer({ ...base, pointerType: 'touch', contactWidth: 44, contactHeight: 44 })).toBe('start');
    expect(decidePointer({ ...base, pointerType: 'touch' })).toBe('start');
  });
  it('"Nhận cả bút và tay": vùng chạm lớn vẫn vẽ (người học chủ động chọn)', () => {
    expect(decidePointer({ ...base, mode: 'all', pointerType: 'touch', contactWidth: 140 })).toBe('start');
  });
  it('bút xuất hiện → xoá nét tay vừa vẽ trong RECENT_PALM_MS, giữ nét cũ hơn và nét bút / chuột', () => {
    const now = 100_000;
    const stroke = (pointerType: string, ago: number) => ({ cellId: 'a', points: [[0.1, 0.1], [0.2, 0.2]] as Array<readonly [number, number]>, pointerType, at: now - ago });
    let state = EMPTY_INK;
    for (const item of [stroke('touch', RECENT_PALM_MS + 2000), stroke('mouse', 500), stroke('touch', 800), stroke('pen', 100)]) state = inkReducer(state, { type: 'add', stroke: item });
    const cleaned = inkReducer(state, { type: 'remove', shouldRemove: (item) => isLikelyPalmStroke(item, now) });
    expect(cleaned.strokes.map((item) => item.pointerType)).toEqual(['touch', 'mouse', 'pen']);
  });
});

describe('chỉ nhận bút: danh sách cho phép', () => {
  it('loại chạm lạ (rỗng, không rõ) cũng bị bỏ qua khi đã dùng bút; bút và chuột vẫn viết', () => {
    expect(decidePointer({ ...base, penSeen: true, pointerType: '' })).toBe('ignore');
    expect(decidePointer({ ...base, mode: 'pen', pointerType: 'unknown' })).toBe('ignore');
    expect(decidePointer({ ...base, penSeen: true, pointerType: 'pen' })).toBe('start');
    expect(decidePointer({ ...base, penSeen: true, pointerType: 'mouse' })).toBe('start');
  });
});
