-- ─────────────────────────────────────────────────────────────
-- NOKORU — Cho phép chế độ "Học hết ngày" (mode = 'day') được lưu.
--
-- Chế độ 'day' được thêm vào code (session-modes.ts) nhưng ràng buộc của learning_sessions chưa có,
-- nên mọi phiên "Học hết ngày" trên Supabase đều lỗi khi tạo. Danh sách dưới đây phải khớp SESSION_MODES —
-- test session-modes.test.ts kiểm tra điều này.
-- ─────────────────────────────────────────────────────────────

alter table public.learning_sessions drop constraint if exists learning_sessions_mode_check;
alter table public.learning_sessions add constraint learning_sessions_mode_check
  check (mode in ('daily','day','quick5','random','more','rescue','flow','recall','discover','use'));
