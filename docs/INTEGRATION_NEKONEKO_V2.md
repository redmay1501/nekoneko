# Tích hợp dữ liệu NekoNeko v2 vào web — ghi chú cho người sửa code

> Ghi chú này **không sửa repo**. Mọi bước dưới đây đã được chạy thử trên **một bản sao** của `nekoneko-main`
> (bản bạn gửi): sau khi làm đủ các bước, `vitest` **552/552 test pass** (549 test cũ + 3 test mới),
> `tsc --noEmit` sạch, `eslint` sạch, `next build` thành công.
> File diff tham khảo: `patches/code-and-tests.diff`. Kết quả dữ liệu sau khi áp: `preview/`.


> **Điều chỉnh khi tích hợp vào repo (21/10/2026) — khác với phần dưới:**
> - Xếp **đủ 223 từ N5** (không còn 50 từ chờ): giới hạn nâng từ 20/21 lên **26 từ/ngày** (`MAX_WORDS`, test lộ trình
>   kiểm cùng mức) — trung bình ~15 từ/ngày, 16 ngày vượt 20 từ. Tổng từ vựng **978** (không phải 928).
> - Từ chứa Kanji học **muộn hơn** các ngày của bài mình (vd. 一〜十 bài 2 nhưng chữ học ngày 28–32; 父・母 ngày 38;
>   男・女 ngày 50) → học **cùng ngày với chữ đó** và chuyển sang bài của ngày ấy (script: bước dự phòng khi bài gốc không xếp được).
> - Nhờ vậy cả **14** Kanji "mồ côi" đều có từ chứa nó, kể cả **川** (→ ngày 56). Migration thêm dòng `(61, 56)`.
> - Ngày 82: đầu việc "Kanji N5 chưa gặp" thành **"Ôn lại 14 chữ Kanji N5 nay học sớm"** (15 phút) — ngày 82 thành ngày ôn như 83–90.
> - Không mục cũ nào đổi ngày; số đầu việc vẫn **399**.
> - Trang bài tập luyện tập đã viết: `/hoc-tap/ngu-phap/bai-tap` (`GrammarDrillRunner`).

---

## 0. Tóm tắt — thay đổi những gì

| Phần | Hiện tại trên web | Sau khi tích hợp | Cách vào web |
|---|---|---|---|
| Mẫu ngữ pháp | 112 | **128** (+16, id 113–128) | script `apply-nekoneko-v2.py` |
| Ghi chú ngữ pháp (đọc, khi nào dùng, lỗi hay gặp, ví dụ 2) | 112 | **128** | gộp `grammar-notes-additions.json` |
| Ngân hàng câu hỏi ngữ pháp | 1.120 câu (10 × 112) | **1.280 câu** (10 × 128), soạn lại toàn bộ | thay file `grammar-question-bank.json/.csv` |
| Bài tập luyện tập (thay thế / biến đổi / hỏi đáp / hội thoại) | chưa có | **200 bài** (25 bài × 8) | file mới + loader + trang mới |
| Từ vựng trong lộ trình 90 ngày | 755 | **928** (+173 từ N5) | script `apply-nekoneko-v2.py` |
| Kanji | 103 (đủ N5) | 103 — **13 chữ được dời từ ngày 82 về ngày học** | script + migration nhỏ |
| Từ N5 chưa còn chỗ trong lộ trình | — | 50 từ, để chờ | `content/source/nekoneko-v2-unscheduled.json` |
| Từ N4 / Kanji N4 | — | 315 từ, 47 chữ — **không** nhồi vào lộ trình N5 | `n4-extension/` (để dành) |

Nguyên tắc đã giữ:
- **Không đổi id và không đổi ngày** của bất kỳ từ / mẫu câu / ngày lộ trình cũ nào → dữ liệu trí nhớ (`memory_items`, khóa `${type}-${id}`) và tiến độ người học **giữ nguyên**. Ngoại lệ duy nhất: cột `day` của 13 Kanji (mục 5).
- Giữ đúng các luật của lộ trình mà test đang kiểm: ≤ 21 từ / ≤ 6 Kanji / ≤ 3 mẫu câu mỗi ngày; một ngày chỉ thuộc một bài; Kanji học đúng ngày của từ **đầu tiên** chứa nó.

---

## 1. Bản đồ file trong gói

