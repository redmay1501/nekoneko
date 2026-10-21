# NekoNeko v3: chia lại lộ trình 90 ngày

Đây là ghi chú để bạn tự sửa code. Mình **không sửa repo của bạn**. Mọi bước dưới đây đã được làm thử trên một bản sao sạch của `nekoneko-main`, làm đúng thứ tự trong mục 2. Kết quả sau khi làm xong:

- `npm run verify` (lint + typecheck + test + build) **chạy qua hết**;
- **552/552 test pass** (549 test cũ, đã sửa số liệu, cộng 3 test mới);
- file kết quả (`n5-content.json`, migration) **giống hệt từng byte** với bản trong thư mục `preview/` và `supabase/`.

> **Gói này thay thế gói v2.** Đừng chạy `apply-nekoneko-v2.py` và đừng dùng migration `20261021000001_nekoneko_v2.sql` của gói trước. Phần nào của v2 vẫn dùng được (ngân hàng câu hỏi, bài tập, 16 mẫu câu) đã nằm sẵn trong gói này.

---

## 0. Bạn yêu cầu gì, kết quả ra sao

| Yêu cầu | Kết quả |
|---|---|
| Giữ đúng số từ vựng của từng bài như giáo trình | Bài 1–25 có **1.063 từ**. Bài nào cũng khớp đúng số từ của giáo trình: 49 · 47 · 45 · 64 · 58 · 55 · 48 · 62 · 51 · 49 · 62 · 51 · 42 · 41 · 28 · 54 · 36 · 29 · 31 · 29 · 38 · 24 · 34 · 19 · 17. Xem sheet "Đối chiếu số từ" trong `data-review/nekoneko-v3-review.xlsx`. |
| Chia lại ngày | Lộ trình **vẫn đủ 90 ngày**, chia lại toàn bộ (mục 3). |
| Kana học 15 chữ/ngày thay vì 10 | Hiragana chỉ còn **5 ngày**: あかさ (15 chữ), たなは (15), まやらわん (16), rồi 1 ngày âm đục, 1 ngày âm ghép. Katakana lặp lại y hệt ở ngày 6–10. Phần chữ cái từ **14 ngày còn 10 ngày**. |
| Thông tin phải đủ | **Mọi từ đều có mẹo nhớ.** Mình đã viết 749 mẹo: 419 cho từ web đang để trống, 330 cho từ mới. Có thêm **828 câu ví dụ có bản dịch**: 1.006/1.085 từ có câu ví dụ chứa chính từ đó (mục 6). 128/128 mẫu câu có đủ ghi chú. 103/103 Kanji có đủ trường, và **chữ nào cũng được học cùng từ chứa nó**, không còn chữ nào phải dồn về ngày tổng ôn. |

---

## 1. Bản đồ file trong gói

```
docs/INTEGRATION_NEKONEKO_V3.md              ← ghi chú này
docs/README_exercises.md, exercises.schema.json ← định dạng bài tập luyện tập

scripts/replan_v3.py                         ← MỚI · chia lại lộ trình trên content/seed/n5-content.json đang dùng
scripts/make_migration_v3.py                 ← MỚI · sinh migration Supabase từ kết quả trên

content/source/nekoneko-v3.json              ← MỚI · dữ liệu đầu vào của replan_v3.py:
                                                 330 từ mới (có bài, mẹo), 6 từ chuyển bài, 419 mẹo cho từ web, 16 mẫu câu mới
content/seed/grammar-question-bank.json/.csv ← THAY · 1.280 câu hỏi (10 × 128 mẫu)
content/seed/grammar-drills.json             ← MỚI · 200 bài tập luyện tập
content/seed/examples-nekoneko.json          ← MỚI · 828 câu ví dụ NekoNeko tự soạn (id 900001+)
grammar-notes-additions.json                 ← gộp vào content/seed/grammar-notes.json (16 mẫu mới)

supabase/migrations/20261022000001_nekoneko_v3.sql ← MỚI · bản sinh sẵn (giống hệt bản bạn tự sinh ở bước 4)

patches/code-and-tests.diff                  ← toàn bộ thay đổi code + test (git apply được), gồm 3 file mới
reference-code/src/...                       ← 3 file mới (loader + hàm chấm bài tập + test), cũng có trong diff

preview/n5-content.after.json                ← n5-content.json SAU khi chạy script
preview/reading-passages.after.json          ← reading-passages.json sau khi chạy (chỉ đổi cột day)
preview/grammar-notes.after.json             ← grammar-notes.json sau khi gộp
preview/nekoneko-v3-day-map.json             ← bảng ngày cũ → ngày mới (tiến độ người học)

data-review/nekoneko-v3-review.xlsx          ← để rà soát: đối chiếu số từ · 1.085 từ (ngày, mẹo, nguồn) · lộ trình 90 ngày · 75 từ không dùng
n4-extension/kanji-n4.json                   ← 47 Kanji N4 đã rà lại (không đưa vào lộ trình, xem mục 7)
n4-extension/vocabulary-extra.json           ← 75 từ của bộ NekoNeko không dùng (trùng / cũ / kính ngữ N4)
```

