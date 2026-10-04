-- ═══════════════════════════════════════════════════════════════════
--  NOKORU — schema khởi tạo
--  Nguồn: sheet "3. Mô hình dữ liệu" + "10. Phi chức năng" (bảo mật)
--
--  Ba nhóm bảng:
--   1. NỘI DUNG  — dùng chung, ai cũng đọc được, chỉ seed/editor được ghi.
--   2. NGƯỜI HỌC — profiles, user_settings, app_roles.
--   3. TRÍ NHỚ   — memory_items, review_events, learning_sessions, session_items.
--                  Người học CHỈ ĐỌC được dữ liệu của chính mình.
--                  Mọi thay đổi đi qua server (service_role) → Memory Engine.
-- ═══════════════════════════════════════════════════════════════════

-- gen_random_uuid() có sẵn từ PostgreSQL 13 (Supabase dùng PostgreSQL 15) — không cần extension.

-- ─────────────────────────── 1. NỘI DUNG ───────────────────────────

create table public.journey_days (
  day              int primary key check (day between 1 and 90),
  week             int,
  stage            text not null,
  minna            text not null default '',
  title            text not null,
  kanji_summary    text not null default '',
  radical_summary  text not null default '',
  grammar_summary  text not null default '',
  vocab_summary    text not null default '',
  skill            text not null default '',
  minutes          int  not null default 0
);

create table public.day_tasks (
  day       int  not null references public.journey_days(day) on delete cascade,
  order_no  int  not null,
  label     text not null,
  body      text not null,
  minutes   int  not null default 0,
  primary key (day, order_no)
);

create table public.kana (
  id        int primary key,
  hiragana  text not null,
  katakana  text not null,
  romaji    text not null,
  tip       text not null default '',
  day       int
);

-- Cột jlpt_level: chuẩn bị cho N4 trở đi (câu Q-04, sheet 13). Hiện tại chỉ có N5.
create table public.radicals (
  id          int primary key,
  radical     text not null,
  name_jp     text not null default '',
  meaning     text not null,
  kanji_list  text not null default '',
  tip         text not null default '',
  day         int,
  jlpt_level  text not null default 'N5'
);

create table public.kanji (
  id           int primary key,
  character    text not null,
  han_viet     text not null default '',
  meaning      text not null,
  on_reading   text not null default '',
  kun_reading  text not null default '',
  strokes      int,
  words        text not null default '',
  tip          text not null default '',
  day          int,
  jlpt_level   text not null default 'N5'
);

create table public.vocabulary (
  id          int primary key,
  kana        text not null,
  kanji       text not null default '',
  meaning     text not null,
  tip         text not null default '',
  lesson      text not null default '',
  day         int,
  jlpt_level  text not null default 'N5'
);

create table public.grammar (
  id          int primary key,
  pattern     text not null,
  usage       text not null default '',
  example_jp  text not null default '',
  example_vi  text not null default '',
  lesson      text not null default '',
  day         int,
  jlpt_level  text not null default 'N5'
);

create table public.lessons (
  id             text primary key,
  name           text not null,
  day_range      text not null default '',
  day_count      int,
  grammar_count  text not null default '',
  vocab_count    text not null default '',
  note           text not null default ''
);

create table public.jlpt_grammar (
  id       int primary key,
  pattern  text not null,
  usage    text not null default ''
);

create table public.study_resources (
  id        int primary key,
  source    text not null,
  used_for  text not null default '',
  how_to    text not null default ''
);

-- Nội dung NOKORU tự soạn (không trích giáo trình có bản quyền — câu Q-02).
create table public.reading_passages (
  id         int primary key,
  day        int not null,
  lesson     text not null default '',
  text_jp    text not null,
  questions  jsonb not null default '[]'::jsonb
);

create table public.practice_templates (
  id           int primary key,
  kind         text not null,
  context_jp   text not null,
  sentence_jp  text not null,
  prompt_vi    text not null
);

-- ─────────────────────────── 2. NGƯỜI HỌC ───────────────────────────

create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text not null,
  start_date    date not null default current_date,
  exam_date     date,
  -- Chỉ để hiển thị nhẹ. Trục tiến bộ thật là: N5 · Ngày X/90 · sức khoẻ trí nhớ.
  level         int  not null default 1,
  created_at    timestamptz not null default now()
);

create table public.user_settings (
  user_id         uuid primary key references public.profiles(id) on delete cascade,
  daily_minutes   int  not null default 8 check (daily_minutes in (0, 5, 8, 15)),
  reminder_time   time,
  autoplay_audio  boolean not null default true,
  show_furigana   boolean not null default true,
  gentle_mode     boolean not null default false,
  updated_at      timestamptz not null default now()
);

create table public.app_roles (
  user_id  uuid not null references auth.users(id) on delete cascade,
  role     text not null check (role in ('learner', 'editor', 'admin')),
  primary key (user_id, role)
);

-- ─────────────────────────── 3. TRÍ NHỚ ───────────────────────────