```
docs/INTEGRATION_NEKONEKO_V2.md        ← ghi chú này
docs/README_exercises.md, docs/exercises.schema.json ← định dạng bài tập luyện tập
content/seed/grammar-question-bank.json ← THAY file cùng tên trong repo (1.280 câu, đúng schema GrammarQuestionBankRow)
content/seed/grammar-question-bank.csv  ← THAY file cùng tên (bản cho người duyệt)
content/seed/grammar-drills.json        ← FILE MỚI: 200 bài tập luyện tập
content/source/nekoneko-v2-additions.json   ← FILE MỚI: 16 mẫu câu (đã có ngày) + 223 từ N5 ứng viên
content/source/nekoneko-v2-unscheduled.json ← (xem trước) 50 từ script sẽ không xếp được — script tự ghi lại file này khi chạy
scripts/apply-nekoneko-v2.py            ← FILE MỚI: áp dữ liệu vào content/seed/n5-content.json
supabase/migrations/20261021000001_nekoneko_v2.sql ← FILE MỚI: đổi cột day của 13 Kanji
grammar-notes-additions.json            ← gộp vào khóa "notes" của content/seed/grammar-notes.json
reference-code/src/lib/utils/drill-checker.ts              ← hàm chấm bài tập (copy vào repo)
reference-code/src/features/learning/grammar-drills.ts     ← loader + kiểm tra dữ liệu bài tập
reference-code/src/features/learning/grammar-drills.test.ts← 3 test cho loader
patches/code-and-tests.diff             ← diff tham khảo cho các file code/test cũ cần sửa
preview/n5-content.after.json           ← n5-content.json SAU khi chạy script (để so sánh)
preview/grammar-notes.after.json        ← grammar-notes.json SAU khi gộp
vocabulary-diff.csv                     ← đối chiếu từng từ: web ↔ bộ NekoNeko (có ở cả hai / chỉ web / chỉ bộ mới)
n4-extension/vocabulary-n4.json         ← 315 từ N4 (để dành lộ trình N4)
n4-extension/kanji-n4.json              ← 47 Kanji N4 (cùng định dạng mục kanji của web; bỏ trường _level khi import)
```

---

## 2. Thứ tự làm (checklist)

Làm theo đúng thứ tự — mỗi bước có test kèm theo để biết đã đúng chưa.

1. **Tạo nhánh mới**, ví dụ `feat/nekoneko-v2`.
2. Copy các file **mới** vào đúng chỗ (giữ nguyên đường dẫn trong gói):
   `content/source/nekoneko-v2-additions.json`, `scripts/apply-nekoneko-v2.py`,
   `supabase/migrations/20261021000001_nekoneko_v2.sql`, `content/seed/grammar-drills.json`.
3. Chạy script áp dữ liệu (mục 3):
   ```bash
   python3 scripts/apply-nekoneko-v2.py
   ```
   Kết quả mong đợi:
   `Thêm 16 mẫu câu, 173 từ; chuyển 13 Kanji từ ngày tổng ôn về ngày học: 千何目耳駅右左東西南北空山; 50 từ chưa xếp được → content/source/nekoneko-v2-unscheduled.json`
   Chạy lại lần 2 sẽ in `Đã áp dụng trước đó — không làm gì.` (script ghi `"nekoneko-v2"` vào `meta.adjustments`).
4. Gộp ghi chú ngữ pháp (mục 4).
5. Thay ngân hàng câu hỏi + sửa `grammar-exercises.ts` (mục 6).
6. Sửa các test có số cứng (mục 8).
7. Thêm loader bài tập + trang bài tập (mục 7).
8. Sửa chữ "112 mẫu" trên giao diện & tài liệu (mục 9).
9. `npm run verify` (lint + typecheck + test + build).
10. Áp migration lên Supabase, rồi `npm run seed:content` (mục 10).

---

## 3. Script `apply-nekoneko-v2.py` — vì sao và làm gì

### Vì sao KHÔNG chạy lại `convert-roadmap.py`
Khi chạy thử `python3 scripts/convert-roadmap.py` trên repo **chưa sửa gì**, file sinh ra **khác** `content/seed/n5-content.json` đang commit:
- sinh ra 759 từ (file đang dùng có 755 — 4 từ id 108–111 きれい/しずか/げんき/ゆうめい đã được bỏ tay),
- nhiều `tip` khác (file đang dùng đã viết lại mẹo, vd. あなた, 受付),
- một số `day` khác (vd. 受付: 23 ↔ 22), 393 đầu việc thay vì 396.

