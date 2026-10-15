import type { ContentImage, N5Content } from '@/types/content';

/**
 * Lớp phủ do admin quản lý (migration 20261016000001_admin_studio.sql), áp lên nội dung trước khi cache:
 *  - content_status: mục 'draft' / 'review' / 'archived' bị ẩn khỏi app học (mục không có dòng = published).
 *    Admin chỉ chuyển một mục đã có người học sang trạng thái ẩn khi chưa ai có thẻ nhớ của mục đó (xem admin).
 *  - content_images: ảnh minh hoạ gắn cho từ vựng / kanji / bộ thủ / ngữ pháp.
 */
export type OverlayContentType = 'vocabulary' | 'kanji' | 'radical' | 'grammar';
export const HIDDEN_STATUSES = ['draft', 'review', 'archived'] as const;

export interface ContentStatusRow { content_type: string; content_id: number; status: string }
export interface ContentImageRow { content_type: string; content_id: number; alt_text: string; storage_path: string }

const keyOf = (type: string, id: number) => `${type}:${id}`;

export function applyContentOverlays(
  content: N5Content,
  statuses: readonly ContentStatusRow[],
  images: readonly ContentImageRow[],
  publicUrlOf: (storagePath: string) => string,
): N5Content {
  const hidden = new Set(statuses.filter((row) => (HIDDEN_STATUSES as readonly string[]).includes(row.status))
    .map((row) => keyOf(row.content_type, row.content_id)));
  const imageByKey = new Map<string, ContentImage>(images.map((row) => [
    keyOf(row.content_type, row.content_id), { url: publicUrlOf(row.storage_path), alt: row.alt_text },
  ]));
  const decorate = <T extends { id: number }>(type: OverlayContentType, items: T[]): T[] => items
    .filter((item) => !hidden.has(keyOf(type, item.id)))
    .map((item) => {
      const image = imageByKey.get(keyOf(type, item.id));
      return image ? { ...item, image } : item;
    });
  const kanji = decorate('kanji', content.kanji);
  const radicals = decorate('radical', content.radicals);
  const kanjiIds = new Set(kanji.map((item) => item.id));
  const radicalIds = new Set(radicals.map((item) => item.id));
  return {
    ...content,
    vocabulary: decorate('vocabulary', content.vocabulary),
    kanji,
    radicals,
    grammar: decorate('grammar', content.grammar),
    kanjiRadicals: content.kanjiRadicals.filter((link) => kanjiIds.has(link.kanjiId) && radicalIds.has(link.radicalId)),
  };
}

export function storagePublicUrl(supabaseUrl: string, bucket: string, storagePath: string): string {
  return `${supabaseUrl.replace(/\/$/, '')}/storage/v1/object/public/${bucket}/${storagePath.split('/').map(encodeURIComponent).join('/')}`;
}
