import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { revalidateTag } from 'next/cache';
import { isSupabaseConfigured, publicEnv } from '@/config/env';
import { ActionRejectedError, NotFoundError } from '@/lib/api/errors';
import { loadSeedContent } from '@/lib/data/seed-content';
import { contentFromRows, rowsFromContent } from '@/lib/data/supabase-content-mapper';
import { getLearningDataSource } from '@/lib/data/get-data-source';
import type { N5Content } from '@/types/content';
import { buildKnowledgeCatalog } from '@/features/learning/knowledge-catalog';
import { buildKnowledgeDetail, type KnowledgeDetailView } from '@/features/learning/knowledge-detail';
import { toContentKey } from '@/features/learning/knowledge-types';
import { toMemoryView } from '@/features/memory/memory-engine';
import { storagePublicUrl } from '@/lib/data/content-overlays';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import type { AdminUser } from './admin-access';
import { getAdminSchema, MEDIA_BUCKET, requireAdminTables } from './admin-schema';
import { writeAuditLog } from './audit-log';
import {
  type AdminEntity, type AdminRow, canChangeStatus, canDeleteContent, type ContentStatus, ENTITY_CONFIG,
  type ListableRow, validateEntityInput,
} from './content-entities';

/**
 * Đọc / ghi nội dung cho admin bằng service role (chỉ ở server, sau requireAdmin*).
 * Mọi thao tác ghi: kiểm tra dữ liệu (zod) → ghi → làm mới cache nội dung của app học → ghi nhật ký.
 * Không bao giờ đụng bảng trí nhớ; chỉ ĐẾM thẻ nhớ để chặn xoá / ẩn mục người học đang dùng.
 */

const PAGE = 1000;

export interface EntityImage {
  assetId: string;
  url: string;
  alt: string;
  assetAlt: string;
}

export interface EntityRecord extends ListableRow {
  image: EntityImage | null;
  statusNote: string;
}

async function selectAll(client: SupabaseClient, table: string, columns = '*', order = 'id'): Promise<Record<string, unknown>[]> {
  const rows: Record<string, unknown>[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await client.from(table).select(columns).order(order).range(from, from + PAGE - 1);
    if (error) throw new Error(`Supabase: đọc ${table} — ${error.message}`);
    rows.push(...((data ?? []) as unknown as Record<string, unknown>[]));
    if (!data || data.length < PAGE) return rows;
  }
}

function demoRows(entity: AdminEntity): AdminRow[] {
  const rows = rowsFromContent(loadSeedContent());
  const byEntity = { vocabulary: rows.vocabulary, kanji: rows.kanji, radical: rows.radicals, grammar: rows.grammar };
  return byEntity[entity] as unknown as AdminRow[];
}

export const mediaUrl = (storagePath: string) => storagePublicUrl(publicEnv.supabaseUrl, MEDIA_BUCKET, storagePath);

