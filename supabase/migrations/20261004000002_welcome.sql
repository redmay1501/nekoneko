-- ─────────────────────────────────────────────────────────────
-- NOKORU — Lời chào lần đầu (SC-01/SC-03 gộp thành một hộp thoại ở Trang chủ).
--
-- welcomed_at: thời điểm người học đi qua (hoặc bỏ qua) lời chào. NULL = chưa từng thấy.
-- Lưu ở user_settings (không phải localStorage) để đổi máy, đổi trình duyệt cũng không chào lại.
-- Chỉ là cờ giao diện, không ảnh hưởng trí nhớ → người học được tự ghi (theo policy "own settings editable").
-- ─────────────────────────────────────────────────────────────

alter table public.user_settings add column if not exists welcomed_at timestamptz;

-- Tài khoản đã có từ trước khi có lời chào: coi như đã chào, chỉ người đăng ký mới mới thấy.
update public.user_settings s
   set welcomed_at = now()
 where welcomed_at is null
   and exists (select 1 from public.review_events e where e.user_id = s.user_id);
