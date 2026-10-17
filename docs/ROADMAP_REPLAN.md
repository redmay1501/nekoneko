# Phương án phân bổ lại lộ trình N5 (90 ngày)

> Trạng thái: **ĐÃ DUYỆT & ĐÃ TRIỂN KHAI trong code/dữ liệu** (18/10/2026, bản 2: bộ thủ gọn trong 3 ngày, vào bài từ ngày 18). Migration Supabase `20261018000001_roadmap_replan_v2.sql` cần chạy trước khi deploy.
> Ngày lập: 17/10/2026. Mọi con số dưới đây đếm trực tiếp từ `content/seed/n5-content.json` (chuyển từ `content/source/Lo_trinh_JLPT_N5_90_ngay_Minna.xlsx`) và đối chiếu với database Supabase đang chạy.

## 1. Kết quả audit (đã xác minh)

| Hạng mục | Số lượng | Ghi chú |
|---|---|---|
| Chữ cái (Hiragana + Katakana) | 104 | Ngày 1–14, giữ nguyên |
| Bộ thủ trong lộ trình | 45 | Hiện rải mỗi ngày 1 bộ ở ngày 15–66, xen giữa các bài |
| Bộ thủ tham khảo | 26 | Thêm từ `kanji-radicals.json`, `day = null`, chỉ để nối Kanji ↔ bộ — không thuộc lộ trình |
| Kanji | 103 | Hiện rải 1–2 chữ/ngày ở ngày 15–76 **theo danh sách riêng, không theo từ vựng** |
| Từ vựng | 755 | 25 bài Minna + 22 từ chào hỏi/Katakana ở giai đoạn chữ cái |
| Mẫu ngữ pháp | 112 | 3–6 mẫu mỗi bài |
| Bài giáo trình | 25 | Minna no Nihongo bài 1–25 |

**Phát hiện chính**

1. Hiện tại Kanji **không** đi cùng từ vựng: ví dụ ngày 15 (bài 1) dạy 日・一 nhưng từ của bài 1 là 先生・学生・会社員…; còn 先・生・学 mãi tới ngày 26–48 mới được dạy.
2. Khi gắn Kanji theo từ vựng, **89/103 Kanji** có ngữ cảnh trong từ vựng của giáo trình. Kanji dồn nhiều vào bài đầu (bài 1: 12 chữ, bài 4: 15, bài 5: 13); từ bài 13 trở đi gần như không có Kanji N5 mới.
3. **14 Kanji không xuất hiện trong bất kỳ từ vựng nào** (kể cả dạng viết kana): 東 目 山 北 川 千 西 空 何 南 右 左 駅 耳. Dữ liệu Kanji của các chữ này có sẵn 3 từ ví dụ mỗi chữ (vd. 駅 → 駅・東京駅・駅前) nhưng các từ đó không nằm trong bảng từ vựng.
4. Từ vựng của bài chứa thêm 379 chữ Hán ngoài danh sách 103 Kanji N5 (曜・物・家…). Không có dữ liệu Kanji cho các chữ này → vẫn hiển thị trong từ như hiện nay, **không tự tạo** dữ liệu Kanji mới.
5. 6 từ có gắn bài 1–2 (はじめまして, ありがとう, ええ, おはよう, テレビ, ラジオ) đang nằm ở ngày chữ cái; không chứa Kanji → giữ nguyên.
6. Database khớp hoàn toàn với file seed về cột `day` (radicals, kanji, vocabulary, grammar). 13 tài khoản hiện đều ở **ngày 1–8** (giai đoạn chữ cái); 392 bản ghi trí nhớ.

## 2. Cách phân bổ

