-- ─────────────────────────────────────────────────────────────
-- Neko Neko — Bản sao ảnh câu chuyện Kanji trên Storage của app.
--
-- image_url (URL gốc Pixabay / Wikimedia) giữ nguyên để truy nguồn và ghi công.
-- image_hosted_url = bản sao WebP trong bucket content-media (scripts/host-kanji-story-images.ts điền).
-- App dùng bản sao trước, lỗi thì về URL gốc. Cột trống → app dùng URL gốc như trước.
--
-- Chạy lại an toàn (add column if not exists).
-- ROLLBACK: alter table public.kanji_stories drop column if exists image_hosted_url;
-- ─────────────────────────────────────────────────────────────

alter table public.kanji_stories add column if not exists image_hosted_url text;
