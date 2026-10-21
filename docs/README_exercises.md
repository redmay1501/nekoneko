# NekoNeko – Bài tập luyện tập N5 (tích hợp web)

## Nội dung
- 25 bài ngữ pháp × 8 bài tập = **200 bài tập**, 793 mục/chỗ trống.
- 4 dạng (mỗi bài 2 bài mỗi dạng):

| type | Tên | Cách làm | Cách chấm |
|---|---|---|---|
| `substitution` | Luyện thay thế | Có khung câu `frame` + gợi ý (`prompt`), người học gõ cả câu | `answer_mode: "exact"` → `checkItem()` |
| `transformation` | Biến đổi câu | Có câu gốc / dạng gốc (`prompt`), người học gõ câu đã biến đổi | `exact` → `checkItem()` |
| `qa` | Hỏi đáp theo gợi ý | Có câu hỏi (`prompt`) + gợi ý tiếng Việt (`cue_vi`) | `answer_mode: "model"` → `checkItem()`, nếu sai thì hiện đáp án mẫu + cho tự đánh giá (có `similarity()` để gợi ý) |
| `dialogue` | Hội thoại điền chỗ trống | Hội thoại `lines[]`, chỗ trống `{{n}}`, chọn 1/4 trong `blanks[n].options` | `checkBlank(choice, blank)` – `answer_index` đếm từ 1 |

- Mục `items[0]` (có `is_example: true`) là **ví dụ mẫu**: hiển thị sẵn đáp án, không tính điểm.
- `pattern_ids` khớp với `grammar[].id` trong `nekoneko_n5.json` → làm link "Xem lại ngữ pháp".
- `grammar_lesson` khớp với `grammar_lessons[]` và `tests[].grammar_lesson`.

## File
- `nekoneko_exercises.json` – dữ liệu (cũng đã gộp vào `nekoneko_n5.json` dưới khóa `exercises`)
- `exercises.schema.json` – JSON Schema (draft 2020-12) để validate khi import
- `checker.ts` – hàm chấm: `normalize`, `checkItem`, `similarity`, `checkBlank`, `renderLine`
- `nekoneko-exercises.xlsx` – bản Excel để người duyệt nội dung đọc/sửa

## Chuẩn hóa khi chấm (`normalize`)
NFKC (đổi full-width ↔ half-width), bỏ khoảng trắng & dấu câu (。、？！「」…), katakana → hiragana.
Người học gõ kanji, gõ toàn hiragana, gõ katakana, có/không dấu cách đều được chấp nhận
(so với `answers[]` và `readings[]`). Đã chạy thử với toàn bộ 860 đáp án: 0 lỗi.

## Gợi ý giao diện
- **Thay thế / biến đổi:** hiện `instruction_vi`, `frame` (nếu có), ví dụ mẫu; mỗi mục 1 ô nhập + nút "Kiểm tra"; sai → hiện `answers[0]` và `readings[0]` (furigana).
- **Hỏi đáp:** hiện câu hỏi + chip gợi ý `cue_vi`; sau khi nộp luôn hiện đáp án mẫu; nếu không khớp, cho người học bấm "Mình trả lời đúng ý" / "Chưa đúng".
- **Hội thoại:** hiện từng dòng theo `speaker` (A/B/C) như khung chat; `{{n}}` → dropdown/nút chọn; nút "Xem bản dịch" dùng `lines[].vi`; nút "Xem cách đọc" dùng `lines[].reading`.
- **Nghe:** mọi hội thoại có `script_for_listening: true` → dùng `text_full` để thu âm hoặc TTS, rồi làm bài nghe điền chỗ trống với cùng `blanks`.

## Trạng thái & bản quyền
- Toàn bộ câu, tình huống, nhân vật do NekoNeko tự biên soạn; chỉ mô phỏng **dạng** bài tập thông dụng, không lấy nội dung từ giáo trình.
- `readings` / `reading` tạo tự động – cần người biết tiếng Nhật duyệt trước khi dùng làm furigana chính thức.
- Mọi bài tập đang ở trạng thái **cần duyệt** (xem cột "Trạng thái" trong Excel).
