# N5 Content Audit

Ngày audit: 2026-10-06 · Nguồn đã đọc: `content/seed/n5-content.json` (sinh từ `content/source/Lo_trinh_JLPT_N5_90_ngay_Minna.xlsx`),
`content/seed/examples.json` (Tatoeba), `content/seed/supplement.json`.

> Quy ước: **"Needs manual verification"** = chưa đối chiếu được với nguồn đáng tin cậy; không được coi là "đủ N5".
> Không có danh sách N5 chính thức: JLPT đã ngừng công bố danh sách từ vựng/kanji theo cấp từ 2010. Các danh sách
> "N5" phổ biến (JLPT Sensei, Tanos, Minna no Nihongo bài 1–25) là danh sách **tham khảo**, lệch nhau vài chục mục.

## Tổng quan

| Category | Expected coverage (tham khảo) | Current | Missing | Duplicate | Incorrect / vấn đề | Source | Action |
|---|---|---|---|---|---|---|---|
| Hiragana cơ bản | 46 | 46 | 0 | 0 | Chia ngày cắt ngang hàng âm (ngày 2 = さ→て, ngày 3 = と→ふ) | Bảng kana chuẩn | Chia lại theo hàng: 10/10/10/8/8 (xem LEARNING_FLOW_AUDIT) |
| Dakuten + handakuten (Hiragana) | 25 | 25 | 0 | 0 | Dồn chung ngày 6 với 33 âm ghép (58 âm/ngày) | Bảng kana chuẩn | Ngày 6 chỉ âm đục/bán đục |
| Âm ghép 拗音 (Hiragana) | 33 | 33 | 0 | 0 | Như trên | Bảng kana chuẩn | Chuyển sang ngày 7 |
| Katakana | 104 (46+25+33) | 104 | 0 | 0 | Ngày = ngày Hiragana + 7 (`KATAKANA_DAY_OFFSET`) → cùng lỗi chia ngày | — | Sửa theo Hiragana là tự đúng |
| Từ vựng | Minna bài 1–25: ~800–900 từ; danh sách N5 tham khảo: ~650–800 | **350** (đúng 14 từ × 25 bài) | Rất nhiều — **Needs manual verification** từng bài | 9 mặt chữ trùng: 家, 飲みます, かけます, 荷物, 引きます, 渡ります, 信号, 交差点, 直します | Một số trùng là đồng âm hợp lệ (家 いえ/うち) — cần xem từng cặp | Excel lộ trình | Xem mục Từ vựng |
| Kanji | ~80–110 (danh sách N5 tham khảo) | 103 | **Needs manual verification** so với danh sách tham khảo | 0 | Đủ trường (words, tip, strokes) | Excel lộ trình | Đối chiếu danh sách tham khảo, ghi chênh lệch |
| Bộ thủ | Không cần đủ 214 — chỉ bộ/thành phần xuất hiện trong kanji N5 | 45 | **34/103 kanji N5 không gắn với bộ nào** trong `kanjiList`: 国会年二中長出行社分五四新九入円外八六来気七多北書半西空万毎母友左父 | 0 | Có kanji là bộ thủ độc lập (二, 八…) nên không cần bộ riêng | Excel lộ trình | Bổ sung thành phần cho kanji có cấu tạo ghép; kanji đơn thể ghi "là chính nó" |
| Ngữ pháp Minna | Bài 1–25 | 112 mẫu | — | 0 | 4 câu ví dụ là bảng chia ("書きます → 書いて / …") chứ không phải câu; mỗi mẫu chỉ 1 ví dụ; không có cách đọc, không có lỗi thường gặp | Excel lộ trình | Xem mục Ngữ pháp |
| Ngữ pháp JLPT (rà soát) | Danh sách tham khảo | 94 | — | — | Khoảng 17 mẫu không có trong Minna hoặc chỉ có tên tiếng Việt | Excel lộ trình | Ghi chú rõ, không tự tính |
| Câu ví dụ | — | 141 (Tatoeba, chỉ bản dịch Việt trực tiếp) | 230/350 từ vựng, 15/103 kanji chưa có câu | — | Có thể có bản dịch chưa tự nhiên — **Needs manual verification** | tatoeba.org, CC BY 2.0 FR | Giữ; mở rộng có kiểm duyệt |
| Bài đọc | — | 1 | — | — | Rất ít | Tự soạn | Mở rộng sau |

## Từ vựng — chi tiết

- Thứ tự bài trong file JSON đúng 1→25. **Lỗi hiển thị lộn xộn đến từ database**: bảng `lessons` có khoá là chữ (`"Bài 1"`,
  `"Bài 10"`…) và được đọc `order by id` → sắp theo thứ tự chữ (1, 10, 11, …, 19, 2, 20…). Sửa ở tầng dữ liệu (sắp theo số bài).
- 14 từ/bài là con số **cắt gọn** của lộ trình, không phải đầy đủ Minna. Bổ sung từ vựng cần nguồn từ điển có giấy phép
  (gợi ý: JMdict/EDRDG — CC BY-SA 4.0) + đối chiếu danh sách bài Minna (không chép nội dung giáo trình có bản quyền).
  → **Needs manual verification** trước khi đưa vào lộ trình.
