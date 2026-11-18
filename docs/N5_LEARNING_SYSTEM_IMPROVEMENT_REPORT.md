# Báo cáo cải thiện hệ thống học N5

**Ngày:** 2026-11-18 · **Phạm vi:** ôn tập & học lại, giao diện kiểm tra, từ vựng N5, logic đề ngữ pháp, câu ví dụ, luyện nghe / viết / đọc.
Báo cáo chi tiết phần từ vựng: [N5_VOCABULARY_COMPLETENESS_AUDIT.md](N5_VOCABULARY_COMPLETENESS_AUDIT.md).

Nguyên tắc đã giữ: không xoá từ / ngữ pháp / Kanji; không giới hạn thời gian học; không tự tạo từ không có căn cứ; giữ kiến trúc hiện có (Session Engine, Memory Engine, luồng học theo ngày, migration + seed).

---

## 1. Lỗi phát hiện, nguyên nhân gốc, cách sửa

### Phần 1 — Ôn tập và học lại hôm nay

| Lỗi | Nguyên nhân gốc | Đã sửa |
|---|---|---|
| Ôn tập xong không có lựa chọn học lại hôm nay | Màn "Khoảnh khắc tiến bộ" chỉ mời học tiếp phần còn lại / học thêm 5 phút; bước Ôn tập của luồng học theo ngày không có lối quay lại từ đầu | Thêm **"🔁 Học lại hôm nay · ngày N"** ở Khoảnh khắc tiến bộ và **"Học lại hôm nay từ đầu"** ở bước Ôn tập. Cả hai dẫn về đúng kiến thức của ngày đang học (`dayStudyHref` trong `features/roadmap/day-plan.ts`, dùng chung với trang ngày) |
| (an toàn dữ liệu) | — | Học lại đi qua trang học của ngày: `/api/study/answer` ghi trí nhớ **tối đa một lần mỗi mục mỗi ngày** → không bơm điểm, không tạo dữ liệu trùng. Không gọi hoàn thành ngày (người học vẫn tự bấm), không tạo ngày học mới, không đụng lịch sử / lịch ôn. Ngày ôn tuần mở lại phiên ôn của tuần kèm `back` về trang ngày |
| Câu ôn không nói rõ đang ôn gì | Bước phiên học chỉ có mặt chữ + câu hỏi chung | Mỗi bước mang `origin` (loại · bài · ngày, `features/learning/knowledge-origin.ts`); đầu mỗi câu hiện **"Ôn tập từ vựng · Bài 1 · Ngày 14 · Đã học"** / "Học mới …" / "Luyện ngay …" / "Học bù …" / "Dùng trong câu …". Bài lấy từ nhãn bài của chính kiến thức (từ vựng, ngữ pháp) hoặc bài Minna của ngày học (Kanji, bộ thủ); không suy ra được thì để trống, không đoán. Phiên trộn nhiều bài → mỗi câu có nhãn bài riêng |
| Quiz trong Lộ trình | — | Nhãn "Ôn tập từ vựng · Bài 1 (1/3) · Ngày 14 · Nhật → Việt" trên mỗi câu |
| Luyện ngữ pháp ở Học tập | — | Đầu câu: "Luyện / Kiểm tra ngữ pháp · Bài N · dạng bài" |

### Phần 2 — Giao diện kiểm tra

