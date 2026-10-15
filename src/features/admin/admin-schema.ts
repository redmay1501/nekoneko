import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { cache } from 'react';
import { isSupabaseConfigured } from '@/config/env';
import { ActionRejectedError } from '@/lib/api/errors';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

/**
 * Bảng của migration 20261016000001_admin_studio.sql — người dùng tự chạy trong Supabase SQL Editor.
 * Chưa chạy thì tính năng liên quan hiện "cần áp dụng migration" thay vì báo lỗi.
 */
export const ADMIN_MIGRATION_FILE = 'supabase/migrations/20261016000001_admin_studio.sql';
export const ADMIN_TABLES = ['media_assets', 'content_images', 'content_status', 'admin_audit_log'] as const;
export type AdminTable = (typeof ADMIN_TABLES)[number];
export type AdminSchema = Record<AdminTable, boolean>;

export const MEDIA_BUCKET = 'content-media';

/** PostgREST báo bảng chưa có: PGRST205 (không có trong schema cache) hoặc 42P01 (relation does not exist). */
export function isMissingTableError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return error.code === 'PGRST205' || error.code === '42P01' || /does not exist|schema cache/i.test(error.message ?? '');
}

async function tableExists(client: SupabaseClient, table: AdminTable): Promise<boolean> {
  const { error } = await client.from(table).select('*', { head: true, count: 'exact' }).limit(1);
  return !isMissingTableError(error);
}

export const getAdminSchema = cache(async (): Promise<AdminSchema> => {
  if (!isSupabaseConfigured()) return Object.fromEntries(ADMIN_TABLES.map((table) => [table, false])) as AdminSchema;
  const client = createAdminSupabaseClient();
  const flags = await Promise.all(ADMIN_TABLES.map((table) => tableExists(client, table)));
  return Object.fromEntries(ADMIN_TABLES.map((table, index) => [table, flags[index]])) as AdminSchema;
});

export const MIGRATION_REQUIRED_MESSAGE = `Cần áp dụng migration ${ADMIN_MIGRATION_FILE} trong Supabase SQL Editor trước.`;

export async function requireAdminTables(...tables: AdminTable[]): Promise<void> {
  const schema = await getAdminSchema();
  if (tables.some((table) => !schema[table])) throw new ActionRejectedError(MIGRATION_REQUIRED_MESSAGE, 503);
}

export const getMediaBucketStatus = cache(async (): Promise<'ok' | 'missing' | 'not-public' | 'unknown'> => {
  if (!isSupabaseConfigured()) return 'unknown';
  const { data, error } = await createAdminSupabaseClient().storage.getBucket(MEDIA_BUCKET);
  if (error || !data) return 'missing';
  return data.public ? 'ok' : 'not-public';
});
