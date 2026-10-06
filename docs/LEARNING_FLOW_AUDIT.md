# Learning Flow Audit

Ngày audit: 2026-10-06. Mô tả hệ thống **đang chạy** và chỗ lệch so với brief.

## Kiến trúc hiện tại (giữ nguyên)

- **Memory Engine** (`features/memory`): điểm trí nhớ, trạng thái hiển thị, lịch gặp lại. Hoạt động đúng — không thay.
- **Session Engine** (`features/learning/session-engine.ts`): một engine cho mọi chế độ; chặng Gặp lại → Học bù → Mới → Dùng thử;
  phương án nhiễu chỉ từ thứ đã biết; phiên dở dang học tiếp được.
- **Lộ trình**: `journey_days` + `day_tasks` (văn bản soạn sẵn từ Excel) + `day` trên từng kiến thức (kana, kanji, từ, ngữ pháp, bộ thủ).
  Ngày Katakana = ngày Hiragana + 7. Ngày chỉ tăng khi người học xác nhận hoàn thành.

## Lộ trình ngày 1–15 — hiện trạng và đề xuất

| Ngày | Hiện tại | Vấn đề | Đề xuất |
|---|---|---|---|
| 1 | あ→こ (10) | — | giữ: hàng あ, か (10) |
| 2 | さ→て (9) | cắt ngang hàng た | hàng さ, た (10) |
| 3 | と→ふ (9) | cắt ngang hàng た, は | hàng な, は (10) |
| 4 | へ→ゆ (9) | cắt ngang hàng は, や | hàng ま, や (8) |
| 5 | よ→ん (9) | cắt ngang hàng や | hàng ら, わ, ん (8) |
| 6 | 25 âm đục/bán đục **+ 33 âm ghép** | quá tải (58 âm) | chỉ âm đục + bán đục (25) + bảng so sánh + mẹo nhớ |
| 7 | Ôn & kiểm tra Hiragana | không có kiến thức mới trong app | âm ghép 拗音 (33) + ôn Hiragana |
| 8–12 | Katakana theo cùng cách cắt | như ngày 1–5 | tự đúng khi sửa ngày Hiragana (offset +7) |
| 13 | Katakana âm đục + âm ghép | quá tải; brief yêu cầu đủ giải thích | âm đục + bán đục Katakana (như ngày 6) |
| 14 | Ôn Katakana | — | âm ghép Katakana + ôn |
| 15 | Minna bài 1: 日、一, bộ 亻, 3 mẫu ngữ pháp, 7 từ | trang ngày chỉ liệt kê | trang ngày trả lời: học gì, vì sao, từ/mẫu nào, ví dụ, cách đọc, mẹo, link chi tiết |

Lưu ý: `day_tasks` (văn bản "Học 9 âm…", "Học 25 âm đục… 33 âm ghép") phải sửa **cùng lúc** với `day` của kana,
nếu không lộ trình nói một đằng, phiên học dạy một nẻo.

**Cần xác nhận**: brief nói "Ngày 8 trở đi … thực tế là ngày ôn". Theo dữ liệu, ngày 8 là **bắt đầu Katakana** (chữ mới).
Các ngày ôn thật sự hiện là 7, 14 và các ngày `hasNewKnowledge = false` về sau (ví dụ 21, 28…).

## Thẻ / màn liên quan

- **Trang ngày** (`/lo-trinh/ngay/[day]`): có kiến thức của ngày + timeline việc cần làm. Thiếu: "vì sao học", bảng âm cho ngày kana,
  ví dụ/cách đọc cho ngày Minna; từ vựng có chạm để xem (sheet) nhưng **không có link sang trang chi tiết từ** (`/hoc-tap/tu-vung/[id]`).
- **Ngày ôn**: nhãn hiện dựa vào `hasNewKnowledge`; nội dung ôn (ôn cái gì) chưa được liệt kê.
- **Popup**: lần đầu = lời chào 3 bước (DB `welcomed_at`); sau đó lời chào ngày (localStorage theo ngày VN) dựa trên chuỗi ngày,
  ngày nghỉ, kế hoạch hôm nay. Chưa tách loại "học tiếp phiên dở", "nhắc ôn".
- **`/hoc/day`**: giữ cho link cũ; "Học hôm nay" nay đã đi hết ngày theo chặng.