create table public.memory_items (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles(id) on delete cascade,
  content_type      text not null check (content_type in ('hiragana','katakana','radical','kanji','vocabulary','grammar')),
  content_id        int  not null,
  -- Điểm tại thời điểm last_seen_at. Điểm thực tế = điểm này trừ phần trôi (tính lúc đọc).
  memory_score      int  not null check (memory_score between 0 and 100),
  -- Trạng thái tại thời điểm ghi, để báo cáo bằng SQL. App luôn tính lại từ điểm thực tế.
  status            text not null check (status in ('new','weak','fading','learning','strong','mastered')),
  encounter_count   int  not null default 0,
  correct_count     int  not null default 0,
  wrong_count       int  not null default 0,
  rescued_count     int  not null default 0,
  last_seen_at      timestamptz,
  last_recalled_at  timestamptz,
  next_review_at    timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (user_id, content_type, content_id)
);
create index memory_items_user_next_review_idx on public.memory_items (user_id, next_review_at);

create table public.learning_sessions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles(id) on delete cascade,
  mode             text not null check (mode in ('daily','quick5','random','more','rescue','flow','recall','discover','use')),
  started_at       timestamptz not null default now(),
  ended_at         timestamptz,
  recalled         int not null default 0,
  learned_new      int not null default 0,
  used_in_context  int not null default 0,
  missed           int not null default 0,
  summary          jsonb
);
create index learning_sessions_user_idx on public.learning_sessions (user_id, started_at desc);

-- Các bước của một phiên. Có đáp án đúng nên KHÔNG mở cho trình duyệt đọc.
create table public.session_items (
  session_id      uuid not null references public.learning_sessions(id) on delete cascade,
  step_index      int  not null,
  step_type       text not null check (step_type in ('surprise','recall','discover','use')),
  content_type    text not null,
  content_id      int  not null,
  payload         jsonb not null,
  correct_answer  text,
  answered_at     timestamptz,
  result          jsonb,
  primary key (session_id, step_index)
);

-- Nhật ký từng lần tương tác — trả lời được câu "vì sao NOKORU nghĩ bạn sắp quên cái này".
create table public.review_events (
  id                   bigint generated always as identity primary key,
  user_id              uuid not null references public.profiles(id) on delete cascade,
  memory_item_id       uuid not null references public.memory_items(id) on delete cascade,
  session_id           uuid references public.learning_sessions(id) on delete set null,
  event_type           text not null check (event_type in ('surprise','recall','discover','use','rescue')),
  answer               text,
  is_correct           boolean,
  memory_score_before  int not null,
  memory_score_after   int not null,
  -- Chống ghi trùng: gửi lại cùng request_id thì không cộng điểm lần hai.
  request_id           text not null unique,
  created_at           timestamptz not null default now()
);
create index review_events_user_item_time_idx on public.review_events (user_id, memory_item_id, created_at);
create index review_events_user_time_idx on public.review_events (user_id, created_at);

-- ─────────────────────────── ROW LEVEL SECURITY ───────────────────────────

alter table public.journey_days       enable row level security;
alter table public.day_tasks          enable row level security;
alter table public.kana               enable row level security;
alter table public.radicals           enable row level security;
alter table public.kanji              enable row level security;
alter table public.vocabulary         enable row level security;
alter table public.grammar            enable row level security;
alter table public.lessons            enable row level security;
alter table public.jlpt_grammar       enable row level security;
alter table public.study_resources    enable row level security;
alter table public.reading_passages   enable row level security;
alter table public.practice_templates enable row level security;
alter table public.profiles           enable row level security;
alter table public.user_settings      enable row level security;
alter table public.app_roles          enable row level security;
alter table public.memory_items       enable row level security;
alter table public.learning_sessions  enable row level security;
alter table public.session_items      enable row level security;
alter table public.review_events      enable row level security;

-- Nội dung: ai cũng đọc được (để cache và để trang kiến thức có thể được index).
-- Không có policy ghi → chỉ service_role (script seed) ghi được.
create policy "content readable" on public.journey_days       for select to anon, authenticated using (true);
create policy "content readable" on public.day_tasks          for select to anon, authenticated using (true);
create policy "content readable" on public.kana               for select to anon, authenticated using (true);
create policy "content readable" on public.radicals           for select to anon, authenticated using (true);
create policy "content readable" on public.kanji              for select to anon, authenticated using (true);
create policy "content readable" on public.vocabulary         for select to anon, authenticated using (true);
create policy "content readable" on public.grammar            for select to anon, authenticated using (true);
create policy "content readable" on public.lessons            for select to anon, authenticated using (true);
create policy "content readable" on public.jlpt_grammar       for select to anon, authenticated using (true);
create policy "content readable" on public.study_resources    for select to anon, authenticated using (true);
create policy "content readable" on public.reading_passages   for select to anon, authenticated using (true);
create policy "content readable" on public.practice_templates for select to anon, authenticated using (true);

-- Người học: chỉ thấy và sửa hồ sơ của chính mình.
create policy "own profile readable"  on public.profiles      for select to authenticated using (id = auth.uid());
create policy "own profile editable"  on public.profiles      for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "own settings readable" on public.user_settings for select to authenticated using (user_id = auth.uid());
create policy "own settings editable" on public.user_settings for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own roles readable"    on public.app_roles     for select to authenticated using (user_id = auth.uid());