- **Ngày 1–14:** chữ cái, giữ nguyên.
- **Ngày 15–17:** 45 bộ thủ, 15 bộ/ngày, giữ thứ tự hiện có, không có ngày ôn riêng. Mục tiêu: nhận diện mặt chữ, nhớ tên/nghĩa, nhận ra bộ trong Kanji (dùng `kanjiList`, `tip` sẵn có). Không bắt viết nhiều lần. Ôn bộ thủ về sau do Memory Engine đưa vào phiên ôn hằng ngày.
- **Ngày 18–81:** bài 1 → 25 đúng thứ tự, 1–4 ngày/bài; một ngày ôn sau khoảng 8 ngày học (rơi đúng ranh giới bài). 3 ngày dư (do bộ thủ gọn lại) dành cho các bài nặng Kanji nhất ở đầu: bài 2, 3 (3 ngày) và bài 4 (4 ngày).
- **Ngày 82–90:** tổng ôn & thi thử.

**Chia một bài thành nhiều ngày** — tự động, có thể kiểm chứng lại:
- Số ngày của bài = lớn nhất trong (số từ ÷ 20, số Kanji mới ÷ 6, số mẫu câu ÷ 3), làm tròn lên.
- Từ vựng giữ đúng thứ tự giáo trình, cắt thành các nhóm liền nhau sao cho tải mỗi ngày (số từ + 2 × số Kanji mới) cân nhất.
- **Kanji được giới thiệu đúng ngày có từ đầu tiên chứa nó** (vd. 先・生 cùng ngày với 先生). Kanji đã gặp ở bài trước không tính là mới.
- Mẫu câu chia theo thứ tự, ngày đầu nhận nhiều hơn.

**Độ cân bằng:** tối đa 21 từ, 6 Kanji mới, 3 mẫu câu mỗi ngày. Tổng: 755 từ, 112 mẫu, 45 bộ, 89 Kanji theo từ + 14 Kanji còn lại — không bỏ mục nào.

**Số ngày mỗi bài:** bài 4: 4 ngày (15 Kanji giờ/ngày/thứ); bài 2, 3, 5 (Kanji số đếm), 8, 9, 11 (nhiều từ): 3 ngày; bài 23: 1 ngày (18 từ, 3 mẫu, 2 Kanji); các bài còn lại 2 ngày.

## 3. Bảng phân bổ 90 ngày

Cột “Từ vựng”: số từ của ngày, từ đầu … từ cuối của nhóm. Cột “Kanji mới”: chữ (từ giới thiệu nó trong ngày).

