import 'server-only';
import { randomUUID } from 'node:crypto';
import { revalidateTag } from 'next/cache';
import { isSupabaseConfigured } from '@/config/env';
import { ActionRejectedError } from '@/lib/api/errors';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import type { AdminUser } from './admin-access';
import { MEDIA_BUCKET, requireAdminTables } from './admin-schema';
import { writeAuditLog } from './audit-log';
import { mediaUrl } from './content-admin';
import { ENTITY_CONFIG, type AdminEntity, foldSearch, isAdminEntity } from './content-entities';
import { deleteImage, type MediaAssetRow, type MediaDeps, type UploadFile, uploadImage } from './media-core';

export interface MediaUsage {
  entity: AdminEntity;
  contentId: number;
  title: string;
  altText: string;
}

export interface MediaAssetView extends MediaAssetRow {
  url: string;
  usage: MediaUsage[];
}

function supabaseMediaDeps(): MediaDeps {
  const client = createAdminSupabaseClient();
  const bucket = () => client.storage.from(MEDIA_BUCKET);
  return {
    async storageUpload(path, bytes, mimeType) {
      const { error } = await bucket().upload(path, bytes, { contentType: mimeType, upsert: false, cacheControl: '31536000' });
      return { error: error?.message ?? null };
    },
    async storageRemove(path) {
      const { error } = await bucket().remove([path]);
      return { error: error?.message ?? null };
    },
    async insertAsset(row) {
      const { data, error } = await client.from('media_assets').insert(row).select('*').single();
      return { row: (data as MediaAssetRow | null) ?? null, error: error?.message ?? null };
    },
    async findAsset(id) {
      const { data } = await client.from('media_assets').select('*').eq('id', id).maybeSingle();
      return (data as MediaAssetRow | null) ?? null;
    },
    async countUsage(assetId) {
      const { count, error } = await client.from('content_images').select('content_id', { head: true, count: 'exact' }).eq('asset_id', assetId);
      if (error) throw new Error(`Supabase: đếm chỗ dùng ảnh — ${error.message}`);
      return count ?? 0;
    },
    async deleteAsset(id) {
      const { error } = await client.from('media_assets').delete().eq('id', id);
      // 23503 = vi phạm khoá ngoại: có mục vừa gắn ảnh này (on delete restrict).
      return { error: error?.message ?? null, inUse: error?.code === '23503' };
    },
    newId: () => randomUUID(),
  };
}

/** Tên hiển thị của từng mục đang dùng ảnh (đọc thẳng bảng nội dung). */
async function usageByAsset(assetIds: string[]): Promise<Map<string, MediaUsage[]>> {
  const usage = new Map<string, MediaUsage[]>();
  if (!assetIds.length) return usage;
  const client = createAdminSupabaseClient();
  const { data, error } = await client.from('content_images').select('content_type, content_id, asset_id, alt_text').in('asset_id', assetIds);
  if (error) throw new Error(`Supabase: đọc chỗ dùng ảnh — ${error.message}`);
  const links = (data ?? []) as Array<{ content_type: string; content_id: number; asset_id: string; alt_text: string }>;
  const byEntity = new Map<AdminEntity, number[]>();
  for (const link of links) if (isAdminEntity(link.content_type)) byEntity.set(link.content_type, [...(byEntity.get(link.content_type) ?? []), link.content_id]);
  const titles = new Map<string, string>();
  await Promise.all([...byEntity].map(async ([entity, ids]) => {
    const rows = await client.from(ENTITY_CONFIG[entity].table).select('*').in('id', ids);
    for (const row of (rows.data ?? []) as Array<Record<string, string | number | null> & { id: number }>) {
      titles.set(`${entity}:${row.id}`, ENTITY_CONFIG[entity].title(row));
    }
  }));
  for (const link of links) {
    if (!isAdminEntity(link.content_type)) continue;
    const entry = { entity: link.content_type, contentId: link.content_id, altText: link.alt_text, title: titles.get(`${link.content_type}:${link.content_id}`) ?? `#${link.content_id}` };
    usage.set(link.asset_id, [...(usage.get(link.asset_id) ?? []), entry]);
  }
  return usage;
}

export interface MediaFilters {
  q?: string;
  type?: string;
  used?: 'used' | 'unused' | 'all';
}

export async function listMedia(filters: MediaFilters = {}): Promise<MediaAssetView[]> {
  if (!isSupabaseConfigured()) return [];
  await requireAdminTables('media_assets', 'content_images');
  const { data, error } = await createAdminSupabaseClient().from('media_assets').select('*').order('created_at', { ascending: false }).limit(1000);
  if (error) throw new Error(`Supabase: đọc thư viện ảnh — ${error.message}`);
  const rows = (data ?? []) as MediaAssetRow[];
  const usage = await usageByAsset(rows.map((row) => row.id));
  const query = foldSearch(filters.q ?? '');
  return rows
    .map((row) => ({ ...row, url: mediaUrl(row.storage_path), usage: usage.get(row.id) ?? [] }))
    .filter((asset) => !query || foldSearch(`${asset.original_name} ${asset.alt_text} ${asset.usage.map((use) => use.title).join(' ')}`).includes(query))
    .filter((asset) => !filters.type || filters.type === 'all' || asset.mime_type === filters.type)
    .filter((asset) => filters.used === 'used' ? asset.usage.length > 0 : filters.used === 'unused' ? asset.usage.length === 0 : true);
}

export async function uploadMedia(admin: AdminUser, file: UploadFile, altText: string): Promise<MediaAssetView> {
  await requireAdminTables('media_assets');
  const result = await uploadImage(supabaseMediaDeps(), admin.userId, file, altText);
  if (!result.ok) throw new ActionRejectedError(result.message, result.status === 502 ? 503 : result.status);
  await writeAuditLog(admin, { action: 'media.upload', targetType: 'media', targetId: result.asset.id, detail: { name: result.asset.original_name, size: result.asset.size_bytes, mime: result.asset.mime_type } });
  return { ...result.asset, url: mediaUrl(result.asset.storage_path), usage: [] };
}

export async function updateMediaAlt(admin: AdminUser, assetId: string, altText: string): Promise<void> {
  await requireAdminTables('media_assets');
  const { data, error } = await createAdminSupabaseClient().from('media_assets')
    .update({ alt_text: altText.trim().slice(0, 300), updated_at: new Date().toISOString() }).eq('id', assetId).select('id');
  if (error) throw new Error(`Supabase: sửa mô tả ảnh — ${error.message}`);
  if (!data?.length) throw new ActionRejectedError('Ảnh không còn trong thư viện.', 404);
  revalidateTag('content');
  await writeAuditLog(admin, { action: 'media.alt', targetType: 'media', targetId: assetId, detail: { altText: altText.trim().slice(0, 300) } });
}

export async function deleteMedia(admin: AdminUser, assetId: string): Promise<void> {
  await requireAdminTables('media_assets', 'content_images');
  const result = await deleteImage(supabaseMediaDeps(), assetId);
  if (!result.ok) throw new ActionRejectedError(result.message, result.status === 502 ? 503 : result.status);
  await writeAuditLog(admin, { action: 'media.delete', targetType: 'media', targetId: assetId, detail: { name: result.asset.original_name, path: result.asset.storage_path } });
}