→ File JSON đang dùng đã được sửa tay / qua công cụ khác sau lần sinh cuối. **Chạy lại convert-roadmap sẽ làm mất các sửa đó.** Vì vậy script mới làm việc **trực tiếp trên `n5-content.json` hiện tại**.

> Gợi ý riêng (không bắt buộc): nên ghi lại ở `docs/` rằng `n5-content.json` giờ là nguồn chính, hoặc đưa các sửa tay vào `roadmap_adjustments.py`, để sau này không ai lỡ chạy lại convert-roadmap.

### Đã thử phương án "chèn trước bước dựng lộ trình" — không dùng được
Nếu chèn từ mới vào trước `ROADMAP_REPLAN_V2` (để lộ trình tự chia lại), lộ trình cần **99 ngày** thay vì 90 (assert trong `_apply_roadmap_replan_v2` dừng lại). Và nếu chia lại thì **ngày của gần như mọi mục cũ đều đổi** → phải viết migration chuyển tiến độ mới. Không đáng.

### Script làm gì (từng bước)
1. **16 mẫu ngữ pháp** (id 113–128): thêm vào `grammar` với ngày đã xếp sẵn trong file additions (mỗi ngày ≤ 3 mẫu, nằm trong khoảng ngày của bài). Nhãn bài lấy đúng nhãn ngữ pháp của web (`"BÀI 4  ·  …"`, không có đuôi "(14 từ)").
2. **Từ N5 mới**: với mỗi từ (theo thứ tự bài):
   - bỏ qua nếu đã có (cùng mặt chữ + cách đọc),
   - chọn ngày **trong khoảng ngày của bài** còn < 20 từ (giới hạn của bước dựng lộ trình; test cho phép 21), ưu tiên ngày ít từ nhất,
   - không đặt từ **trước** ngày học của Kanji mà nó chứa,
   - nếu từ chứa một Kanji "mồ côi" (đang học ở ngày tổng ôn 82) và ngày đó còn < 6 Kanji → **dời chữ đó về ngày của từ** (đúng luật "Kanji học cùng ngày với từ đầu tiên chứa nó"),
   - không còn ngày phù hợp → ghi vào `content/source/nekoneko-v2-unscheduled.json`.
   - id mới = id lớn nhất + 1 (kết quả: **767–939**). `tip` để trống (giống từ bổ sung N5 hiện có).
3. **Viết lại đầu việc của các ngày bị ảnh hưởng**:
   - `語 Từ vựng`: thêm khối `+ Từ N5 bổ sung (n):` liệt kê từ mới, cộng 2 phút/từ;
   - `漢 Kanji`: dựng lại danh sách chữ của ngày (giữ thứ tự cũ, chữ được dời về nối cuối), có dòng "Trong từ hôm nay"; tạo việc Kanji mới nếu ngày đó trước kia không có (→ tổng đầu việc 396 → **399**);
   - `文 Ngữ pháp`: thêm dòng mẫu mới + ví dụ, cộng 10 phút/mẫu;
   - ngày 82: dựng lại việc "Kanji N5 chưa gặp…" chỉ còn chữ 川;
   - `journeyDays`: cập nhật `vocabSummary`, `kanjiSummary`, `grammarSummary`, `minutes`;
   - `lessons`: cập nhật `vocabCount`, `grammarCount`.
4. Dùng lại `MINUTES`, `_kanji_line`, `_lesson_no` của `roadmap_adjustments.py` → định dạng đầu việc giống hệt phần còn lại.

### Số từ thêm theo bài (B = bài; "chờ" = chưa xếp được)
B1 +7 (chờ 2) · B2 +5 (chờ 14) · B3 +4 · B4 +10 (chờ 4) · B5 +6 · B6 +7 (chờ 4) · B7 +8 (chờ 1) · B8 +6 · B9 +9 · B10 +0 (chờ 4) · B11 +15 (chờ 2) · B12 +10 · B13 +7 · B14 +10 (chờ 3) · B15 +2 · B16 +1 · B17 +2 · B18 +10 · B19 +4 · B20 +20 (chờ 5) · B21 +21 (chờ 10) · B22 +5 · B23 +2 (chờ 1) · B24 +0 · B25 +2