---

## 2. Thứ tự làm (đã chạy thử đúng như này)

```bash
git checkout -b feat/nekoneko-v3

# 1) chép file mới vào đúng chỗ (giữ nguyên đường dẫn trong gói)
cp <gói>/content/source/nekoneko-v3.json            content/source/
cp <gói>/scripts/replan_v3.py <gói>/scripts/make_migration_v3.py   scripts/
cp <gói>/content/seed/*                              content/seed/      # bank, drills, examples-nekoneko

# 2) chia lại lộ trình (ghi đè n5-content.json + reading-passages.json, tạo content/source/nekoneko-v3-day-map.json)
python3 scripts/replan_v3.py
#   → Xong: 1085 từ (1063 từ thuộc bài 1–25), 103 Kanji, 128 mẫu câu; chữ cái 1–10, bộ thủ 11–13,
#     61 ngày học bài + 7 ngày ôn (ôn sau mỗi ~8 ngày), tổng ôn 82–90; 0 Kanji học ở ngày 82: —

# 3) gộp ghi chú 16 mẫu câu mới
python3 - <<'PY'
import json
n = json.load(open('content/seed/grammar-notes.json', encoding='utf-8'))
n['notes'].update(json.load(open('<gói>/grammar-notes-additions.json', encoding='utf-8'))['notes'])
json.dump(n, open('content/seed/grammar-notes.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
PY

# 4) sinh migration
python3 scripts/make_migration_v3.py      # → supabase/migrations/20261022000001_nekoneko_v3.sql

# 5) sửa code + test
git apply <gói>/patches/code-and-tests.diff

# 6) kiểm tra
npm run verify

# 7) đưa lên Supabase (mục 9)
```

Chạy lại `replan_v3.py` lần hai thì script **không làm gì**, vì nó đã ghi `"nekoneko-v3"` vào `meta.adjustments`. Muốn chạy lại từ đầu thì `git checkout content/seed/n5-content.json content/seed/reading-passages.json` trước.

---

## 3. Lộ trình mới

| Ngày | Giai đoạn | Nội dung |
|---|---|---|
| 1–3 | Hiragana | あ・か・さ (15 chữ) · た・な・は (15) · ま・や・ら・わ・ん (16) |
| 4 | Hiragana | Âm đục & bán đục (25). Bắt đầu học từ chào hỏi, vì đến đây đã đọc được hết Hiragana. |
| 5 | Hiragana | Âm ghép (33) + ôn các từ đã học |
| 6–10 | Katakana | Giống hệt ngày 1–5. Từ Katakana được học **đúng ngày đã thuộc đủ chữ trong từ** (テレビ ở ngày 9 vì có ビ). |
| 11–13 | Bộ thủ | 45 bộ, 15 bộ/ngày (giữ nguyên nội dung) |
| 14–81 | Bài 1–25 | 61 ngày học + 7 ngày ôn (ngày 22, 33, 42, 52, 62, 71, 81) |
| 82–90 | Tổng ôn & thi thử | Giữ nguyên nội dung. Ngày 82 đổi tên thành "Tổng ôn Kanji N5", vì không còn Kanji nào phải học bù. |

