# Learning Session Engine

> **Một** bộ máy cho mọi kiểu học. Các chế độ chỉ khác nhau ở **cấu hình**.
> Code: `src/features/learning/session-engine.ts` · Cấu hình: `session-modes.ts` · Test: `session-engine.test.ts`

## Nhịp một phiên

```text
Gặp lại bất ngờ → Gặp lại (trắc nghiệm) → [Khám phá một chặng → Luyện ngay chặng đó]… → Dùng trong câu → Khoảnh khắc tiến bộ
```

**Hai nguyên tắc sư phạm (bắt buộc):**

1. **Chưa gặp thì chưa hỏi.** Bước Gặp lại / Bất ngờ chỉ lấy kiến thức người học ĐÃ GẶP ít nhất một lần
   (`encounterCount > 0`). Kiến thức lộ trình mới gieo (điểm khởi đầu, chưa gặp) tính là chưa học — `toMemoryView`.
2. **Giới thiệu trước, luyện sau.** Mỗi chặng (tối đa `DAY_CHUNK_SIZE` = 5) giới thiệu từng thứ bằng thẻ Khám phá
   (mặt chữ, cách đọc, nghĩa, mẹo nhớ, nghe), xong cả chặng mới tới các câu **Luyện ngay** (`recall` + `isPractice`)
   đúng những thứ vừa học, đảo thứ tự. Chữ cái hỏi cách đọc; bộ thủ/kanji/từ hỏi nghĩa. Phương án nhiễu ưu tiên
   thứ học cùng ngày (あ/お) để phải thật sự phân biệt.

Người mới ở ngày 1 vì vậy chỉ thấy: 5 thẻ giới thiệu Hiragana → 5 câu luyện ngay — không có câu hỏi nào về thứ chưa học.

## Cấu hình các chế độ (sheet 6)

| Hằng số | Tên hiển thị | Bất ngờ | Gặp lại | Mới | Ngữ cảnh | Nguồn gặp lại | Phút |
|---|---|---|---|---|---|---|---|
| `daily` | Học hôm nay (mức tối thiểu) | 1 | 3 | **5 = một chặng** (+5 câu luyện ngay) | 1 | ưu tiên | 8 |
| `day` | Học hết ngày | 0 | 0 | **tất cả còn lại của ngày**, dừng sau mỗi 5 | 2 | — | ~1 phút/kiến thức |
| `quick5` | Học nhanh 5 phút | 1 | 3 | 0 | 0 | ưu tiên | 5 |
| `random` | Học ngẫu nhiên | 1 | 2 | 1 | 1 | ưu tiên | 6 |
| `more` | Học thêm | 0 | 3 | 3 | 0 | ưu tiên | 5 |
| `rescue` | Ôn lại sau khi nghỉ | 0 | 5 | 0 | 0 | **sắp quên** | 6 |
| `flow` | Học liên tục | 1 | 4 | 3 | 2 | ưu tiên | 12 |
| `recall` | Gặp lại kiến thức | 0 | 4 | 0 | 0 | sắp quên | 4 |
| `discover` | Khám phá | 0 | 0 | 4 | 0 | — | 4 |
| `use` | Thực hành | 0 | 0 | 0 | 4 | — | 4 |

Thêm một chế độ mới = thêm một dòng vào `SESSION_MODE_CONFIG`. **Không** tạo file engine mới.

## Nhịp học: tối thiểu vs. học hết ngày

8 phút là **mức tối thiểu để giữ nhịp**, không phải độ dài một ngày học. Một ngày lộ trình có 13–24 kiến thức.

- **Học hôm nay** = ôn trí nhớ + đúng **một chặng** (5 kiến thức mới kế tiếp của ngày đang học).
- **Học hết ngày** = MỘT phiên đi hết phần còn lại của ngày; sau mỗi chặng có **điểm dừng**
  ("Học tiếp chặng 3 · 5 kiến thức" / "Dừng ở đây") — không phải quay ra menu bấm lại.
