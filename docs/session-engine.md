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
| `daily` | Học hôm nay (một ngày trọn vẹn, theo chặng) | 1 | 4 | **≤3 học bù + 5 = một chặng** (+ câu luyện ngay) | 2 | ưu tiên | 8 |
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
- Thẻ "Học hôm nay" hiện kế hoạch phiên kế tiếp theo chặng (`previewSessionPlan`): dựng thử đúng phiên đó và đếm
  kiến thức mỗi chặng — số lượng không phụ thuộc seed nên luôn khớp phiên thật (có test).

Tham khảo: WaniKani dạy kiến thức mới theo lô nhỏ (mặc định 5) và để người học tự quyết làm bao nhiêu lô;
Anki tách giới hạn thẻ mới khỏi thẻ ôn. Chặng 5 (`DAY_CHUNK_SIZE`) và hệ số thời gian
(`MINUTES_PER_NEW_KNOWLEDGE`) là hằng số, chỉnh được khi có dữ liệu thật.

**Thay đổi so với sheet 6:** `daily` đổi từ 2 → 5 kiến thức mới và 2 → 1 bước ngữ cảnh; thêm chế độ `day`.

## Chặng của một ngày học

Mỗi bước mang `phase`: **review** (bất ngờ + gặp lại) → **backlog** (học bù) → **new** (chặng mới của hôm nay) → **use**
(dùng trong câu). Session Engine luôn xếp đúng thứ tự này (có test). Trình duyệt hiện thanh chặng
(`SessionPhaseBar`: "🔄 Gặp lại 2/5 · 🌱 Mới · ✨ Dùng thử") và một màn chuyển chặng ngắn (`PhaseIntro`) mỗi khi sang
chặng mới. Phiên lưu trước khi có `phase` → `phaseOfStep()` suy ra từ loại bước.

Màn tổng kết trả lời "khi nào gặp lại?": mỗi thứ vừa gặp kèm lịch Memory Engine đã xếp (ngày mai, 3 ngày nữa…), và
mời Học bù nếu còn kiến thức ngày trước.

## Học bù (BACKLOG) — kiến thức không bao giờ mất

Kiến thức của các ngày TRƯỚC ngày đang học mà người học **chưa gặp lần nào** (bấm "Hoàn thành ngày" khi còn sót,
bỏ dở…) là **Học bù** — `backlogKnowledge()` trong `session-engine.ts`. Suy ra trực tiếp từ trí nhớ, không có bảng
riêng: còn chưa gặp thì vẫn còn đó, gặp rồi thì tự rời đi.

- "Học hôm nay" học bù tối đa `BACKLOG_PER_DAILY_SESSION` (3) thứ cũ nhất **trước** chặng mới của hôm nay — mỗi nhóm
  giới thiệu xong mới luyện, không trộn.
- Chế độ `backlog` (`/hoc/backlog`, "Học bù") chỉ lấy kiến thức ngày cũ, 5 thứ mỗi phiên.
- Lộ trình ≠ Trí nhớ: sang ngày mới khi còn sót thì phần sót chuyển vào Học bù (nút Hoàn thành ngày nói rõ điều này).

## Học tiếp phiên dở dang

Tải lại trang / đóng tab giữa chừng: `startLearningSession()` tìm phiên **chưa kết thúc** cùng chế độ, cùng ngày lộ
trình, trong 12 giờ qua, còn bước chưa làm → trả lại đúng phiên đó với `resumeFromStep` = bước đầu tiên chưa làm
(các bước trước đã lưu). Trình duyệt nhảy tới bước đó và nhắc "Học tiếp từ chỗ bạn dừng lại".

## Cách chọn nội dung

- **Gặp lại**: kiến thức đã GẶP (trừ ngữ pháp), xếp theo `getReviewPriority`; lấy rộng gấp 3 lần rồi chọn tất định
  theo seed để mỗi phiên hơi khác nhau. Chế độ "sắp quên" lấy đúng từ ra-đa, thiếu thì bù bằng mục đến hạn.
- **Khám phá**: các kiến thức CHƯA GẶP của ngày đang học, theo thứ tự cố định (`unmetKnowledgeOfDay`). Ngày ôn tập không có bước này.
  Kèm câu nối vào thứ đã biết ("Nó mang bộ 日 bạn đã học ngày 17") — `knowledge-presenter.ts`.
  **Ngữ cảnh** (`context-index.ts`): từ vựng/kanji có một câu ví dụ — chọn câu có NHIỀU thứ người học đã biết và ít
  thứ lạ nhất, kèm "✨ Bạn đã từng gặp: 私、朝" (kiến thức cũ quay lại trong kiến thức mới). Chữ cái có vài từ bắt đầu
  bằng chữ đó. Câu lấy từ bảng `example_sentences` (Tatoeba, CC BY 2.0 FR — `scripts/fetch-examples.ts`, chỉ câu ngắn
  dùng 103 kanji N5 và có bản dịch tiếng Việt đã duyệt) và câu mẫu ngữ pháp. Khớp bằng chuỗi con theo phần gốc
  (`食べます` → `食べ`), không cần tách từ.
- **Dùng trong câu**: mẫu ngữ pháp đã học; xen kẽ "chọn câu đúng" và "điền chỗ trống". Điền chỗ trống ưu tiên **câu
  thật** có từ đó (`realSentenceBlank` — đục đúng chỗ từ, phương án nhiễu cùng kiểu chữ); không có thì dùng câu mẫu
  `practice_templates`. Giai đoạn bảng chữ cái chưa có ngữ pháp thì bỏ qua bước này.
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

## Ngoài phiên học: Luyện nghe, ngày ôn & chuỗi ngày

- **Luyện nghe** (`/luyen-tap/nghe`): mỗi câu nghe-chọn-nghĩa gửi `POST /api/memory/practice`; SERVER chấm (so với nghĩa
  của từ) và ghi một lần nhớ lại (`recall`). Mỗi từ chỉ tính **tối đa một lần mỗi ngày** — từ đã gặp hôm nay (kể cả
  trong phiên học) thì không ghi nữa, để làm lại bài liên tục không "bơm" điểm trí nhớ. Nói / đọc / viết là luyện tự do,
  không có đáp án gắn với một kiến thức nên không ghi.
- **Ngày ôn & chuỗi ngày** (`features/progress/recall-streak.ts`): hàm SQL `recall_dates()` trả về các ngày (giờ Việt Nam)
  có ít nhất một lần nhớ đúng. Từ đó: "Đã ôn N ngày" = số ngày trong 30 ngày qua; chuỗi hiện tại (hôm nay chưa ôn vẫn giữ
  chuỗi tới hôm qua); chuỗi dài nhất — thành tích "Chuỗi 7 ngày" dựa vào chuỗi dài nhất nên đạt rồi không mất.
- **Ngữ pháp JLPT** (`features/progress/jlpt-coverage.ts`): danh sách JLPT không có bài riêng; một mẫu tính là đã gặp khi
  một mẫu Minna người học đã học chứa nó. Vài mẫu chỉ có tên tiếng Việt / không có trong Minna nên không tự tính được.
