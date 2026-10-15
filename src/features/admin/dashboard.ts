import 'server-only';
import { isSupabaseConfigured } from '@/config/env';
import { ALL_LISTENING_VIDEOS } from '@/features/listening/video-library';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { getAdminSchema } from './admin-schema';
import { loadAdminContent, loadEntityRecords } from './content-admin';
import { ADMIN_ENTITIES, type AdminEntity, type ContentStatus } from './content-entities';
import { runQualityChecks } from './quality-checks';
import { auditRoadmap } from './roadmap-audit';
import { loadAllAdminUsers, matchesUserState } from './users-admin';

export interface AuditLogRow {
  id: number;
  actor_email: string;
  action: string;
  target_type: string;
  target_id: string;
  detail: Record<string, unknown>;
  created_at: string;
}

/** Số liệu THẬT cho Dashboard — đếm từ database / tệp nội dung, không có số ước lượng. */
export async function loadDashboard() {
  const schema = await getAdminSchema();
  const [records, content] = await Promise.all([
    Promise.all(ADMIN_ENTITIES.map(async (entity) => [entity, await loadEntityRecords(entity)] as const)),
    loadAdminContent(),
  ]);
  const contentStats = Object.fromEntries(records.map(([entity, rows]) => {
    const byStatus = { draft: 0, review: 0, published: 0, archived: 0 } as Record<ContentStatus, number>;
    for (const row of rows) byStatus[row.status] += 1;
    return [entity, { total: rows.length, byStatus, withImage: rows.filter((row) => row.hasImage).length }];
  })) as Record<AdminEntity, { total: number; byStatus: Record<ContentStatus, number>; withImage: number }>;

  const roadmap = auditRoadmap(content);
  const issues = runQualityChecks(content, ALL_LISTENING_VIDEOS);
  const videos = { total: ALL_LISTENING_VIDEOS.length, published: ALL_LISTENING_VIDEOS.filter((video) => video.status === 'published').length };

  let users: { total: number; unconfirmed: number; locked: number; admins: number } | null = null;
  let mediaCount: number | null = null;
  let recentLogs: AuditLogRow[] = [];
  if (isSupabaseConfigured()) {
    const all = await loadAllAdminUsers();
    const count = (state: string) => all.filter((user) => matchesUserState(user, state)).length;
    users = { total: all.length, unconfirmed: count('unconfirmed'), locked: count('locked'), admins: count('admin') };
    const client = createAdminSupabaseClient();
    if (schema.media_assets) {
      const { count } = await client.from('media_assets').select('id', { head: true, count: 'exact' });
      mediaCount = count ?? 0;
    }
    if (schema.admin_audit_log) {
      const { data } = await client.from('admin_audit_log').select('*').order('created_at', { ascending: false }).limit(8);
      recentLogs = (data ?? []) as AuditLogRow[];
    }
  }
  return {
    schema, contentStats, users, mediaCount, recentLogs, videos,
    readingPassages: content.readingPassages.length,
    journeyDays: content.journeyDays.length,
    daysWithGaps: roadmap.days.filter((day) => day.missing.length).length,
    duplicates: roadmap.duplicates.length,
    issues: { errors: issues.filter((issue) => issue.severity === 'error').length, warnings: issues.filter((issue) => issue.severity === 'warning').length },
  };
}
