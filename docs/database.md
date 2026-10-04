# Database

> Migration: `supabase/migrations/` (chạy theo thứ tự tên file) · Kiểm chứng: `npm run test:db`

## Ba nhóm bảng

| Nhóm | Bảng | Ai đọc | Ai ghi |
|---|---|---|---|
| Nội dung | `journey_days`, `day_tasks`, `kana`, `radicals`, `kanji`, `vocabulary`, `grammar`, `lessons`, `jlpt_grammar`, `study_resources`, `reading_passages`, `practice_templates` | mọi người (anon + authenticated) | chỉ `service_role` (script seed) |
| Người học | `profiles`, `user_settings`, `app_roles` | chính chủ | chính chủ — riêng `profiles` chỉ được sửa `display_name`, `exam_date` (KHÔNG sửa được `current_day`) |
| Lộ trình | `journey_day_completions` | chính chủ | chỉ `service_role` qua `advance_journey_day` |
| Trí nhớ | `memory_items`, `review_events`, `learning_sessions`, `session_items` | chính chủ (trừ `session_items`) | **chỉ `service_role`** qua Route Handler |

`session_items` chứa đáp án đúng → không ai ngoài server đọc được (`revoke select`).

## Hàm `apply_memory_update(...)`

Lưu MỘT lần gặp lại trong một transaction: upsert `memory_items` + insert `review_events` + đánh dấu
`session_items`. Gửi trùng `request_id` → không làm gì, trả `{ duplicate: true }`. Chỉ `service_role` được gọi.
Hàm này **không tính toán** — mọi con số do Memory Engine (TypeScript) truyền vào.

## Hàm `advance_journey_day(user_id, from_day, method)`

Chuyển sang ngày kế tiếp khi xong ngày `from_day` (`method` = `auto` | `manual`). Khoá dòng hồ sơ (`for update`),
**chỉ chuyển nếu `from_day` đúng là `current_day`** → bấm hai lần, hai tab, hay gửi ngày chưa tới đều không làm gì.
Xong ngày 90: giữ `current_day = 90`, ghi `journey_completed_at`. Ghi nhật ký vào `journey_day_completions`.
Chỉ `service_role` được gọi. Migration: `20261004000001_journey_progress.sql`.

## Trigger `on_auth_user_created`

Tạo `profiles` (tên lấy từ metadata `display_name` hoặc phần trước @ của email, `current_day = 1`, `start_date = hôm nay`),
`user_settings` mặc định, và vai trò `learner`.

## Nội dung: từ Excel tới database

```text
content/source/Lo_trinh_JLPT_N5_90_ngay_Minna.xlsx      ← nguồn sự thật
   │  python3 scripts/convert-roadmap.py  (chỉ chạy lại khi Excel đổi; cần `pip install openpyxl`)
   ▼
content/seed/n5-content.json  (+ supplement.json: nội dung Neko Neko tự soạn)
   │  npm run seed:content     (upsert, chạy lại bao nhiêu lần cũng được)
   ▼
Bảng nội dung trong Supabase
```

Script chuyển đổi tự kiểm tra số lượng (90 ngày, 491 đầu việc trong Excel — còn 486 sau điều chỉnh ở `scripts/roadmap_adjustments.py`, 104 kana, 45 bộ thủ, 103 kanji, 112 ngữ pháp,
350 từ vựng, 25 bài, 94 mẫu JLPT) và **dừng** nếu lệch. Ánh xạ dòng ⇄ nội dung ở
`src/lib/data/supabase-content-mapper.ts`, có test đọc-ghi khứ hồi.

## Thay đổi schema

1. Tạo file migration MỚI trong `supabase/migrations/` (không sửa file đã chạy trên production).
2. Cập nhật `src/lib/supabase/database-rows.ts` (hoặc sinh tự động: `supabase gen types typescript`).
3. `npm run test:db`.
4. Ghi lại vào file này.