**Cách chia bài** dùng đúng thuật toán của `roadmap-replan-v2` (hàm cắt bài cũ):
- từ giữ thứ tự trong bài;
- Kanji học ở ngày của từ **đầu tiên** chứa nó;
- mẫu câu chia theo thứ tự;
- việc tự làm (nghe, đọc…) của bài đi theo phần tương ứng.

Số ngày của mỗi bài là số nhỏ nhất **thực sự cắt được** sao cho ngày nào cũng ≤ 24 từ và ≤ 6 Kanji mới. Ngày còn dư thì dồn cho bài nặng nhất.

Khoảng ngày của từng bài: B1 14–16 · B2 17–18 · B3 19–21 · B4 23–26 · B5 27–29 · B6 30–32 · B7 34–35 · B8 36–38 · B9 39–41 · B10 43–45 · B11 46–48 · B12 49–51 · B13 53–54 · B14 55–56 · B15 57–58 · B16 59–61 · B17 63–64 · B18 65–66 · B19 67–68 · B20 69–70 · B21 72–73 · B22 74 · B23 75–76 · B24 77–78 · B25 79–80.

### Vì sao tối đa 24 từ/ngày (trước là 21)
Số từ của bài tăng từ 755 lên 1.063, trong khi số ngày học bài chỉ tăng từ 57 lên 61, nhờ gộp ngày học kana. Mình đã chạy thử các mức:

| Tối đa từ/ngày | Ngày ôn | Ghi chú |
|---|---|---|
| 21 | — | Không chia được vào 90 ngày |
| 22 | 3 (ôn sau ~22 ngày) | Ôn quá thưa |
| 23 | 5 (ôn sau ~10 ngày) | |
| **24** | **7 (ôn sau ~8 ngày, như hiện tại)** | **Đang dùng.** Trung bình 17,3 từ/ngày, chỉ 11/61 ngày học vượt 21 từ (phần lớn là bài số đếm, giờ giấc). |

Muốn đổi mức thì chạy `NEKO_MAX_WORDS=23 python3 scripts/replan_v3.py`, rồi sửa giới hạn trong test `roadmap-replan.test.ts`.

---

## 4. Từ vựng: lấy từ đâu, đổi gì

| Nhóm | Số từ | Xử lý |
|---|---|---|
| Từ web có trong bộ NekoNeko | 658 | **Giữ id, chữ, nghĩa, mẹo của web.** Dữ liệu ghi nhớ của người học giữ nguyên. |
| Từ web không có trong bộ NekoNeko | 97 | **Giữ lại hết** (会社員, 銀行員, はじめまして, các câu chào…), vì web đã soạn kỹ và người học đã có tiến độ. |
| Từ web chuyển bài | 6 | Bài 22 dư 6 từ so với giáo trình nên chuyển sang bài hợp chủ đề: 花瓶, スリッパ → bài 10 · 財布, ポケット → bài 2 · ケーキ → bài 6 · 時間 → bài 4. |
| Từ mới NekoNeko | 330 | Xếp vào bài theo chủ đề và mẫu câu của bài, để bù cho đủ số từ giáo trình. Động từ viết ở thể ます như web. id mới từ **767 đến 1096**. |
| Không dùng | 75 | Trùng với từ web (だれ / どなた, ～円, 熱い…), từ cũ (テープレコーダー, ラジカセ), kính ngữ N4 → `n4-extension/vocabulary-extra.json`. |

- Tổng có **1.085 từ** = 1.063 từ thuộc bài 1–25 + 22 từ chỉ học ở giai đoạn chữ cái (はい, パン, コンビニ…).
- Các từ chào hỏi như テレビ, はじめまして **vẫn tính vào bài** của chúng, chỉ là được học sớm ở giai đoạn chữ cái, giống web hiện nay.
- Có **419 mẹo** viết cho từ web đang để trống. Script chỉ điền vào chỗ trống, **không ghi đè mẹo bạn đã viết**.
- Mẹo nhớ thường theo dạng: âm Hán Việt, tách chữ, cách dùng hoặc lỗi hay gặp. Ví dụ: 「入口 — 入 (nhập = vào) + 口 → cửa vào. Đọc いりぐち, không phải はいりぐち.」
- Danh sách đầy đủ có cột "Nguồn" (web / mới) và "Ghi chú" (chuyển bài, mẹo mới) nằm trong sheet "Từ vựng sau v3".