| Ngày | Giai đoạn | Nội dung | Từ vựng | Kanji mới (từ ngữ cảnh) | Mẫu câu |
|---|---|---|---|---|---|
| 1 | Chữ cái | Hiragana: hàng あ・か (10 âm) | — | — | — |
| 2 | Chữ cái | Hiragana: hàng さ・た (10 âm) | — | — | — |
| 3 | Chữ cái | Hiragana: hàng な・は (10 âm) | — | — | — |
| 4 | Chữ cái | Hiragana: hàng ま・や (8 âm) | — | — | — |
| 5 | Chữ cái | Hiragana: hàng ら・わ・ん (8 âm) | — | — | — |
| 6 | Chữ cái | Hiragana: âm đục & bán đục (゛ ゜) | 3: はい、いいえ、わかりました | — | — |
| 7 | Chữ cái | Hiragana: âm ghép (きゃ・しゅ・ちょ…) & ôn tập | — | — | — |
| 8 | Chữ cái | Katakana: hàng あ・か (10 âm) | 4: テレビ、ラジオ、おはようございます、こんにちは | — | — |
| 9 | Chữ cái | Katakana: hàng さ・た (10 âm) | 4: パン、コーヒー、こんばんは、さようなら | — | — |
| 10 | Chữ cái | Katakana: hàng な・は (10 âm) | 4: タクシー、バス、ありがとうございます、どういたしまして | — | — |
| 11 | Chữ cái | Katakana: hàng ま・や (8 âm) | 4: ノート、ペン、すみません、ごめんなさい | — | — |
| 12 | Chữ cái | Katakana: hàng ら・わ・ん (8 âm) | 7: はじめまして、カメラ、パソコン、どうぞよろしく、ありがとう、ええ、おはよう | — | — |
| 13 | Chữ cái | Katakana: âm đục & bán đục (゛ ゜) | 2: レストラン、コンビニ | — | — |
| 14 | Chữ cái | Katakana: âm ghép (きゃ・しゅ・ちょ…) & ôn tập | — | — | — |
| 15 | Bộ thủ | Bộ thủ (1/3): 人 口 日 月 木 水 火 土 金 女 子 心 手 目 耳 | — | — | — |
| 16 | Bộ thủ | Bộ thủ (2/3): 足 言 車 門 食 魚 雨 山 川 田 力 大 小 宀 艹 | — | — | — |
| 17 | Bộ thủ | Bộ thủ (3/3): 辶 彳 广 儿 十 白 立 馬 貝 糸 米 生 一 亠 尸 | — | — | — |
| 18 | Giáo trình | **Bài 1** (1/2) · Chào hỏi & Giới thiệu bản thân | 8: 私 … お願いします | 先 (先生)、生 (先生)、学 (学生)、会 (会社員)、社 (会社員)、行 (銀行員) | N1 は N2 です · N1 は N2 じゃ ありません · N1 は N2 ですか |
| 19 | Giáo trình | **Bài 1** (2/2) · Chào hỏi & Giới thiệu bản thân | 11: 外国人 … 生徒 | 外 (外国人)、国 (外国人)、人 (外国人)、大 (大学)、名 (名前)、前 (名前) | N も · N1 の N2 |
| 20 | Giáo trình | **Bài 2** (1/3) · これ・それ・あれ — Chỉ đồ vật | 6: 本 … 名刺 | 本 (本)、書 (辞書)、新 (新聞)、聞 (新聞)、手 (手帳) | これ / それ / あれ · この N / その N / あの N |
| 21 | Giáo trình | **Bài 2** (2/3) · これ・それ・あれ — Chỉ đồ vật | 14: 鍵 … 時計 | 時 (時計) | そうです / そうじゃ ありません · N1 の N2 (chất liệu, chủ đề) |
| 22 | Giáo trình | **Bài 2** (3/3) · これ・それ・あれ — Chỉ đồ vật | 10: 傘 … どれ | 万 (万年筆)、年 (万年筆)、語 (英語) | 〜は 〜ですか、〜ですか |
| 23 | Giáo trình | **Bài 3** (1/3) · ここ・そこ・あそこ — Chỉ nơi chốn | 16: 教室 … そっち | 食 (食堂) | ここ / そこ / あそこ · こちら / そちら / あちら |
| 24 | Giáo trình | **Bài 3** (2/3) · ここ・そこ・あそこ — Chỉ nơi chốn | 12: あっち … 入口 | 円 (円)、入 (入口)、口 (入口) | N は 場所 です · N は どこですか |
| 25 | Giáo trình | **Bài 3** (3/3) · ここ・そこ・あそこ — Chỉ nơi chốn | 8: 出口 … 学校 | 出 (出口)、下 (廊下)、金 (お金)、校 (学校) | いくらですか |
| 26 | Ôn tập | Ôn tập — Minna bài 1–3 | — | — | — |
| 27 | Giáo trình | **Bài 4** (1/4) · Giờ giấc & Thì của động từ | 8: 起きます … 今日 | 休 (休みます)、今 (今日)、日 (今日) | 今 〜時 〜分です · V ます / V ません |
| 28 | Giáo trình | **Bài 4** (2/4) · Giờ giấc & Thì của động từ | 11: 明日 … 毎朝 | 一 (一昨日)、午 (午前)、後 (午後)、毎 (毎朝) | V ました / V ませんでした · 時間 に V |
| 29 | Giáo trình | **Bài 4** (3/4) · Giờ giấc & Thì của động từ | 11: 毎晩 … 水曜日 | 月 (月曜日)、分 (〜分)、火 (火曜日)、水 (水曜日) | N1 から N2 まで |
| 30 | Giáo trình | **Bài 4** (4/4) · Giờ giấc & Thì của động từ | 11: 木曜日 … 始まります | 木 (木曜日)、土 (土曜日)、電 (電話)、話 (電話) | N1 と N2 |
| 31 | Giáo trình | **Bài 5** (1/3) · Đi lại — Phương tiện & Điểm đến | 13: 行きます … 四日 | 来 (来ます)、車 (電車)、二 (二日)、三 (三日)、四 (四日) | 場所 へ 行きます / 来ます / 帰ります · どこ[へ]も 行きません |
| 32 | Giáo trình | **Bài 5** (2/3) · Đi lại — Phương tiện & Điểm đến | 7: 五日 … 二十日 | 五 (五日)、六 (六日)、七 (七日)、八 (八日)、九 (九日)、十 (十日) | 乗り物 で 行きます · 人 と V |
| 33 | Giáo trình | **Bài 5** (3/3) · Đi lại — Phương tiện & Điểm đến | 21: 先週 … 一緒 | 週 (先週)、友 (友だち) | いつ V ますか |
| 34 | Giáo trình | **Bài 6** (1/2) · Tân ngữ を & Rủ rê | 16: 食べます … お酒 | 飲 (飲みます)、見 (見ます)、読 (読みます) | N を V · N を します · 場所 で V |
| 35 | Giáo trình | **Bài 6** (2/2) · Tân ngữ を & Rủ rê | 17: 果物 … 宿題 | 買 (買います)、魚 (魚)、店 (喫茶店) | いっしょに V ませんか · V ましょう |
| 36 | Ôn tập | Ôn tập — Minna bài 4–6 | — | — | — |
| 37 | Giáo trình | **Bài 7** (1/2) · Cho & Nhận, Công cụ で | 16: あげます … スプーン | — | 道具 で V · N を あげます · N を もらいます |
| 38 | Giáo trình | **Bài 7** (2/2) · Cho & Nhận, Công cụ で | 10: 紙 … 奥さん | 花 (花)、母 (お母さん)、父 (お父さん) | もう V ました · 〜語 で 何ですか |
| 39 | Giáo trình | **Bài 8** (1/3) · Tính từ | 11: 大きい … 甘い | 小 (小さい)、古 (古い)、高 (高い)、安 (安い)、白 (面白い) | い-adj + です · な-adj + です |
| 40 | Giáo trình | **Bài 8** (2/3) · Tính từ | 21: 辛い … 危ない | 長 (長い) | Adj + N · N は どうですか |
| 41 | Giáo trình | **Bài 8** (3/3) · Tính từ | 21: 汚い … いかが | 気 (元気) | 〜が、〜 |
| 42 | Giáo trình | **Bài 9** (1/3) · Thích / Giỏi / Có & Lý do から | 14: 好き[な] … 黒い | 上 (上手[な]) | N が 好き / 嫌い / 上手 / 下手 です · N が わかります |
| 43 | Giáo trình | **Bài 9** (2/3) · Thích / Giỏi / Có & Lý do から | 16: 白い … 嫌 | — | 〜から、〜 · どうして〜か |
| 44 | Giáo trình | **Bài 9** (3/3) · Thích / Giỏi / Có & Lý do から | 12: 上手 … ちょっと | 言 (言葉)、少 (少し) | よく / だいたい / たくさん / 少し / あまり / 全然 |
| 45 | Ôn tập | Ôn tập — Minna bài 7–9 | — | — | — |
| 46 | Giáo trình | **Bài 10** (1/2) · Tồn tại — あります / います & Vị trí | 20: います … 本棚 | 中 (中) | 場所 に N が あります / います · N は 場所 に あります / います |
| 47 | Giáo trình | **Bài 10** (2/2) · Tồn tại — あります / います & Vị trí | 20: 隣 … アパート | 間 (間) | N1 の N2 (vị trí) · N1 や N2 (など) |
| 48 | Giáo trình | **Bài 11** (1/3) · Số đếm & Lượng từ | 15: 一つ〜十 … 八つ | — | 〜つ (1〜10) · 〜人 / 〜台 / 〜枚 / 〜冊 |
| 49 | Giáo trình | **Bài 11** (2/3) · Số đếm & Lượng từ | 19: 九つ … 大人 | — | 〜回 / 〜時間 / 〜週間 / 〜か月 / 〜年 · 期間 に 回数 |
| 50 | Giáo trình | **Bài 11** (3/3) · Số đếm & Lượng từ | 11: 男の子 … 一月 | 男 (男の子)、子 (男の子)、女 (女の子)、半 (半分) | Số lượng + だけ / しか〜ない |
| 51 | Giáo trình | **Bài 12** (1/2) · Quá khứ của tính từ & So sánh | 11: 寒い … より | 天 (天気)、雨 (雨)、多 (多い) | Adj quá khứ · N1 は N2 より Adj です |
| 52 | Giáo trình | **Bài 12** (2/2) · Quá khứ của tính từ & So sánh | 17: もっと … パーティー | — | N1 と N2 と どちらが Adj ですか · N1 [の中] で 何/どこ/だれ が いちばん Adj ですか |
| 53 | Giáo trình | **Bài 13** (1/2) · Mong muốn — たい & ほしい | 13: ほしい … ホテル | — | N が ほしいです · V ます-stem + たいです |
| 54 | Giáo trình | **Bài 13** (2/2) · Mong muốn — たい & ほしい | 14: 町 … バター | — | 場所 へ V ます-stem に 行きます / 来ます / 帰ります · N (danh động từ) に 行きます |
| 55 | Ôn tập | Ôn tập — Minna bài 10–13 | — | — | — |
| 56 | Giáo trình | **Bài 14** (1/2) · Thể て & Yêu cầu | 14: つけます … 曲がります | 立 (立ちます) | Cách chia thể て · V て ください |
| 57 | Giáo trình | **Bài 14** (2/2) · Thể て & Yêu cầu | 16: 持ちます … さあ | — | V て います · V ましょうか |
| 58 | Giáo trình | **Bài 15** (1/2) · Cho phép & Cấm đoán | 14: 住みます … 家庭 | — | V て も いいです · V て は いけません |
| 59 | Giáo trình | **Bài 15** (2/2) · Cho phép & Cấm đoán | 14: 高校 … クラス | — | V て います (trạng thái) · 〜を 知って います / 知りません |
| 60 | Giáo trình | **Bài 16** (1/2) · Nối câu bằng thể て | 13: 浴びます … 洗います | — | V1 て、V2 て、V3 · V1 て から、V2 · N は N が Adj です |
| 61 | Giáo trình | **Bài 16** (2/2) · Nối câu bằng thể て | 13: 広い … そうして | — | Adj て / で (nối tính từ) · どうやって〜か |
| 62 | Giáo trình | **Bài 17** (1/2) · Thể ない — Cấm, Bắt buộc, Không cần | 11: 脱ぎます … 大丈夫 | — | Cách chia thể ない · V ない で ください · V なければ なりません |
| 63 | Giáo trình | **Bài 17** (2/2) · Thể ない — Cấm, Bắt buộc, Không cần | 12: 大変 … もう | — | V なくても いいです · 時 まで に V |
| 64 | Ôn tập | Ôn tập — Minna bài 14–17 | — | — | — |
| 65 | Giáo trình | **Bài 18** (1/2) · Thể từ điển & Khả năng | 11: できます … 洗濯 | — | Thể từ điển (辞書形) · N が できます · V る こと が できます |
| 66 | Giáo trình | **Bài 18** (2/2) · Thể từ điển & Khả năng | 11: 趣味 … やります | — | わたしの 趣味は V る ことです · V る まえに / N の まえに / 期間 まえに |
| 67 | Giáo trình | **Bài 19** (1/2) · Thể た — Kinh nghiệm & Liệt kê | 10: 登ります … 弱い | — | Thể た — nói với bạn bè về việc đã qua · V た こと が あります |
| 68 | Giáo trình | **Bài 19** (2/2) · Thể た — Kinh nghiệm & Liệt kê | 10: 調子 … ほか | — | V たり V たり します · Adj く なります / に なります |
| 69 | Giáo trình | **Bài 20** (1/2) · Thể thông thường (普通形) | 10: 要ります … 研究します | — | Thể thông thường của động từ · Thể thông thường của tính từ và danh từ |
| 70 | Giáo trình | **Bài 20** (2/2) · Thể thông thường (普通形) | 10: 大学院 … など | — | Câu hỏi thân mật · Lược bỏ trợ từ |
| 71 | Giáo trình | **Bài 21** (1/2) · Ý kiến — と 思います / と 言います | 8: 思います … 違います | 足 (足ります) | 普通形 と 思います · 普通形 と 言います |
| 72 | Giáo trình | **Bài 21** (2/2) · Ý kiến — と 思います / と 言います | 11: 大切 … 消えます | — | 普通形 でしょう？ · N / 場所 で |
| 73 | Ôn tập | Ôn tập — Minna bài 18–21 | — | — | — |
| 74 | Giáo trình | **Bài 22** (1/2) · Mệnh đề bổ nghĩa danh từ | 15: 着ます … ズボン | — | 普通形 + N · Trong mệnh đề bổ nghĩa, が thay cho は |
| 75 | Giáo trình | **Bài 22** (2/2) · Mệnh đề bổ nghĩa danh từ | 15: 靴 … 財布 | — | V る 時間 / 約束 / 用事 が あります |
| 76 | Giáo trình | **Bài 23** (1/1) · とき & Điều kiện と | 18: 回します … 出ます | 道 (道)、百 (八百屋) | 普通形 + とき、〜 · N の とき / Adj な とき / Adj い とき · V る と、〜 |
| 77 | Giáo trình | **Bài 24** (1/2) · Cho & Nhận nâng cao — てあげる / てもらう / てくれる | 7: くれます … 説明します | — | N を くれます · V て あげます |
| 78 | Giáo trình | **Bài 24** (2/2) · Cho & Nhận nâng cao — てあげる / てもらう / てくれる | 8: レコード … コピーします | — | V て もらいます · V て くれます |
| 79 | Giáo trình | **Bài 25** (1/2) · Giả định — たら & ても | 7: 引っ越しします … 〜たら | — | 普通形 た + ら、〜 · V て も、〜 |
| 80 | Giáo trình | **Bài 25** (2/2) · Giả định — たら & ても | 8: 方 … 頑張ります | — | もし 〜 たら · いくら 〜 ても |
| 81 | Ôn tập | Ôn tập — Minna bài 22–25 | — | — | — |
| 82 | Tổng ôn & thi thử | Kanji N5 còn lại (14 chữ chưa có trong từ vựng) + tổng ôn Kanji | — | 14 chữ: 東目山北川千西空何南右左駅耳 (qua từ ví dụ trong dữ liệu Kanji) | — |
| 83 | Tổng ôn & thi thử | Tổng ôn trợ từ, tính từ & so sánh (bài 1–12) | — | — | — |
| 84 | Tổng ôn & thi thử | Tổng ôn chia động từ (bài 14, 17–20) | — | — | — |
| 85 | Tổng ôn & thi thử | Luyện dạng đề: Chữ Hán – Từ vựng – Ngữ pháp – Đọc hiểu | — | — | — |
| 86 | Tổng ôn & thi thử | 🎯 Đề thi thử số 1 | — | — | — |
| 87 | Tổng ôn & thi thử | Chữa đề 1 + vá lỗ hổng | — | — | — |
| 88 | Tổng ôn & thi thử | 🎯 Đề thi thử số 2 | — | — | — |
| 89 | Tổng ôn & thi thử | Chữa đề 2 + chốt sổ tay | — | — | — |
| 90 | Tổng ôn & thi thử | Ngày cuối — nghỉ ngơi, giữ sức | — | — | — |

