/**
 * Kiểm chứng supabase/migrations bằng PostgreSQL nhúng (PGlite) — không cần Docker hay Supabase thật.
 *
 *   npm run test:db
 *
 * Mô phỏng phần Supabase cung cấp sẵn (schema auth, auth.uid(), role anon/authenticated/service_role)
 * rồi chạy migration và kiểm tra: trigger tạo hồ sơ, hàm ghi atomic + chống ghi trùng, và RLS
 * (người học KHÔNG được sửa trí nhớ, không đọc được đáp án, không thấy dữ liệu người khác).
 */
import { PGlite } from '@electric-sql/pglite';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
const MIGRATIONS_DIR = join(process.cwd(), 'supabase', 'migrations');
const db = new PGlite();
// Giả lập phần Supabase cung cấp sẵn: schema auth, auth.users, auth.uid(), các role.
await db.exec(`
  create role anon; create role authenticated; create role service_role;
  create schema auth;
  create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb default '{}'::jsonb);
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema public to anon, authenticated, service_role;
  grant usage on schema auth to anon, authenticated, service_role; -- như Supabase: ai cũng gọi được auth.uid()
  alter default privileges in schema public grant select, insert, update, delete on tables to anon, authenticated, service_role;
  alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;
`);
const sql = readdirSync(MIGRATIONS_DIR).filter((name) => name.endsWith('.sql')).sort().map((name) => readFileSync(join(MIGRATIONS_DIR, name), 'utf8')).join('\n');
await db.exec(sql);
await db.exec(`grant select, insert, update, delete on all tables in schema public to anon, authenticated, service_role;
  revoke insert, update, delete on public.memory_items, public.review_events, public.learning_sessions, public.session_items from anon, authenticated;
  revoke select on public.session_items from anon, authenticated; revoke update on public.profiles from authenticated; grant update (display_name, exam_date) on public.profiles to authenticated;`);
console.log('✓ migration chạy thành công');


let failures = 0;
const expectBlocked = (ok, label) => { if (!ok) { failures++; console.log(`✗ ${label}`); } };
const uid = '11111111-1111-4111-8111-111111111111', other = '22222222-2222-4222-8222-222222222222';
await db.exec(`insert into auth.users (id, email, raw_user_meta_data) values ('${uid}','hien@vd.com','{"display_name":"Hiền"}'), ('${other}','b@vd.com','{}');`);
console.log('✓ trigger tạo hồ sơ:', (await db.query(`select display_name, start_date = current_date as today from profiles order by display_name`)).rows);
console.log('✓ cài đặt mặc định:', (await db.query(`select daily_minutes from user_settings where user_id='${uid}'`)).rows);

// Tham số cuối = số lần gặp server đã đọc trước khi tính (NULL = lúc đọc chưa có bản ghi) — khoá lạc quan.
const call = (req, encounters = 1, expected = 'null') => db.query(`select apply_memory_update('${uid}','${req}','kanji',1,'recall','x',true,50,64,'learning',${encounters},1,0,0,now(),now(),now()+interval '4 day',now(),null,null,null,${expected}) as r`);
await db.exec(`insert into journey_days (day, stage, title) values (1,'Kana','x'); insert into kanji (id, character, meaning, day) values (1,'日','Ngày',15);`);
await db.exec('set role service_role');
console.log('✓ lần 1:', (await call('req-1')).rows[0].r);
console.log('✓ gửi trùng:', (await call('req-1')).rows[0].r);
// Ghi đồng thời: hai request cùng đọc encounter_count = 1. Request đầu ghi (→ 2); request sau tính trên
// bản cũ → phải bị TỪ CHỐI (không ghi đè mất lần gặp của request đầu).
console.log('✓ request A (đọc được 1 lần gặp):', (await call('req-a', 2, 1)).rows[0].r);
try { await call('req-b', 2, 1); expectBlocked(false, 'request B ghi đè lên bản đã đổi: KHÔNG bị chặn'); }
catch (e) { console.log(`  ✓ request B tính trên bản cũ: bị từ chối — ${e.message.split('\n')[0]}`); }
console.log('✓ request B thử lại sau khi đọc lại (2 lần gặp):', (await call('req-b', 3, 2)).rows[0].r);
try { await call('req-c', 1, 'null'); expectBlocked(false, 'ghi như bản ghi mới khi đã có bản ghi: KHÔNG bị chặn'); }
catch (e) { console.log(`  ✓ tưởng chưa có bản ghi nhưng đã có: bị từ chối — ${e.message.split('\n')[0]}`); }
await db.exec('reset role');
const encounters = (await db.query(`select encounter_count from memory_items`)).rows[0].encounter_count;
expectBlocked(encounters === 3, `encounter_count phải là 3 (không mất lần nào), đang là ${encounters}`);
console.log('✓ không mất lần gặp nào — encounter_count:', encounters);
console.log('✓ memory_items:', (await db.query(`select memory_score, status, encounter_count from memory_items`)).rows,
  'review_events:', (await db.query(`select count(*)::int c from review_events`)).rows[0].c);