- Kiến thức mới luôn lấy theo **thứ tự cố định** (chữ cái → bộ thủ → kanji → từ vựng → ngữ pháp), không ngẫu nhiên,
  nên dừng ở đâu thì lần sau học tiếp đúng chỗ đó. Không bao giờ lấn sang ngày sau khi ngày này chưa xong.
- Trang chủ, Một ngày học và Khoảnh khắc tiến bộ đều nói rõ "còn N kiến thức · khoảng M phút".

Tham khảo: WaniKani dạy kiến thức mới theo lô nhỏ (mặc định 5) và để người học tự quyết làm bao nhiêu lô;
Anki tách giới hạn thẻ mới khỏi thẻ ôn. Chặng 5 (`DAY_CHUNK_SIZE`) và hệ số thời gian
(`MINUTES_PER_NEW_KNOWLEDGE`) là hằng số, chỉnh được khi có dữ liệu thật.

**Thay đổi so với sheet 6:** `daily` đổi từ 2 → 5 kiến thức mới và 2 → 1 bước ngữ cảnh; thêm chế độ `day`.

## Cách chọn nội dung

- **Gặp lại**: kiến thức đã GẶP (trừ ngữ pháp), xếp theo `getReviewPriority`; lấy rộng gấp 3 lần rồi chọn tất định
  theo seed để mỗi phiên hơi khác nhau. Chế độ "sắp quên" lấy đúng từ ra-đa, thiếu thì bù bằng mục đến hạn.
- **Khám phá**: các kiến thức CHƯA GẶP của ngày đang học, theo thứ tự cố định (`unmetKnowledgeOfDay`). Ngày ôn tập không có bước này.
  Kèm câu nối vào thứ đã biết ("Nó mang bộ 日 bạn đã học ngày 17") — `knowledge-presenter.ts`.
- **Dùng trong câu**: mẫu ngữ pháp đã học; xen kẽ "chọn câu đúng" và "điền chỗ trống" (mẫu câu lấy từ bảng
  `practice_templates`). Giai đoạn bảng chữ cái chưa có ngữ pháp thì bỏ qua bước này.
- Không có kiến thức nào lặp lại trong một phiên — trừ câu Luyện ngay của thứ vừa giới thiệu.

## Đáp án & chấm điểm

Trình duyệt nhận các bước **kèm** `correctAnswer` để tự chấm (`gradeAnswer`, `session-types.ts`) và hiện đúng/sai
**ngay khi bấm** — không chờ mạng. Server vẫn là nguồn đúng: lưu bản đáp án của nó trong `session_items`, chấm lại
bằng `evaluateStepAnswer()` (cùng hàm `gradeAnswer`) rồi mới ghi trí nhớ; kết quả do trình duyệt gửi lên không bao giờ
được tin. Việc ghi chạy ngầm, nối tiếp nhau (`useLearningSession`); khi xong, dòng "lần tới gặp lại" được điền thêm.

Đánh đổi có chủ ý: người tự học mở DevTools sẽ xem trộm được đáp án — chỉ thiệt cho chính họ. Nếu sau này có chế độ
**thi thật** (kết quả có giá trị với người khác), chế độ đó phải quay lại kiểu chấm ở server và giấu đáp án.

## Tổng kết — `summarizeSession()`

Ba con số của Khoảnh khắc tiến bộ (nhớ lại · mới · dùng trong câu) + câu điểm nhấn
"Bạn vừa nhớ lại 日本 sau 6 ngày" (mục nhớ đúng có khoảng cách lâu nhất).

## Liên quan tới lộ trình

Bước **Khám phá** lấy kiến thức của ngày đang học. Phiên học **không bao giờ tự chuyển ngày**: học hết kiến thức của
ngày (`isDayReadyToComplete`) thì Trang chủ và Khoảnh khắc tiến bộ mời người học bấm "Hoàn thành ngày X" và xác nhận.
"Học hôm nay" đi một chặng; "Học hết ngày" đi hết ngày trong một phiên.

## Vòng đời ở trình duyệt — `useLearningSession`

`useQuery` tạo phiên (mỗi lần mở là một phiên mới, không tự tải lại) → `useMutation` trả lời từng bước →
bước cuối gọi `finish` rồi chuyển tới `/khoanh-khac?phien=<id>`.
