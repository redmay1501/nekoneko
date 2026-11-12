/**
 * Đưa NỘI DUNG N5 (content/seed/n5-content.json) vào Supabase.
 *
 *   npm run seed:content
 *
 * - Idempotent: chạy lại bao nhiêu lần cũng được (upsert theo khoá chính).
 * - KHÔNG BAO GIỜ đụng tới bảng trí nhớ (memory_items, review_events, learning_sessions…).
 * - CHÚ Ý: ghi đè các cột nội dung bằng giá trị trong file → sửa đổi làm ở /admin trên cùng id sẽ mất. Chỉ chạy khi chủ ý.
 * - Dùng SUPABASE_SERVICE_ROLE_KEY → chỉ chạy trên máy dev / CI, không bao giờ ở trình duyệt.
 */
import { type SupabaseClient, createClient } from '@supabase/supabase-js';
import { loadSeedContent } from '../src/lib/data/seed-content';
import { CONTENT_TABLES, rowsFromContent } from '../src/lib/data/supabase-content-mapper';
import { kanjiStoryToRow } from '../src/lib/data/kanji-stories';
import type { KanjiStory } from '../src/types/content';
import { loadLocalEnv, requireEnv } from './load-env';

const BATCH_SIZE = 200;

async function main() {
  loadLocalEnv();
  const supabase = createClient(requireEnv('NEXT_PUBLIC_SUPABASE_URL'), requireEnv('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false },
  });
  const content = loadSeedContent();
  const rows = rowsFromContent(content);

  // Thứ tự trong CONTENT_TABLES đã đúng phụ thuộc khoá ngoại (journey_days trước day_tasks).
  for (const { key, table, conflictKey } of CONTENT_TABLES) {
    const tableRows = rows[key] as unknown as Record<string, unknown>[];
    for (let start = 0; start < tableRows.length; start += BATCH_SIZE) {
      const { error } = await supabase.from(table).upsert(tableRows.slice(start, start + BATCH_SIZE), { onConflict: conflictKey });
      if (error) {
        console.error(`✗ Lỗi khi ghi bảng ${table}: ${error.message}`);
        process.exit(1);
      }
    }
    console.log(`✓ ${table.padEnd(20)} ${tableRows.length} dòng`);
  }
  await removeStaleDayTasks(supabase, rows.dayTasks as unknown as { day: number; order_no: number }[]);
  await removeStaleById(supabase, 'vocabulary', rows.vocabulary.map((word) => word.id));
  await insertMissingKanjiStories(supabase, content.kanjiStories);
  console.log('Xong. Nội dung N5 đã có trong Supabase 🌸');
}

/**
 * Upsert không xoá được đầu việc đã bị bỏ khỏi lộ trình (ví dụ việc học từ ở ngày 1–5,
 * xem scripts/roadmap_adjustments.py) → xoá những (ngày, thứ tự) có trong database nhưng không còn trong file.
 */
async function removeStaleDayTasks(supabase: SupabaseClient, seeded: { day: number; order_no: number }[]) {
  const keep = new Set(seeded.map((task) => `${task.day}:${task.order_no}`));
  const { data, error } = await supabase.from('day_tasks').select('day, order_no');
  if (error) throw new Error(`đọc day_tasks: ${error.message}`);
  const stale = (data as { day: number; order_no: number }[]).filter((task) => !keep.has(`${task.day}:${task.order_no}`));
  for (const task of stale) {
    const removal = await supabase.from('day_tasks').delete().eq('day', task.day).eq('order_no', task.order_no);
    if (removal.error) throw new Error(`xoá đầu việc ngày ${task.day}: ${removal.error.message}`);
  }
  if (stale.length) console.log(`✓ đã xoá ${stale.length} đầu việc không còn trong lộ trình`);
}

/**
 * Mục nội dung đã bị bỏ khỏi file (ví dụ từ vựng trùng — scripts/roadmap_adjustments.py) → xoá khỏi database.
 * Mục admin thêm ở /admin có id lớn hơn mọi id trong file → không bao giờ bị xoá ở đây.
 */
async function removeStaleById(supabase: SupabaseClient, table: string, keepIds: number[]) {
  const keep = new Set(keepIds);
  const maxSeedId = Math.max(...keepIds);
  const { data, error } = await supabase.from(table).select('id');
  if (error) throw new Error(`đọc ${table}: ${error.message}`);
  const stale = (data as { id: number }[]).map((row) => row.id).filter((id) => id <= maxSeedId && !keep.has(id));
  if (!stale.length) return;
  const removal = await supabase.from(table).delete().in('id', stale);
  if (removal.error) throw new Error(`xoá ${table}: ${removal.error.message}`);
  console.log(`✓ đã xoá ${stale.length} dòng ${table} không còn trong nội dung (id: ${stale.join(', ')})`);
}

/**
 * Câu chuyện Kanji: CHỈ THÊM (kanji_id, locale, version) chưa có — dòng đã có (có thể đã được sửa tay / đổi trạng thái) giữ nguyên.
 * Muốn đưa nội dung mới lên → tăng version trong file (scripts/import-kanji-stories.py), không ghi đè version cũ.
 * Bảng chưa có (chưa chạy migration 20261112000001) → báo và bỏ qua; app vẫn dùng chuyện trong repo.
 */
async function insertMissingKanjiStories(supabase: SupabaseClient, stories: readonly KanjiStory[]) {
  const storyRows = stories.map(kanjiStoryToRow);
  let inserted = 0;
  for (let start = 0; start < storyRows.length; start += BATCH_SIZE) {
    const { data, error } = await supabase.from('kanji_stories')
      .upsert(storyRows.slice(start, start + BATCH_SIZE), { onConflict: 'kanji_id,locale,version', ignoreDuplicates: true })
      .select('kanji_id');
    if (error) {
      console.warn(`! Bỏ qua kanji_stories: ${error.message} (chạy migration 20261112000001_kanji_stories.sql trước)`);
      return;
    }
    inserted += data?.length ?? 0;
  }
  console.log(`✓ ${'kanji_stories'.padEnd(20)} ${inserted} dòng mới · ${storyRows.length - inserted} dòng đã có (giữ nguyên)`);
}

main().catch((error: unknown) => {
  console.error('✗ Seed nội dung thất bại', error);
  process.exit(1);
});
