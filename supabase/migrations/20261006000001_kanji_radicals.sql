-- ─────────────────────────────────────────────────────────────
-- Neko Neko — Kanji ↔ bộ thủ theo ID (content/seed/kanji-radicals.json).
-- Trước đây quan hệ chỉ nằm trong cột văn bản radicals.kanji_list → 34/103 kanji N5 không gắn bộ nào.
-- position 0 = bộ chính (hệ 214 bộ), các vị trí sau = bộ nhìn thấy trong chữ (mẹo nhớ).
-- Bộ chưa có trong lộ trình được thêm vào radicals với day = null (bộ tham khảo).
-- ─────────────────────────────────────────────────────────────

create table if not exists public.kanji_radicals (
  kanji_id    int not null references public.kanji (id) on delete cascade,
  radical_id  int not null references public.radicals (id) on delete cascade,
  position    int not null default 0,
  primary key (kanji_id, radical_id)
);

create index if not exists kanji_radicals_radical_idx on public.kanji_radicals (radical_id);

alter table public.kanji_radicals enable row level security;
create policy "content readable" on public.kanji_radicals for select to anon, authenticated using (true);
