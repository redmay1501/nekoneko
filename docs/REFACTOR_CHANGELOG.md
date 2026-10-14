# Refactor Changelog — 2026-10-06

Theo brief audit sản phẩm (phần A–X). Không viết lại dự án; Memory Engine / Session Engine giữ nguyên, chỉ mở rộng.
Chi tiết hiện trạng & lý do: `N5_CONTENT_AUDIT.md`, `LEARNING_FLOW_AUDIT.md`, `UX_ISSUES.md`, `CONTENT_MAPPING.md`.

## Dữ liệu & mô hình (Phase 2–3)
- Lộ trình kana theo hàng âm: ngày 1–5 = 10/10/10/8/8; ngày 6 chỉ âm đục & bán đục; ngày 7 âm ghép + ôn. Katakana 8–14 đi theo.
  Điều chỉnh `kana-by-row` (`scripts/roadmap_adjustments.py`) đổi cùng lúc ngày học, tiêu đề ngày, văn bản đầu việc, mẹo nhớ.
- `kanji_radicals` (kanji ↔ bộ thủ theo id, bộ chính đứng đầu) + 26 bộ tham khảo; `kanji_list` tính lại từ liên kết.
- Từ vựng 350 → 759 (`n5-vocabulary-supplement`, `vocabulary-dedupe`); seed xoá dòng không còn trong nội dung.
- Ngữ pháp: cách đọc, khi nào dùng, lỗi thường gặp, ví dụ 2 cho cả 112 mẫu (`grammar-notes.json`).
- Ảnh minh hoạ cho 133 danh từ cụ thể (`vocabulary-images.json`, `npm run icons:fetch`).
- Bài sắp theo số bài khi đọc từ database.

## Luồng học hằng ngày (Phase 4)
- Một bố cục phiên học cho mọi chế độ (CTA ngay dưới câu hỏi).
- Lời chào đầu ngày theo trạng thái học + ngày (`greeted_at` trong database, không chào lặp trong ngày; mời học tiếp phiên dở).

## Phản hồi & tốc độ (Phase 5)
- Prefetch ngày kề bên / ngày đang học / "Bắt đầu học"; chuyển hướng đường dẫn cũ 308 ở server.
- Cập nhật lạc quan ở Cài đặt; POST keepalive.

## Trang ngày 1–15 (Phase 6)
- Bảng chữ cái theo hàng / bảng so sánh âm gốc → âm đục (mẹo nhớ + ngoại lệ じ ぢ づ ふ) / bảng âm ghép.
- "Vì sao học hôm nay?"; ngày ôn ghi rõ "Hôm nay bạn sẽ ôn: …"; trang ngày Katakana không còn bị coi là ngày ôn.
- Từ vựng trên trang ngày link sang chi tiết; chi tiết có "ngày N →" về lại.

## Từ vựng, Ngữ pháp, Kanji, Bộ thủ (Phase 7–9)
- Tab bài 1→25, mở sẵn bài đang học, tab "Chữ cái"; Tự kiểm tra từ vựng.
- Ngữ pháp: cách đọc ở chế độ học, ẩn ở câu kiểm tra; hai ví dụ; lỗi thường gặp theo mẫu.
- Kanji: công thức chữ + bộ thủ mở rộng tại chỗ; trang Bộ thủ tách bộ của lộ trình / bộ tham khảo; khay chi tiết gọn trên máy tính.

## Luyện viết (Phase 10)
- Nghe – gõ: từ và câu; so khớp chuẩn hoá (`compareJapanese`), tô chỗ sai, điểm; từ đã học ghi vào trí nhớ.

## Theo dõi & Cài đặt (Phase 11–12)
- `/theo-doi` (Tiến độ · Trí nhớ · Thành tích) + giải thích trí nhớ; Hồ sơ gộp vào Cài đặt; radio thật.

## Chuyển động
- Cuộn GỐC của trình duyệt. Đã thử Lenis (cuộn giả lập có quán tính) và gỡ: trên bàn di Mac trang trôi chậm hơn ngón tay → lag.
- Giảm chi phí vẽ khi cuộn: bỏ kính mờ (backdrop-filter) ở thẻ lớn trang chủ / thanh dưới / nút trên thanh trên; bỏ
  drop-shadow trên cánh hoa đang xoay; 16 → 10 cánh; hoa dừng khi tab bị ẩn.
