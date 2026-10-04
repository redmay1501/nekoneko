-- ─────────────────────────────────────────────────────────────
-- NOKORU — Giọng đọc tiếng Nhật ưa thích (Cài đặt → Giọng đọc).
--
-- App dùng giọng tiếng Nhật có sẵn trên máy (Web Speech API); cột này chỉ lưu người học muốn nghe giọng
-- nữ hay nam. Máy không có giọng đúng loại thì app dùng giọng tiếng Nhật còn lại và báo cho người học.
-- ─────────────────────────────────────────────────────────────

alter table public.user_settings
  add column if not exists voice_gender text not null default 'female'
  check (voice_gender in ('female', 'male'));
