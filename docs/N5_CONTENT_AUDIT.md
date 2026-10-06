# N5 Content Audit

**Ngày audit:** 2026-10-06
**Phạm vi:** \`content/seed/n5-content.json\`, \`content/seed/grammar-notes.json\`, \`content/seed/kanji-radicals.json\`, file nguồn/reference trong \`content/source/\`, và logic lộ trình trong \`src/features/roadmap/\`.

> **Giới hạn về chuẩn N5:** JLPT mô tả năng lực N5 ở mức hiểu một phần tiếng Nhật cơ bản; không có checklist công khai đóng và đầy đủ hiện hành cho mọi từ vựng, Kanji, ngữ pháp. Vì vậy, “thiếu N5” trong báo cáo nghĩa là thiếu so với một reference cụ thể hoặc thiếu trong learning flow, không phải kết luận thiếu so với syllabus chính thức. Danh sách OpenJLPT/Tanos là reference cộng đồng, không phải chuẩn chính thức. [JLPT — Level Summary](https://www.jlpt.jp/e/about/levelsummary.html) · [OpenJLPT](https://github.com/evanclan/OpenJLPT)

## Executive Summary

- **Kana:** 104 bản ghi, mỗi bản ghi có một Hiragana và một Katakana: đủ 46 âm cơ bản + 25 âm đục/bán đục + 33 âm ghép cho mỗi bảng. Romaji đủ, thứ tự dữ liệu đúng. Chia Hiragana ngày 1–7 và Katakana ngày 8–14 theo hàng âm là hợp lý; 25 âm đục và 33 âm ghép mỗi nhóm vẫn là khối lượng lớn cần luyện tập phân tán. Có lỗi hướng dẫn nghe ở ngày 13 và điểm cần rà lại cách gọi romaji “wo”.
- **Vocabulary:** 759 mục; không có bản ghi trùng hoàn toàn. Có 6 nhóm trùng kana nhưng khác kanji/meaning, là các cặp từ/nghĩa chứ không phải duplicate cần gộp. Phân bổ theo lesson dao động 15–57 từ. Metadata cả 25 lesson vẫn ghi “14 từ”, không phản ánh nội dung đã bổ sung. Chưa thể tuyên bố coverage N5 đầy đủ chỉ từ số lượng.
- **Grammar:** 112 mẫu chính; 112/112 có pattern, usage, ví dụ Nhật, bản dịch Việt và ghi chú reading/when/mistake/example. Đủ trường không bảo đảm đúng: một số quy tắc quá tuyệt đối hoặc ví dụ không khớp lời giải thích. Danh sách \`jlptGrammar\` 94 mục là danh sách riêng, không được liên kết vào ngày học.
- **Kanji:** 103 chữ, không duplicate ký tự; 103/103 có liên kết component trong \`kanji-radicals.json\`. Một số reading kun trống có thể hợp lệ; một số giải thích component/mnemonic giản lược hoặc lệch cấu tạo. Reference cộng đồng trong repo ghi 80 chữ trùng danh sách Waller, 23 chữ thêm theo Minna và 4 chữ reference chưa có; không xem đó là kiểm định chính thức.
- **Roadmap consistency:** 90 ngày và lịch kiến thức thực tế lấy theo \`day\` trong manifest. Ngày bài mới thường có 10–29 từ cùng 1–3 grammar, 2 Kanji và 1 radical; cao nhất là ngày 31 với 35 mục mới. Có lệch văn bản roadmap/lesson và hướng dẫn cũ; tổng thời lượng task thường khớp số phút ngày. Ngày 90 không có task, phù hợp tiêu đề nghỉ ngơi nhưng cần bảo đảm UI không thành trạng thái rỗng.

## Critical Issues

### P0 — cần xử lý trước khi coi curriculum là đã được kiểm duyệt

1. **Giải thích grammar có quy tắc sai hoặc quá tuyệt đối:** #51 nói từ 11 trở đi dùng \`〜個\` thay cho \`〜つ\` như quy tắc chung; #100 nói chủ ngữ trong mệnh đề bổ nghĩa “luôn” dùng が; #46 nói あまり và 全然 “luôn” đi với phủ định. Các lời giải thích này có nguy cơ dạy quy tắc sai/không đúng phạm vi nếu dùng làm đáp án học thuộc.
2. **Grammar #97 không khớp nhãn/nghĩa với ví dụ:** pattern ghi \`普通形 でしょう？\`, usage mô tả câu hỏi xác nhận lên giọng, còn ví dụ \`あした 雨が 降るでしょう。\` và bản dịch là phỏng đoán “Chắc ngày mai trời sẽ mưa”. Cần tách/ghi rõ hai cách dùng.
3. **Roadmap ngày 13 hướng dẫn nghe sai bảng chữ:** ngày Katakana dùng ví dụ Katakana ở task khác, nhưng phần nghe yêu cầu phân biệt \`か/が, た/だ, は/ば/ぱ\` (Hiragana). Cặp phù hợp là \`カ/ガ, タ/ダ, ハ/バ/パ\`.

### P1 — nên sửa trước khi phát hành curriculum có định lượng

4. **Metadata lesson lỗi ở cả 25 bài:** \`lessons.vocabCount\` đều ghi “14 từ”, trong khi actual count theo lesson là 15–57. Vocabulary đã được bổ sung nhưng metadata chưa đồng bộ.
5. **Summary roadmap ngày ôn sai số:** ngày 7 ghi “2 từ” nhưng task yêu cầu ôn 3 từ; ngày 14 ghi “2 từ” nhưng task yêu cầu ôn 25 từ. Manifest gán 34 từ vào ngày 6–13, vì vậy câu “25 từ trong hai tuần” cũng cần xác định lại phạm vi.
6. **Radical mnemonic có mapping không phản ánh rõ cấu tạo:** 道 liệt kê 辶 + 目, trong khi 目 chỉ là phần nằm trong 首; giải thích bỏ mất cấu trúc 首 và có thể dạy tách chữ sai. Schema cũng chưa phân biệt radical chính, component nhìn thấy và mnemonic.
7. **Tải nội dung mới lệch nhiều:** 12/54 ngày có ít nhất 25 mục mới (vocabulary + grammar + Kanji + radical), cao nhất 35 mục ngày 31. Đây là item count, không đồng nghĩa thời gian thực học, nhưng cần review sư phạm.
8. **\`jlptGrammar\` chưa nối vào learning flow:** 94 mục chỉ có pattern/usage, không có day hay khóa liên kết tới 112 grammar chính. Chưa thể biết mục nào đã dạy, bị bỏ hoặc gộp.

### P2 — cải thiện kiểm chứng và chất lượng

9. **Coverage chưa có baseline tái lập:** nghĩa tiếng Việt và bài Minna trong nguồn supplement do dự án phân loại, cần duyệt thủ công. Không có checklist N5 chính thức đóng để kết luận “đủ N5”.
10. **6 nhóm kana trùng cần được dạy theo ngữ cảnh:** きます, かけます, はし, ひきます, はやい, かぜ. Chúng hiện có kanji/meaning khác nhau, không phải duplicate exact.
11. **Romaji \`を = wo\`:** hữu ích để nhận diện cách viết, nhưng trợ từ を trong tiếng Nhật hiện đại thường phát âm “o”; nên nói rõ để tránh học sai phát âm.
12. **Cần duyệt các Kanji có kun-reading trống:** 10 chữ 気, 午, 百, 電, 校, 万, 毎, 天, 週, 駅. Có thể hợp lý nếu chỉ dạy on-reading, nhưng cần phân biệt “không dạy” với “chưa nhập”.

## Vocabulary Audit

### Số lượng, duplicate và giới hạn đối chiếu

- **759 mục**; mọi mục có kana, meaning, lesson, day; không có bản ghi trùng cả kana + kanji + meaning.
- Có **6 nhóm cách viết kana trùng** nhưng khác từ/kanji/meaning: きます (来ます/着ます), かけます (gọi điện/đeo kính), はし (箸/橋), ひきます (引きます/弾きます), はやい (早い/速い), かぜ (風/風邪). Đây là phân biệt từ vựng hợp lệ.
- Bài 8 có 早い/速い cùng lesson/day; cần bài luyện phân biệt “sớm” và “nhanh”, không chỉ hiện kana.
- Có 34 mục gán vào ngày 6–13 (giai đoạn kana). Một phần mang nhãn lesson 1/2, phần khác nhãn “Chào hỏi & từ Katakana”; cần thống nhất cách đếm “từ giai đoạn kana” với “từ mới của Minna lesson”.
- Không có danh sách N5 chính thức để đo “missing” tuyệt đối. File supplement ghi rõ từ/cách đọc lấy từ OpenJLPT, còn nghĩa tiếng Việt và lesson do NekoNeko soạn và cần duyệt. Chỉ nên báo chênh lệch theo reference được chọn, không tự thêm hàng loạt.

### Lesson 1–25

\`Current count\` là số vocabulary có nhãn lesson đó trong manifest, không phải số từ mới được roadmap đưa ra trong từng buổi. Duplicate đếm cặp trùng kana trong cùng lesson; 早い/速い được giữ vì khác kanji và nghĩa.

| Lesson | Current count | Duplicate | Missing/suspicious | Notes |
|---:|---:|---:|---|---|
| 1 | 23 | 0 | Metadata “14 từ” cũ | Từ ngày 12 giai đoạn kana và ngày 15–16; vượt metadata 9. |
| 2 | 32 | 0 | Metadata cũ; 6 từ chỉ định ở ngày 8 | Một số từ lesson xuất hiện trong giai đoạn Katakana trước ngày 17–18. |
| 3 | 36 | 0 | Metadata cũ | 18 từ/ngày ngày 19–20. |
| 4 | 41 | 0 | Metadata cũ | Ngày 22–23 có 21 và 20 từ. |
| 5 | 41 | 0 | Metadata cũ | Ngày 24–25 có 21 và 20 từ. |
| 6 | 33 | 0 | Metadata cũ | Ngày 26–27 có 17 và 16 từ. |
| 7 | 26 | 0 | Metadata cũ | Ngày 29–30 có 13 từ/ngày. |
| 8 | 57 | 1 | Metadata cũ; はやい hai mục | Lượng từ lớn nhất; 早い/速い cần ngữ cảnh. |
| 9 | 42 | 0 | Metadata cũ | Ngày 33–34 có 21 từ/ngày. |
| 10 | 40 | 0 | Metadata cũ | Ngày 36–37 có 20 từ/ngày. |
| 11 | 45 | 0 | Metadata cũ | Ngày 38–39 có 23/22 từ. |
| 12 | 28 | 0 | Metadata cũ | Ngày 40–41 có 14 từ/ngày. |
| 13 | 27 | 0 | Metadata cũ | Ngày 43–44 có 14/13 từ. |
| 14 | 30 | 0 | Metadata cũ | Ngày 45–47 có 11/10/9 từ. |
| 15 | 28 | 0 | Metadata cũ | Từ ở ngày 48 và 50; ngày 49 review. |
| 16 | 26 | 0 | Metadata cũ | Ngày 51–52 có 13 từ/ngày. |
| 17 | 23 | 0 | Metadata cũ | Ngày 53–55 có 9/7/7 từ. |
| 18 | 22 | 0 | Metadata cũ | Ngày 57–58 có 11 từ/ngày. |
| 19 | 20 | 0 | Metadata cũ | Ngày 59–61 giảm còn 7/7/6 từ. |
| 20 | 20 | 0 | Metadata cũ | Ngày 62/64/65 có 7/7/6 từ; ngày 63 review. |
| 21 | 19 | 0 | Metadata cũ | Ngày 66–67 có 10/9 từ. |
| 22 | 30 | 0 | Metadata cũ | Ngày 68–69 có 16/14 từ. |
| 23 | 18 | 0 | Metadata cũ | Ngày 71–72 có 9 từ/ngày. |
| 24 | 15 | 0 | Metadata cũ | Ngày 73–74 có 8/7 từ. |
| 25 | 15 | 0 | Metadata cũ | Ngày 75–76 có 8/7 từ. |

### Từ thiếu / nghi vấn và đường dẫn học

- Không phát hiện day rỗng hoặc trường bắt buộc rỗng trong 759 mục; không có duplicate exact.
- Từ quan trọng xuất hiện trong giai đoạn kana (chào hỏi, đại từ chỉ định, từ Katakana); đây là lựa chọn có chủ đích nhưng summary ngày chưa mô tả nhất quán.
- Không thể duyệt chính xác toàn bộ 759 reading/meaning chỉ bằng schema khi từng từ chưa có nguồn từ điển gắn theo record. Ưu tiên review các từ đa nghĩa, biến thể ngoặc như \`きれい[な]\`, và nghĩa ngữ dụng.
- Kết luận: chưa thể tuyên bố đủ N5; 759 là quy mô collection, không phải bằng chứng coverage. Chưa có báo cáo machine-readable về thiếu so với reference hoặc những từ “new” đã học trước, ngoài việc lesson 1/2 có một số từ từ ngày kana.

## Grammar Audit

### Trạng thái cấu trúc

- 112 grammar records; không có field rỗng ở pattern, usage, example JP/VI; mỗi id 1–112 có note reading/when/mistake/example thứ hai.
- Cấu trúc đầy đủ hơn bản cũ, nhưng chưa có kiểm định chuyên môn cho toàn bộ câu Nhật, cách đọc và bản dịch.
- \`jlptGrammar\` có 94 mục chỉ gồm pattern/usage, không có day hoặc khóa liên kết với curriculum 112 mẫu. Exact-text matching không đủ để xác nhận coverage vì nhiều điểm được gộp hoặc diễn đạt khác nhau.

### Nội dung cần duyệt

| Mẫu | Mức | Vấn đề |
|---|---|---|
| #46 あまり / 全然 | incomplete/suspicious | “Luôn đi với phủ định” là quy tắc sơ cấp phổ biến nhưng quá tuyệt đối nếu nói về mọi cách dùng hiện đại; giới hạn phạm vi mẫu N5 và thêm ví dụ trong phạm vi. |
| #51 〜つ | wrong | “Từ 11 trở đi dùng 〜個” không áp dụng chung cho mọi danh từ; lựa chọn counter phụ thuộc loại vật. |
| #55 だけ / しか〜ない | incomplete | Gộp hai cấu trúc, nhưng chỉ có ví dụ しか; thiếu ví dụ đối chiếu だけ và khác biệt phủ định. |
| #63 N に 行く/来る | suspicious | Ví dụ \`日本へ 勉強に 来ました\` cần ngữ cảnh “đến Nhật để học” để bản dịch rõ chủ thể/điểm nhìn. |
| #64 Chia thể て | incomplete | Là bảng quy tắc, không phải câu ví dụ; gộp nhóm và ngoại lệ trong một dòng. Cần ví dụ từng nhóm và làm rõ 行く→行って. |
| #70 Vている (trạng thái) | suspicious | Usage gộp trạng thái, nghề nghiệp, thói quen nhưng ví dụ chỉ là làm việc; dễ bị hiểu là hành động đang diễn ra. Thêm ví dụ 知っています/住んでいます. |
| #81 時までに | incomplete | Ví dụ hợp hạn chót nhưng cần phân biệt với まで (“đến 5 giờ”). |
| #86 Vる/Nの/期間 まえに | suspicious | Chỉ có ví dụ Vる前に; chưa minh họa danh từ hoặc khoảng thời gian. |
| #94 Lược bỏ trợ từ | incomplete | Chỉ minh họa lược を; thiếu giới hạn để tránh hiểu は・が・を có thể tùy ý lược. |
| #97 でしょう | wrong/mismatch | Lời giải thích là hỏi xác nhận, ví dụ/dịch lại là phỏng đoán. |
| #100 が trong mệnh đề bổ nghĩa | wrong/overgeneralized | “Luôn dùng が” quá tuyệt đối; nên mô tả trong phạm vi cấu trúc cụ thể. |
| #101 Vる時間/約束/用事 | incomplete | Gộp ba kết hợp nhưng ví dụ chỉ có 時間. |
| #102 普通形 + とき | suspicious | Nói thì quyết định quan hệ trước/sau nhưng chỉ có ví dụ một dạng; cần cặp Vるとき/Vたとき. |
| #104 Vると | incomplete | Đã nêu giới hạn với ý chí/mệnh lệnh; cần ví dụ phân biệt と điều kiện với とき/たら. |
| #112 いくら〜ても | incomplete | Một ví dụ; cần phân biệt với #110 và nêu vai trò nhấn mạnh của いくら. |

**Core coverage:** có các khối sơ cấp quan trọng: copula, trợ từ, thời/thể lịch sự, thể て/ない/た, tính từ, tồn tại, so sánh, mục đích, mệnh đề bổ nghĩa, điều kiện, cho/nhận. Độ rộng này đáng kể nhưng chưa chứng minh đủ N5 vì danh sách \`jlptGrammar\` chưa được map và JLPT không công bố checklist ngữ pháp đóng. Japan Foundation có tài liệu giải thích ngữ pháp và ví dụ sơ cấp để đối chiếu từng điểm; sự tồn tại của tài liệu không tự xác nhận nội dung hiện tại. [みんなの教材サイト — 教師向け文法解説](https://www.kyozai.jpf.go.jp/kyozai/grammar/home/ja/render.do)

## Kanji Audit

- 103 records và 103 ký tự phân biệt; không thấy duplicate. Mỗi record có meaning, on-reading, strokes, words, tip, day; 10 kun-reading để trống như nêu ở P2.
- Lịch Kanji từ ngày 15–76; phần lớn ngày có 2 chữ, ngày 72–76 còn một chữ/ngày. Không có Kanji thiếu day.
- \`kanji-radicals.json\` có entry cho cả 103 ký tự. Đây là đủ liên kết dữ liệu, không phải bằng chứng mọi component chính xác hoặc hữu ích.
- Có 45 radical trong nội dung chính; file component có thêm thành phần tham khảo. Dữ liệu chưa phân biệt rõ radical từ điển, component hình thể và mnemonic tự tạo.
- Ví dụ cần duyệt: 道 được liệt kê 辶 + 目, nhưng 目 chỉ là một phần bên trong 首; 魚 dùng 田 như một phần gợi nhớ nhưng không giải thích cấu tạo đầy đủ. Không trình bày mnemonic như phân tích tự nguyên.
- Reference notes cũ trong repo nêu 80/103 trùng danh sách Kanji N5 cộng đồng, 23 chữ thêm theo Minna và 4 chữ reference chưa có (丈, 無, 誰, 貼). Đây là chênh lệch syllabus theo reference, không phải missing chính thức.
- **Đánh giá component system:** hữu ích khi liên kết đến chữ học đúng thời điểm và giải thích quan hệ thật; mapping giản lược như 道 cần bổ sung/đính chính trước khi dùng để ghi nhớ tin cậy.

## Kana Audit

### Độ phủ / reading / romaji

| Nhóm | Số mỗi script | Đánh giá |
|---|---:|---|
| Hiragana cơ bản | 46 | Đủ あ–ん, gồm を; thứ tự theo hàng âm. |
| Dakuten | 20 | Đủ が/ざ/だ/ば-series; じ đọc ji, ぢ đọc ji, づ đọc zu được lưu đúng. |
| Handakuten | 5 | Đủ ぱ-series. |
| Yōon / âm ghép | 33 | Đủ 11 nhóm × 3, gồm âm ghép hữu thanh ぎゃ/じゃ/びゃ/ぴゃ. |
| Katakana | 104 | Tạo từ cặp mỗi record: 46 cơ bản + 25 dakuten/handakuten + 33 yōon. |

Romaji đủ và khớp cách ghi phổ biến (shi, chi, tsu, fu, ji, zu, kya...). \`を\` đang ghi \`wo\`; nên lưu ý đây là cách phiên âm, còn trợ từ を thường phát âm “o”. Bộ này không có âm Katakana mở rộng như ティ/ファ/ヴ; đây không phải thiếu trong bảng cơ bản + dakuten + yōon, nhưng cần xác định có nằm ngoài phạm vi N5 app không.

### Thứ tự và độ nặng

- Ngày 1–5: 10/10/10/8/8, theo hàng âm; hợp lý để tận dụng quy luật, không cắt ngang hàng.
- Ngày 6: 25 dakuten/handakuten; ngày 7: 33 yōon và ôn/kiểm tra 104 Hiragana. Tách nhóm có logic, nhưng vẫn nhiều chữ cho người mới; cần dữ liệu nhớ sau kiểm tra để đánh giá.
- Katakana ngày 8–12 theo đúng mẫu 10/10/10/8/8; ngày 13 nhóm 25, ngày 14 nhóm 33 + ôn. Offset +7 trong catalog tạo lịch này.
- Không thay đổi roadmap trong audit này. Theo dõi kết quả kiểm tra; nếu nhớ thấp, cân nhắc ôn phân tán trước khi kết luận nhịp phù hợp.
- Lỗi cụ thể: task nghe ngày 13 dùng cặp Hiragana thay vì Katakana.

## Roadmap vs Content

### Các điểm khớp

- Có 90 \`journeyDays\`, 484 task; ngày mới lấy knowledge theo trường \`day\` qua \`buildDayPlan\`; Katakana được tạo ở \`kana.day + 7\`.
- Từ mới được đưa vào ngày 6–13 trước Minna; Lesson 1–25 chủ yếu từ ngày 15–76, xen các ngày review 21, 28, 35, 42, 49, 56, 63, 70, 77.
- \`lesson.dayRange\` có thể bao trùm review day; \`dayCount\` đếm ngày có nội dung bài mới chứ không phải hiệu số hai đầu mút.
- Tổng phút task khớp số phút ngày trong seed. Phần lớn ngày bài mới 100–122 phút kế hoạch; số phút đúng nhau không có nghĩa là workload đã được kiểm nghiệm.

### Các lệch / nội dung khó tìm thấy qua roadmap

- Ngày 7 và 14 mang chữ “& ôn tập” nhưng vẫn có yōon mới; đây là ngày học âm ghép + kiểm tra, không phải review thuần.
- Ngày 7 summary “2 từ” không khớp task ôn 3 từ; ngày 14 summary “2 từ” không khớp task ôn 25 từ. Đồng thời manifest gán 34 từ cho ngày 6–13, nên câu “25 từ trong hai tuần” cần định nghĩa lại phạm vi.
- Ngày 13 task nghe dùng Hiragana dù là ngày Katakana.
- \`lessons.vocabCount\` ghi 14 cho mọi bài nhưng thực tế là 15–57; lesson card nhận trực tiếp metadata này.
- 94 \`jlptGrammar\` không có day hay link dữ liệu vào lịch ngày; chưa rõ đây là curriculum hay reference.
- 11/63 ngày có từ 25 mục mới; ngày 31 có 35 mục (29 từ + 3 grammar + 2 Kanji + 1 radical), ngày 32 có 33. Cần review tải, nhất là ngày 31–32 và 38–39.
- Ngày 78–89 có tasks; ngày 90 không có task và title ghi nghỉ ngơi. Xác nhận UI thể hiện rõ đây là ngày nghỉ chủ đích, không phải thiếu dữ liệu.

## Recommended Fix Order

### P0

1. Giáo viên tiếng Nhật duyệt/sửa #46, #51, #97, #100 trước khi biến thành quy tắc ghi nhớ hoặc đáp án.
2. Sửa task nghe Katakana ngày 13 để ví dụ và luyện tập dùng đúng script.

### P1

3. Đồng bộ \`lessons.vocabCount\` theo actual content cho 25/25 bài.
4. Đồng bộ summary/task ngày 7 và 14 với nhóm từ thực sự ôn; quyết định phạm vi là 25 hay 34.
5. Review các ngày tải cao (31–32, 38–39, 22–25) bằng thời gian học thực tế.
6. Đối chiếu 94 \`jlptGrammar\` với 112 grammar; tạo trạng thái covered/partial/not scheduled/duplicate và reference rõ.
7. Duyệt component/mnemonic, bắt đầu với 道; phân biệt radical chính, component và mnemonic.

### P2

8. Lập workflow đối chiếu vocabulary theo nguồn/reference đã chọn; duyệt meaning, reading, N5 relevance và lý do thêm/bỏ. Không thêm hàng loạt chỉ theo một list.
9. Dạy 6 nhóm trùng kana bằng ngữ cảnh; rà cách ghi/phát âm を/wo.
10. Chốt ý nghĩa kun-reading trống và phạm vi âm Katakana mở rộng.
11. Xác nhận ngày 90 là ngày nghỉ được UI hỗ trợ rõ; theo dõi kết quả kiểm tra kana ngày 7/14.

### Tài liệu tham khảo

- [JLPT — N1–N5 Summary of Linguistic Competence](https://www.jlpt.jp/e/about/levelsummary.html)
- [Japan Foundation — みんなの教材サイト: 教師向け文法解説](https://www.kyozai.jpf.go.jp/kyozai/grammar/home/ja/render.do)
- [OpenJLPT community reference](https://github.com/evanclan/OpenJLPT)
- Repo-local references: \`content/source/Lo_trinh_JLPT_N5_90_ngay_Minna.xlsx\`, \`content/source/n5-vocabulary-supplement.tsv\`, \`docs/CONTENT_MAPPING.md\`, và ghi chú audit trước đây (dùng làm reference, không phải syllabus chính thức).