### Cách xử lý 50 từ "chờ"
Ngày của các bài đó đã đủ 20 từ. Ba cách (tùy bạn chọn):
- **Bớt từ "chỉ có trên web"** của cùng bài (xem `vocabulary-diff.csv`, trạng thái `chỉ có trên web` — 244 từ, phần lớn là từ riêng của giáo trình Minna; bớt những từ này cũng giảm rủi ro bản quyền), rồi chuyển từ chờ vào `nekoneko-v2-additions.json` và chạy lại script trên file gốc.
- Cho phép 21 từ/ngày (sửa `MAX_WORDS = 21` trong script) → xếp thêm được một ít.
- Để dành cho mục "Từ mở rộng" ngoài lộ trình.

### 15 từ đã loại vì trùng với web
Bộ so khớp ban đầu (`vocabulary-diff.csv`) bỏ sót do khác ký tự `～`/`〜`, đuôi `[な]`, hoặc web gộp hai chữ (`暑い / 熱い`). Đã loại khỏi file additions:
`～さん ～人 ～時 ～時間 ～週間 ～か月 ～年 ～回 親切 うち 熱い ～冊 ～台 ～枚 ～など`.
Trong `vocabulary-diff.csv` các từ này vẫn ghi "chỉ có ở bộ mới" — bỏ qua.

---

## 4. Ghi chú ngữ pháp (`grammar-notes.json`)

Gộp khóa `notes` của `grammar-notes-additions.json` vào khóa `notes` của `content/seed/grammar-notes.json` (16 khóa "113"…"128"; định dạng `{reading, when, mistake, example{jp, reading, vi}}` giống 112 mẫu cũ). Không đụng khóa `fixes`.

```python
import json
n = json.load(open('content/seed/grammar-notes.json', encoding='utf-8'))
n['notes'].update(json.load(open('grammar-notes-additions.json', encoding='utf-8'))['notes'])
json.dump(n, open('content/seed/grammar-notes.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
```

Test `src/lib/data/grammar-notes.test.ts` kiểm cả 6 trường không rỗng — mọi mẫu mới đều có `mistake` (đã viết riêng cho 13 mẫu trước đó còn trống).

### 16 mẫu mới
| id | Mẫu | Bài | Ngày |
|---|---|---|---|
| 113 | 〜ね | 4 | 30 |
| 114 | 〜よ | 5 | 33 |
| 115 | 何を しますか (なに / なん) | 6 | 35 |
| 116 | N1 は どんな N2 ですか | 8 | 41 |
| 117 | N が あります / います | 10 | 47 |
| 118 | どのくらい / ぐらい | 11 | 50 |
| 119 | どこか / 何か | 13 | 54 |
| 120 | N が V (hiện tượng) | 14 | 57 |
| 121 | N (tân ngữ) は | 17 | 63 |
| 122 | なかなか〜ない / ぜひ | 18 | 66 |
| 123 | 場所 で イベント が あります | 21 | 72 |
| 124 | N でも V | 21 | 71 |
| 125 | 場所 を V (chuyển động) | **13** | 53 |
| 126 | Từ nghi vấn が V | 24 | 78 |
| 127 | V たら (sau khi) | 25 | 80 |
| 128 | そうですか | 2 | 22 |

Mẫu **125** theo bộ dữ liệu gốc thuộc bài 23, nhưng bài 23 chỉ có 1 ngày (76) và đã đủ 3 mẫu → xếp vào **bài 13** (cùng chủ đề 公園を散歩します). Ngân hàng câu hỏi đã dùng nhãn bài 13 cho G125. 3 bài tập luyện tập có mẫu 125 (`L23-T2`, `L23-Q2`, `L23-D1`) vẫn ở bài 23 — không sao, vì lúc đó người học đã học mẫu này.

`romaji.ts` (`PATTERN_KANJI_READINGS`): chữ Hán trong 16 mẫu mới chỉ có 何, 場所 — đã có trong bảng, không cần thêm.

---

## 5. Kanji: dời 13 chữ + migration

Trước đây 14 Kanji N5 không có trong từ nào của giáo trình nên chỉ học ở ngày 82. Nay có từ N5 mới chứa 13 chữ trong số đó, nên chúng được học ở ngày của từ:

