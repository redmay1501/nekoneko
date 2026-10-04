/**
 * Gieo TRẠNG THÁI TRÍ NHỚ MẪU cho một tài khoản — chỉ dùng cho dev / QA.
 *
 *   npm run seed:demo-memory -- --email ban@vidu.com [--day 23]
 *
 * Tài khoản mới đăng ký bắt đầu ở ngày 1 với vườn trống, và chỉ sang ngày sau khi học xong.
 * Script này đưa tài khoản tới "giữa lộ trình" (mặc định ngày 23, giống prototype) để kiểm thử mọi màn hình.
 *
 * Ghi đè memory_items của tài khoản đó. KHÔNG dùng với người học thật.
 */
import { createClient } from '@supabase/supabase-js';
import { buildKnowledgeCatalog } from '../src/features/learning/knowledge-catalog';
import { generateDemoMemoryRecords } from '../src/features/memory/demo-memory-seed';
import { getMemoryStatus } from '../src/features/memory/memory-engine';
import { loadSeedContent } from '../src/lib/data/seed-content';
import { addDays, toIsoDate } from '../src/lib/utils/dates';
import { loadLocalEnv, requireEnv } from './load-env';

const DEFAULT_DAY = 23;
const BATCH_SIZE = 200;
const USERS_PER_PAGE = 1000;

function argument(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main() {
  loadLocalEnv();
  const email = argument('email');
  const journeyDay = Number(argument('day') ?? DEFAULT_DAY);
  if (!email || !Number.isInteger(journeyDay) || journeyDay < 1 || journeyDay > 90) {
    console.error('Cách dùng: npm run seed:demo-memory -- --email ban@vidu.com [--day 23]');
    process.exit(1);
  }

  const supabase = createClient(requireEnv('NEXT_PUBLIC_SUPABASE_URL'), requireEnv('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false },
  });
  const { data: users, error: usersError } = await supabase.auth.admin.listUsers({ perPage: USERS_PER_PAGE });
  if (usersError) throw usersError;
  const user = users.users.find((candidate) => candidate.email?.toLowerCase() === email.toLowerCase());
  if (!user) {
    console.error(`✗ Không tìm thấy tài khoản ${email}. Hãy đăng ký trong app trước.`);
    process.exit(1);
  }

  const now = new Date();
  const startDate = addDays(now, -(journeyDay - 1));
  // Đưa tài khoản tới ngày `journeyDay`: các ngày trước đó coi như đã xong (ghi nhật ký hoàn thành).
  const profileUpdate = await supabase.from('profiles').update({
    current_day: journeyDay, journey_completed_at: null,
    start_date: toIsoDate(startDate), exam_date: toIsoDate(addDays(startDate, 89)),
  }).eq('id', user.id);
  if (profileUpdate.error) throw profileUpdate.error;
  const completions = Array.from({ length: journeyDay - 1 }, (_, index) => ({ user_id: user.id, day: index + 1, method: 'manual' }));
  if (completions.length) {
    const { error } = await supabase.from('journey_day_completions').upsert(completions, { onConflict: 'user_id,day' });
    if (error) throw error;
  }

  const catalog = buildKnowledgeCatalog(loadSeedContent());
  const rows = generateDemoMemoryRecords(catalog.items, journeyDay, now).map((record) => ({
    user_id: user.id, content_type: record.contentType, content_id: record.contentId,
    memory_score: record.memoryScore, status: getMemoryStatus(record.memoryScore),
    encounter_count: record.encounterCount, correct_count: record.correctCount, wrong_count: record.wrongCount,
    rescued_count: record.rescuedCount, last_seen_at: record.lastSeenAt, last_recalled_at: record.lastRecalledAt,
    next_review_at: record.nextReviewAt, created_at: record.createdAt,
  }));
  for (let start = 0; start < rows.length; start += BATCH_SIZE) {
    const { error } = await supabase.from('memory_items').upsert(rows.slice(start, start + BATCH_SIZE), { onConflict: 'user_id,content_type,content_id' });
    if (error) throw error;
  }
  console.log(`✓ ${email}: ngày ${journeyDay}/90, ${rows.length} kiến thức có trạng thái trí nhớ mẫu.`);
}

main().catch((error: unknown) => {
  console.error('✗ Seed trí nhớ mẫu thất bại', error);
  process.exit(1);
});