// RLS: người học chỉ đọc được của mình, không ghi được trí nhớ, không gọi được RPC.
await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub','${uid}',false);`);
console.log('✓ RLS đọc của mình:', (await db.query(`select count(*)::int c from memory_items`)).rows[0].c,
  '| hồ sơ thấy được:', (await db.query(`select count(*)::int c from profiles`)).rows[0].c,
  '| nội dung đọc được:', (await db.query(`select count(*)::int c from kanji`)).rows[0].c);
for (const [label, q] of [
  ['ghi memory_score', `update memory_items set memory_score = 99`],
  ['chèn memory_items', `insert into memory_items (user_id, content_type, content_id, memory_score, status) values ('${uid}','kanji',2,99,'mastered')`],
  ['gọi apply_memory_update', `select apply_memory_update('${uid}','hack','kanji',1,'recall','x',true,0,99,'mastered',1,1,0,0,now(),now(),now(),now(),null,null,null,null)`],
  ['đọc session_items (đáp án)', `select * from session_items`],
  ['đổi start_date', `update profiles set start_date = '2020-01-01'`],
]) {
  try { const r = await db.query(q); expectBlocked(false, `${label}: KHÔNG bị chặn (rows ${r.rows.length})`); }
  catch (e) { console.log(`  ✓ ${label}: bị chặn — ${e.message.split('\n')[0]}`); }
}
// ── Lộ trình theo ngày học thật ──
await db.exec('reset role');
console.log('✓ tài khoản mới bắt đầu ở ngày:', (await db.query(`select current_day from profiles where id='${uid}'`)).rows[0].current_day);
await db.exec('set role service_role');
const advance = async (day) => (await db.query(`select advance_journey_day('${uid}', ${day}, 'manual') as r`)).rows[0].r;
const first = await advance(1);
const twice = await advance(1);
const skip = await advance(5);
console.log('✓ xong ngày 1:', first, '| bấm lại ngày 1:', twice, '| thử nhảy cóc ngày 5:', skip);
expectBlocked(first.advanced === true && first.current_day === 2, 'xong ngày 1 phải mở ngày 2');
expectBlocked(twice.advanced === false && twice.current_day === 2, 'bấm hai lần không được nhảy hai ngày');
expectBlocked(skip.advanced === false, 'không được hoàn thành một ngày chưa tới');
await db.exec(`reset role; update profiles set current_day = 90 where id='${uid}'; set role service_role;`);
const last = await advance(90);
expectBlocked(last.journey_completed === true && last.current_day === 90, 'xong ngày 90 phải đánh dấu hoàn thành lộ trình');
console.log('✓ xong ngày 90:', last);
await db.exec(`reset role; set role authenticated; select set_config('request.jwt.claim.sub','${uid}',false);`);
for (const [label, q] of [
  ['tự đổi current_day', `update profiles set current_day = 50`],
  ['tự gọi advance_journey_day', `select advance_journey_day('${uid}', 2, 'manual')`],
  ['tự ghi nhật ký hoàn thành', `insert into journey_day_completions (user_id, day, method) values ('${uid}', 3, 'manual')`],
]) {
  try { await db.query(q); expectBlocked(false, `${label}: KHÔNG bị chặn`); }
  catch (e) { console.log(`  ✓ ${label}: bị chặn — ${e.message.split('\n')[0]}`); }
}
console.log('✓ nhật ký các ngày đã xong của mình:', (await db.query(`select day, method from journey_day_completions order by day`)).rows);

// Ngày ôn theo giờ Việt Nam: 00:30 sáng 6/10 ở VN (17:30 UTC 5/10) phải tính là ngày 6/10.
await db.exec(`reset role; insert into review_events (user_id, memory_item_id, event_type, is_correct, memory_score_before, memory_score_after, request_id, created_at)
  select '${uid}', id, 'recall', true, 50, 60, 'tz-late', '2026-10-05T17:30:00Z' from memory_items limit 1;
  insert into review_events (user_id, memory_item_id, event_type, is_correct, memory_score_before, memory_score_after, request_id, created_at)
  select '${uid}', id, 'recall', false, 50, 40, 'tz-wrong', '2026-10-07T03:00:00Z' from memory_items limit 1;
  set role authenticated; select set_config('request.jwt.claim.sub','${uid}',false);`);
const myDates = (await db.query(`select d::text from recall_dates() d`)).rows.map((row) => row.d);
expectBlocked(myDates.includes('2026-10-06') && !myDates.includes('2026-10-07'), `recall_dates phải theo giờ VN và chỉ đếm câu đúng: ${myDates}`);
console.log('✓ ngày ôn của mình (giờ VN, chỉ câu đúng):', myDates);

await db.exec(`select set_config('request.jwt.claim.sub','${other}',false);`);
const otherDates = (await db.query(`select count(*)::int c from recall_dates()`)).rows[0].c;
expectBlocked(otherDates === 0, `người khác đọc được ngày ôn của Hiền: ${otherDates}`);
console.log('✓ người khác thấy ngày ôn của Hiền:', otherDates);
console.log('✓ người khác thấy trí nhớ của Hiền:', (await db.query(`select count(*)::int c from memory_items`)).rows[0].c);

if (failures) { console.log(`\n✗ ${failures} kiểm tra bảo mật thất bại`); process.exit(1); }
console.log('\nTất cả kiểm tra database đều đạt 🌸');
