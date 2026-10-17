# Bài tập ngữ pháp — trạng thái & cách bổ sung

## Đang có (18/10/2026)

`src/features/learning/grammar-exercises.ts` sinh bài tập **từ dữ liệu thật** của 112 mẫu (`exampleJp` + `example2Jp`,
`usage`, `commonMistake`) — không có câu bịa:

| Dạng | Số câu | Nguồn |
|---|---|---|
| Chọn nghĩa (Nhật → Việt) | 224 | câu ví dụ; đáp án nhiễu = câu của mẫu khác, ưu tiên cùng bài |
| Chọn câu tiếng Nhật (Việt → Nhật) | 224 | như trên |
| Chọn trợ từ | 102 | chỉ khi trợ từ nằm trong chính mẫu câu và câu có đúng một chỗ trống; trợ từ nhiễu là trợ từ chắc chắn sai ở vị trí đó |
| Sắp xếp câu | 209 | câu ≥ 3 mảnh |
| **Tổng** | **759** | |

Số bài mỗi mẫu: 8 bài (49 mẫu) · 7 (2) · 6 (52) · 5 (5) · 4 (4). **Chưa đạt ~10 bài/mẫu** vì mỗi mẫu mới có 2 câu ví dụ.
Kiểm tra chất lượng tự động: `grammar-exercises.test.ts` (không trùng, đúng một đáp án đúng, 4 lựa chọn khác nhau,
trợ từ ghép lại đúng câu gốc, liên kết đúng mẫu + bài, bỏ trống không bao giờ tính đúng).

## Để đạt ~10 bài/mẫu

Mỗi mẫu cần thêm **1–2 câu ví dụ** (câu + cách đọc + nghĩa). Mỗi câu mới tự sinh thêm 3–4 bài (nghĩa, câu Nhật,
trợ từ nếu có, sắp xếp). Đề xuất:

1. Soạn câu mới (tự biên soạn, không chép sách) trong `content/seed/grammar-notes.json` — thêm trường `examples`
   (mảng `{ jp, reading, vi }`) cho từng mẫu; bộ sinh đọc thêm các câu này (sửa nhỏ ở `sentencesOf`).
2. Mỗi câu chỉ dùng từ vựng / Kanji đã học tới bài đó (test có thể kiểm như `reading-passages.test.ts`).
3. Người biết tiếng Nhật duyệt trước khi seed. 112 mẫu × 2 câu ≈ 224 câu.

Không nhân bản câu (đổi một từ) để đủ số — test hiện có sẽ báo trùng.
