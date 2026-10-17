# Rà soát ngân hàng câu hỏi ngữ pháp

## Phạm vi và cách dùng

`content/seed/grammar-question-bank.json` là bản chuyển dữ liệu tĩnh, giữ nguyên các trường câu hỏi từ
`content/seed/grammar-question-bank.csv`. Ứng dụng chỉ chuẩn hoá hai nhãn điền (`Điền cấu trúc/từ` và
`Điền từ theo câu`) thành cùng dạng hiển thị **Điền từ / cấu trúc**. Không sửa câu hỏi, lựa chọn, đáp án,
giải thích hoặc trạng thái duyệt trong dữ liệu nguồn.

Kiểm tra tự động trên CSV:

- 1.120 dòng, 112 Mẫu ID; mỗi mẫu có đúng 10 câu.
- Không trùng ID; không thiếu trường bắt buộc.
- Cả 1.120 câu có bốn lựa chọn khác nhau và đáp án đúng nằm trong lựa chọn.
- Mẫu ngữ pháp và số bài khớp với 112 mẫu trong `n5-content.json`.
- 337 câu Nhật → Việt, 336 câu Việt → Nhật, 347 câu Điền cấu trúc/từ và 100 câu Điền từ theo câu.
- **Cả 1.120 câu đều ở trạng thái “Cần rà soát ngôn ngữ và đáp án”. Không có câu nào được đánh dấu đã duyệt.**

## Cần người rà soát

Các phát hiện dưới đây là cờ rà soát, không phải quyết định tự sửa nội dung:

1. **18 câu điền không khớp câu gốc sau khi thay chỗ trống bằng đáp án đúng:**
   `G003-Q07`, `G008-Q07`, `G009-Q07`, `G012-Q07`, `G015-Q07`, `G022-Q07`, `G039-Q07`, `G040-Q07`,
   `G045-Q07`, `G049-Q07`, `G067-Q07`, `G075-Q07`, `G076-Q07`, `G077-Q07`, `G079-Q07`, `G082-Q07`,
   `G083-Q07`, `G085-Q07`. Ví dụ: `G009-Q07` hỏi `これは □ 本です。` với đáp án `日本語の`, nhưng câu gốc là
   `これは 日本語の 辞書です。`. Phản hồi không dùng câu gốc lệch ở những trường hợp này; dữ liệu CSV/JSON vẫn được giữ để rà soát.
2. **Hai cặp câu hỏi lặp nội dung:** `G039-Q08` / `G039-Q10` (đều là câu điền `＿＿ 車を 買いました。`) và
   `G094-Q02` / `G094-Q04` (đều hỏi nghĩa của `ごはん、食べた？`). Các dòng vẫn được giữ nguyên, không tự xoá để đủ số lượng.
3. **277 giải thích có dấu câu `..` liền nhau**, ví dụ `G001-Q08`: `Anh/chị Tanaka là giáo viên.. Kiểm tra mẫu...`.
4. Một số câu nhiễu không cùng dạng với câu hỏi; ví dụ `G002-Q05` hỏi dịch một câu nhưng có lựa chọn `行って → 行った`.
   Cần rà tính hợp lý của câu nhiễu và độ tự nhiên của bản dịch trên toàn bộ ngân hàng.

CSV có 336 câu ghi nguồn là câu mới tự biên soạn và 784 câu ghi nguồn ngân hàng cũ / nội dung hiện tại. Nguồn gốc không
thay thế việc kiểm duyệt ngôn ngữ. Chưa có xác nhận của chuyên gia tiếng Nhật cho bất kỳ câu nào trong file.
