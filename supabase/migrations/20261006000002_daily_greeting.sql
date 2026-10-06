-- ─────────────────────────────────────────────────────────────
-- Neko Neko — Lời chào mỗi ngày: nhớ lần chào gần nhất ở database (không ở trình duyệt).
--
-- greeted_at: lúc người học thấy (và đóng / bấm học) lời chào đầu ngày. Trang chủ chỉ chào khi greeted_at
-- không cùng ngày (giờ Việt Nam) với hôm nay → đổi máy, đổi trình duyệt cũng không bị chào lặp trong ngày;
-- nghỉ vài ngày quay lại vẫn được chào (lời chào dựa vào NGÀY + tình hình học, không dựa vào ngày lộ trình).
-- Cờ giao diện, không ảnh hưởng trí nhớ → người học tự ghi được (policy "own settings editable").
-- ─────────────────────────────────────────────────────────────

alter table public.user_settings add column if not exists greeted_at timestamptz;
