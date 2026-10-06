-- ─────────────────────────────────────────────────────────────
-- Neko Neko — Ngữ pháp đầy đủ hơn cho người học (content/seed/grammar-notes.json):
-- cách đọc câu ví dụ, khi nào dùng, lỗi thường gặp, ví dụ thứ hai (kèm cách đọc + nghĩa).
-- Cột mặc định rỗng → bản app cũ vẫn đọc bảng bình thường.
-- ─────────────────────────────────────────────────────────────

alter table public.grammar
  add column if not exists example_reading  text not null default '',
  add column if not exists when_to_use      text not null default '',
  add column if not exists common_mistake   text not null default '',
  add column if not exists example2_jp      text not null default '',
  add column if not exists example2_reading text not null default '',
  add column if not exists example2_vi      text not null default '';