/** Mọi dòng của một loại nội dung + trạng thái + ảnh (đọc thẳng database, không qua cache của app học). */
export async function loadEntityRecords(entity: AdminEntity): Promise<EntityRecord[]> {
  if (!isSupabaseConfigured()) {
    return demoRows(entity).map((row) => ({ row, status: 'published', hasImage: false, image: null, statusNote: '' }));
  }
  const client = createAdminSupabaseClient();
  const schema = await getAdminSchema();
  const [rows, statuses, images] = await Promise.all([
    selectAll(client, ENTITY_CONFIG[entity].table),
    schema.content_status
      ? client.from('content_status').select('content_id, status, note').eq('content_type', entity)
      : Promise.resolve({ data: [], error: null }),
    schema.content_images && schema.media_assets
      ? client.from('content_images').select('content_id, asset_id, alt_text, media_assets(storage_path, alt_text)').eq('content_type', entity)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (statuses.error) throw new Error(`Supabase: đọc content_status — ${statuses.error.message}`);
  if (images.error) throw new Error(`Supabase: đọc content_images — ${images.error.message}`);
  const statusById = new Map((statuses.data as Array<{ content_id: number; status: ContentStatus; note: string }>).map((row) => [row.content_id, row]));
  type ImageJoin = { content_id: number; asset_id: string; alt_text: string; media_assets: { storage_path: string; alt_text: string } | Array<{ storage_path: string; alt_text: string }> | null };
  const imageById = new Map((images.data as unknown as ImageJoin[]).flatMap((row) => {
    const asset = Array.isArray(row.media_assets) ? row.media_assets[0] : row.media_assets;
    return asset ? [[row.content_id, { assetId: row.asset_id, url: mediaUrl(asset.storage_path), alt: row.alt_text, assetAlt: asset.alt_text }] as const] : [];
  }));
  return (rows as AdminRow[]).map((row) => {
    const status = statusById.get(row.id);
    const image = imageById.get(row.id) ?? null;
    return { row, status: status?.status ?? 'published', statusNote: status?.note ?? '', hasImage: Boolean(image), image };
  });
}

export async function loadEntityRecord(entity: AdminEntity, id: number): Promise<EntityRecord> {
  const record = (await loadEntityRecords(entity)).find((item) => item.row.id === id);
  if (!record) throw new NotFoundError(`${entity} ${id}`);
  return record;
}

/** Số thẻ nhớ (của mọi người học) đang trỏ tới mục này. Chỉ đếm — không đọc nội dung trí nhớ. */
export async function countLearnerMemory(entity: AdminEntity, id: number): Promise<number> {
  if (!isSupabaseConfigured()) return 0;
  const { count, error } = await createAdminSupabaseClient().from('memory_items')
    .select('id', { head: true, count: 'exact' }).eq('content_type', entity).eq('content_id', id);
  if (error) throw new Error(`Supabase: đếm thẻ nhớ — ${error.message}`);
  return count ?? 0;
}

function assertValid(entity: AdminEntity, input: unknown) {
  const result = validateEntityInput(entity, input);
  if (!result.ok) throw new ActionRejectedError(`Dữ liệu chưa hợp lệ: ${Object.entries(result.errors).map(([field, message]) => `${field} — ${message}`).join('; ')}`, 422);
  return result.value;
}

function refreshLearnerContent() {
  // Cache nội dung của app học (unstable_cache, tag 'content') — làm mới để người học thấy thay đổi ngay.
  revalidateTag('content');
}

export async function createEntity(admin: AdminUser, entity: AdminEntity, input: unknown): Promise<{ id: number; status: ContentStatus }> {
  const value = assertValid(entity, input);
  const config = ENTITY_CONFIG[entity];
  const client = createAdminSupabaseClient();
  const existing = await loadEntityRecords(entity);
  const key = config.duplicateKey(value as Partial<AdminRow>);
  const duplicate = existing.find((record) => config.duplicateKey(record.row) === key);
  if (duplicate) throw new ActionRejectedError(`Đã có ${config.singular} này (id ${duplicate.row.id}) — sửa mục đó thay vì thêm trùng.`, 409);

  const schema = await getAdminSchema();
  // Mục mới bắt đầu là Nháp (người học chưa thấy) khi đã có bảng trạng thái; chưa có thì xuất bản ngay.
  const status: ContentStatus = schema.content_status ? 'draft' : 'published';
  let id = Math.max(0, ...existing.map((record) => record.row.id)) + 1;
  for (let attempt = 0; attempt < 3; attempt += 1, id += 1) {
    const { error } = await client.from(config.table).insert({ ...value, id });
    if (!error) {
      if (schema.content_status) {
        const statusInsert = await client.from('content_status').upsert({ content_type: entity, content_id: id, status, updated_by: admin.userId });
        if (statusInsert.error) throw new Error(`Supabase: ghi trạng thái — ${statusInsert.error.message}`);
      }
      refreshLearnerContent();
      await writeAuditLog(admin, { action: 'content.create', targetType: entity, targetId: id, detail: { title: config.title({ ...value, id } as AdminRow), status } });
      return { id, status };
    }
    if (error.code !== '23505') throw new Error(`Supabase: thêm ${config.table} — ${error.message}`);
  }
  throw new ActionRejectedError('Không cấp được mã mới (có người vừa thêm cùng lúc). Bạn thử lại nhé.', 409);
}

export async function updateEntity(admin: AdminUser, entity: AdminEntity, id: number, input: unknown): Promise<void> {
  const value = assertValid(entity, input);
  const config = ENTITY_CONFIG[entity];
  const before = await loadEntityRecord(entity, id);
  const { error } = await createAdminSupabaseClient().from(config.table).update(value).eq('id', id);
  if (error) throw new Error(`Supabase: sửa ${config.table} — ${error.message}`);
  refreshLearnerContent();
  const changed = Object.keys(value).filter((field) => String(before.row[field] ?? '') !== String(value[field] ?? ''));
  await writeAuditLog(admin, { action: 'content.update', targetType: entity, targetId: id, detail: { title: config.title({ ...before.row, ...value } as AdminRow), changed } });
}

/** Gắn / gỡ một mục khỏi ngày trong lộ trình (chỉ đổi cột day). Không đổi tiến độ của ai. */
export async function setEntityDay(admin: AdminUser, entity: AdminEntity, id: number, day: number | null): Promise<void> {
  if (day !== null && (!Number.isInteger(day) || day < 1 || day > 90)) throw new ActionRejectedError('Ngày phải từ 1 đến 90.', 422);
  const config = ENTITY_CONFIG[entity];
  const before = await loadEntityRecord(entity, id);
  const { error } = await createAdminSupabaseClient().from(config.table).update({ day }).eq('id', id);
  if (error) throw new Error(`Supabase: đổi ngày — ${error.message}`);
  refreshLearnerContent();
  await writeAuditLog(admin, { action: day === null ? 'roadmap.unlink' : 'roadmap.link', targetType: entity, targetId: id, detail: { title: config.title(before.row), from: before.row.day, to: day } });
}

export async function deleteEntity(admin: AdminUser, entity: AdminEntity, id: number): Promise<void> {
  const config = ENTITY_CONFIG[entity];
  const before = await loadEntityRecord(entity, id);
  const allowed = canDeleteContent(await countLearnerMemory(entity, id));
  if (!allowed.ok) throw new ActionRejectedError(allowed.reason, 409);
  const client = createAdminSupabaseClient();
  const schema = await getAdminSchema();
  // Lớp phủ không có khoá ngoại tới bảng nội dung → dọn tay (ảnh vẫn giữ trong thư viện).
  if (schema.content_images) await client.from('content_images').delete().eq('content_type', entity).eq('content_id', id);
  if (schema.content_status) await client.from('content_status').delete().eq('content_type', entity).eq('content_id', id);
  const { error } = await client.from(config.table).delete().eq('id', id);
  if (error) throw new Error(`Supabase: xoá ${config.table} — ${error.message}`);
  refreshLearnerContent();
  await writeAuditLog(admin, { action: 'content.delete', targetType: entity, targetId: id, detail: { title: config.title(before.row), snapshot: before.row } });
}

export async function setEntityStatus(admin: AdminUser, entity: AdminEntity, id: number, status: ContentStatus, note: string): Promise<void> {
  await requireAdminTables('content_status');
  const before = await loadEntityRecord(entity, id);
  const allowed = canChangeStatus(status, await countLearnerMemory(entity, id));
  if (!allowed.ok) throw new ActionRejectedError(allowed.reason, 409);
  const { error } = await createAdminSupabaseClient().from('content_status').upsert({
    content_type: entity, content_id: id, status, note: note.slice(0, 500), updated_by: admin.userId, updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(`Supabase: đổi trạng thái — ${error.message}`);
  refreshLearnerContent();
  await writeAuditLog(admin, { action: 'content.status', targetType: entity, targetId: id, detail: { title: ENTITY_CONFIG[entity].title(before.row), from: before.status, to: status } });
}

/** Gắn ảnh (assetId) hoặc gỡ ảnh (null) khỏi một mục. Gỡ ảnh không xoá ảnh khỏi thư viện. */
export async function setEntityImage(admin: AdminUser, entity: AdminEntity, id: number, assetId: string | null, altText: string): Promise<void> {
  await requireAdminTables('media_assets', 'content_images');
  const before = await loadEntityRecord(entity, id);
  const client = createAdminSupabaseClient();
  if (assetId === null) {
    const { error } = await client.from('content_images').delete().eq('content_type', entity).eq('content_id', id);
    if (error) throw new Error(`Supabase: gỡ ảnh — ${error.message}`);
  } else {
    const asset = await client.from('media_assets').select('id').eq('id', assetId).maybeSingle();
    if (asset.error) throw new Error(`Supabase: đọc ảnh — ${asset.error.message}`);
    if (!asset.data) throw new ActionRejectedError('Ảnh này không còn trong thư viện.', 404);
    const { error } = await client.from('content_images').upsert({
      content_type: entity, content_id: id, asset_id: assetId, alt_text: altText.trim().slice(0, 300), updated_by: admin.userId, updated_at: new Date().toISOString(),
    });
    if (error) throw new Error(`Supabase: gắn ảnh — ${error.message}`);
  }
  refreshLearnerContent();
  await writeAuditLog(admin, {
    action: assetId === null ? 'content.image.remove' : before.image ? 'content.image.replace' : 'content.image.set',
    targetType: entity, targetId: id, detail: { title: ENTITY_CONFIG[entity].title(before.row), from: before.image?.assetId ?? null, to: assetId },
  });
}

/**
 * Toàn bộ nội dung như admin thấy: bốn loại sửa được lấy thẳng từ database (gồm cả mục nháp / lưu trữ),
 * phần còn lại (lộ trình, đầu việc, chữ cái, bài đọc) lấy từ nguồn nội dung của app.
 */
export async function loadAdminContent(): Promise<N5Content> {
  const base = await (await getLearningDataSource()).getContent();
  if (!isSupabaseConfigured()) return base;
  const [vocabulary, kanji, radicals, grammar] = await Promise.all(
    (['vocabulary', 'kanji', 'radical', 'grammar'] as const).map(async (entity) => (await loadEntityRecords(entity)).map((record) => record.row)),
  );
  const mapped = contentFromRows({
    ...rowsFromContent(base),
    vocabulary: vocabulary as never, kanji: kanji as never, radicals: radicals as never, grammar: grammar as never,
  });
  return { ...base, vocabulary: mapped.vocabulary, kanji: mapped.kanji, radicals: mapped.radicals, grammar: mapped.grammar };
}

/**
 * Xem trước như người học: dựng đúng khay "Chi tiết kiến thức" của app học từ dòng đang lưu (kể cả mục nháp),
 * với trí nhớ trống (người học chưa gặp). Không ghi gì.
 */
export async function buildLearnerPreview(entity: AdminEntity, record: EntityRecord): Promise<KnowledgeDetailView | null> {
  const content = await loadAdminContent();
  const mapped = contentFromRows({
    ...rowsFromContent({ ...content, vocabulary: [], kanji: [], radicals: [], grammar: [] }),
    vocabulary: entity === 'vocabulary' ? [record.row as never] : [],
    kanji: entity === 'kanji' ? [record.row as never] : [],
    radicals: entity === 'radical' ? [record.row as never] : [],
    grammar: entity === 'grammar' ? [record.row as never] : [],
  });
  const image = record.image ? { url: record.image.url, alt: record.image.alt || record.image.assetAlt } : null;
  const replace = <T extends { id: number }>(items: T[], fresh: T[]) => [...items.filter((item) => item.id !== record.row.id), ...fresh.map((item) => ({ ...item, image }))];
  const previewContent: N5Content = {
    ...content,
    vocabulary: entity === 'vocabulary' ? replace(content.vocabulary, mapped.vocabulary) : content.vocabulary,
    kanji: entity === 'kanji' ? replace(content.kanji, mapped.kanji) : content.kanji,
    radicals: entity === 'radical' ? replace(content.radicals, mapped.radicals) : content.radicals,
    grammar: entity === 'grammar' ? replace(content.grammar, mapped.grammar) : content.grammar,
  };
  const catalog = buildKnowledgeCatalog(previewContent);
  const key = toContentKey(entity, record.row.id);
  const item = catalog.byKey.get(key);
  if (!item) return null;
  return buildKnowledgeDetail(item, toMemoryView(key, entity, null, new Date()), catalog);
}
