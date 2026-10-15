-- ─────────────────────────────────────────────────────────────
-- Neko Neko — Admin Studio (/admin).
--
-- CHỈ THÊM: bảng mới, không sửa / xoá cột hay dữ liệu cũ. Chạy lại nhiều lần vẫn an toàn (if not exists).
-- Quyền admin dùng bảng app_roles có sẵn (role 'admin') — cấp bằng `npm run admin:grant -- <email>`.
--
--   1. media_assets     — ảnh minh hoạ đã tải lên Supabase Storage (bucket content-media). Lưu ĐƯỜNG DẪN, không lưu base64.
--   2. content_images   — gắn một ảnh cho một mục nội dung (từ vựng, kanji, bộ thủ, ngữ pháp).
--                          on delete restrict: ảnh đang được dùng thì cơ sở dữ liệu không cho xoá.
--   3. content_status   — trạng thái biên tập (draft / review / published / archived). Mục KHÔNG có dòng = published.
--   4. admin_audit_log  — nhật ký thao tác admin. Không bao giờ ghi mật khẩu, token hay khoá.
--
-- RLS: bật cho cả bốn bảng. media_assets / content_images / content_status đọc công khai (ảnh và trạng thái là
-- nội dung học dùng chung). admin_audit_log KHÔNG có policy nào → chỉ service_role (server) đọc / ghi.
-- Không có policy ghi nào → người học không thể tự ghi, kể cả tự cấp quyền.
-- ─────────────────────────────────────────────────────────────

create table if not exists public.media_assets (
  id             uuid primary key default gen_random_uuid(),
  storage_path   text not null unique,
  mime_type      text not null check (mime_type in ('image/jpeg', 'image/png', 'image/webp')),
  size_bytes     int  not null check (size_bytes > 0),
  original_name  text not null default '',
  alt_text       text not null default '',
  created_by     uuid references auth.users(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table if not exists public.content_images (
  content_type  text not null check (content_type in ('vocabulary', 'kanji', 'radical', 'grammar')),
  content_id    int  not null,
  asset_id      uuid not null references public.media_assets(id) on delete restrict,
  alt_text      text not null default '',
  updated_by    uuid references auth.users(id) on delete set null,
  updated_at    timestamptz not null default now(),
  primary key (content_type, content_id)
);
create index if not exists content_images_asset_idx on public.content_images (asset_id);

create table if not exists public.content_status (
  content_type  text not null check (content_type in ('vocabulary', 'kanji', 'radical', 'grammar')),
  content_id    int  not null,
  status        text not null check (status in ('draft', 'review', 'published', 'archived')),
  note          text not null default '',
  updated_by    uuid references auth.users(id) on delete set null,
  updated_at    timestamptz not null default now(),
  primary key (content_type, content_id)
);

create table if not exists public.admin_audit_log (
  id           bigint generated always as identity primary key,
  actor_id     uuid references auth.users(id) on delete set null,
  actor_email  text not null default '',
  action       text not null,
  target_type  text not null default '',
  target_id    text not null default '',
  detail       jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);
create index if not exists admin_audit_log_created_idx on public.admin_audit_log (created_at desc);

alter table public.media_assets     enable row level security;
alter table public.content_images   enable row level security;
alter table public.content_status   enable row level security;
alter table public.admin_audit_log  enable row level security;

drop policy if exists "content readable" on public.media_assets;
drop policy if exists "content readable" on public.content_images;
drop policy if exists "content readable" on public.content_status;
create policy "content readable" on public.media_assets   for select to anon, authenticated using (true);
create policy "content readable" on public.content_images for select to anon, authenticated using (true);
create policy "content readable" on public.content_status for select to anon, authenticated using (true);
