-- NekoNeko v2 (2026-10-21) — xem docs/INTEGRATION_NEKONEKO_V2.md
-- 1) 14 Kanji N5 trước đây chỉ học ở ngày tổng ôn 82 (không có trong từ giáo trình) nay có từ N5 mới chứa nó
--    → học ở đúng ngày của từ đầu tiên chứa chữ (luật của lộ trình). Chỉ đổi cột day, KHÔNG đụng bảng trí nhớ.
-- 2) 16 mẫu ngữ pháp (id 113–128) và 223 từ N5 mới (tối đa 26 từ / ngày) được THÊM bằng `npm run seed:content` (upsert theo id),
--    nên migration này không chèn nội dung.
update public.kanji as t set day = v.day from (values
  (27, 53),
  (40, 38),
  (50, 57),
  (55, 54),
  (61, 56),
  (62, 20),
  (67, 54),
  (73, 56),
  (79, 25),
  (80, 53),
  (93, 53),
  (96, 53),
  (99, 51),
  (103, 38)
) as v(id, day) where t.id = v.id;
