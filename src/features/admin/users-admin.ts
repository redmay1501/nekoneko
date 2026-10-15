import 'server-only';
import { createClient, type User } from '@supabase/supabase-js';
import { isSupabaseConfigured, publicEnv } from '@/config/env';
import { ActionRejectedError, NotFoundError } from '@/lib/api/errors';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import type { AdminUser } from './admin-access';
import { writeAuditLog } from './audit-log';
import { foldSearch } from './content-entities';
import { checkDeleteUser, checkLockUser, isBanned, LOCK_DURATION } from './user-rules';

/**
 * Quản lý tài khoản bằng Supabase Auth Admin API (service role, chỉ ở server).
 * Mật khẩu: admin KHÔNG đặt hay xem mật khẩu — chỉ gửi email đặt lại qua luồng của Supabase.
 * Nhật ký không ghi token, liên kết hay mật khẩu.
 */

export interface AdminUserSummary {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
  lastSignInAt: string | null;
  emailConfirmedAt: string | null;
  bannedUntil: string | null;
  isLocked: boolean;
  providers: string[];
  roles: string[];
  currentDay: number | null;
}

export interface AdminUserDetail extends AdminUserSummary {
  startDate: string | null;
  journeyCompletedAt: string | null;
  counts: { memoryItems: number; sessions: number; reviewEvents: number; completedDays: number };
}

type ProfileLite = { id: string; display_name: string; current_day: number; start_date: string; journey_completed_at: string | null };

async function allAuthUsers(): Promise<User[]> {
  const client = createAdminSupabaseClient();
  const users: User[] = [];
  for (let page = 1; page <= 50; page += 1) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(`Supabase Auth: danh sách tài khoản — ${error.message}`);
    users.push(...data.users);
    if (data.users.length < 200) break;
  }
  return users;
}

function summarize(user: User, profile: ProfileLite | undefined, roles: string[]): AdminUserSummary {
  const bannedUntil = (user as User & { banned_until?: string | null }).banned_until ?? null;
  return {
    id: user.id, email: user.email ?? '', displayName: profile?.display_name ?? String(user.user_metadata?.display_name ?? ''),
    createdAt: user.created_at, lastSignInAt: user.last_sign_in_at ?? null, emailConfirmedAt: user.email_confirmed_at ?? null,
    bannedUntil, isLocked: isBanned(bannedUntil),
    providers: (user.app_metadata?.providers as string[] | undefined) ?? (user.app_metadata?.provider ? [String(user.app_metadata.provider)] : []),
    roles, currentDay: profile?.current_day ?? null,
  };
}

export interface UserListResult {
  users: AdminUserSummary[];
  total: number;
  page: number;
  pageCount: number;
}

/** Mọi tài khoản (đã ghép hồ sơ + vai trò), mới nhất trước. */
export async function loadAllAdminUsers(): Promise<AdminUserSummary[]> {
  if (!isSupabaseConfigured()) return [];
  const client = createAdminSupabaseClient();
  const [users, profiles, roles] = await Promise.all([
    allAuthUsers(),
    client.from('profiles').select('id, display_name, current_day, start_date, journey_completed_at'),
    client.from('app_roles').select('user_id, role'),
  ]);
  if (profiles.error) throw new Error(`Supabase: đọc hồ sơ — ${profiles.error.message}`);
  if (roles.error) throw new Error(`Supabase: đọc vai trò — ${roles.error.message}`);
  const profileById = new Map((profiles.data as ProfileLite[]).map((row) => [row.id, row]));
  const rolesById = new Map<string, string[]>();
  for (const row of roles.data as Array<{ user_id: string; role: string }>) rolesById.set(row.user_id, [...(rolesById.get(row.user_id) ?? []), row.role]);
  return users.map((user) => summarize(user, profileById.get(user.id), rolesById.get(user.id) ?? []))
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export function matchesUserState(user: AdminUserSummary, state: string | undefined): boolean {
  switch (state) {
    case 'unconfirmed': return !user.emailConfirmedAt;
    case 'locked': return user.isLocked;
    case 'admin': return user.roles.includes('admin');
    default: return true;
  }
}

export async function listAdminUsers(filters: { q?: string; page?: number; state?: string } = {}): Promise<UserListResult> {
  const query = foldSearch(filters.q ?? '');
  const all = (await loadAllAdminUsers())
    .filter((user) => !query || foldSearch(`${user.email} ${user.displayName} ${user.id}`).includes(query))
    .filter((user) => matchesUserState(user, filters.state));
  const pageSize = 25;
  const pageCount = Math.max(1, Math.ceil(all.length / pageSize));
  const page = Math.min(Math.max(filters.page ?? 1, 1), pageCount);
  return { users: all.slice((page - 1) * pageSize, page * pageSize), total: all.length, page, pageCount };
}

async function headCount(table: string, column: string, userId: string): Promise<number> {
  const { count, error } = await createAdminSupabaseClient().from(table).select('*', { head: true, count: 'exact' }).eq(column, userId);
  if (error) throw new Error(`Supabase: đếm ${table} — ${error.message}`);
  return count ?? 0;
}

async function authUser(userId: string): Promise<User> {
  const { data, error } = await createAdminSupabaseClient().auth.admin.getUserById(userId);
  if (error || !data.user) throw new NotFoundError(`user ${userId}`);
  return data.user;
}

export async function getAdminUserDetail(userId: string): Promise<AdminUserDetail> {
  const client = createAdminSupabaseClient();
  const [user, profile, roles, memoryItems, sessions, reviewEvents, completedDays] = await Promise.all([
    authUser(userId),
    client.from('profiles').select('id, display_name, current_day, start_date, journey_completed_at').eq('id', userId).maybeSingle(),
    client.from('app_roles').select('role').eq('user_id', userId),
    headCount('memory_items', 'user_id', userId),
    headCount('learning_sessions', 'user_id', userId),
    headCount('review_events', 'user_id', userId),
    headCount('journey_day_completions', 'user_id', userId),
  ]);
  const profileRow = (profile.data as ProfileLite | null) ?? undefined;
  return {
    ...summarize(user, profileRow, ((roles.data ?? []) as Array<{ role: string }>).map((row) => row.role)),
    startDate: profileRow?.start_date ?? null, journeyCompletedAt: profileRow?.journey_completed_at ?? null,
    counts: { memoryItems, sessions, reviewEvents, completedDays },
  };
}

/** Client anon, luồng implicit: liên kết trong email mang phiên về trang đặt lại mật khẩu (không cần mã PKCE của trình duyệt admin). */
function emailClient() {
  return createClient(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, flowType: 'implicit' },
  });
}