## 4. Những điểm cần duyệt

1. **14 Kanji không có từ vựng trong giáo trình.** Đề xuất: học ở ngày 82 qua chính các từ ví dụ có trong dữ liệu Kanji (vẫn là Kanji N5 cần cho đề thi). Phương án khác: không đưa vào lộ trình, chỉ để trong thư viện Kanji.
2. **Tổng ôn rút từ 13 xuống 9 ngày** (giai đoạn bộ thủ và các bài cần thêm ngày). Gộp “tổng ôn trợ từ” + “tính từ & so sánh”, gộp hai ngày “luyện dạng đề”, gộp “chữa đề 1” + “vá lỗ hổng”, bỏ “tổng duyệt trước đề 2”. Giữ đủ 2 đề thi thử và ngày nghỉ cuối.
3. **Ngày ôn giữa lộ trình:** 7 ngày ôn — sau bài 1–3, 4–6, 7–9, 10–13, 14–17, 18–21, 22–25. Kiến thức đến hạn vẫn được Memory Engine đưa ra hằng ngày, độc lập với lộ trình.
4. **Nội dung việc của từng ngày (day_tasks từ Excel)** đang viết riêng cho từng ngày cũ (nhắc bộ thủ/Kanji của ngày đó). Khi dời ngày:
   - việc 文 ngữ pháp, 耳 nghe, 読 đọc, ✎ viết của bài đi theo phần tương ứng của bài;
   - việc 部 bộ thủ và 漢 Kanji được **dựng lại từ dữ liệu** (bộ/Kanji của ngày, từ chứa Kanji, cách đọc trong từ) — không viết thêm nội dung mới;
   - ngày bộ thủ, ngày ôn và tổng ôn dùng việc dựng từ dữ liệu + nội dung Excel gộp của ngày cũ tương ứng.

