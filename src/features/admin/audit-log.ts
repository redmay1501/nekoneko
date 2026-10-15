import 'server-only';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/utils/logger';
import type { AdminUser } from './admin-access';
import { getAdminSchema } from './admin-schema';
import { sanitizeAuditDetail } from './audit-detail';

export interface AuditEntry {
  action: string;
  targetType?: string;
  targetId?: string | number;
  detail?: Record<string, unknown>;
}

/**
 * Ghi nhật ký thao tác admin (bảng admin_audit_log, chỉ service_role đọc / ghi).
 * Chưa áp dụng migration → chỉ ghi log server, không làm hỏng thao tác chính.
 * Chi tiết được lọc bỏ mọi khoá có tên giống bí mật (password, token, key…).
 */
export async function writeAuditLog(admin: AdminUser, entry: AuditEntry): Promise<void> {
  if (admin.isDemo) return;
  const schema = await getAdminSchema();
  const row = {
    actor_id: admin.userId, actor_email: admin.email ?? '', action: entry.action,
    target_type: entry.targetType ?? '', target_id: entry.targetId === undefined ? '' : String(entry.targetId),
    detail: sanitizeAuditDetail(entry.detail ?? {}),
  };
  if (!schema.admin_audit_log) {
    logger.warn('admin: chưa có bảng admin_audit_log — nhật ký chỉ ghi ở log server', { action: row.action, target: `${row.target_type}:${row.target_id}` });
    return;
  }
  const { error } = await createAdminSupabaseClient().from('admin_audit_log').insert(row);
  if (error) logger.error('admin: không ghi được nhật ký', error, { action: row.action });
}
