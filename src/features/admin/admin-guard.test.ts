import { beforeEach, describe, expect, it, vi } from 'vitest';

/** Lớp guard thật (admin-guard.ts) với Supabase giả: người học thường bị chặn ở API và trang. */
const state = vi.hoisted(() => ({ user: null as null | { id: string; email: string; banned_until?: string }, roles: [] as string[] }));

vi.mock('@/config/env', () => ({ isSupabaseConfigured: () => true, publicEnv: { supabaseUrl: 'https://x', supabaseAnonKey: 'anon' } }));
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: async () => ({ auth: { getUser: async () => ({ data: { user: state.user }, error: state.user ? null : { message: 'no session' } }) } }),
}));
vi.mock('@/lib/supabase/admin', () => ({
  createAdminSupabaseClient: () => ({
    from: () => ({ select: () => ({ eq: async () => ({ data: state.roles.map((role) => ({ role })), error: null }) }) }),
  }),
}));
vi.mock('next/navigation', () => ({
  notFound: () => { throw new Error('NEXT_NOT_FOUND'); },
  redirect: (url: string) => { throw new Error(`NEXT_REDIRECT ${url}`); },
}));
vi.mock('react', async (original) => ({ ...(await original<typeof import('react')>()), cache: <T>(fn: T) => fn }));

const { requireAdminApi, requireAdminPage, requireAdminWriter } = await import('./admin-guard');
const { ForbiddenError, UnauthenticatedError } = await import('@/lib/api/errors');

describe('admin guard (server)', () => {
  beforeEach(() => { state.user = null; state.roles = []; });

  it('chưa đăng nhập: API → 401, trang → chuyển về đăng nhập', async () => {
    await expect(requireAdminApi()).rejects.toBeInstanceOf(UnauthenticatedError);
    await expect(requireAdminPage()).rejects.toThrow('NEXT_REDIRECT /dang-nhap?tiep=/admin');
  });
  it('người học thường: API → 403, trang → 404', async () => {
    state.user = { id: 'u1', email: 'learner@example.com' };
    state.roles = ['learner'];
    await expect(requireAdminApi()).rejects.toBeInstanceOf(ForbiddenError);
    await expect(requireAdminWriter()).rejects.toBeInstanceOf(ForbiddenError);
    await expect(requireAdminPage()).rejects.toThrow('NEXT_NOT_FOUND');
  });
  it('admin bị khoá → 403', async () => {
    state.user = { id: 'u1', email: 'a@example.com', banned_until: '2126-01-01T00:00:00Z' };
    state.roles = ['admin'];
    await expect(requireAdminApi()).rejects.toBeInstanceOf(ForbiddenError);
  });
  it('admin → qua', async () => {
    state.user = { id: 'u1', email: 'a@example.com' };
    state.roles = ['admin'];
    await expect(requireAdminWriter()).resolves.toMatchObject({ userId: 'u1', isDemo: false });
  });
});
