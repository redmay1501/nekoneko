import { describe, expect, it } from 'vitest';
import { decidePointer, isPenOnly } from './pen-input';

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
