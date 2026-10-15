/** Quy tắc thao tác trên tài khoản — hàm thuần, server dùng để kiểm tra lại mọi yêu cầu. */
export const LOCK_DURATION = '876000h'; // ~100 năm: Supabase Auth không có "khoá vĩnh viễn", dùng ban_duration rất dài.

export function isBanned(bannedUntil: string | null | undefined, now: Date = new Date()): boolean {
  return Boolean(bannedUntil && new Date(bannedUntil).getTime() > now.getTime());
}

interface TargetUser {
  id: string;
  email: string;
  roles: string[];
  isLocked: boolean;
}

type RuleResult = { ok: true } | { ok: false; reason: string };

export function checkLockUser(actorId: string, target: TargetUser, locked: boolean): RuleResult {
  if (target.id === actorId) return { ok: false, reason: 'Không thể tự khoá tài khoản của chính mình.' };
  if (locked && target.roles.includes('admin')) return { ok: false, reason: 'Đây là tài khoản admin — gỡ quyền admin (npm run admin:grant -- <email> --revoke) trước khi khoá.' };
  if (locked === target.isLocked) return { ok: false, reason: locked ? 'Tài khoản đã bị khoá.' : 'Tài khoản đang không bị khoá.' };
  return { ok: true };
}

export function checkDeleteUser(actorId: string, target: TargetUser, confirmEmail: string): RuleResult {
  if (target.id === actorId) return { ok: false, reason: 'Không thể tự xoá tài khoản của chính mình.' };
  if (target.roles.includes('admin')) return { ok: false, reason: 'Đây là tài khoản admin — gỡ quyền admin trước khi xoá.' };
  if (!target.email || confirmEmail.trim().toLowerCase() !== target.email.toLowerCase()) {
    return { ok: false, reason: 'Email xác nhận không khớp — chưa xoá gì cả.' };
  }
  return { ok: true };
}
