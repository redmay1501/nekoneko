-- ─────────────────────────────────────────────────────────────
-- Neko Neko — Chống mất cập nhật trí nhớ khi ghi đồng thời (khoá lạc quan).
--
-- Memory Engine tính bản ghi mới từ bản ghi server ĐỌC lúc đầu request. Hai request cùng một kiến thức
-- (hai tab, gửi lại khi mạng chập chờn) trước đây ghi đè nhau → mất một lần gặp lại.
-- Nay hàm nhận thêm p_expected_encounter_count = số lần gặp lúc đọc (NULL = lúc đọc chưa có bản ghi).
-- Bản ghi đã đổi kể từ lúc đọc → không ghi gì, báo lỗi 'stale_memory_record' (SQLSTATE P0001);
-- memory-service đọc lại, tính lại, thử lại.
-- KHÔNG dùng SQLSTATE 40001 (serialization_failure): PostgREST tự thử lại cả giao dịch khi gặp mã này →
-- xung đột lặp mãi tới khi hết giờ chờ (đã gặp thật: treo 125 giây).
-- ─────────────────────────────────────────────────────────────

drop function if exists public.apply_memory_update(
  uuid, text, text, int, text, text, boolean, int, int, text, int, int, int, int,
  timestamptz, timestamptz, timestamptz, timestamptz, uuid, int, jsonb
);

create or replace function public.apply_memory_update(
  p_user_id                  uuid,
  p_request_id               text,
  p_content_type             text,
  p_content_id               int,
  p_event_type               text,
  p_answer                   text,
  p_is_correct               boolean,
  p_score_before             int,
  p_score_after              int,
  p_status                   text,
  p_encounter_count          int,
  p_correct_count            int,
  p_wrong_count              int,
  p_rescued_count            int,
  p_last_seen_at             timestamptz,
  p_last_recalled_at         timestamptz,
  p_next_review_at           timestamptz,
  p_created_at               timestamptz,
  p_session_id               uuid,
  p_step_index               int,
  p_step_result              jsonb,
  p_expected_encounter_count int
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
  -- Chỉ ghi đè khi bản ghi vẫn đúng như lúc server đọc (NULL = lúc đọc chưa có bản ghi → có rồi là đã bị ghi trước).
  where m.encounter_count is not distinct from p_expected_encounter_count
  returning m.id into v_memory_item_id;

  if v_memory_item_id is null then
    raise exception 'stale_memory_record' using errcode = 'P0001';
  end if;

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
  timestamptz, timestamptz, timestamptz, timestamptz, uuid, int, jsonb, int
) from public, anon, authenticated;
grant execute on function public.apply_memory_update(
  uuid, text, text, int, text, text, boolean, int, int, text, int, int, int, int,
  timestamptz, timestamptz, timestamptz, timestamptz, uuid, int, jsonb, int
) to service_role;

-- Tìm phiên dở dang để học tiếp (tải lại trang / đóng tab giữa chừng).
create index if not exists learning_sessions_resume_idx
  on public.learning_sessions (user_id, mode, started_at desc) where ended_at is null;
