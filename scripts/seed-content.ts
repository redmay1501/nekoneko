/**
 * Đưa NỘI DUNG N5 (content/seed/n5-content.json) vào Supabase.
 *
 *   npm run seed:content
 *
 * - Idempotent: chạy lại bao nhiêu lần cũng được (upsert theo khoá chính).
 * - KHÔNG BAO GIỜ đụng tới bảng trí nhớ (memory_items, review_events, learning_sessions…).
 * - Dùng SUPABASE_SERVICE_ROLE_KEY → chỉ chạy trên máy dev / CI, không bao giờ ở trình duyệt.
 */
import { type SupabaseClient, createClient } from '@supabase/supabase-js';
import { loadSeedContent } from '../src/lib/data/seed-content';
import { CONTENT_TABLES, rowsFromContent } from '../src/lib/data/supabase-content-mapper';
import { loadLocalEnv, requireEnv } from './load-env';

const BATCH_SIZE = 200;

async function main() {
  loadLocalEnv();
  const supabase = createClient(requireEnv('NEXT_PUBLIC_SUPABASE_URL'), requireEnv('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false },
  });
  const rows = rowsFromContent(loadSeedContent());

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

main().catch((error: unknown) => {
  console.error('✗ Seed nội dung thất bại', error);
  process.exit(1);
});