> Về bản quyền: danh sách từ do NekoNeko tự chọn theo chủ đề của bài. **Chỉ có số từ mỗi bài** là theo giáo trình. Nghĩa, mẹo và câu ví dụ đều tự viết. Phần web đang tham chiếu Minna (mục 10) vẫn còn nguyên.

---

## 5. Code cần sửa (đều có trong `patches/code-and-tests.diff`)

| File | Thay đổi | Vì sao |
|---|---|---|
| `src/features/learning/knowledge-catalog.ts` | `KATAKANA_DAY_OFFSET = 7` → **`5`** | Katakana học sau Hiragana 5 ngày. **Bắt buộc phải sửa**: không sửa thì Katakana bị gán sai ngày. |
| `src/features/roadmap/journey.ts` | `JOURNEY_STAGES`: chữ cái **1–10**, bộ thủ **11–13**, giáo trình **14–81**, tổng ôn 82–90 | Bản đồ lộ trình, chọn ngày, trang chủ |
| `src/lib/data/seed-content.ts` | `exampleSentences: [...rawExamples.sentences, ...rawNekoExamples.sentences]` (import `examples-nekoneko.json`) | Đưa 828 câu ví dụ vào app và Supabase |
| `src/app/(app)/cai-dat/page.tsx` | Thêm dòng ghi nguồn "câu ví dụ bổ sung do NekoNeko tự soạn" (đặt sau giấy phép Tatoeba) | Không ghi nhầm câu tự soạn là của Tatoeba |
| `src/features/learning/grammar-exercises.ts` | Bỏ số cứng 112 / 1.120 (dùng `grammar.length * 10`). Câu điền: bỏ gợi ý `（…）` ở cuối trước khi so với câu gốc | Ngân hàng 1.280 câu |
| `src/app/(app)/hoc-tap/ngu-phap/page.tsx` | "112 mẫu câu theo Minna bài 1–25" → `{total} mẫu câu theo bài 1–25` | Đếm theo dữ liệu |
| `src/components/learning/DictationPractice.tsx` | "từ ngày 18" → "từ ngày 14" | Ngày bắt đầu học bài |
| `src/components/roadmap/DayActions.tsx`, `src/lib/utils/romaji.ts` | Chỉ sửa chú thích (ngày 1–10, 128 mẫu) | |
| **Mới:** `src/features/learning/grammar-drills.ts`, `src/lib/utils/drill-checker.ts`, `grammar-drills.test.ts` | Đọc và kiểm tra 200 bài tập, kèm hàm chấm | Trang bài tập chưa có, gợi ý ở mục 8 |

### Test đã sửa số liệu (cũng nằm trong diff)
| File | Sửa chính |
|---|---|
| `roadmap-replan.test.ts` | Ngày bài 14–81, bộ thủ 11–13, 1.085 từ (1.063 thuộc bài), 128 mẫu, ≤ 24 từ/ngày. Test "14 Kanji mồ côi" đổi thành "mọi Kanji đều có từ chứa nó". Test migration chuyển sang file v3, kiểm cả bảng `kana` và `vocabulary`; bảng ánh xạ kiểm đủ 90 ngày cũ. |
| `day-plan.test.ts` | Kana 15/15/16/25/33 ở ngày 1–5 và 6–10. Không học từ ở ngày 1–3. Từ chào hỏi ở ngày 4–6. Ngày ôn đầu tiên là 22 (cửa sổ ôn 11–21). Tổng 388 đầu việc. Ngày 82–90 không có kiến thức riêng. |
| `day-plan-review.test.ts` | Ngày 10 ôn 28 từ, ngày 5 ôn 7 từ, ngày ôn bài 1–3 là 22 |
| `kana-lesson.test.ts` | Ngày 2 = た・な・は, ngày 3 = ま…ん, âm đục ngày 4 / 9, âm ghép ngày 5 |
| `kanji-vocab-mapping.test.ts` | 先生 / 学生 ở ngày 14, 大学 ngày 15, 本 ngày 17. Không còn nhóm "Kanji N5 bổ sung". |
| `journey.test.ts`, `journey-progress.test.ts` | Ranh giới chặng mới. Ngày 1 có 15 chữ. Ngày ôn đầu là 22. |
| `session-engine.test.ts` | Ngày 23 giờ là bài 4 (1/4), có 23 mục. Học bù ở ngày 1 dùng 12/15 chữ. |
| `listening-practice.test.ts`, `study-actions.test.ts` | Kanji đầu tiên ở ngày 14 |
| `grammar-question-bank.test.ts`, `grammar-notes.test.ts` | 1.280 câu / 512 câu điền / 128 mẫu |
| `supabase-content-mapper.test.ts` | `tasks: 388, grammar: 128, vocabulary: 1085` |

