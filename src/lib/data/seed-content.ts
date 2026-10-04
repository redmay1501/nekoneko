import rawSeedContent from '@content/seed/n5-content.json';
import type { N5Content } from '@/types/content';

/**
 * Nội dung N5 dạng seed (sinh từ file Excel lộ trình bằng scripts/convert-roadmap.py).
 *
 * Dùng ở ba nơi — và CHỈ ba nơi:
 *  1. Chế độ demo (không có Supabase) — làm nguồn nội dung.
 *  2. scripts/seed-content.ts — để đưa vào Supabase.
 *  3. Unit test.
 * Khi chạy với Supabase, app đọc nội dung từ database, không đọc file này.
 */
export function loadSeedContent(): N5Content {
  return rawSeedContent as N5Content;
}
