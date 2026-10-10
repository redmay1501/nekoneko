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