## 5. Bảo toàn trí nhớ và tiến độ

- **Trí nhớ** (`memory_items`, `review_events`) gắn theo loại + id kiến thức, **không theo ngày** → không đổi, không tạo trùng, không reset. Kiến thức đến hạn vẫn vào phiên ôn như cũ.
- Chỉ đổi cột `day` của radicals / kanji / vocabulary / grammar (cùng id), bảng `journey_days` và `day_tasks`. Không đụng các cột nội dung khác — sửa đổi ở /admin được giữ (không chạy lại seed ghi đè).
- **Tiến độ** (`profiles.current_day`): hiện mọi tài khoản ở ngày 1–8 → không ai bị ảnh hưởng. Cho chắc chắn, migration vẫn đổi ngày cũ → ngày mới theo bài đang học (về đầu bài đó; bộ thủ chưa gặp hiện là “còn học bù” ở ngày 15–17, không tự đánh dấu xong):
  15→18 · 16→18 · 17→20 · 18→20 · 19→23 · 20→23 · 21→27 · 22→27 · 23→27 · 24→31 · 25→31 · 26→34 · 27→34 · 28→37 · 29→37 · 30→37 · 31→39 · 32→39 · 33→42 · 34→42 · 35→46 · 36→46 · 37→46 · 38→48 · 39→48 · 40→51 · 41→51 · 42→53 · 43→53 · 44→53 · 45→56 · 46→56 · 47→56 · 48→58 · 49→58 · 50→58 · 51→60 · 52→60 · 53→62 · 54→62 · 55→62 · 56→65 · 57→65 · 58→65 · 59→67 · 60→67 · 61→67 · 62→69 · 63→69 · 64→69 · 65→69 · 66→71 · 67→71 · 68→74 · 69→74 · 70→76 · 71→76 · 72→76 · 73→77 · 74→77 · 75→79 · 76→79 · 77→81 · 78→82 · 79→83 · 80→83 · 81→84 · 82→85 · 83→85 · 84→86 · 85→87 · 86→87 · 87→88 · 88→88 · 89→89 · 90→90
