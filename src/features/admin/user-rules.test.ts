import { describe, expect, it } from 'vitest';
import { checkDeleteUser, checkLockUser, isBanned } from './user-rules';

const learner = { id: 'u2', email: 'learner@example.com', roles: ['learner'], isLocked: false };

describe('checkDeleteUser', () => {
  it('cần gõ đúng email (không phân biệt hoa thường)', () => {
    expect(checkDeleteUser('admin', learner, 'sai@example.com')).toMatchObject({ ok: false });
    expect(checkDeleteUser('admin', learner, '')).toMatchObject({ ok: false });
    expect(checkDeleteUser('admin', learner, ' Learner@Example.com ')).toEqual({ ok: true });
  });
  it('không tự xoá chính mình, không xoá admin', () => {
    expect(checkDeleteUser('u2', learner, learner.email)).toMatchObject({ ok: false });
    expect(checkDeleteUser('admin', { ...learner, roles: ['admin'] }, learner.email)).toMatchObject({ ok: false });
  });
});

describe('checkLockUser', () => {
  it('khoá người học thường → ok; không tự khoá; không khoá admin', () => {
    expect(checkLockUser('admin', learner, true)).toEqual({ ok: true });
    expect(checkLockUser('u2', learner, true)).toMatchObject({ ok: false });
    expect(checkLockUser('admin', { ...learner, roles: ['admin'] }, true)).toMatchObject({ ok: false });
  });
  it('mở khoá tài khoản đang khoá → ok; mở khoá tài khoản không khoá → từ chối', () => {
    expect(checkLockUser('admin', { ...learner, isLocked: true }, false)).toEqual({ ok: true });
    expect(checkLockUser('admin', learner, false)).toMatchObject({ ok: false });
  });
});

describe('isBanned', () => {
  const now = new Date('2026-10-16T00:00:00Z');
  it('so với thời điểm hiện tại', () => {
    expect(isBanned(null, now)).toBe(false);
    expect(isBanned('2026-10-15T00:00:00Z', now)).toBe(false);
    expect(isBanned('2126-10-15T00:00:00Z', now)).toBe(true);
  });
});
