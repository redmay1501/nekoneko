import rawRevisions from '@content/seed/content-revisions.json';
import type { ContentKey } from './knowledge-types';

/**
 * Kiến thức được THÊM MỚI hoặc DỜI VỀ NGÀY SỚM HƠN trong một lần sửa nội dung (vd. audit từ vựng Minna 2026-11-18).
 * Học bù bình thường bỏ qua ngày người học đã bấm hoàn thành — nhưng người học bấm hoàn thành TRƯỚC khi mục này có mặt
 * ở ngày đó, nên vẫn phải được giao (nếu chưa gặp). Không đổi trạng thái hoàn thành, không ghi gì vào trí nhớ.
 * Danh sách sinh tự động từ so sánh dữ liệu trước / sau (content/seed/content-revisions.json).
 */
interface ContentRevision { id: string; date: string; keys: string[] }

export const REVISED_KNOWLEDGE_KEYS: ReadonlySet<ContentKey> = new Set(
  (rawRevisions as { revisions: ContentRevision[] }).revisions.flatMap((revision) => revision.keys) as ContentKey[],
);