| Mục | Đã làm |
|---|---|
| 2.1 Cỡ chữ | Câu hỏi tiếng Nhật: phiên học 62 → 48px (tự co tới 24px), quiz Lộ trình 36 → 30px, luyện nghe 36 → 30px, Cứu kiến thức 56 → 46px. Giữ cỡ của đáp án / hướng dẫn; tự co theo độ dài chữ như cũ |
| 2.2 Tự chuyển câu | Tách cơ chế của Neko Streak thành `hooks/useAutoNext.ts` + `components/common/AutoNextToggle.tsx` (cùng khoá localStorage → **một công tắc cho cả app**, trò chơi dùng lại đúng hook này). Hành vi giữ nguyên: đúng → tự sang câu sau 1 giây; sai → dừng để đọc đáp án; bấm nút / tắt công tắc → huỷ. **Thêm:** chỉ chuyển khi câu trả lời đã được ghi nhận (phiên học: server trả về số liệu trí nhớ; quiz Lộ trình / luyện nghe / nghe – gõ: request lưu xong) — đang lưu hoặc lưu lỗi thì đứng lại và báo. Áp dụng: phiên học & bài kiểm tra Học tập, quiz Lộ trình, luyện nghe, nghe chữ cái, nghe – gõ, luyện ngữ pháp (luyện tập: sau khi chấm đúng; kiểm tra: sau khi chọn, trừ câu cuối và câu sắp xếp) |
| 2.3 Bỏ "Nó nghĩa là gì?" | Câu hỏi nghĩa chỉ hiện từ (先生, 学生…); câu hỏi cách đọc giữ hướng dẫn ngắn "Chọn cách đọc". Phiên cũ còn lưu câu cũ cũng được ẩn. Bỏ cả "Nó có nghĩa là gì?" (Cứu kiến thức) và "Bộ này nghĩa là…" (quiz bộ thủ) |
| 2.4 Nút nghe | Thêm loa ở câu ôn (phiên học), Cứu kiến thức, "Dùng trong câu" (sau khi trả lời: câu đúng đầy đủ), quiz Kanji / Việt → Nhật (Lộ trình). Dùng `AudioButton` sẵn có (trạng thái đang phát, bấm lại để dừng / nghe lại; máy không có giọng Nhật → thông báo sẵn có) |
| Lộ đáp án qua âm thanh (lỗi có sẵn) | Quiz "Chữ → cách đọc" (chữ cái), "Cách đọc", "Đọc từ ghép" (Kanji) phát âm **trước** khi trả lời; luyện ngữ pháp dạng trợ từ / điền từ phát âm **cả câu đầy đủ** trước khi trả lời. Đã chuyển các loa này ra sau khi trả lời (`audioRevealsAnswer`, câu hỏi cách đọc trong phiên học dùng `ask: 'reading'`) |
| Vỡ dấu tiếng Việt (lỗi có sẵn) | Đáp án nghĩa tiếng Việt trong phiên học bị gán font tiếng Nhật ("Ky˜sư"). Nay chỉ dùng font Nhật khi lựa chọn / đáp án có kana hoặc Kanji |

### Phần 3 — Từ vựng N5

Xem báo cáo riêng. Tóm tắt: **+237 từ** của danh mục Minna I bài 1–25 còn thiếu (kể cả 社員, エンジニア, 失礼ですが, お名前は, こちらは〜さんです, 〜から来ました, あの人, あの方, tên các nước), **194 từ chuyển về đúng bài** (研究者, 病院, 電気 → Bài 1…), không xoá từ nào (1.085 → 1.322). Nguyên nhân gốc: bản v3 khớp *số lượng* từ mỗi bài với giáo trình nhưng không khớp *nội dung*.

### Phần 4 — Đề ngữ pháp dùng từ của bài sau

| Lỗi | Nguyên nhân gốc | Đã sửa |
|---|---|---|
| Quiz Lộ trình Bài 1 (ngày 14) có từ / câu của Bài 2 | `nearest()` trong `day-study.ts` chọn phương án nhiễu theo khoảng cách ngày **cả hai phía** | Chỉ lấy ngày **trước** ngày đang học, gần nhất trước |
| Bài tập ngữ pháp sinh từ câu ví dụ có câu nhiễu của bài sau | `distractorSentences` ưu tiên "bài gần nhất" cả hai phía | Chỉ cùng bài / bài trước |
| Phiên kiểm tra mẫu câu: thiếu câu nhiễu thì mượn **toàn bộ** ngân hàng | `buildGrammarCheckStep` fallback `catalog.content.grammar` | Chỉ mẫu có ngày ≤ max(ngày hiện tại, ngày của mẫu) |
| "Dùng trong câu" chọn câu Tatoeba có từ chưa học | `realSentenceBlank` chỉ lọc phương án nhiễu | Khi có danh sách đã biết: mọi kiến thức khác trong câu phải đã biết |
| Ngân hàng 1.280 câu: 263 câu dùng từ của bài sau (Bài 1: 兄, 父, 母, 妹, 駅, 図書館, 本…) | Câu hỏi được biên soạn theo mẫu ngữ pháp, không kiểm phạm vi từ | `features/learning/vocabulary-scope.ts` nhận diện từ của bài sau trong từng câu (khớp từ dài trước; bỏ qua chữ Hán đơn trong tên riêng 山田, 田中, 東京). Luyện ngữ pháp **ưu tiên câu trong phạm vi** (kể cả khi chọn lượt mới); câu buộc phải dùng từ bài sau đứng cuối và có chú thích "Từ chưa học: 兄（あに）anh trai — Bài 11". Chú thích của câu điền không làm lộ đáp án. Mỗi bài vẫn đủ câu trong phạm vi cho lượt 10–20 câu (Bài 1: 35/50) |

