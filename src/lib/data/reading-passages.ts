import rawReadingPassages from '@content/seed/reading-passages.json';
import type { N5Content, ReadingPassage } from '@/types/content';

/**
 * Bài đọc hiểu do Neko Neko soạn (content/seed/reading-passages.json) — một bài cho mỗi bài Minna 1–25.
 * Đọc thẳng từ repo ở MỌI chế độ (demo lẫn Supabase): bảng reading_passages chưa có cột tiêu đề / bản dịch, và nội dung
 * tĩnh này đi cùng mã nguồn (deploy là có, kiểm tra tự động trong reading-passages.test.ts).
 */
export const READING_PASSAGES: readonly ReadingPassage[] = (rawReadingPassages as { passages: ReadingPassage[] }).passages;

export function withReadingPassages<T extends Omit<N5Content, 'readingPassages'> & { readingPassages: unknown }>(content: T): T & Pick<N5Content, 'readingPassages'> {
  return { ...content, readingPassages: [...READING_PASSAGES] };
}