| Chữ | id | Ngày cũ → mới |
|---|---|---|
| 千 | 62 | 82 → 20 |
| 何 | 79 | 82 → 25 |
| 目, 耳 | 40, 103 | 82 → 38 |
| 駅 | 99 | 82 → 51 |
| 東, 南, 右, 左 | 27, 80, 93, 96 | 82 → 53 |
| 北, 西 | 55, 67 | 82 → 54 |
| 空 | 73 | 82 → 56 |
| 山 | 50 | 82 → 57 |

Chỉ còn **川** học ở ngày 82.

- `supabase/migrations/20261021000001_nekoneko_v2.sql`: chỉ `update public.kanji set day` cho 13 id trên. **Không đụng** bảng trí nhớ. Đừng sửa migration cũ `20261018000001_roadmap_replan_v2.sql` (đã chạy trên DB).
- Ảnh hưởng người học: ai đã qua ngày 53–57 sẽ không gặp các chữ này trong "việc hôm nay" nữa (ngày 82 không còn dạy chúng). Họ vẫn thấy chữ trong thư viện Kanji. Nếu có nhiều người học đang ở giữa lộ trình, có thể giữ một dòng nhắc ở ngày 82 ("Ôn lại 13 chữ đã chuyển lên trước: …").

---

## 6. Ngân hàng câu hỏi ngữ pháp

### File
Thay `content/seed/grammar-question-bank.json` và `.csv` bằng bản trong gói. 1.280 dòng, id `G001-Q01` … `G128-Q10`, đúng schema `GrammarQuestionBankRow` (`kind`: 'Nhật → Việt' | 'Việt → Nhật' | 'Điền cấu trúc/từ'; `pattern` trùng `grammar.pattern`; `lessonLabel` trùng nhãn bài của mẫu). Mọi câu `reviewStatus = "Cần rà soát ngôn ngữ và đáp án"`.

### Sửa `src/features/learning/grammar-exercises.ts` (2 chỗ)
1. Dòng ~154 — bỏ số cứng 112 / 1.120:
   ```ts
   // cũ
   if (grammar.length !== 112) errors.push(`Nội dung có ${grammar.length} mẫu ngữ pháp; cần đúng 112.`);
   if (sourceRows.length !== 1120) errors.push(`Ngân hàng có ${sourceRows.length} dòng; cần đúng 1.120.`);
   // mới
   if (sourceRows.length !== grammar.length * 10) errors.push(`Ngân hàng có ${sourceRows.length} dòng; cần đúng ${grammar.length * 10} (10 câu × ${grammar.length} mẫu).`);
   ```
2. Dòng ~224 — câu điền bản mới có **gợi ý nghĩa ở cuối** (`「…＿＿…。（Tôi đi Tokyo.）」`), phải bỏ gợi ý trước khi so với câu gốc:
   ```ts
   // cũ
   const completedPrompt = kind === 'dien-tu' ? row.prompt.replace(/□|＿＿/, row.answer) : row.sentenceJp;
   // mới
   const completedPrompt = kind === 'dien-tu' ? row.prompt.replace(/（[^（）]*）\s*$/, '').replace(/□|＿＿/, row.answer) : row.sentenceJp;
   ```
   Không sửa chỗ này thì `sourceMatchesPrompt` = false cho mọi câu điền.

Số câu theo dạng: Nhật → Việt 384 · Việt → Nhật 384 · Điền 512. Đáp án đúng chia đều A/B/C/D.

---

## 7. Bài tập luyện tập (tính năng mới)

### Dữ liệu
`content/seed/grammar-drills.json` → `{ _note, exercises: [...] }`, 200 bài. Mỗi bài có thêm `grammarIds` (số, khớp `grammar.id`) và `lessonLabel` (nhãn bài của web). Định dạng chi tiết: xem `docs/README_exercises.md` và `docs/exercises.schema.json` (cùng gói này; trong file web có thêm 2 trường `grammarIds`, `lessonLabel`).

| type | Tên | Chấm |
|---|---|---|
| `substitution` | Luyện thay thế (có `frame`) | `checkItem()` khớp chính xác (`answer_mode: "exact"`) |
| `transformation` | Biến đổi câu | `checkItem()` |
| `qa` | Hỏi đáp theo gợi ý (`cue_vi`) | `checkItem()`; không khớp thì hiện đáp án mẫu + cho tự đánh giá (`answer_mode: "model"`, có `similarity()`) |
| `dialogue` | Hội thoại chọn từ cho `{{n}}` | `checkBlank()` (`answer_index` đếm từ 1) |