### Phần 5 — Câu ví dụ

Đọc toàn bộ 141 câu Tatoeba và 828 câu NekoNeko (lý do từng câu: `content/source/example-sentence-review.json`).

- **Bỏ 26 câu Tatoeba:** tục / ẩn ý (先生、アソコがかゆいんです — câu ở thẻ 先生), thô / ra lệnh cộc (ほっといてくれ, 休め！, あいつ…, 来な), định kiến (男には気をつけろよ), sai ngữ pháp (毎日にここへ来る), dịch sai nghĩa (耳がかぶれています ≠ "viêm tai"; イメージアップをはかっている ≠ "chúng tôi bàn bạc"), tục ngữ văn cổ ngoài N5 (言わぬが花, 百聞は一見にしかず, 時は金なり), ngữ pháp vượt N5 (〜てほしかった, sai khiến…).
- **Thay bằng 11 câu NekoNeko** cho đúng các từ mất ví dụ (先生、質問が あります。・耳が 痛いです。・夜は 車に 気を つけて ください。…).
- **Sửa 9 bản dịch** (thì / chủ ngữ sai, カメラ = máy ảnh, 気づく = để ý, 話せます = nói *được*…); bản dịch đã sửa ghi người dịch là NekoNeko (không còn là bản dịch gốc Tatoeba).
- **Sửa 3 câu NekoNeko:** そうして → そして; 程 → ほど; "どうぞ…座りましょう" → "どうぞ ここに 座って ください".
- Không bỏ câu chỉ vì khó: các câu N4 tự nhiên, có ích (〜つもり, 〜たい…) giữ nguyên.

### Phần 6 — Số câu luyện nghe / nghe – gõ

Bỏ số cố định 8 câu (nghe) / 8 từ + 4 câu (nghe – gõ). Bộ chọn "Số câu mỗi lượt" (5 · 10 · 15 · 20 · 30 · 50 · Tất cả) chỉ hiện lựa chọn **nhỏ hơn số câu khả dụng**, luôn có "Tất cả (N)", hiện số khả dụng của phạm vi; chọn nhiều hơn thì làm đúng số khả dụng, không lặp câu (`features/learning/question-count.ts`). Nghe – gõ: cùng số câu cho gõ từ và gõ câu, mỗi phần giới hạn theo số khả dụng của nó. Lựa chọn nhớ trên máy (localStorage).

### Phần 7 — Luyện đọc

- **Font:** bài đọc dùng font bo tròn Zen Maru Gothic (vẽ そ dạng biến thể, làm mềm ソ ン シ ツ). Nay dùng font gothic tiêu chuẩn: Noto Sans JP (nếu máy có) → Hiragino (Apple) → Yu Gothic / Meiryo (Windows) → Noto Sans CJK (Android); weight 400, line-height 2.1 (mobile 2.0), letter-spacing nhẹ. Không tải thêm font (font hệ điều hành, không tăng dung lượng trang).
- **Từ vựng trong 25 bài đọc:** đối chiếu từng từ với danh sách (sau audit). Phần lớn từ đã học trước hoặc cùng bài. 6 bài dùng từ của bài sau: 国 (Bài 1 → học ở Bài 3), アパート・少し・でも (Bài 8), でも (Bài 9, 12), 道 (Bài 16), 最近 (Bài 19). Các từ này có mục **"📌 Từ cần chú ý"** (cách đọc, nghĩa, bài sẽ học). ベトナム・ブラジル・昼休み (dùng trong bài đọc, không có trong danh sách) đã thêm vào từ vựng. Không phát hiện từ viết sai / dịch sai.
- **Hỗ trợ đọc chữ Hán:** 23 bài có chữ Hán có thêm bản kana cả đoạn, bật bằng "Xem cách đọc (kana)" (test kiểm: không còn chữ Hán, cùng số câu).

