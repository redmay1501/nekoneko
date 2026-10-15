import 'server-only';
import { notFound, redirect } from 'next/navigation';
import { cache } from 'react';
import { DEMO_LEARNER } from '@/config/demo';
import { isSupabaseConfigured } from '@/config/env';
import { ActionRejectedError, ForbiddenError, UnauthenticatedError } from '@/lib/api/errors';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { type AdminAccess, type AdminUser, decideAdminAccess, decideDemoAccess } from './admin-access';

/**
 * Kiểm tra quyền admin Ở SERVER cho mọi trang và mọi API trong /admin.
 *  - Người dùng: getUser() hỏi thẳng Supabase Auth (không chỉ đọc JWT) → tài khoản đã xoá / phiên bị thu hồi không qua.
 *  - Vai trò: đọc app_roles bằng service role ở server — client không gửi / không sửa được vai trò.
 * Cache trong phạm vi một request.
 */
export const getAdminAccess = cache(async (): Promise<AdminAccess> => {
  if (!isSupabaseConfigured()) return decideDemoAccess(process.env.NODE_ENV, DEMO_LEARNER.userId);
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return { kind: 'unauthenticated' };
  const roles = await createAdminSupabaseClient().from('app_roles').select('role').eq('user_id', data.user.id);
  if (roles.error) {
    logger.error('admin: không đọc được app_roles', roles.error);
    return { kind: 'forbidden', reason: 'not-admin' };
  }
  const user = data.user as typeof data.user & { banned_until?: string | null };
  return decideAdminAccess(
    { id: user.id, email: user.email, bannedUntil: user.banned_until ?? null },
    (roles.data ?? []).map((row: { role: string }) => row.role),
  );
});

/** Trang /admin: chưa đăng nhập → trang đăng nhập; không phải admin → 404 (không để lộ rằng có khu admin). */
export async function requireAdminPage(): Promise<AdminUser> {
  const access = await getAdminAccess();
  if (access.kind === 'unauthenticated') redirect('/dang-nhap?tiep=/admin');
  if (access.kind === 'forbidden') notFound();
  return access.admin;
}

/** API /api/admin/*: 401 khi chưa đăng nhập, 403 khi không phải admin. */
export async function requireAdminApi(): Promise<AdminUser> {
  const access = await getAdminAccess();
  if (access.kind === 'unauthenticated') throw new UnauthenticatedError();
  if (access.kind === 'forbidden') throw new ForbiddenError();
  return access.admin;
}

/** Thao tác ghi: chặn ở chế độ demo (không có database thật để ghi). */
export async function requireAdminWriter(): Promise<AdminUser> {
  const admin = await requireAdminApi();
  if (admin.isDemo) throw new ActionRejectedError('Chế độ demo chỉ để xem — cần Supabase để lưu thay đổi.', 503);
  return admin;
}