- Ảnh minh hoạ: chưa có nguồn ảnh giáo dục có giấy phép cho 350 từ. Không tạo ảnh giả. Đề xuất: chỉ danh từ cụ thể (đồ vật,
  con vật, đồ ăn, phương tiện) dùng icon 3D Fluent Emoji (MIT) khi khớp nghĩa rõ ràng; từ trừu tượng / động từ không có ảnh.

## Ngữ pháp — chi tiết

- `usage` hiện là 1 câu ngắn, có chỗ thuật ngữ. Thiếu: khi nào dùng, cách đọc ví dụ (furigana), lỗi thường gặp, ví dụ thứ hai.
- Câu ví dụ là câu tự soạn trong Excel lộ trình (không trích giáo trình) — giữ, thêm cách đọc kana sinh từ dữ liệu từ vựng/kanji
  đã có; phần nào không sinh được chắc chắn thì **Needs manual verification**.

## Dakuten — kiểm tra mẹo nhớ được đề xuất

| Mẹo | Phụ âm | Đúng? | Ghi chú |
|---|---|---|---|
| "Con gái" | K → G | ✓ | か→が … こ→ご |
| "Sống zai" | S → Z | ✓ (một phần) | ざ ず ぜ ぞ = za zu ze zo, nhưng **し→じ đọc "ji"**, không phải "zi" |
| "Tự do" | T → D | ✓ (một phần) | だ で ど = da de do; **ぢ = ji, づ = zu** (ít dùng) |
| "Hòa bình" | H → B | ✓ | は→ば; lưu ý **ふ (fu) → ぶ (bu)** |
| "Hạnh phúc" | H → P | ✓ | Bán đục ゜: は→ぱ, ふ→ぷ (pu) |

Các ngoại lệ (じ, ぢ, づ, ふ→ぶ/ぷ) phải ghi ngay dưới bảng so sánh âm.

## Cập nhật sau khi sửa (2026-10-06)

Đối chiếu với **OpenJLPT** (https://github.com/evanclan/OpenJLPT, CC BY-SA 4.0; cấp độ theo danh sách JLPT của Jonathan Waller,
tanos.co.uk, CC BY; dữ liệu kanji từ KANJIDIC2). Đây là danh sách *tham khảo cộng đồng*, không phải danh sách chính thức.

| Category | Trước | Sau | Ghi chú / cần duyệt |
|---|---|---|---|
| Từ vựng | 350 (phủ 218/674 từ của danh sách N5 tham khảo) | **759** | +394 từ N5 bổ sung (`content/source/n5-vocabulary-supplement.tsv`), +22 từ giai đoạn chữ cái trước chỉ nằm trong văn bản đầu việc, −7 từ trùng. **Nghĩa tiếng Việt và cách xếp vào bài Minna do Neko Neko soạn — Needs manual verification.** |
| Từ trùng | 9 cặp | 1 cặp hợp lệ | かけます (gọi điện / đeo kính) là đồng âm khác nghĩa — giữ cả hai. 7 cặp trùng thật đã gộp (giữ lần đầu); はじめまして / テレビ / ラジオ dời về đúng ngày giai đoạn chữ cái. |
| Lỗi trong nguồn tham khảo | — | đã sửa, không chép | せっけん ghi "economy" → *xà phòng*; 半分 ghi "half minute" → *một nửa*; 毎月 / 毎年 đọc まいつき / まいとし (nguồn ghi まいげつ / まいねん). |
| Không đưa vào | — | 6 từ | テープレコーダー, ラジカセ, フィルム, マッチ, 灰皿, 字引 — đồ vật đã lỗi thời. |
| Kanji | 103 | 103 | Bộ chính trong `kanji-radicals.json` **khớp KANJIDIC2 ở cả 80 kanji trùng nhau** (chỉ khác biến thể 川/巛). 23 kanji của lộ trình (会 口 古 多 安 少 店 手 新 目 社 空 立 耳 花 言 買 足 週 道 飲 駅 魚) **không** nằm trong danh sách N5 của Waller (xếp N4) — giữ vì lộ trình Minna dạy; ghi nhận chênh lệch. 4 kanji danh sách tham khảo có mà lộ trình không có: 丈 無 誰 貼 — chưa thêm (Needs manual verification). |
| Bộ thủ | 45, 34/103 kanji không gắn bộ | 71 (45 + 26 bộ tham khảo), **103/103 kanji có bộ chính** | Bảng `kanji_radicals` theo id. |
| Ngữ pháp | 1 ví dụ, không cách đọc | 112/112 có cách đọc, khi nào dùng, lỗi thường gặp, ví dụ 2 | `content/seed/grammar-notes.json` — Needs manual verification. Đã sửa: #62 デパート = *bách hoá* (không phải siêu thị); #97 でしょう giải thích đúng nghĩa phỏng đoán. |
| Ảnh từ vựng | 0 | 133 từ | Chỉ danh từ cụ thể, icon Fluent Emoji (MIT) khớp nghĩa rõ; đã bỏ ghép gượng (砂糖, ハンカチ, しょうゆ…). Từ trừu tượng / động từ không có ảnh. |
| Ảnh Kanji | 0 | 0 | Không tìm được nguồn ảnh mở thể hiện đúng nghĩa từng chữ → không thêm ảnh trang trí. Mẹo nhớ bằng bộ thủ thay thế. |