### Phần 8 — Nhập câu trả lời

- **Tự focus ô nhập:** nghe – gõ (gõ từ / gõ câu, khi đổi chế độ, sang câu mới) và "Gõ kana" ở Lộ trình (sang câu mới). Focus sau khi câu mới vẽ xong (`requestAnimationFrame`), không focus khi ô đang chỉ đọc (đã chấm) / xong bài, không xoá chữ đang gõ. Màn cảm ứng: không tự bật bàn phím ảo lúc vừa mở trang — chỉ sau khi người học thao tác; máy có chuột: focus ngay (`features/learning/input-focus.ts`).
- **Hiện / ẩn nghĩa tiếng Việt:** một công tắc cho cả gõ từ và gõ câu, đổi được giữa bài, nhớ trên máy. Chỉ ẩn / hiện nghĩa, không lộ chữ Nhật.
- **Kèm theo:** sau khi trả lời, đáp án có Kanji hiện kana + romaji (đã làm ở đợt trước, nay áp cả quiz Lộ trình).

---

## 2. Từ vựng bổ sung và nguồn

237 từ, nguồn: danh mục từ mới của bài tương ứng trong *Minna no Nihongo Shokyu I, bản 2* (ベトナム: bài đọc NekoNeko). Danh sách đầy đủ kèm cách đọc, nghĩa, bài: [N5_VOCABULARY_COMPLETENESS_AUDIT.md](N5_VOCABULARY_COMPLETENESS_AUDIT.md#danh-sách-từ-đã-bổ-sung).

## 3. Phần chưa thể xác minh / còn tồn tại

- **Danh mục Minna** được lập lại thủ công (không có bản điện tử chính thức trong repo). Các mục không chắc chắn đã để nguyên và liệt kê ở báo cáo từ vựng (どちら nghĩa Bài 3, 信号, おつり, 〜前, 〜中, ケーキ).
- **Ngân hàng câu hỏi ngữ pháp:** 263 câu dùng từ của bài sau chưa được viết lại — đã được đẩy xuống cuối và có chú thích. Nên biên soạn lại dần (danh sách có thể lấy bằng `withVocabularyScope`).
- **Nhận diện phạm vi từ** bỏ qua từ viết toàn hiragana (vd. かさ — Bài 2 — trong câu Bài 1) vì dễ khớp nhầm vào đuôi chia động từ.
- **Ngày nặng:** sau khi bổ sung, ngày nặng nhất có 34 từ (ngày 35, Bài 7) — không cắt từ theo yêu cầu; người học tự chia.
- **Nhãn bài trong `vocabulary.lesson`** vẫn mang hậu tố cũ "(14 từ)" của file Excel gốc (không hiển thị cho người học); số từ thật nằm ở `lessons.vocabCount`.
- **Kiểm tra tự động trên trình duyệt** chạy ở chế độ demo (không đăng nhập Supabase).

## 4. Đưa lên production

Nội dung trên production đọc từ Supabase, nên cần (theo đúng thứ tự):
1. Chạy migration `supabase/migrations/20261118000001_minna_vocabulary_audit.sql` (từ mới, bài / ngày từ vựng, ngày Kanji, nhiệm vụ ngày, số từ mỗi bài) và `20261118000002_example_sentence_review.sql` (câu ví dụ). Không đụng bảng trí nhớ / tiến độ.
2. Deploy code. Bài đọc (bản kana, từ cần chú ý) đi cùng mã nguồn, không cần database.

## 5. File đã thay đổi

**Dữ liệu:** `content/seed/n5-content.json`, `content/seed/examples.json`, `content/seed/examples-nekoneko.json`, `content/seed/reading-passages.json`; mới: `content/source/minna-vocabulary-audit.json`, `content/source/example-sentence-review.json`.
**Script / migration (mới):** `scripts/apply_vocabulary_audit.py`, `scripts/make_migration_vocabulary_audit.py`, `scripts/apply_example_review.py`, `supabase/migrations/20261118000001_minna_vocabulary_audit.sql`, `supabase/migrations/20261118000002_example_sentence_review.sql`.
**Logic:** `features/learning/` — `day-study.ts`, `day-study-quiz.ts`, `grammar-exercises.ts`, `session-engine.ts`, `session-types.ts`, `context-index.ts`; mới: `knowledge-origin.ts`, `vocabulary-scope.ts`, `question-count.ts`, `input-focus.ts`. `features/roadmap/day-plan.ts`, `features/memory/rescue-view.ts`, `hooks/useAutoNext.ts` (mới), `types/content.ts`.
**Giao diện:** `components/learning/session/SessionSteps.tsx`, `StepFeedback.tsx`, `LearningSession.tsx`, `AssessmentQuiz.tsx`, `ListeningQuiz.tsx`, `DictationPractice.tsx`, `PracticePanels.tsx`, `GrammarExerciseRunner.tsx`, `grammar-exercise-runner-state.ts`, `components/day-study/StudyQuiz.tsx`, `DayStudyFlow.tsx`, `components/games/NekoStreak.tsx`, `components/memory/RescueFlow.tsx`; mới: `components/common/AutoNextToggle.tsx`, `components/learning/QuestionCountPicker.tsx`, `components/learning/ReadingPassageText.tsx`. Trang: `khoanh-khac`, `lo-trinh/ngay/[day]`, `luyen-tap/doc/[id]`, `hoc-tap/ngu-phap/luyen-tap`. `app/globals.css`.
**Test:** mới `features/learning/practice-flow.test.ts`, `features/learning/vocabulary-scope.test.ts`; cập nhật `session-engine.test.ts`, `roadmap-replan.test.ts`, `day-plan.test.ts`, `kanji-vocab-mapping.test.ts`, `reading-passages.test.ts`, `supabase-content-mapper.test.ts`.

## 6. Kiểm tra đã chạy

| Kiểm tra | Kết quả |
|---|---|
| `tsc --noEmit` | Không lỗi |
| `eslint . --max-warnings=0` | Không lỗi, không cảnh báo |
| `vitest run` | **665/665 test qua** (85 file) |
| Test mới | Học lại hôm nay (đúng ngày, không đụng hoàn thành ngày); nhãn ngữ cảnh khớp bài của kiến thức; không lấy từ / câu bài sau vào đề (nearest, câu nhiễu ngữ pháp, lượt luyện Bài 1, lượt mới có lịch sử); nhận diện từ bài sau (bỏ qua tên riêng); số câu (lựa chọn theo số khả dụng, không vượt); tự chuyển câu bật / tắt / sai / đang lưu / chưa trả lời; focus ô nhập (câu mới, đã chấm, xong bài, cảm ứng vs chuột); bài đọc (bản kana, từ cần chú ý); migration khớp dữ liệu seed và không đụng bảng trí nhớ / tiến độ |
| Test cập nhật theo dữ liệu mới | Tổng 1.085 → 1.322 từ; trần 24 → 40 từ/ngày (không cắt từ giáo trình; vẫn ≤ 6 Kanji, ≤ 3 mẫu câu/ngày); 本 nay học ở Bài 1 (日本) — ví dụ Kanji Bài 2 đổi sang 書 (辞書); số đầu việc 388 → 393 |
| `git diff --check` | Sạch |
| Trình duyệt (chế độ demo), 390×844 · 820×1180 · 1440×900 | 6 màn (quiz Lộ trình, phiên kiểm tra, luyện nghe, nghe – gõ, bài đọc, luyện ngữ pháp) × 3 cỡ: không tràn ngang, không lỗi console. Phát hiện và đã sửa: vỡ dấu tiếng Việt ở đáp án, mất khoảng trắng trong nhãn, nút số câu đang chọn khó nhận ra, lượt luyện ngữ pháp mới bị xáo trộn làm mất ưu tiên câu trong phạm vi. Đã xác nhận lượt 10 câu Bài 1 không còn câu dùng từ bài sau (theo bộ nhận diện) |
