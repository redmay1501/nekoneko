/**
 * Quyết định quyền vào /admin — hàm thuần, không đọc cookie hay database (dễ kiểm thử).
 * Nguồn sự thật là bảng app_roles (chỉ service_role ghi được — người dùng không thể tự cấp quyền).
 * Không có email admin nào được viết cứng trong mã.
 */
export const ADMIN_ROLE = 'admin';

export interface AdminUser {
  userId: string;
  email: string | null;
  /** Chế độ demo (không có Supabase, chỉ trên máy dev): xem bằng dữ liệu mẫu, mọi thao tác ghi bị chặn. */
  isDemo: boolean;
}

export type AdminAccess =
  | { kind: 'admin'; admin: AdminUser }
  | { kind: 'unauthenticated' }
  | { kind: 'forbidden'; reason: 'not-admin' | 'banned' | 'demo-in-production' };

export interface VerifiedUser {
  id: string;
  email?: string | null;
  bannedUntil?: string | null;
}

export function decideAdminAccess(user: VerifiedUser | null, roles: readonly string[], now: Date = new Date()): AdminAccess {
  if (!user) return { kind: 'unauthenticated' };
  if (user.bannedUntil && new Date(user.bannedUntil).getTime() > now.getTime()) return { kind: 'forbidden', reason: 'banned' };
  if (!roles.includes(ADMIN_ROLE)) return { kind: 'forbidden', reason: 'not-admin' };
  return { kind: 'admin', admin: { userId: user.id, email: user.email ?? null, isDemo: false } };
}

/** Demo chỉ mở trên máy dev; bản production luôn có Supabase — nếu thiếu cấu hình thì đóng hẳn, không mở cửa demo. */
export function decideDemoAccess(nodeEnvironment: string | undefined, demoUserId: string): AdminAccess {
  if (nodeEnvironment === 'production') return { kind: 'forbidden', reason: 'demo-in-production' };
  return { kind: 'admin', admin: { userId: demoUserId, email: null, isDemo: true } };
}