- `journey_day_completions` là nhật ký → giữ nguyên bản ghi cũ, thêm cột phiên bản lộ trình (migration chỉ thêm, không xoá).
- Trạng thái ngày vẫn tính từ kiến thức đã gặp thật; mở bài hay chuyển ngày không tự đánh dấu hoàn thành.

## 6. Các bước triển khai sau khi duyệt

1. Ghi phép phân bổ vào `scripts/roadmap_adjustments.py` (có ngày, lý do) → sinh lại `n5-content.json` (chế độ demo dùng ngay).
2. Migration Supabase chỉ cập nhật cột `day`, `journey_days`, `day_tasks`, ánh xạ `current_day`; chạy thử trên nhánh trước.
3. Cập nhật `JOURNEY_STAGES` (Chữ cái 1–14 · Bộ thủ 15–17 · Giáo trình 18–81 · Tổng ôn 82–90), bản đồ và trang ngày.
4. Trang ngày: Kanji hiển thị trong ngữ cảnh từ của ngày (từ đầy đủ, kana, nghĩa, cách đọc trong từ, các từ khác cùng Kanji), có bài nhận diện Kanji / đọc từ / nhớ nghĩa.
5. Test: mọi Kanji có từ chứa nó cùng ngày (trừ 14 chữ ở ngày 82); mỗi ngày đủ giới hạn; thứ tự bài không giảm; tổng số mục không đổi; ánh xạ tiến độ không lùi về trước bài đang học; trí nhớ không bị đụng.

