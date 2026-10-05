-- ─────────────────────────────────────────────────────────────
-- Neko Neko — Chế độ "Học bù" (mode = 'backlog'): kiến thức các ngày trước còn chưa gặp.
-- Danh sách phải khớp SESSION_MODES — session-modes.test.ts kiểm tra.
-- ─────────────────────────────────────────────────────────────

alter table public.learning_sessions drop constraint if exists learning_sessions_mode_check;
alter table public.learning_sessions add constraint learning_sessions_mode_check
  check (mode in ('daily','day','backlog','quick5','random','more','rescue','flow','recall','discover','use'));