---

## 6. "Thông tin phải đủ": đã bổ sung những gì

| Mục | Trước | Sau |
|---|---|---|
| Mẹo nhớ của từ vựng | 336/755 từ có mẹo | **1.085/1.085** |
| Câu ví dụ chứa từ | ít, chỉ 141 câu Tatoeba và câu mẫu ngữ pháp | **1.006/1.085 từ** có ít nhất một câu. 79 từ còn lại là kana rất ngắn (はい, これ, ここ, いい…): bộ tìm câu của app **cố ý bỏ qua** những từ này để tránh khớp nhầm. |
| Ghi chú ngữ pháp (cách đọc, khi nào dùng, lỗi hay gặp, ví dụ 2) | 112 | **128** |
| Câu hỏi ngữ pháp | 1.120 | **1.280** |
| Bài tập luyện tập | 0 | **200** |
| Kanji học cùng từ chứa nó | 89/103 (14 chữ dồn về ngày 82) | **103/103** |

Về câu ví dụ:
- Câu nằm trong `examples-nekoneko.json`, có id 900001 trở lên và `owner = "NekoNeko"`.
- Phần lớn lấy từ câu ví dụ của bộ dữ liệu NekoNeko. Có 80 câu mình viết thêm cho những từ chưa có câu.
- Bước "Dùng thử" của app chỉ lấy câu có id bắt đầu bằng `tatoeba-`. `context-index.ts` gắn tiền tố này cho mọi câu trong `exampleSentences`, nên câu NekoNeko cũng được dùng. Nếu muốn tách riêng, thêm trường `source` vào `ExampleSentence`.

---

## 7. Những gì cố ý KHÔNG làm

- **Không thêm 47 Kanji N4.** Mình đã thử: bài 1 phải kéo thành 4 ngày, bài 4 thành 5 ngày, vượt luật tối đa 4 ngày/bài và 6 Kanji/ngày. Web đã có đủ toàn bộ Kanji N5 (103 chữ). 47 chữ N4 đã được rà lại cẩn thận trong `n4-extension/kanji-n4.json`: âm Hán Việt, on/kun gọn, 3 từ ví dụ, mẹo nhớ. Dùng được ngay khi làm lộ trình N4. Muốn thêm thì phải có thêm `kanji-radicals.json` và chạy `node scripts/fetch-stroke-order.mjs`.
- **Không xóa từ web nào.** 97 từ chỉ có trên web vẫn nằm trong bài.
- **Không đổi `jlpt_level`.** 234 từ mới là từ N4 (theo danh sách tanos) đặt trong bài N5 để đủ số từ giáo trình. Bảng `vocabulary` có cột `jlpt_level` nhưng mapper đang không ghi cột này. Muốn hiện nhãn "N4" thì thêm trường `jlptLevel` vào `VocabularyContent` và mapper. Cấp độ của từng từ mới có trong trường `level` của `nekoneko-v3.json`.
- **Không chạy lại `convert-roadmap.py`.** File `n5-content.json` hiện tại đã được sửa tay sau lần sinh cuối, nên chạy lại sẽ mất các sửa đó. `replan_v3.py` làm việc trực tiếp trên file hiện tại.

---

## 8. Trang bài tập luyện tập (chưa viết, gợi ý)

- Route: `src/app/(app)/hoc-tap/ngu-phap/bai-tap/page.tsx`. Làm giống `luyen-tap/page.tsx`: lấy `buildGrammarDrills(catalog.content.grammar)` rồi lọc theo `?bai=` / `?mau=` / dạng bài.
- Component `GrammarDrillRunner`, theo từng dạng:
  - **Thay thế / biến đổi:** mỗi mục một ô nhập, chấm bằng `checkItem()`.
  - **Hỏi đáp:** luôn hiện đáp án mẫu, cho người học tự đánh giá.
  - **Hội thoại:** hiện như khung chat, `{{n}}` thành nút chọn, chấm bằng `checkBlank()`.