-- Người học không được tự đổi ngày bắt đầu hay cấp độ — chỉ tên và ngày thi.
revoke update on public.profiles from authenticated;
grant update (display_name, exam_date) on public.profiles to authenticated;

-- Trí nhớ: CHỈ ĐỌC dữ liệu của chính mình. Không có policy insert/update/delete.
create policy "own memory readable"   on public.memory_items      for select to authenticated using (user_id = auth.uid());
create policy "own events readable"   on public.review_events     for select to authenticated using (user_id = auth.uid());
create policy "own sessions readable" on public.learning_sessions for select to authenticated using (user_id = auth.uid());
-- session_items: không có policy nào → trình duyệt không đọc được đáp án.

revoke insert, update, delete on public.memory_items, public.review_events, public.learning_sessions, public.session_items from anon, authenticated;
-- Đáp án đúng nằm trong session_items → chặn đọc ở cả mức quyền, không chỉ dựa vào RLS.
revoke select on public.session_items from anon, authenticated;

-- ─────────────────────────── TẠO HỒ SƠ KHI ĐĂNG KÝ ───────────────────────────

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), split_part(new.email, '@', 1)));
  insert into public.user_settings (user_id) values (new.id);
  insert into public.app_roles (user_id, role) values (new.id, 'learner');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────────────────── GHI MỘT LẦN GẶP LẠI (atomic) ───────────────────────────
--
-- Memory Engine (TypeScript, chạy ở server) đã tính xong mọi con số.
-- Hàm này chỉ LƯU, trong MỘT transaction:
--   memory_items (upsert) + review_events (insert) + session_items (đánh dấu đã trả lời).
-- Lỗi ở bất kỳ bước nào → rollback cả ba, không để dữ liệu lệch nhau.
-- Gửi trùng request_id → không làm gì, trả về duplicate = true.
--
-- Chỉ service_role được gọi. Trình duyệt KHÔNG gọi được hàm này.

create or replace function public.apply_memory_update(
  p_user_id           uuid,
  p_request_id        text,
  p_content_type      text,
  p_content_id        int,
  p_event_type        text,
  p_answer            text,
  p_is_correct        boolean,
  p_score_before      int,
  p_score_after       int,
  p_status            text,
  p_encounter_count   int,
  p_correct_count     int,
  p_wrong_count       int,
  p_rescued_count     int,
  p_last_seen_at      timestamptz,
  p_last_recalled_at  timestamptz,
  p_next_review_at    timestamptz,
  p_created_at        timestamptz,
  p_session_id        uuid,
  p_step_index        int,
  p_step_result       jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_memory_item_id uuid;
begin
  if exists (select 1 from public.review_events where request_id = p_request_id) then
    return jsonb_build_object('duplicate', true);
  end if;

  insert into public.memory_items as m (
    user_id, content_type, content_id, memory_score, status, encounter_count, correct_count,
    wrong_count, rescued_count, last_seen_at, last_recalled_at, next_review_at, created_at, updated_at
  ) values (
    p_user_id, p_content_type, p_content_id, p_score_after, p_status, p_encounter_count, p_correct_count,
    p_wrong_count, p_rescued_count, p_last_seen_at, p_last_recalled_at, p_next_review_at, p_created_at, now()
  )
  on conflict (user_id, content_type, content_id) do update set
    memory_score     = excluded.memory_score,
    status           = excluded.status,
    encounter_count  = excluded.encounter_count,
    correct_count    = excluded.correct_count,
    wrong_count      = excluded.wrong_count,
    rescued_count    = excluded.rescued_count,
    last_seen_at     = excluded.last_seen_at,
    last_recalled_at = excluded.last_recalled_at,
    next_review_at   = excluded.next_review_at,
    updated_at       = now()
  returning m.id into v_memory_item_id;

  insert into public.review_events (
    user_id, memory_item_id, session_id, event_type, answer, is_correct,
    memory_score_before, memory_score_after, request_id
  ) values (
    p_user_id, v_memory_item_id, p_session_id, p_event_type, p_answer, p_is_correct,
    p_score_before, p_score_after, p_request_id
  );

  if p_session_id is not null then
    update public.session_items
       set answered_at = now(), result = p_step_result
     where session_id = p_session_id and step_index = p_step_index;
  end if;

  return jsonb_build_object('duplicate', false, 'memory_item_id', v_memory_item_id);
end;
$$;

revoke all on function public.apply_memory_update(
  uuid, text, text, int, text, text, boolean, int, int, text, int, int, int, int,
  timestamptz, timestamptz, timestamptz, timestamptz, uuid, int, jsonb
) from public, anon, authenticated;
grant execute on function public.apply_memory_update(
  uuid, text, text, int, text, text, boolean, int, int, text, int, int, int, int,
  timestamptz, timestamptz, timestamptz, timestamptz, uuid, int, jsonb
) to service_role;