`items[0]` có `is_example: true` là ví dụ mẫu — hiện sẵn đáp án, không tính điểm.

### Code tham khảo (đã chạy test, typecheck, lint trên bản sao)
- `src/lib/utils/drill-checker.ts` — `normalize` (NFKC, bỏ dấu câu/khoảng trắng, katakana → hiragana), `checkItem`, `similarity`, `checkBlank`, `renderLine`.
- `src/features/learning/grammar-drills.ts` — `buildGrammarDrills(grammar)`: đọc JSON, kiểm id, dạng bài, `grammarIds` tồn tại, mỗi chỗ trống có trong hội thoại, 4 lựa chọn khác nhau…; lỗi thì ném một lần (giống `buildGrammarQuestionBank`). Kèm `drillsOfLesson`, `drillsOfPattern`.
- `src/features/learning/grammar-drills.test.ts` — 3 test: đủ 25 bài × 8, mọi đáp án mẫu (kể cả gõ toàn kana) tự chấm đúng, dữ liệu hỏng báo lỗi.

### Trang (chưa viết — gợi ý)
- Route: `src/app/(app)/hoc-tap/ngu-phap/bai-tap/page.tsx`, làm giống `luyen-tap/page.tsx`: `getLearnerContext()` → `buildGrammarDrills(catalog.content.grammar)` → lọc theo `?bai=` / `?mau=` / dạng bài.
- Component client `GrammarDrillRunner` (theo kiểu `GrammarExerciseRunner`):
  - thay thế / biến đổi: hiện `instruction_vi`, `frame`, ví dụ mẫu; mỗi mục 1 ô nhập + "Kiểm tra"; sai → hiện `answers[0]` + `readings[0]`;
  - hỏi đáp: hiện câu hỏi + chip `cue_vi`; nộp xong luôn hiện đáp án mẫu; không khớp → nút "Mình trả lời đúng ý" / "Chưa đúng";
  - hội thoại: hiện như khung chat theo `speaker`, `{{n}}` thành nút chọn; "Xem bản dịch" (`lines[].vi`), "Xem cách đọc" (`lines[].reading`).
- Liên kết: ở trang chi tiết mẫu ngữ pháp thêm nút "Bài tập" → `/hoc-tap/ngu-phap/bai-tap?mau={id}` (dùng `drillsOfPattern`).
- Lưu kết quả (tuỳ chọn): có thể ghi như một lần ôn của `grammar-${id}` cho mọi `grammarIds` của bài.
- Bài nghe: 50 hội thoại có `script_for_listening: true` → `text_full` dùng cho TTS / thu âm.

---

## 8. Test cần sửa (số cứng)

Tất cả đã có trong `patches/code-and-tests.diff`.

| File | Sửa |
|---|---|
| `src/features/learning/grammar-question-bank.test.ts` | 1120 → **1280** (2 chỗ), 447 → **512** (số câu điền), `/1119/` → `/1279/`, tiêu đề "112 mẫu" → "128 mẫu" |
| `src/lib/data/grammar-notes.test.ts` | 112 → **128** |
| `src/features/roadmap/roadmap-replan.test.ts` | 755 → **928** từ, 112 → **128** mẫu; `ORPHAN_KANJI` → `[...'川']`; tiêu đề "14 Kanji N5…" → "Kanji N5…"; test "cột day trong migration khớp seed": đọc thêm `20261021000001_nekoneko_v2.sql` và cho migration sau **ghi đè** ngày; id không có trong migration nào (mẫu 113–128, từ mới — vào DB qua seed) thì bỏ qua |
| `src/features/roadmap/kanji-vocab-mapping.test.ts` | ví dụ "Kanji N5 bổ sung": `'駅'` → `'川'` (駅 giờ thuộc Bài 12) |
| `src/features/roadmap/day-plan.test.ts` | tổng đầu việc 396 → **399** (cả chú thích) |
| `src/lib/data/supabase-content-mapper.test.ts` | `tasks: 399`, `grammar: 128`, `vocabulary: 928` |

