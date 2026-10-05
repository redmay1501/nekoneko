-- ─────────────────────────────────────────────────────────────
-- Neko Neko — Câu ví dụ tiếng Nhật ↔ tiếng Việt (ngữ cảnh cho thẻ học, ôn tập, "Dùng thử").
--
-- Nguồn: Tatoeba (https://tatoeba.org) — giấy phép CC BY 2.0 FR. Mỗi câu giữ mã câu + người đóng góp của câu
-- tiếng Nhật và bản dịch tiếng Việt để ghi nguồn. Lọc cho N5: câu ngắn, chỉ dùng 103 kanji N5.
-- Sinh bằng scripts/fetch-examples.ts → content/seed/examples.json → npm run seed:content.
-- Câu nào chứa kiến thức nào: tính ở ứng dụng (context-index.ts), không lưu cứng.
-- ─────────────────────────────────────────────────────────────

create table if not exists public.example_sentences (
  id        int primary key,          -- mã câu tiếng Nhật trên Tatoeba
  text_jp   text not null,
  text_vi   text not null,
  vi_id     int,                      -- mã câu tiếng Việt trên Tatoeba
  owner     text,                     -- người đóng góp câu tiếng Nhật
  vi_owner  text,                     -- người dịch tiếng Việt
  source    text not null default 'tatoeba'
);

alter table public.example_sentences enable row level security;
drop policy if exists "content readable" on public.example_sentences;
create policy "content readable" on public.example_sentences for select to anon, authenticated using (true);