## 7. Đã triển khai (18/10/2026)

- \`scripts/roadmap_adjustments.py\` — điều chỉnh \`roadmap-replan-v2\` (chạy lại nhiều lần không đổi kết quả) → \`content/seed/n5-content.json\`.
- \`supabase/migrations/20261018000001_roadmap_replan_v2.sql\` — sinh từ dữ liệu: chỉ cột \`day\` theo id, \`journey_days\` + \`day_tasks\`, \`lessons\`, ánh xạ tiến độ. Không đụng bảng trí nhớ.
- Bài đọc hiểu (\`reading-passages.json\`) dời về ngày cuối của bài; 6 chữ Hán chưa học tới ngày đó viết lại bằng kana (二かい→にかい, 一かい→いっかい, 山→やま, 道→みち, 駅→えき, 川→かわ).
- Phiên học: Kanji đứng ngay sau từ đầu tiên chứa nó (\`orderDayKnowledge\`); trang ngày: “Kanji trong từ hôm nay” — từ, cách đọc, nghĩa, cách đọc của chữ trong từ (suy từ âm On/Kun của dữ liệu, không chắc thì không ghi), từ đã gặp trước có cùng chữ.
- Thẻ Kanji & kiểm tra: bài “đọc từ” dùng từ của ngày học trước; bài “cách đọc” ưu tiên âm trong từ; “Đã gặp trong” chỉ lấy từ đã học (không lấy từ bài sau).
- Test: \`src/features/roadmap/roadmap-replan.test.ts\` (thứ tự giai đoạn và bài, Kanji cùng ngày với từ đầu tiên chứa nó, 14 Kanji ngày 82, giới hạn mỗi ngày, cách đọc trong từ, migration không đụng trí nhớ và không lùi tiến độ).
- Ghi chú: chuyển lại từ Excel (\`convert-roadmap.py\`) vốn đã lệch file JSON đang dùng từ trước (sửa tay sau khi chuyển: mẹo ん, 4 từ bị bỏ, câu trong tài liệu học) — không do thay đổi này.