- Chuyển động theo cuộn CHỈ ở phần được chọn (`ScrollScenes`, chỉ transform / opacity, chỉ cảnh trong tầm nhìn, ≤ 1 lần / khung):
  - hiện một lần (`data-reveal`): phần đầu trang chủ (nhẹ), Học hôm nay + Gặp lại, Lộ trình + Vườn, danh sách từ vựng,
    nhóm ngữ pháp, Theo dõi (nhẹ);
  - theo cuộn (`data-scene`): bảng chữ cái — hàng trượt vào xen kẽ hai bên; Kanji — bộ thủ từ hai phía trôi vào, gộp
    thành chữ (`KanjiMergeScene`, sticky); Vườn — ba lớp cây trôi khác tốc độ (parallax).
  - Không có ở Cài đặt / form / màn đang học. "Giảm chuyển động" → hiện ngay, cảnh ở trạng thái cuối.
- Theo ý chủ sản phẩm: chỉ dùng kiểu "cuộn tới thì hiện lên". Đã gỡ các cảnh riêng của Kana (bay tán xạ, biến đổi
  か→が), Từ vựng (Neko nhìn đồ vật), Ngữ pháp (ghép câu), Kanji (tách → gộp) và Vườn (parallax) — thay bằng hiện lên khi
  cuộn tới. Thẻ "Lộ trình 90 ngày" cũng chỉ hiện lên (bỏ các chặng bay vào). Còn giữ: kana trôi ở phần đầu trang chủ;
  Neko cạnh ngày hôm nay trên bản đồ.
- "Cuộn tới thì hiện lên" TỰ ĐỘNG cho mọi trang (`ScrollScenes`, `AUTO_SELECTOR`): thẻ, dòng danh sách, tiêu đề mục, ngày,
  ô cây, dòng sắp quên… — khối ngoài cùng, nối đuôi nhau. Không áp dụng: Cài đặt, form / ô nhập liệu, màn đang học, khay,
  hộp thoại.
- Sửa lỗi "cuộn bị nhảy lên rồi giật": class hiệu ứng tên `reveal` TRÙNG class ô hiện đáp án cũ (có margin + padding)
  → khối phình ra khi đang hiện rồi co lại → trang đổi chiều cao → vị trí cuộn bị kéo ngược. Đổi thành `motion-reveal`.

## Migration mới
- `20261006000001_kanji_radicals.sql`, `20261006000002_daily_greeting.sql`, `20261006000003_grammar_notes.sql`.

## Kiểm thử (Phase 14)
- 165 unit test, lint, typecheck, kiểm tra database (PGlite).
- E2E trên Supabase thật, tài khoản mới: lời chào → ngày 1 → học trọn ngày → 25 trang × 3 kích thước (390/820/1440, không
  tràn ngang, không lỗi console) → 55 link nội bộ không chết → đổi tên / radio lưu được → tự kiểm tra → nghe – gõ.

## Còn mở
- Duyệt thủ công nghĩa tiếng Việt của 394 từ bổ sung và ghi chú 112 mẫu ngữ pháp.
- Ảnh minh hoạ Kanji: chưa có nguồn phù hợp.
- Furigana dạng ruby trên từng chữ Hán (hiện là dòng cách đọc kana dưới câu).

---

# 2026-10-11 — Cải thiện theo phản hồi người dùng thật

