-- ─────────────────────────────────────────────────────────────
-- Neko Neko — Câu chuyện ghi nhớ Kanji (content/seed/kanji-stories.json ← docs/nekoneko-kanji-story-library-…-v9.html).
--
-- NỘI DUNG dùng chung, không phải dữ liệu người học:
--   - không đụng bảng kanji (nghĩa, âm đọc, ngày học giữ nguyên) và không đụng memory_items / review_events / journey_*;
--   - "đã đọc chuyện" của người học lưu ở user_settings.game_records (khoá "chuyen-kanji<n>:<id>") — KHÔNG đổi điểm trí nhớ.
--
-- Phiên bản / ngôn ngữ: khoá (kanji_id, locale, version). App dùng bản 'published' có version cao nhất của (kanji_id, locale).
--   Viết lại chuyện → thêm version mới. Quay về bản cũ → đặt bản mới là 'archived'.
-- Giấy phép ảnh: có URL nguồn ≠ đã được cấp phép thương mại → mặc định 'unverified'.
-- Ảnh: image_url = URL gốc của thư viện (giữ nguyên để truy nguồn). Bản sao trên Storage: migration 20261112000002.
--
-- Seed: `npm run seed:content` chỉ THÊM dòng (kanji_id, locale, version) còn thiếu — không ghi đè dòng đã có (sửa tay an toàn).
-- App đọc bảng nếu có dòng; bảng chưa có / rỗng → dùng bản trong repo (lib/data/kanji-stories.ts).
--
-- ROLLBACK (an toàn — không bảng nào tham chiếu tới bảng này, app tự quay về bản trong repo):
--   drop table if exists public.kanji_stories;
-- ─────────────────────────────────────────────────────────────

create table if not exists public.kanji_stories (
  kanji_id              int  not null references public.kanji (id) on delete cascade,
  locale                text not null default 'vi',
  version               int  not null check (version > 0),
  status                text not null default 'published' check (status in ('draft', 'published', 'archived')),
  source_id             text,
  category              text not null default '',
  category_label        text not null default '',
  title                 text not null default '',
  content               text not null check (length(content) > 0),
  memory_tip            text not null default '',
  example_words         jsonb not null default '[]'::jsonb check (jsonb_typeof(example_words) = 'array'),
  image_url             text,
  image_alt             text not null default '',
  image_source_url      text not null default '',
  image_source_label    text not null default '',
  image_provider        text not null default '',
  image_credit          text not null default '',
  image_width           int,
  image_height          int,
  image_resolution      text not null default '',
  image_license         text not null default '',
  image_license_url     text not null default '',
  image_license_status  text not null default 'unverified' check (image_license_status in ('unverified', 'verified', 'rejected')),
  image_description     text not null default '',
  image_usage_note      text not null default '',
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  primary key (kanji_id, locale, version)
);

create index if not exists kanji_stories_published_idx on public.kanji_stories (kanji_id, locale, version desc) where status = 'published';

alter table public.kanji_stories enable row level security;
-- Đọc công khai như mọi bảng nội dung, nhưng chỉ bản đã xuất bản. Không có policy ghi → chỉ service_role (seed / admin) ghi.
drop policy if exists "content readable" on public.kanji_stories;
create policy "content readable" on public.kanji_stories for select to anon, authenticated using (status = 'published');
