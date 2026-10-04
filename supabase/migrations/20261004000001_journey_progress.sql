-- ═══════════════════════════════════════════════════════════════════
--  Lộ trình tính theo NGÀY HỌC THẬT (chốt câu hỏi Q-05)
--
--  Trước: "ngày X/90" = số ngày lịch kể từ start_date → nghỉ vài hôm là bị đẩy lên trước.
--  Nay  : profiles.current_day chỉ tăng khi người học XONG ngày hiện tại:
--           (a) đã gặp hết kiến thức của ngày đó trong phiên học, hoặc
--           (b) tự bấm "Hoàn thành ngày X".
--         Xong là mở ngày kế tiếp NGAY (không phải đợi sang ngày mai).
-- ═══════════════════════════════════════════════════════════════════

alter table public.profiles
  add column current_day int not null default 1 check (current_day between 1 and 90),
  -- Thời điểm xong ngày 90. NULL = chưa xong cả lộ trình.
  add column journey_completed_at timestamptz;

-- Phiên học bắt đầu ở ngày nào — để Khoảnh khắc tiến bộ báo "Bạn vừa xong ngày 23".
alter table public.learning_sessions
  add column journey_day int check (journey_day between 1 and 90);

-- Nhật ký các ngày đã xong — trả lời được "xong ngày 5 lúc nào, bằng cách nào".
create table public.journey_day_completions (
  user_id       uuid not null references public.profiles(id) on delete cascade,
  day           int  not null check (day between 1 and 90),
  method        text not null check (method in ('auto', 'manual')),
  completed_at  timestamptz not null default now(),
  primary key (user_id, day)
);
alter table public.journey_day_completions enable row level security;
create policy "own completions readable" on public.journey_day_completions
  for select to authenticated using (user_id = auth.uid());
revoke insert, update, delete on public.journey_day_completions from anon, authenticated;

-- Quyền sửa hồ sơ của người học giữ nguyên (chỉ display_name, exam_date) → không tự đổi current_day được.

-- ─────────────────────────── CHUYỂN SANG NGÀY KẾ TIẾP (atomic) ───────────────────────────
--
-- Chỉ chuyển khi p_from_day đúng là ngày đang học. Nhờ vậy:
--   - bấm hai lần / hai tab cùng lúc → chỉ chuyển một ngày, không nhảy cóc;
--   - không thể "hoàn thành" một ngày trong tương lai.
-- Xong ngày 90: giữ current_day = 90, ghi journey_completed_at.
-- Chỉ service_role được gọi (qua Route Handler).

create or replace function public.advance_journey_day(
  p_user_id   uuid,
  p_from_day  int,
  p_method    text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.profiles%rowtype;
begin
  select * into v_profile from public.profiles where id = p_user_id for update;
  if not found then
    raise exception 'Không tìm thấy hồ sơ %', p_user_id;
  end if;

  if v_profile.current_day <> p_from_day or v_profile.journey_completed_at is not null then
    return jsonb_build_object('advanced', false, 'current_day', v_profile.current_day,
                              'journey_completed', v_profile.journey_completed_at is not null);
  end if;

  insert into public.journey_day_completions (user_id, day, method)
  values (p_user_id, p_from_day, p_method)
  on conflict (user_id, day) do nothing;

  update public.profiles
     set current_day          = least(p_from_day + 1, 90),
         journey_completed_at = case when p_from_day = 90 then now() else null end
   where id = p_user_id
  returning * into v_profile;

  return jsonb_build_object('advanced', true, 'current_day', v_profile.current_day,
                            'journey_completed', v_profile.journey_completed_at is not null);
end;
$$;

revoke all on function public.advance_journey_day(uuid, int, text) from public, anon, authenticated;
grant execute on function public.advance_journey_day(uuid, int, text) to service_role;
