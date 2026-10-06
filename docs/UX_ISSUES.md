# UX Issues

Ngày audit: 2026-10-06. Trạng thái: **Đã xác nhận** (thấy trong code/dữ liệu) · **Cần tái hiện** (chưa thấy, cần thử trên thiết bị).

| # | Khu vực | Vấn đề | Trạng thái | Nguyên nhân / ghi chú |
|---|---|---|---|---|
| 1 | Từ vựng / Ngữ pháp | Tab bài 1→25 lộn xộn trên production | Đã xác nhận | DB đọc `lessons` order by `id` dạng chữ ("Bài 10" < "Bài 2") |
| 2 | Từ vựng | Tab không tự cuộn tới bài đang học | Đã xác nhận | Tab mặc định "Tất cả", không biết bài hiện tại |
| 3 | Bộ thủ | Chi tiết bộ thủ mở khay lớn | Đã xác nhận | Dùng `KnowledgeSheet` chung (sheet toàn chiều cao trên desktop) |
| 4 | Kanji | Chưa thấy bộ thủ cấu thành ngay trên trang kanji cho 34 kanji | Đã xác nhận | Dữ liệu thiếu liên kết (N5_CONTENT_AUDIT) |
| 5 | Ngữ pháp | Không có cách đọc (furigana) cho câu ví dụ | Đã xác nhận | Dữ liệu chỉ có `exampleJp` |
| 6 | Trang ngày | Từ vựng không link sang trang chi tiết | Đã xác nhận | Chỉ mở sheet |
| 7 | Vườn | Thẻ chú giải "Mới học" chữ tràn | Cần tái hiện | `.plot` có `aspectRatio` + chữ 9.5px; nghi tràn ở bề rộng hẹp |
| 8 | Cài đặt | Radio (mục tiêu mỗi ngày, giọng đọc) trông như nút bo tròn | Đã xác nhận | Là `button role="radio"` dạng pill — không có chấm radio |
| 9 | Phiên học | CTA "Tiếp tục" vị trí khác nhau giữa các bước | Đã xác nhận | Bước Gặp lại ở chế độ daily: phản hồi gọn phía trên; chế độ khác: dưới đáp án |
| 10 | Toàn hệ thống | Nút async không phản hồi | Một phần | Phiên học, Hoàn thành ngày, Cài đặt đã có `aria-busy`; cần rà từng nút còn lại |
| 11 | Chuyển ngày | Cảm giác chờ khi Hoàn thành ngày → ngày mới | Cần đo | `complete-day` → `router.refresh()` dựng lại cả trang ở server |
| 12 | Theo dõi | Trí nhớ / Tiến độ / Thành tích tách 3 trang | Đã xác nhận | Đề xuất gộp `/theo-doi` có tab, giữ link cũ (redirect) |
| 13 | Hồ sơ / Cài đặt | Tách 2 trang | Đã xác nhận | Đề xuất gộp vào Cài đặt, giữ `/ho-so` → redirect |
| 14 | Luyện viết | Chỉ có bảng viết kanji; chưa có nghe-gõ (dictation) | Đã xác nhận | Tính năng mới |
| 15 | Từ vựng | Chưa có tự kiểm tra theo bài / khoảng bài | Đã xác nhận | Tính năng mới |

## Trạng thái sau khi sửa (2026-10-06)

| # | Kết quả |
|---|---|
| 1 | ✅ Bài sắp theo số (`lessonNumber`) khi đọc từ database. |
| 2 | ✅ Mở sẵn bài đang học, tab tự cuộn vào giữa tầm nhìn; thêm tab "Chữ cái". |
| 3 | ✅ Bộ thủ mở rộng tại chỗ (`RadicalExpandable`), có gợi ý "💡 Bấm vào bộ thủ để xem mẹo nhớ"; khay chi tiết trên máy tính là thẻ nổi 460px, không trải hết màn hình. |
| 4 | ✅ 103/103 kanji có bộ chính + công thức "時 = 日 + 土". |
| 5 | ✅ Cách đọc cho mọi câu ví dụ ngữ pháp (chế độ học); câu hỏi kiểm tra không hiện cách đọc. |
| 6 | ✅ Từ vựng trên trang ngày là link sang trang chi tiết; trang chi tiết có "ngày N →" dẫn về ngày đã học. |
| 7 | ✅ Đã tái hiện: chú giải bị ép vào ô cây 58px → chữ vỡ 3 dòng. Nay là hàng nhãn co giãn; chữ dài trong ô cây rút gọn bằng "…". |
| 8 | ✅ Radio thật (chấm tròn) ở Cài đặt, giọng đọc, lời chào; cập nhật lạc quan (đổi ngay khi bấm). |
| 9 | ✅ Mọi chế độ học dùng chung một bố cục: phản hồi + "Tiếp tục" ngay dưới câu hỏi. |
| 10 | ✅ Đã rà: các nút gọi API có trạng thái bận / lạc quan; POST dùng keepalive. |
| 11 | ✅ Prefetch đầy đủ ngày kề bên, ngày đang học trên bản đồ, "Bắt đầu học"; đường dẫn cũ chuyển 308 ở server. Thời gian server ~0,23–0,66 s/trang (đọc Supabase) — skeleton hiện ngay. |
| 12 | ✅ `/theo-doi` có tab Tiến độ · Trí nhớ · Thành tích; giải thích "Trí nhớ được tính thế nào". |
| 13 | ✅ Hồ sơ gộp vào Cài đặt (đổi tên hiển thị tại chỗ). |
| 14 | ✅ Nghe – gõ: từ và câu, so khớp chuẩn hoá, tô chỗ sai, điểm. |
| 15 | ✅ Tự kiểm tra từ vựng theo khoảng bài (chọn nghĩa / gõ cách đọc), điểm, danh sách cần ôn, ghi trí nhớ. |
