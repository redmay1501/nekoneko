import { describe, expect, it } from 'vitest';
import { decideAdminAccess, decideDemoAccess } from './admin-access';

const user = { id: 'u1', email: 'a@example.com' };

describe('decideAdminAccess', () => {
  it('chưa đăng nhập → unauthenticated', () => {
    expect(decideAdminAccess(null, ['admin'])).toEqual({ kind: 'unauthenticated' });
  });
  it('người học thường → forbidden', () => {
    expect(decideAdminAccess(user, ['learner'])).toMatchObject({ kind: 'forbidden', reason: 'not-admin' });
    expect(decideAdminAccess(user, [])).toMatchObject({ kind: 'forbidden', reason: 'not-admin' });
  });
  it('editor chưa đủ quyền admin', () => {
    expect(decideAdminAccess(user, ['editor'])).toMatchObject({ kind: 'forbidden' });
  });
  it('có vai trò admin → admin', () => {
    expect(decideAdminAccess(user, ['learner', 'admin'])).toEqual({ kind: 'admin', admin: { userId: 'u1', email: 'a@example.com', isDemo: false } });
  });
  it('admin đang bị khoá → forbidden', () => {
    const now = new Date('2026-10-16T00:00:00Z');
    expect(decideAdminAccess({ ...user, bannedUntil: '2126-01-01T00:00:00Z' }, ['admin'], now)).toMatchObject({ kind: 'forbidden', reason: 'banned' });
    expect(decideAdminAccess({ ...user, bannedUntil: '2026-01-01T00:00:00Z' }, ['admin'], now)).toMatchObject({ kind: 'admin' });
  });
});

describe('decideDemoAccess', () => {
  it('production thiếu Supabase → đóng, không mở demo', () => {
    expect(decideDemoAccess('production', 'demo')).toMatchObject({ kind: 'forbidden', reason: 'demo-in-production' });
  });
  it('máy dev → admin chỉ xem', () => {
    expect(decideDemoAccess('development', 'demo')).toMatchObject({ kind: 'admin', admin: { isDemo: true } });
  });
});