function rejectEmailError(error: { status?: number; message: string }): never {
  if (error.status === 429) throw new ActionRejectedError('Supabase đang giới hạn số email gửi đi (rate limit). Đợi một lúc rồi thử lại.', 503);
  throw new ActionRejectedError(`Supabase không gửi được email: ${error.message}`, 503);
}

export async function sendPasswordReset(admin: AdminUser, userId: string, origin: string): Promise<{ email: string }> {
  const user = await authUser(userId);
  if (!user.email) throw new ActionRejectedError('Tài khoản này không có email.', 422);
  const { error } = await emailClient().auth.resetPasswordForEmail(user.email, { redirectTo: `${origin}/dat-lai-mat-khau` });
  if (error) rejectEmailError(error);
  await writeAuditLog(admin, { action: 'user.reset_password_email', targetType: 'user', targetId: userId, detail: { email: user.email } });
  return { email: user.email };
}

export async function resendVerification(admin: AdminUser, userId: string, origin: string): Promise<{ email: string }> {
  const user = await authUser(userId);
  if (!user.email) throw new ActionRejectedError('Tài khoản này không có email.', 422);
  if (user.email_confirmed_at) throw new ActionRejectedError('Email này đã được xác minh rồi.', 409);
  const { error } = await emailClient().auth.resend({ type: 'signup', email: user.email, options: { emailRedirectTo: `${origin}/auth/callback` } });
  if (error) rejectEmailError(error);
  await writeAuditLog(admin, { action: 'user.resend_verification', targetType: 'user', targetId: userId, detail: { email: user.email } });
  return { email: user.email };
}

export async function setUserLocked(admin: AdminUser, userId: string, locked: boolean): Promise<void> {
  const detail = await getAdminUserDetail(userId);
  const allowed = checkLockUser(admin.userId, detail, locked);
  if (!allowed.ok) throw new ActionRejectedError(allowed.reason, 409);
  const { error } = await createAdminSupabaseClient().auth.admin.updateUserById(userId, { ban_duration: locked ? LOCK_DURATION : 'none' });
  if (error) throw new Error(`Supabase Auth: ${locked ? 'khoá' : 'mở khoá'} — ${error.message}`);
  await writeAuditLog(admin, { action: locked ? 'user.lock' : 'user.unlock', targetType: 'user', targetId: userId, detail: { email: detail.email } });
}

/**
 * Xoá hẳn tài khoản. Bảng hồ sơ / trí nhớ / phiên học có on delete cascade theo auth.users → mất toàn bộ dữ liệu học
 * của người này — vì vậy form bắt gõ lại đúng email, và server kiểm tra lại (không tin form).
 */
export async function deleteAdminUser(admin: AdminUser, userId: string, confirmEmail: string): Promise<void> {
  const detail = await getAdminUserDetail(userId);
  const allowed = checkDeleteUser(admin.userId, detail, confirmEmail);
  if (!allowed.ok) throw new ActionRejectedError(allowed.reason, 409);
  const { error } = await createAdminSupabaseClient().auth.admin.deleteUser(userId);
  if (error) throw new Error(`Supabase Auth: xoá tài khoản — ${error.message}`);
  await writeAuditLog(admin, {
    action: 'user.delete', targetType: 'user', targetId: userId,
    detail: { email: detail.email, createdAt: detail.createdAt, counts: detail.counts, currentDay: detail.currentDay },
  });
}