- Chi tiết định dạng ở `docs/README_exercises.md`. Mỗi bài có `grammarIds` (số, khớp `grammar.id`) và `lessonLabel`.

---

## 9. Đưa lên Supabase

1. Chạy migration `20261022000001_nekoneko_v3.sql`. Migration này:
   - đổi cột `day` của kana / bộ thủ / Kanji / từ / mẫu câu theo id;
   - thay `journey_days` và `day_tasks` (90 ngày, 388 đầu việc);
   - cập nhật `lessons`;
   - chuyển `profiles.current_day` và `journey_day_completions` theo bảng ánh xạ. Phần này chạy **một lần**, vì có kiểm `journey_plan_versions = 'nekoneko-v3'`.
   - **Không đụng** `memory_items`, `review_events`, `learning_sessions`, `session_items`.
2. Chạy `npm run seed:content` **ngay sau đó**. Lệnh này upsert theo id: thêm 330 từ mới và 16 mẫu câu, ghi mẹo, nhãn bài mới (6 từ chuyển bài) và 828 câu ví dụ.
3. Kiểm nhanh:
   - `select count(*) from vocabulary` = 1085, `grammar` = 128, `day_tasks` = 388, `example_sentences` = 141 + 828;
   - `select day from kana where id in (1, 16, 31)` = 1, 2, 3;
   - `select day from kanji where character = '先'` = 14.

### Tiến độ người học: ngày cũ → ngày mới
Quy tắc: ngày đích luôn là chữ cái, bộ thủ, **ngày đầu của bài đang học**, ngày ôn hoặc tổng ôn. Không bao giờ đẩy người học lùi qua bài trước. Không tự đánh dấu "xong" phần người học chưa học. Một số ví dụ:

| Cũ → mới |
|---|
| Kana: 1,2 → 1 · 3 → 2 · 4,5 → 3 · 6 → 4 · 7 → 5 · 8,9 → 6 · 10 → 7 · 11,12 → 8 · 13 → 9 · 14 → 10 |
| Bộ thủ: 15 → 11 · 16 → 12 · 17 → 13 |
| Bài 1 (18–19) → 14 · Bài 2 (20–22) → 17 · Bài 3 (23–25) → 19 · Ôn 1–3 (26) → 22 · Bài 4 (27–30) → 23 … |
| Tổng ôn 82–90 → 82–90 |

Bảng đầy đủ nằm ở `preview/nekoneko-v3-day-map.json` và sheet "Lộ trình 90 ngày" (cột "Ngày cũ ánh xạ về đây").

---

## 10. Việc còn lại (tùy bạn)

- **Tham chiếu Minna** trong đầu việc vẫn giữ nguyên chữ từ Excel gốc:
  - nhãn "Minna bài N (1/3)", "Từ mới Minna bài N";
  - "Mở CD Minna no Nihongo…";
  - "Làm phần 練習B/練習C/問題 trong Minna";
  - nhân vật マリア trong bài đọc.

  Nếu muốn giảm rủi ro bản quyền ở mức tên gọi, sửa các câu chữ này trong `replan_v3.py` (các chỗ có "Minna") rồi chạy lại từ bước 2. Có thể trỏ việc tự làm sang bài tập luyện tập mới.
- **Tài liệu:** `docs/ROADMAP_REPLAN.md`, `docs/CONTENT_MAPPING.md`, `docs/GRAMMAR_EXERCISES.md`, `docs/database.md` còn ghi số cũ (14 ngày chữ cái, 755 từ, 112 mẫu, 1.120 câu). Nên thêm một dòng trỏ sang file này.
- **Rà soát nội dung:** toàn bộ phần mới (nghĩa, mẹo, câu ví dụ, câu hỏi, bài tập) cần một người đọc được tiếng Nhật duyệt. Sheet "Từ vựng sau v3" có bộ lọc theo cột "Nguồn" và "Ghi chú" để duyệt nhanh.
