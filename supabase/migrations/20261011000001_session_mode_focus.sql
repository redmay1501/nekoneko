-- ─────────────────────────────────────────────────────────────
-- Neko Neko — Chế độ "Học theo lựa chọn" (mode = 'focus'): người học tự chọn kiến thức để học / kiểm tra
-- ngay tại trang Học tập (Kanji, Từ vựng, Ngữ pháp, Bộ thủ, Hiragana, Katakana) — không phải chờ lộ trình.
-- Danh sách phải khớp SESSION_MODES — session-modes.test.ts kiểm tra.
-- ─────────────────────────────────────────────────────────────

alter table public.learning_sessions drop constraint if exists learning_sessions_mode_check;
alter table public.learning_sessions add constraint learning_sessions_mode_check
  check (mode in ('daily','day','backlog','focus','quick5','random','more','rescue','flow','recall','discover','use'));
