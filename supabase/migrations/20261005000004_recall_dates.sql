-- ─────────────────────────────────────────────────────────────
-- Neko Neko — Các NGÀY có nhớ lại đúng (theo giờ Việt Nam), để tính "Đã ôn N ngày" và chuỗi ngày liên tiếp.
--
-- Trước đây app tải mọi lần trả lời đúng trong 30 ngày rồi tự gom theo ngày UTC: chậm dần theo thời gian học,
-- và 23h–7h ở Việt Nam bị tính sang ngày khác. Hàm này gom ngay trong database, trả về tối đa một dòng mỗi ngày.
-- security invoker: chạy với quyền người gọi → RLS của review_events vẫn áp dụng, chỉ thấy ngày của chính mình.
-- ─────────────────────────────────────────────────────────────

create or replace function public.recall_dates(p_since timestamptz default null)
returns setof date
language sql
stable
security invoker
set search_path = public
as $$
  select distinct (created_at at time zone 'Asia/Ho_Chi_Minh')::date as day
    from public.review_events
   where user_id = auth.uid()
     and is_correct
     and (p_since is null or created_at >= p_since)
   order by day;
$$;

revoke all on function public.recall_dates(timestamptz) from public, anon;
grant execute on function public.recall_dates(timestamptz) to authenticated;
