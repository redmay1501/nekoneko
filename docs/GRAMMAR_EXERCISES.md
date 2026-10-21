# Bài tập ngữ pháp

Luồng `/hoc-tap/ngu-phap/luyen-tap` dùng ngân hàng tĩnh `content/seed/grammar-question-bank.json`, được chuyển từ
`content/seed/grammar-question-bank.csv`. Mỗi mẫu có đúng 10 câu; trang chọn theo bài Minna hoặc theo mẫu, không cộng
câu tự sinh của engine cũ vào ngân hàng.

| Dạng hiển thị | Số câu | Nhãn trong CSV |
|---|---:|---|
| Nhật → Việt | 384 | `Nhật → Việt` |
| Việt → Nhật | 384 | `Việt → Nhật` |
| Điền từ / cấu trúc | 512 | `Điền cấu trúc/từ` |
| **Tổng** | **1.280** (10 × 128 mẫu, bản NekoNeko v2) | |

Câu điền bản v2 có gợi ý nghĩa ở cuối (`「…＿＿…。（nghĩa）」`); `buildGrammarQuestionBank` bỏ phần gợi ý trước khi so với câu gốc.

`GrammarExerciseRunner` dùng lại cho luyện tập và kiểm tra. Luyện tập hiện phản hồi sau khi chọn đáp án; kiểm tra chỉ
hiện kết quả sau khi nộp. Câu hỏi và lựa chọn được trộn tất định, đáp án đi theo đúng lựa chọn. Không ghi vào Memory Engine.

Kiểm tra tự động: `src/features/learning/grammar-question-bank.test.ts` kiểm số câu mỗi mẫu, ID, lựa chọn, đáp án,
dạng bài và lọc bài/mẫu. `src/components/learning/grammar-exercise-runner-state.test.ts` kiểm trả lời, chuyển câu, nộp
bài và làm lại.

## Kiểm duyệt nội dung

Trạng thái duyệt trong CSV/JSON được giữ nguyên. Hiện cả 1.280 câu đều ghi **“Cần rà soát ngôn ngữ và đáp án”**; chưa
có xác nhận chuyên gia tiếng Nhật. Các cờ rà soát tự động và ví dụ được ghi riêng trong
[`GRAMMAR_QUESTION_BANK_REVIEW.md`](GRAMMAR_QUESTION_BANK_REVIEW.md). Không sửa trực tiếp `n5-content.json` hoặc
`grammar-notes.json` để đưa ngân hàng vào luồng này.

## Bài tập luyện tập (NekoNeko v2)

`/hoc-tap/ngu-phap/bai-tap` dùng `content/seed/grammar-drills.json`: 200 bài (25 bài học × 8) gồm luyện thay thế,
biến đổi câu, hỏi đáp theo gợi ý và hội thoại điền chỗ trống. Loader `src/features/learning/grammar-drills.ts` kiểm dữ liệu
khi tải; chấm bằng `src/lib/utils/drill-checker.ts` (NFKC, bỏ dấu câu, chấp nhận gõ toàn kana). Hỏi đáp tự do không khớp
đáp án mẫu → hiện mẫu và cho người học tự đánh giá. Giao diện: `GrammarDrillRunner`. Không ghi vào Memory Engine.
Định dạng dữ liệu: [`README_exercises.md`](README_exercises.md), [`exercises.schema.json`](exercises.schema.json).
Toàn bộ quá trình tích hợp: [`INTEGRATION_NEKONEKO_V2.md`](INTEGRATION_NEKONEKO_V2.md).
