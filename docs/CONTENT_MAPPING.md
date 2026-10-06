# Content Mapping

Ngày audit: 2026-10-06.

## ID ổn định hiện có

| Loại | Bảng | Khoá | Ổn định? | Ghi chú |
|---|---|---|---|---|
| Kana (Hiragana + Katakana) | `kana` | `id` int (1–104) | ✓ | Một dòng = cặp hiragana/katakana; `contentKey` = `hiragana-N` / `katakana-N` |
| Bộ thủ | `radicals` | `id` int | ✓ | `kanjiList` là **chuỗi văn bản**, không phải danh sách id |
| Kanji | `kanji` | `id` int | ✓ | `words` là chuỗi văn bản |
| Từ vựng | `vocabulary` | `id` int | ✓ | `lesson` là **nhãn văn bản** ("BÀI 1 · …"), không phải khoá |
| Ngữ pháp | `grammar` | `id` int | ✓ | `lesson` là nhãn văn bản |
| Bài | `lessons` | `id` text ("Bài 1") | ⚠️ | Khoá chữ → sắp sai thứ tự; cần số bài |
| Ngày | `journey_days` | `day` int | ✓ | Các ô `kanjiSummary`, `vocabSummary`… là **văn bản tóm tắt**, không tham chiếu |
| Việc trong ngày | `day_tasks` | (`day`, `order_no`) | ✓ | Văn bản soạn sẵn từ Excel |
| Câu ví dụ | `example_sentences` | `id` = mã câu Tatoeba | ✓ | Gắn với kiến thức bằng khớp chuỗi lúc chạy (`context-index.ts`) |

## Nguồn sự thật cho "ngày N dạy gì"

Đã đúng hướng: phiên học lấy kiến thức theo trường `day` của từng mục (tham chiếu bằng id) — **không** đọc văn bản tóm tắt.
Chỗ có thể lệch: **văn bản** `journey_days.*Summary` và `day_tasks.body` được soạn tay. Khi đổi `day` của kiến thức mà
không sửa văn bản → "lộ trình nói A, phiên học dạy B".

Đề xuất:
1. Trang ngày hiển thị danh sách kiến thức **từ id** (đã làm ở `DayKnowledgeBlock`) — văn bản tóm tắt chỉ là phụ đề.
2. Sinh lại `day_tasks` cho ngày kana từ dữ liệu (`kana.day`) thay vì sửa tay.
3. Thêm `lesson_no int` cho `lessons`, `vocabulary`, `grammar` (suy từ nhãn "BÀI N") để sắp xếp và liên kết bài ↔ ngày.
4. Thêm bảng nối `kanji_radicals (kanji_id, radical_id)` thay cho `kanjiList` văn bản.

## Đã làm (2026-10-06)

- `kanji_radicals (kanji_id, radical_id, position)` thay cho cột văn bản: sinh từ `content/seed/kanji-radicals.json` (bộ chính theo
  hệ 214 bộ + bộ nhìn thấy trong chữ). 26 bộ chưa có trong lộ trình thêm vào `radicals` với `day = null` (bộ tham khảo).
  `kanji_list` được tính lại từ liên kết → văn bản và liên kết luôn khớp.
- Bài được sắp theo **số bài** khi đọc từ database (`lessonNumber`), không theo khoá chữ.
- Trang ngày lấy chữ cái của ngày từ danh mục kiến thức (gồm Katakana) — hết cảnh ngày Katakana bị coi là "ngày ôn".
- Lộ trình kana theo hàng âm: điều chỉnh `kana-by-row` trong `scripts/roadmap_adjustments.py` (đổi `kana.day`, tiêu đề ngày,
  văn bản đầu việc, mẹo nhớ âm đục/âm ghép cùng lúc → lộ trình và phiên học nói cùng một điều).
