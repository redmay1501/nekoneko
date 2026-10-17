# Bài tập ngữ pháp

Luồng `/hoc-tap/ngu-phap/luyen-tap` dùng ngân hàng tĩnh `content/seed/grammar-question-bank.json`, được chuyển từ
`content/seed/grammar-question-bank.csv`. Mỗi mẫu có đúng 10 câu; trang chọn theo bài Minna hoặc theo mẫu, không cộng
câu tự sinh của engine cũ vào ngân hàng.

| Dạng hiển thị | Số câu | Nhãn trong CSV |
|---|---:|---|
| Nhật → Việt | 337 | `Nhật → Việt` |
| Việt → Nhật | 336 | `Việt → Nhật` |
| Điền từ / cấu trúc | 447 | `Điền cấu trúc/từ` (347) + `Điền từ theo câu` (100) |
| **Tổng** | **1.120** | |

`GrammarExerciseRunner` dùng lại cho luyện tập và kiểm tra. Luyện tập hiện phản hồi sau khi chọn đáp án; kiểm tra chỉ
hiện kết quả sau khi nộp. Câu hỏi và lựa chọn được trộn tất định, đáp án đi theo đúng lựa chọn. Không ghi vào Memory Engine.

Kiểm tra tự động: `src/features/learning/grammar-question-bank.test.ts` kiểm số câu mỗi mẫu, ID, lựa chọn, đáp án,
dạng bài và lọc bài/mẫu. `src/components/learning/grammar-exercise-runner-state.test.ts` kiểm trả lời, chuyển câu, nộp
bài và làm lại.

## Kiểm duyệt nội dung

Trạng thái duyệt trong CSV/JSON được giữ nguyên. Hiện cả 1.120 câu đều ghi **“Cần rà soát ngôn ngữ và đáp án”**; chưa
có xác nhận chuyên gia tiếng Nhật. Các cờ rà soát tự động và ví dụ được ghi riêng trong
[`GRAMMAR_QUESTION_BANK_REVIEW.md`](GRAMMAR_QUESTION_BANK_REVIEW.md). Không sửa trực tiếp `n5-content.json` hoặc
`grammar-notes.json` để đưa ngân hàng vào luồng này.