Đoạn sửa test migration (trong `roadmap-replan.test.ts`):
```ts
const sqlV2 = readFileSync(join(process.cwd(), 'supabase/migrations/20261021000001_nekoneko_v2.sql'), 'utf8');
// … trong it('cột day trong migration khớp đúng dữ liệu seed (cùng id)')
const later = sqlV2.split(`update public.${table} as t set day`)[1]?.split(') as v(id, day)')[0] ?? '';
for (const [, id, day] of later.matchAll(/\((\d+), (\d+|null)\)/g)) days.set(Number(id), day === 'null' ? null : Number(day));
for (const row of rows) if (days.has(row.id)) expect(days.get(row.id)).toBe(row.day);
```

---

## 9. Chữ trên giao diện & tài liệu cần đổi

- `src/app/(app)/hoc-tap/ngu-phap/page.tsx`: chú thích `SC-22 · Ngữ pháp N5 — 112 mẫu câu` và câu "112 mẫu câu theo Minna bài 1–25" → 128 (tốt hơn: đếm `grammar.length`).
- `src/lib/utils/romaji.ts` dòng ~211: chú thích "112 mẫu" → 128.
- `docs/GRAMMAR_EXERCISES.md`, `docs/CONTENT_MAPPING.md`, `docs/database.md`: số câu hỏi (1.120 → 1.280), số mẫu, số từ, số đầu việc; thêm mục bài tập luyện tập.
- `scripts/convert-roadmap.py`: **không cần sửa** — `EXPECTED` kiểm số lượng của Excel gốc (112 mẫu, 350 từ) trước khi điều chỉnh.

---

## 10. Đưa lên Supabase

1. `supabase db push` (hoặc cách bạn đang dùng) để chạy `20261021000001_nekoneko_v2.sql`.
2. `npm run seed:content` — upsert theo id: thêm 16 mẫu ngữ pháp, 173 từ, cập nhật `journey_days` / `day_tasks` (văn bản đầu việc mới, 3 đầu việc Kanji mới), cập nhật `day` của Kanji.
3. Kiểm nhanh trên DB: `select count(*) from grammar` = 128, `vocabulary` = 928, `kanji` = 103, `day_tasks` = 399; `select day from kanji where character in ('東','山','川')` = 53, 57, 82.
4. Bảng trí nhớ không đổi; người học mới học từ mới khi tới ngày tương ứng. Người đã qua ngày đó: từ mới vẫn có trong thư viện; muốn đưa vào ôn có thể dùng chức năng "đánh dấu đang học" sẵn có.

---

## 11. Những gì cố ý KHÔNG làm

- **Không thay toàn bộ từ vựng web bằng bộ mới.** 511 từ có ở cả hai giữ nguyên id/nghĩa/mẹo của web (nếu muốn dùng nghĩa/ví dụ của bộ mới, đối chiếu cột `bộ_mới_nghĩa` trong `vocabulary-diff.csv` rồi sửa tay từng từ — id giữ nguyên nên không mất dữ liệu trí nhớ).
- **Không xóa 244 từ "chỉ có trên web".** Cần người quyết định: phần lớn là từ riêng của giáo trình Minna (tên riêng, từ của hội thoại mẫu). Nếu xóa: xóa trong `n5-content.json` + viết migration xóa hàng `vocabulary` và các `memory_items` khóa `vocabulary-{id}` tương ứng (hoặc chỉ ẩn khỏi lộ trình bằng `day = null` — nhưng test "mục nào cũng có ngày" sẽ phải đổi).
- **Không đưa từ / Kanji N4 vào lộ trình N5** (`n4-extension/`).
- **Không đụng các tham chiếu Minna còn lại** trong lộ trình (`journeyDays.minna` "Bài 5 (1/3)", đầu việc "Làm 聴解 trong sách bài tập Minna…", nhãn "Từ mới Minna bài 5", bài đọc dùng nhân vật マリア). Nếu muốn giảm rủi ro bản quyền ở mức tên gọi: đổi chữ "Minna bài N" thành "Bài N" trong `roadmap_adjustments.py` / dữ liệu, và trỏ việc tự làm sang bài tập luyện tập mới thay vì sách Minna.

---

## 12. Trạng thái nội dung

Mọi nội dung mới (câu hỏi, bài tập, nghĩa từ, ghi chú ngữ pháp) do NekoNeko soạn — cần một người đọc được tiếng Nhật duyệt trước khi coi là bản chính thức; cách đọc (`reading`) tạo tự động. Nguồn danh sách từ/Kanji: tanos.co.uk (CC BY), KANJIDIC (CC BY-SA 4.0) — ghi công ở trang giới thiệu.