| # | Phản hồi | Đã làm |
|---|---|---|
| 1 | Katakana trông mềm | Chữ ĐANG HỌC (bảng kana, chữ lớn trong phiên, trang chi tiết, câu hỏi, khung viết) dùng **Klee One** (SIL OFL, kiểu sách giáo khoa). Chữ thường vẫn Zen Maru Gothic. Cắt gọn theo unicode-range: kana 31 KB, Kanji 166 KB (chỉ tải khi có Kanji). |
| 4 | そ "mất nét" | Nguyên nhân: Zen Maru Gothic vẽ そ dạng biến thể (nét đầu là chấm xiên, mất đoạn ngang) + ô "chưa học" mờ 62 %. Không phải CSS cắt chữ. Đã đổi font, bỏ làm mờ cả ô. |
| — | (phát hiện thêm) | Middleware chặn `/fonts/*.woff2` khi chưa đăng nhập → trang đăng nhập không có font (từ PR #3). Đã loại font / txt / json khỏi middleware. |
| 2 | Thứ tự nét | Dữ liệu **KanjiVG** (CC BY-SA 3.0, ghi nguồn dưới mỗi hình) cho 251/251 chữ: mọi kana + 103 Kanji N5 (`scripts/fetch-stroke-order.mjs`). `StrokeOrder`: số nét, ▶ / ⏸ / ↺ / ‹ ›. `WritingPad` viết đè lên nét mẫu và chấm cơ bản từng nét (thứ tự, điểm đầu, chiều). Sửa số nét ヨ (3, không phải 2). |
| 3 | Học chủ động | Chế độ phiên **`focus`** (Học theo lựa chọn) trong Session Engine sẵn có. Thanh "Học ngay tại đây" ở 6 trang Học tập (Bắt đầu / Học tiếp / Ôn / Kiểm tra theo trạng thái thật), chọn nhiều (Kanji, Từ vựng), học / kiểm tra cả bài (Từ vựng, Ngữ pháp), "Học … ngay" ở trang chi tiết. Không phải chờ ngày của lộ trình. |
| 5 | Âm thanh mặc định | Cài đặt "Tự phát âm thanh" (mặc định bật) áp dụng cho phiên học: thẻ từ mới tự đọc; câu hỏi chỉ đọc SAU khi trả lời (không lộ đáp án). 🔊/🔇 trên đầu phiên (lưu vào Cài đặt). Không chồng tiếng. Mở khoá ở lần chạm đầu (iOS); bị chặn → báo và phát lại khi chạm; máy không có giọng Nhật → hướng dẫn. |
| 6 | Game ôn tập | **Ghép thẻ** (`/luyen-tap/ghep-the`): từ vựng hoặc Kanji ↔ nghĩa, chỉ thứ ĐÃ HỌC; phạm vi Tất cả / Cần ôn / Vừa học / theo bài; thời gian, số lần sai, độ chính xác, kỷ lục. **Không đổi điểm trí nhớ**; thẻ ghép sai → "Ôn N từ này" (phiên focus, ghi trí nhớ thật). Gợi ý sau phiên học khi vừa học ≥ 3 từ; thẻ trong Luyện tập. Không thêm mục điều hướng. |

## Database / API
- `20261011000001_session_mode_focus.sql` — `learning_sessions.mode` thêm `'focus'`.
- `20261011000002_game_records.sql` — `user_settings.game_records jsonb` (kỷ lục game, không phải trí nhớ).
- `POST /api/session/start` nhận thêm `contentKeys` (≤ 20, server lọc lại). Mới: `POST /api/games/result`.

## Kiểm thử
- 235 unit test (thêm: stroke-order, focus session, study-actions, autoplay, match game), lint, typecheck, build.
- Trình duyệt (tài khoản tạm, đã xoá): そ / ソ ン シ ツ ở 390 px và 1280 px; hình động nét + chấm viết đúng / ngược chiều;
  đi trọn phiên focus từ trang Kanji (0/103 → 5/103, xuất hiện Ôn / Kiểm tra); tự phát âm, chặn → chạm để nghe, tắt lưu vào
  Cài đặt; 2 ván Ghép thẻ — kỷ lục lưu, `review_events` và tổng điểm trí nhớ KHÔNG đổi.

## Giới hạn còn lại
- Chấm nét là mức cơ bản (điểm đầu / cuối từng nét), không nhận dạng hình chữ.
- Âm thanh là giọng đọc của thiết bị (không có file thu sẵn) — chất lượng tuỳ máy.
- Game mới có Ghép thẻ; "Thử thách thời gian" để sau.

---

# 2026-10-12 — Refactor UI/UX, learning flow, practice, performance

| # | Việc | Kết quả |
|---|---|---|
| 1 | Nút | `.btn` dùng chung kiểu NekoButton (ánh sáng đều, bóng mềm), cỡ sm 34 / 40 / lg 46px, màu review/quiz/success/game. `.block` chỉ rộng hết trên điện thoại hoặc trong khay / hộp thoại. |
| 2 | Trang chủ | Hai thẻ cao theo nội dung (không kéo giãn), hai cột từ iPad, mèo nhỏ; nút Ôn ngay là NekoButton. |
| 3 | Trang ngày | CTA lên đầu (Học hết ngày / Ôn lại / Hoàn thành ngày). Bỏ khối "Cách viết" trùng. Từ vựng mở khay chi tiết chung. 4 mẹo nhớ lấp chỗ bị bỏ (roadmap adjustment `vocabulary-tip-cleanup`, đã seed). |
| 4 | Ngày ôn | "Từ vựng cần ôn — N từ": khớp đúng từ được liệt kê hoặc khoảng bài; thẻ gọn + "Ôn N từ" (phiên chọn riêng). |
| 5 | Thời gian | Bỏ chip "việc ngoài app" (thực ra là tổng mọi việc trong Excel). Dòng thời gian ghi trong app / tự làm, mỗi việc có nhãn. |
| 6 | Việc "Từ vựng" | Không lặp danh sách và câu "Trong sách…" — chỉ số từ mới + chỗ xem (từ đã gắn đúng ngày). |
| 7 | Kiểu học | Mô tả đúng hành vi + dòng tính từ cấu hình. Ẩn "Học ngẫu nhiên" (mode vẫn chạy). |
| 8 | Ghép thẻ | Thanh tiến độ, thẻ nổi lật vào, nảy ✓ / lắc nhẹ, sao, Enter. |
| 9 | Từ vựng | Bỏ "Tự kiểm tra"; còn một nút Kiểm tra. |
| 10–11 | Kỹ năng | Không khoá theo ngày. Chọn phạm vi (lộ trình / tất cả / bài) cho nói, nghe – gõ; viết Kanji theo nhóm; đọc hiểu hiện mọi đoạn (hiện chỉ có 1 đoạn). |
| 12 | Enter | `useEnterToContinue`: chỉ sau khi trả lời, bỏ qua ô nhập / IME / khay. Phiên học, trắc nghiệm, nghe, game; ô nghe – gõ không nộp khi chốt chữ IME. |
| 13 | Hiệu năng | Đo được: thời gian server = đọc database (mỗi truy vấn ~300 ms từ Việt Nam, kể cả truy vấn 1 dòng) — do khoảng cách; xác thực đã là getClaims (ES256, ~2 ms). Function Vercel ở iad1. Sửa có số đo: tab Từ vựng "Tất cả" vẽ từng 120 dòng (long task 102 ms → 0, 8.691 → 1.709 phần tử); bộ tải sẵn bỏ qua trang phiên học / game và gộp lần quét DOM. |

API: không đổi (thêm tham số phạm vi trang). Database: không đổi schema; nội dung: 4 mẹo nhớ.

## 2026-10-13 — Menu, Ghép thẻ, chọn phạm vi
- Menu: Học tập / Luyện tập là nút mở / đóng (không chuyển trang); trang tổng ở dòng "Tổng quan".
- Ghép thẻ: lưới ô vuông 4 cột — chọn 12 ô (6 cặp) hoặc 16 ô (8 cặp); chữ Nhật và nghĩa trộn chung; kỷ lục theo cỡ bàn.
- Chọn phạm vi: một nút "Phạm vi: … · Đổi" mở bảng lưới (như bảng Kiểm tra) thay hàng chip dài.
- Lỗi phát hiện khi kiểm tra: đổi tham số trên CÙNG trang Luyện nghe / Luyện viết bằng chuyển trang của Next.js đôi khi bị treo
  (yêu cầu RSC về đủ nhưng router không áp dụng — không tái hiện ổn định, chưa tìm ra gốc). Hai trang này nay đổi phạm vi /
  chữ ngay trong trình duyệt (server gửi sẵn kho mọi phạm vi, URL cập nhật bằng history.replaceState) — tức thì, không phụ
  thuộc lỗi đó. Luyện nói và Ghép thẻ vẫn chuyển trang (đã thử nhiều lần đều chạy).

## 2026-10-13 — Học theo ngày: Từ vựng → Ngữ pháp → Kanji → Ôn tập
- Thứ tự học thống nhất ở cả ba chỗ: phiên "Học hôm nay" (`NEW_KNOWLEDGE_ORDER`: chữ cái → từ vựng → ngữ pháp → bộ thủ → Kanji),
  dòng thời gian của ngày (xếp theo loại việc, giữ thứ tự Excel trong cùng loại) và mục "Kiến thức của ngày" (① ② ③).
- Trang mới `/lo-trinh/ngay/[day]/hoc` (nút "Học hết ngày N"; ngày đã qua có "Học lại theo bước"; ngày chữ cái vẫn dùng `/hoc/day`).
  Bốn bước, đổi bước / chế độ ngay trong trình duyệt (`?buoc=&che-do=` ghi bằng replaceState):
  - Từ vựng: thẻ lật (trước / sau, ← → Space, "5/20 từ", nghe, câu ví dụ nếu có, đánh dấu ôn) + Nhật→Việt, Việt→Nhật, Ghép cặp, Gõ kana.
  - Ngữ pháp: thẻ chủ đề (công thức, ý nghĩa, khi nào dùng, lỗi hay gặp, ví dụ + nghe, áp dụng) + Việt→Nhật, Nhật→Việt (ghi trí nhớ),
    Sắp xếp câu, Tự viết câu (chỉ luyện, không ghi).
  - Kanji: bộ thủ của ngày + thẻ lật (Hán Việt, nghĩa, On/Kun, từ ghép, từ vựng chứa chữ, mẹo, thứ tự nét) + chữ→nghĩa, nghĩa→chữ,
    cách đọc, đọc từ ghép.
  - Ôn tập: phiên focus — câu sai và mục đánh dấu trước, rồi mục yếu nhất theo trí nhớ.
  - Mỗi bài có tổng kết: số đúng, độ chính xác, danh sách sai, "Làm lại", "Ôn … sai".
- API mới `POST /api/study/answer`: server chấm (`study-grading.ts`, dùng chung với trình duyệt) và ghi trí nhớ (RECALL, khoá lạc quan,
  requestId) — nhận cả mục chưa học, tối đa một lần mỗi mục mỗi ngày. Xem thẻ không ghi gì. Database: không đổi.
- Giới hạn: câu ví dụ của từ vựng chỉ có khi kho câu (Tatoeba + câu mẫu ngữ pháp) chứa từ đó; 2 từ ghép Kanji không có cách đọc
  trong dữ liệu (生ビール, 聞こえます) nên không vào câu "đọc từ ghép".

## 2026-10-14 — Mobile, bộ chọn ngày, Bộ thủ ≠ Kanji, audit ngày 15–90
- Chữ từ vựng rớt dòng: mặt chữ 42px cố định đứng chung hàng với ảnh + nút Nghe (cột chữ ~150px), chữ Nhật được ngắt giữa
  bất kỳ hai ký tự. Nay `fitTextStyle` + `.fit-box/.fit-text`: cỡ chữ = bề rộng khung (container query) ÷ độ rộng chữ, kẹp
  [min, max]; chạm min mới xuống dòng và chỉ ở khoảng trắng (`word-break: keep-all`). Dùng chung cho khay chi tiết, thẻ học,
  phiên học, cứu từ, câu hỏi quiz (thay hai hàm "dài/ngắn" theo số ký tự).
- Bộ chọn ngày: `buildDayStrip` chỉ dựng 7 ngày → vuốt không đi đâu. Nay `DayPicker`: dải đủ 90 ngày (cuộn sẵn tới ngày đang
  xem, giữ cú vuốt trong dải) + "📅 Tất cả ngày" mở bảng lưới theo chặng; trạng thái đã học / đang học / chưa học tính từ
  kiến thức thật đã gặp (`buildDayStatuses`).
- Bộ thủ và Kanji: dữ liệu và memory vốn đã tách (radical / kanji); chỗ gộp là giao diện ("③ Bộ thủ & Kanji", bộ thủ nằm
  trong bước Kanji). Nay hai phần riêng ở trang ngày và luồng học (bước Bộ thủ có thẻ + quiz "Bộ → nghĩa" ghi vào trí nhớ
  của bộ thủ). Kanji liên kết bộ thủ của chữ; bộ thủ liệt kê Kanji chứa nó. Mỗi phần có "Thẻ & kiểm tra →"; ngày chưa tới có
  "Học trước theo bước".
- Ngày ôn giữa lộ trình (21, 28, …, 77): gắn kiến thức thật của các ngày học liền trước (ví dụ 21 → 15–20) + nút ôn cả tuần;
  "Kiểm tra lại từ vựng bài 1–3" nay ra danh sách từ. Việc trong app chỉ ra sách (練習A/B/C): phần làm trong app lên trước,
  sách là dòng "tuỳ chọn".
- Chữ cái trong trang học của ngày: bước "Chữ cái" (thẻ lật + thứ tự nét, "Chữ → cách đọc", "Cách đọc → chữ", ghi trí nhớ) đứng
  trước Từ vựng. Trước đó ngày 6, 8–13 (chữ cái + vài từ) mở trang học chỉ có Từ vựng — bỏ sót chữ cái. Nay mọi ngày có kiến
  thức mới đều dùng trang học của ngày; ngày ôn tuần mở phiên ôn kiến thức của tuần.

## 2026-10-14 — Đọc hiểu thành hệ thống bài
- 25 bài đọc Neko soạn (content/seed/reading-passages.json), mỗi bài Minna 1–25 một bài, 3–4 câu hỏi, có tiêu đề và bản
  dịch. Chỉ dùng chữ Hán đã học tới ngày của bài (chữ chưa học viết kana), đặt sau khi học xong bài Minna đó — kiểm tra tự
  động trong reading-passages.test.ts. Bài cũ (id 1) dùng chữ chưa học nên được soạn lại, giữ id. Cần duyệt thủ công.
- App đọc bài từ repo ở mọi chế độ (bảng reading_passages chưa có cột tiêu đề / bản dịch; không cần migration).
- /luyen-tap/doc: danh sách bài, đã làm X/25, điểm cao nhất, "Làm tiếp" bài nên làm. /luyen-tap/doc/[id]: mỗi câu chọn một
  lần, điểm + bản dịch, "Làm lại", "Bài tiếp theo". Kết quả lưu ở user_settings.game_records (khoá doc:bai-N) qua
  POST /api/reading/result; giới hạn 40 kỷ lục nay tính riêng cho từng loại (Ghép thẻ không đẩy mất kết quả bài đọc).

## 2026-10-14 — Thư viện video luyện nghe N5
- /luyen-tap/nghe có hai thẻ: "Bài nghe" (giữ nguyên) và "Video N5" (đổi trong trình duyệt, ?muc=video). Trang xem:
  /luyen-tap/nghe/video/[id].
- 83 video thật (content/seed/listening-videos.json, xác minh 2026-10-14):
  - 10 IRODORI Starter (kênh YouTube chính thức The Japan Foundation, Phnom Penh): oEmbed 200, playableInEmbed=true,
    40–69 giây, phụ đề làm tay tiếng Nhật / Anh / Khmer (không có tiếng Việt) → nhúng bằng youtube-nocookie, bật sẵn CC tiếng Nhật.
  - 48 bài NHK WORLD-JAPAN "Cùng nhau học tiếng Nhật" (bản tiếng Việt): trang bài có lời thoại Nhật + romaji + bản dịch
    tiếng Việt; video phát bằng trình phát riêng của NHK (không có mã nhúng) → chỉ "Xem tại nguồn", không dùng ảnh của NHK.
  - 25 bài Erin's Challenge (Japan Foundation): điều khoản cho phép đặt link, cấm sao chép → chỉ "Xem tại nguồn".
- Trình độ: IRODORI theo giáo trình (A1); NHK / Erin là Neko đánh giá theo câu chính / chủ đề bài, ghi rõ trong levelBasis
  (21 bài có phần vượt N5 được ghi "N5 – có phần N4").
- Tìm (không dấu cũng được), lọc chủ đề / nguồn / đã xem. "Đã xem" do người học tự bấm, lưu ở game_records (khoá video:<id>),
  POST /api/videos/watched — không đổi điểm trí nhớ. Chưa liên kết video với từ / mẫu câu (chưa có transcript được phép dùng).
