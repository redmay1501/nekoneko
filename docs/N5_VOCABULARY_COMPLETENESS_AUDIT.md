# Audit độ đầy đủ từ vựng N5 (Minna no Nihongo bài 1–25)

**Ngày audit:** 2026-11-18 · **Dữ liệu:** `content/seed/n5-content.json` · **Danh mục đối chiếu:** `content/source/minna-vocabulary-audit.json`
**Áp dụng:** `python3 scripts/apply_vocabulary_audit.py` → `python3 scripts/make_migration_vocabulary_audit.py` (migration `supabase/migrations/20261118000001_minna_vocabulary_audit.sql`).

## Nguồn và phương pháp

- **Nguồn chuẩn:** danh mục từ mới (語彙) của từng bài trong *Minna no Nihongo Shokyu I, bản 2* (3A Corporation, 2012). Danh mục được lập lại thủ công theo từng bài (chỉ liệt kê từ + cách đọc, không chép nội dung khác của sách) và lưu ở `minnaOrder` trong file audit.
- **Không coi app bên thứ ba (Mikun…) là chuẩn.** Các mục người dùng nêu được xác minh với danh mục Minna ở trên, không chép từ app khác.
- **Đối chiếu tự động:** mỗi từ của danh mục được tìm trong app theo kana hoặc chữ Hán (cả dạng お〜 / ご〜, danh từ + します). Kết quả được duyệt tay: các trường hợp đồng âm khác nghĩa bị khớp nhầm (引きます ≠ 弾きます, 止まります ≠ 泊まります, 風 ≠ 風邪, 飴 ≠ 雨, いくつ ≠ おいくつ, 降ります: ふります ≠ おります) đã loại trừ.
- **Phân biệt:** "Từ giáo trình" = có trong danh mục Minna của bài; "Từ N5 bổ sung" = từ JLPT N5 đã có trong app nhưng không thuộc danh mục bài nào (giữ nguyên, học sau từ giáo trình trong cùng bài).
- **Không xoá từ nào.** 1.085 → 1.322 từ (+237). Id cũ giữ nguyên → trí nhớ / tiến độ người học không đổi.

## Nguyên nhân gốc

Bản v3 (`scripts/replan_v3.py`) chia lại lộ trình sao cho **số từ** mỗi bài khớp số từ của giáo trình (49 · 47 · 45 …), nhưng **nội dung** từng bài được ghép từ danh sách N5 theo chủ đề (OpenJLPT) chứ không theo danh mục Minna. Kết quả: Bài 1 đủ 49 từ nhưng có 男性・女性・社長・部長… mà thiếu 社員・エンジニア・病院・電気・日本・アメリカ…; nhiều từ của giáo trình bị đẩy về bài muộn (研究者・病院 ở Bài 15, 電気 ở Bài 23, 白い・黒い ở Bài 9 thay vì Bài 8…).

## Các mục người dùng nêu (Bài 1)

| Bạn gõ | Từ đúng (xác minh) | Cách đọc | Nghĩa | Trước audit | Sau audit |
|---|---|---|---|---|---|
| 社員 | 社員 | しゃいん | Nhân viên (của công ty ~) | Không có | Thêm vào Bài 1 |
| けんきゅしゃ | 研究者 (sai chính tả: thiếu う) | けんきゅうしゃ | Nhà nghiên cứu | Có, gán Bài 15 | Chuyển về Bài 1 |
| エンジニア | エンジニア | エンジニア | Kỹ sư | Không có | Thêm vào Bài 1 |
| 美ょイン | 病院 (gõ nhầm chữ Hán) | びょういん | Bệnh viện | Có, gán Bài 15 | Chuyển về Bài 1 |
| 電気 | 電気 | でんき | Điện (tên ngành / công ty) | Có, gán Bài 23 | Chuyển về Bài 1 |
| しつれですが | 失礼ですが (thiếu い) | しつれいですが | Xin lỗi, cho tôi hỏi… | Không có (chỉ có 失礼) | Thêm vào Bài 1 |
| お名前は | お名前は | おなまえは | Tên anh/chị là gì? | Không có | Thêm vào Bài 1 |
| こちらじゃ。。 | こちらは〜さんです (gõ dở) | こちらは〜さんです | Đây là anh/chị ~ | Không có | Thêm vào Bài 1 |
| かりきました | 〜から来ました (đảo âm) | 〜からきました | Đến từ ~ | Không có | Thêm vào Bài 1 |
| あの人 | あの人 | あのひと | Người kia | Không có | Thêm vào Bài 1 |
| あのかた | あの方 | あのかた | Vị kia (lịch sự) | Không có | Thêm vào Bài 1 |

## Tổng hợp theo bài

"Từ đang có" = số từ của bài trước audit. Chuyển đến / đi: từ đã có, đổi bài cho đúng giáo trình.

| Bài | Từ đang có | Từ xác minh còn thiếu (đã thêm) | Từ sai / đáng nghi | Hành động | Sau audit |
|---|---:|---|---|---|---:|
| 1 | 49 | 私たち, あの人, あの方, 教師, 社員, エンジニア, 何歳, おいくつ, 失礼ですが, お名前は, こちらは〜さんです, 〜から来ました, アメリカ, イギリス, インド, インドネシア, 韓国, タイ, 中国, ドイツ, 日本, ブラジル, ベトナム | そう (→ Bài 2), 彼 (→ Bài 5), 彼女 (→ Bài 5), ええ (→ Bài 6), アルバイト (→ Bài 9), 男 (→ Bài 10), 女 (→ Bài 10), 男性 (→ Bài 10), 女性 (→ Bài 10), 留学生 (→ Bài 11), みんな (→ Bài 11), 外国人 (→ Bài 11), 高校生 (→ Bài 15), 社長 (→ Bài 18), 部長 (→ Bài 18), 課長 (→ Bài 18) | thêm 23; nhận 3 từ chuyển về; chuyển 16 từ sang đúng bài | 59 |
| 2 | 47 | カード, シャープペンシル, コンピューター, チョコレート, 日本語, あのう, そうですか, これからお世話になります, こちらこそよろしく | 手紙 (→ Bài 6), 消しゴム (→ Bài 7), どんな (→ Bài 8), 字 (→ Bài 9), 箱 (→ Bài 10), 物 (→ Bài 10), 封筒 (→ Bài 11) | thêm 9; nhận 5 từ chuyển về; chuyển 7 từ sang đúng bài | 54 |
| 3 | 45 | ロビー, エスカレーター, 自動販売機, ワイン, 地下, 何階, 見せてください, イタリア, スイス, フランス | デパート (→ Bài 4), 学校 (→ Bài 5), お金 (→ Bài 7), 所 (→ Bài 8), 神社 (→ Bài 16), こっち (→ Bài 20), そっち (→ Bài 20), あっち (→ Bài 20), どっち (→ Bài 20), 建物 (→ Bài 23), 大使館 (→ Bài 25) | thêm 10; nhận 5 từ chuyển về; chuyển 11 từ sang đúng bài | 49 |
| 4 | 64 | 何時, 何分, 昼休み, 何曜日, 大変ですね, 何番 | 電話 (→ Bài 3), これから (→ Bài 7), 仕事 (→ Bài 8), 時間 (→ Bài 9), 終わり (→ Bài 20) | thêm 6; nhận 6 từ chuyển về; chuyển 5 từ sang đúng bài | 71 |
| 5 | 58 | 何年, 何月, 十四日, 二十四日, 何日, 〜番線, 次の | 車 (→ Bài 2), 切符 (→ Bài 7), お祭り (→ Bài 12), 正月 (→ Bài 13), 自動車 (→ Bài 21), 都合 (→ Bài 22) | thêm 7; nhận 7 từ chuyển về; chuyển 6 từ sang đúng bài | 66 |
| 6 | 55 | ミルク, ジュース, ビール, レポート, ビデオ, テニス, サッカー, いいですね, じゃ、また, メキシコ | いただきます (→ Bài 7), ごちそうさま (→ Bài 7), 食べ物 (→ Bài 8), 飲み物 (→ Bài 9), 喫茶店 (→ Bài 10), カレー (→ Bài 11), サンドイッチ (→ Bài 11), 牛肉 (→ Bài 12), 豚肉 (→ Bài 12), 鶏肉 (→ Bài 12), 湯 (→ Bài 23) | thêm 10; nhận 12 từ chuyển về; chuyển 11 từ sang đúng bài | 66 |
| 7 | 48 | はさみ, ケータイ, メール, 年賀状, パンチ, ホッチキス, セロテープ, クリスマス, すてきですね, いらっしゃい, 失礼します, いかがですか, スペイン | 奥さん (→ Bài 9), 夫 (→ Bài 9), 妻 (→ Bài 9), 家内 (→ Bài 9), ご主人 (→ Bài 9), 両親 (→ Bài 11) | thêm 13; nhận 11 từ chuyển về; chuyển 6 từ sang đúng bài | 66 |
| 8 | 62 | ハンサム, 親切, 素敵, 桜, 寮, 生活, お元気ですか, そうですね, 結構です, そろそろ失礼します | 甘い (→ Bài 12), 辛い (→ Bài 12), 重い (→ Bài 12), 軽い (→ Bài 12), 近い (→ Bài 12), 遠い (→ Bài 12), 早い (→ Bài 12), 速い (→ Bài 12), 遅い (→ Bài 12), 長い (→ Bài 16), 短い (→ Bài 16), 危ない (→ Bài 17), 不便 (→ Bài 21) | thêm 10; nhận 15 từ chuyển về; chuyển 13 từ sang đúng bài | 74 |
| 9 | 51 | 野球, ダンス, クラシック, ジャズ, コンサート, カラオケ, 歌舞伎, ローマ字, 細かいお金, チケット, 主人, 大体, 早く, 残念です | ～語 (→ Bài 2), 映画 (→ Bài 4), ちょっと (→ Bài 6), 白い (→ Bài 8), 黒い (→ Bài 8), 赤い (→ Bài 8), 青い (→ Bài 8), あまり (→ Bài 8), 緑 (→ Bài 16), 言葉 (→ Bài 20), 話 (→ Bài 21) | thêm 14; nhận 14 từ chuyển về; chuyển 11 từ sang đúng bài | 68 |
| 10 | 49 | 男の人, 女の人, パンダ, 象, 電池, スイッチ, 棚, 乗り場, 県 | 部屋 (→ Bài 3), 図書館 (→ Bài 4), 庭 (→ Bài 6), 海 (→ Bài 12), 住所 (→ Bài 14), 動物 (→ Bài 18), 布団 (→ Bài 22) | thêm 9; nhận 14 từ chuyển về; chuyển 7 từ sang đúng bài | 65 |
| 11 | 62 | みかん, アイスクリーム, 弟さん, 妹さん, どのくらい, 全部で, かしこまりました, いってらっしゃい, 行ってきます, 船便, 航空便, エアメール, オーストラリア | 〜時間 (→ Bài 9), 男の子 (→ Bài 10), 女の子 (→ Bài 10), メートル (→ Bài 18), 全部 (→ Bài 24) | thêm 13; nhận 9 từ chuyển về; chuyển 5 từ sang đúng bài | 79 |
| 12 | 51 | 世界, すきやき, 刺身, すし, てんぷら, レモン, 生け花, 紅葉, どちらも, ずっと, ただいま, おかえりなさい, シンガポール | 寒い (→ Bài 8), 山 (→ Bài 8), 旅行 (→ Bài 9), 木 (→ Bài 10), 一番 (→ Bài 10), 川 (→ Bài 13), 降ります (→ Bài 14) | thêm 13; nhận 17 từ chuyển về; chuyển 7 từ sang đúng bài | 74 |
| 13 | 42 | 迎えます, のどがかわきます, おなかがすきます, そうしましょう, 美術, 釣り, スキー, 週末, 定食, 牛どん, 別々に | 美術館 (→ Bài 4), スーパー (→ Bài 5), 店 (→ Bài 6), 暇 (→ Bài 8), 町 (→ Bài 8), ～屋 (→ Bài 10), ホテル (→ Bài 12), 砂糖 (→ Bài 14), 塩 (→ Bài 14), おなか (→ Bài 16), のど (→ Bài 17), 出かけます (→ Bài 17), 払います (→ Bài 17), 着物 (→ Bài 20) | thêm 11; nhận 5 từ chuyển về; chuyển 14 từ sang đúng bài | 44 |
| 14 | 41 | エアコン, 読み方, あとで, もう少し | どうぞ (→ Bài 2), ください (→ Bài 3), 始めます (→ Bài 16) | thêm 4; nhận 13 từ chuyển về; chuyển 3 từ sang đúng bài | 55 |
| 15 | 28 | 資料, カタログ, 時刻表, 製品, ソフト, 電子辞書, 経済, 市役所, 思い出します, いらっしゃいます | 研究者 (→ Bài 1), 病院 (→ Bài 1), 家族 (→ Bài 5), たばこ (→ Bài 6), 写真 (→ Bài 6), クラス (→ Bài 11), 使います (→ Bài 14), 問題 (→ Bài 14), 乗ります (→ Bài 16), 着きます (→ Bài 25) | thêm 10; nhận 4 từ chuyển về; chuyển 10 từ sang đúng bài | 32 |
| 16 | 54 | 下ろします, 見学します, サービス, ジョギング, お寺, どうやって, まず, 次に, キャッシュカード, 暗証番号, 金額, 確認 | それから (→ Bài 6), そして (→ Bài 8), 空港 (→ Bài 12), 広い (→ Bài 13), 狭い (→ Bài 13), 洗います (→ Bài 18), 眠い (→ Bài 19), 初め (→ Bài 20), 交通 (→ Bài 21), 歩きます (→ Bài 23), 渡ります (→ Bài 23), 交差点 (→ Bài 23), 駐車場 (→ Bài 23) | thêm 12; nhận 8 từ chuyển về; chuyển 13 từ sang đúng bài | 61 |
| 17 | 36 | 禁煙, 保険証, 下着, 〜までに, ですから, どうしましたか, お大事に | もう (→ Bài 7), まだ (→ Bài 7), 大変 (→ Bài 13), パスポート (→ Bài 14), 歯医者 (→ Bài 15), 無理 (→ Bài 19) | thêm 7; nhận 6 từ chuyển về; chuyển 6 từ sang đúng bài | 43 |
| 18 | 29 | 換えます, 現金, お祈り, 馬, 特に, へえ, なかなか, 本当ですか, ぜひ | 試験 (→ Bài 4), 入ります (→ Bài 14), 答え (→ Bài 14), 頭 (→ Bài 16), 一度 (→ Bài 19), 練習 (→ Bài 19), 夢 (→ Bài 21), 準備 (→ Bài 24) | thêm 9; nhận 6 từ chuyển về; chuyển 8 từ sang đúng bài | 36 |
| 19 | 31 | 相撲, 一度も, おかげさまで, 乾杯, ダイエット, 体にいい | お茶 (→ Bài 6), 花見 (→ Bài 6), いつも (→ Bài 6), 時々 (→ Bài 6), 初めて (→ Bài 12), また (→ Bài 14), 最近 (→ Bài 21) | thêm 6; nhận 5 từ chuyển về; chuyển 7 từ sang đúng bài | 35 |
| 20 | 29 | 修理します, ビザ, みんなで, おなかがいっぱい | 普通 (→ Bài 5), 研究します (→ Bài 15), でも (→ Bài 19), すごい (→ Bài 21) | thêm 4; nhận 8 từ chuyển về; chuyển 4 từ sang đúng bài | 37 |
| 21 | 38 | 役に立ちます, 動きます, やめます, 気をつけます, 留学します, 無駄, 物価, 放送, アニメ, マンガ, デザイン, 天才, 地球, 本当に, そんなに, 〜について, 仕方がありません, しばらくですね, もちろん | 違います (→ Bài 2), 会議 (→ Bài 4), 悪い (→ Bài 8), 大切 (→ Bài 17), 寂しい (→ Bài 23), 足ります (→ Bài 25) | thêm 19; nhận 7 từ chuyển về; chuyển 6 từ sang đúng bài | 58 |
| 22 | 24 | スーツ, ロボット, ユーモア, えーと, おめでとうございます, 家賃, 和室, 押し入れ | 靴 (→ Bài 3), ネクタイ (→ Bài 3), シャツ (→ Bài 7), 用事 (→ Bài 9), 約束 (→ Bài 9), 服 (→ Bài 15), 上着 (→ Bài 17) | thêm 8; nhận 2 từ chuyển về; chuyển 7 từ sang đúng bài | 27 |
| 23 | 34 | サイズ, 何回も | 電気 (→ Bài 1), 切ります (→ Bài 7), 子ども (→ Bài 9), 右 (→ Bài 10), 左 (→ Bài 10), かかります (→ Bài 11), 出ます (→ Bài 14) | thêm 2; nhận 7 từ chuyển về; chuyển 7 từ sang đúng bài | 36 |
| 24 | 19 | 引っ越し, ホームステイ, 自分で, ほかに | 一人で (→ Bài 5), 送ります (→ Bài 7), コピーします (→ Bài 14), 地図 (→ Bài 14) | thêm 4; nhận 2 từ chuyển về; chuyển 4 từ sang đúng bài | 21 |
| 25 | 17 | グループ, 転勤, こと, どうぞお元気で | — | thêm 4; nhận 3 từ chuyển về | 24 |

Kiểm tra khác trên toàn bộ danh sách (trước và sau audit):

- **Trùng lặp:** không có bản ghi trùng cả kana + chữ Hán + nghĩa. Các cặp đồng âm khác nghĩa (きます 来/着, はし 箸/橋, かえます 変/換, はやい 早/速…) là từ khác nhau, giữ nguyên.
- **Thiếu cách đọc / thiếu nghĩa:** 0 từ (mọi từ có `kana` và `meaning`).
- **Viết sai chữ Hán / cách đọc:** không phát hiện trong số từ đã đối chiếu với danh mục Minna.
- **Không phù hợp N5:** các từ bổ sung đều là từ của danh mục Minna I (bài 1–25), tức thuộc phạm vi N5 theo giáo trình.
- **Từ có trong bài đọc nhưng không có trong danh sách:** ベトナム (4 bài đọc), ブラジル, 昼休み — đã thêm. Các từ bài đọc dùng trước khi học tới được chú thích ngay trong bài đọc (xem báo cáo cải thiện, Phần 7).
- **Từ có trong danh sách nhưng không được dùng ở hoạt động nào:** không có — mọi từ đều có ngày học nên xuất hiện trong thẻ học, quiz theo ngày, phiên ôn, luyện nghe / nghe – gõ (theo phạm vi).

## Lịch học sau audit

- Khung 90 ngày **giữ nguyên** (mỗi bài vẫn đúng các ngày cũ) → không đổi tiến độ người học, không cần chuyển ngày hoàn thành.
- Trong mỗi bài: từ giáo trình (theo thứ tự danh mục) học trước, từ N5 bổ sung sau.
- Kanji vẫn học **cùng ngày với từ đầu tiên chứa nó** và ≤ 6 Kanji mới/ngày. Vì 日本・中国・何歳・〜から来ました nay ở Bài 1, các chữ 日・本・中・国・何・来・電・気 được học ở Bài 1 (trước là Bài 2–4).
- Để giữ ≤ 6 Kanji/ngày cho Bài 1, 6 từ N5 bổ sung có chữ Hán mà giáo trình dạy gốc ở bài sau được xếp theo bài của gốc từ: 男・女・男性・女性 → Bài 10 (cùng 男の人・女の人), 外国人 → Bài 11 (cùng 外国), 高校生 → Bài 15 (cùng 高校).
- Không giới hạn số từ mỗi ngày theo thời gian học; ngày nặng nhất có 34 từ (ngày 35, Bài 7). Người học tự chia trong luồng học theo ngày (mỗi bước có điểm dừng).

## Chưa xác minh / chưa thay đổi

| Mục | Lý do giữ nguyên |
|---|---|
| どちら (Bài 3: "ở đâu" lịch sự) | App có どちら ở Bài 12 với nghĩa "cái nào (trong hai)". Nghĩa Bài 3 chưa thêm thành mục riêng để tránh hai thẻ cùng chữ; nên bổ sung nghĩa vào thẻ hiện có sau khi duyệt. |
| 信号, まがります | Xuất hiện ở hội thoại Bài 14 nhưng là từ mới chính thức của Bài 23 — giữ theo app. |
| おつり, 〜前, 〜中 | Cách dùng trong app (tiền thừa, "kém ~ phút", "suốt ~") không trùng khớp rõ với một mục trong danh mục — giữ nguyên. |
| ケーキ | Không chắc bài giới thiệu trong danh mục (19 hay 22) — giữ ở Bài 6. |
| Tên riêng hư cấu trong 会話 (IMC, パワー電気, さくら大学…) | Không đưa vào danh sách từ. |

## Danh sách từ đã bổ sung

Nguồn mỗi từ: danh mục từ mới của bài tương ứng trong *Minna no Nihongo Shokyu I, bản 2*, trừ ベトナム (xuất hiện trong bài đọc NekoNeko, cần cho người học Việt Nam). Lý do chung: từ của danh mục bài còn thiếu trong app.

| Bài | Từ | Cách đọc | Nghĩa tiếng Việt | Nguồn xác minh |
|---:|---|---|---|---|
| 1 | 私たち | わたしたち | Chúng tôi, chúng ta | Minna I, bài 1 |
| 1 | あの人 | あのひと | Người kia, người ấy | Minna I, bài 1 |
| 1 | あの方 | あのかた | Vị kia (lịch sự của あの人) | Minna I, bài 1 |
| 1 | 教師 | きょうし | Giáo viên (nói về nghề của mình) | Minna I, bài 1 |
| 1 | 社員 | しゃいん | Nhân viên (của công ty ~) | Minna I, bài 1 |
| 1 | エンジニア | エンジニア | Kỹ sư | Minna I, bài 1 |
| 1 | 何歳 | なんさい | Mấy tuổi | Minna I, bài 1 |
| 1 | おいくつ | おいくつ | Bao nhiêu tuổi (lịch sự) | Minna I, bài 1 |
| 1 | 失礼ですが | しつれいですが | Xin lỗi, cho tôi hỏi… | Minna I, bài 1 |
| 1 | お名前は | おなまえは | Tên anh/chị là gì? | Minna I, bài 1 |
| 1 | こちらは〜さんです | こちらは〜さんです | Đây là anh/chị ~ (giới thiệu người khác) | Minna I, bài 1 |
| 1 | 〜から来ました | 〜からきました | Đến từ ~ | Minna I, bài 1 |
| 1 | アメリカ | アメリカ | Nước Mỹ | Minna I, bài 1 |
| 1 | イギリス | イギリス | Nước Anh | Minna I, bài 1 |
| 1 | インド | インド | Ấn Độ | Minna I, bài 1 |
| 1 | インドネシア | インドネシア | Indonesia | Minna I, bài 1 |
| 1 | 韓国 | かんこく | Hàn Quốc | Minna I, bài 1 |
| 1 | タイ | タイ | Thái Lan | Minna I, bài 1 |
| 1 | 中国 | ちゅうごく | Trung Quốc | Minna I, bài 1 |
| 1 | ドイツ | ドイツ | Nước Đức | Minna I, bài 1 |
| 1 | 日本 | にほん | Nhật Bản | Minna I, bài 1 |
| 1 | ブラジル | ブラジル | Brazil | Minna I, bài 1 |
| 1 | ベトナム | ベトナム | Việt Nam | Bài đọc NekoNeko |
| 2 | カード | カード | Thẻ | Minna I, bài 2 |
| 2 | シャープペンシル | シャープペンシル | Bút chì kim | Minna I, bài 2 |
| 2 | コンピューター | コンピューター | Máy vi tính | Minna I, bài 2 |
| 2 | チョコレート | チョコレート | Sô-cô-la | Minna I, bài 2 |
| 2 | 日本語 | にほんご | Tiếng Nhật | Minna I, bài 2 |
| 2 | あのう | あのう | À… ờ… (ngập ngừng khi bắt chuyện) | Minna I, bài 2 |
| 2 | そうですか | そうですか | Thế à, vậy à | Minna I, bài 2 |
| 2 | これからお世話になります | これからおせわになります | Từ nay mong được anh/chị giúp đỡ | Minna I, bài 2 |
| 2 | こちらこそよろしく | こちらこそよろしく | Chính tôi mới mong được giúp đỡ | Minna I, bài 2 |
| 3 | ロビー | ロビー | Sảnh (khách sạn, tòa nhà) | Minna I, bài 3 |
| 3 | エスカレーター | エスカレーター | Thang cuốn | Minna I, bài 3 |
| 3 | 自動販売機 | じどうはんばいき | Máy bán hàng tự động | Minna I, bài 3 |
| 3 | ワイン | ワイン | Rượu vang | Minna I, bài 3 |
| 3 | 地下 | ちか | Tầng hầm, dưới mặt đất | Minna I, bài 3 |
| 3 | 何階 | なんがい | Tầng mấy | Minna I, bài 3 |
| 3 | 見せてください | みせてください | Cho tôi xem ~ | Minna I, bài 3 |
| 3 | イタリア | イタリア | Nước Ý | Minna I, bài 3 |
| 3 | スイス | スイス | Thụy Sĩ | Minna I, bài 3 |
| 3 | フランス | フランス | Nước Pháp | Minna I, bài 3 |
| 4 | 何時 | なんじ | Mấy giờ | Minna I, bài 4 |
| 4 | 何分 | なんぷん | Mấy phút | Minna I, bài 4 |
| 4 | 昼休み | ひるやすみ | Giờ nghỉ trưa | Minna I, bài 4 |
| 4 | 何曜日 | なんようび | Thứ mấy | Minna I, bài 4 |
| 4 | 大変ですね | たいへんですね | Vất vả nhỉ | Minna I, bài 4 |
| 4 | 何番 | なんばん | Số mấy | Minna I, bài 4 |
| 5 | 何年 | なんねん | Năm nào; mấy năm | Minna I, bài 5 |
| 5 | 何月 | なんがつ | Tháng mấy | Minna I, bài 5 |
| 5 | 十四日 | じゅうよっか | Ngày 14 | Minna I, bài 5 |
| 5 | 二十四日 | にじゅうよっか | Ngày 24 | Minna I, bài 5 |
| 5 | 何日 | なんにち | Ngày mấy; mấy ngày | Minna I, bài 5 |
| 5 | 〜番線 | 〜ばんせん | Đường ray / sân ga số ~ | Minna I, bài 5 |
| 5 | 次の | つぎの | ~ tiếp theo | Minna I, bài 5 |
| 6 | ミルク | ミルク | Sữa | Minna I, bài 6 |
| 6 | ジュース | ジュース | Nước hoa quả | Minna I, bài 6 |
| 6 | ビール | ビール | Bia | Minna I, bài 6 |
| 6 | レポート | レポート | Báo cáo | Minna I, bài 6 |
| 6 | ビデオ | ビデオ | Video | Minna I, bài 6 |
| 6 | テニス | テニス | Quần vợt | Minna I, bài 6 |
| 6 | サッカー | サッカー | Bóng đá | Minna I, bài 6 |
| 6 | いいですね | いいですね | Hay đấy, được đấy | Minna I, bài 6 |
| 6 | じゃ、また | じゃ、また | Thế nhé, hẹn gặp lại | Minna I, bài 6 |
| 6 | メキシコ | メキシコ | Mexico | Minna I, bài 6 |
| 7 | はさみ | はさみ | Cái kéo | Minna I, bài 7 |
| 7 | ケータイ | ケータイ | Điện thoại di động | Minna I, bài 7 |
| 7 | メール | メール | Thư điện tử, email | Minna I, bài 7 |
| 7 | 年賀状 | ねんがじょう | Thiệp chúc Tết | Minna I, bài 7 |
| 7 | パンチ | パンチ | Cái đục lỗ (giấy) | Minna I, bài 7 |
| 7 | ホッチキス | ホッチキス | Cái dập ghim | Minna I, bài 7 |
| 7 | セロテープ | セロテープ | Băng dính trong | Minna I, bài 7 |
| 7 | クリスマス | クリスマス | Giáng sinh | Minna I, bài 7 |
| 7 | すてきですね | すてきですね | Đẹp quá nhỉ, tuyệt nhỉ | Minna I, bài 7 |
| 7 | いらっしゃい | いらっしゃい | Mời vào (chào khách đến nhà) | Minna I, bài 7 |
| 7 | 失礼します | しつれいします | Xin phép (khi vào / ra về) | Minna I, bài 7 |
| 7 | いかがですか | いかがですか | Anh/chị dùng ~ nhé? / ~ thế nào ạ? | Minna I, bài 7 |
| 7 | スペイン | スペイン | Tây Ban Nha | Minna I, bài 7 |
| 8 | ハンサム | ハンサム | Đẹp trai | Minna I, bài 8 |
| 8 | 親切 | しんせつ | Tốt bụng, tử tế | Minna I, bài 8 |
| 8 | 素敵 | すてき | Đẹp, tuyệt | Minna I, bài 8 |
| 8 | 桜 | さくら | Hoa anh đào; cây anh đào | Minna I, bài 8 |
| 8 | 寮 | りょう | Ký túc xá | Minna I, bài 8 |
| 8 | 生活 | せいかつ | Cuộc sống, sinh hoạt | Minna I, bài 8 |
| 8 | お元気ですか | おげんきですか | Anh/chị có khỏe không? | Minna I, bài 8 |
| 8 | そうですね | そうですね | Ừ nhỉ; để xem nào… | Minna I, bài 8 |
| 8 | 結構です | けっこうです | Đủ rồi, không cần ạ | Minna I, bài 8 |
| 8 | そろそろ失礼します | そろそろしつれいします | Đã đến lúc tôi xin phép về | Minna I, bài 8 |
| 9 | 野球 | やきゅう | Bóng chày | Minna I, bài 9 |
| 9 | ダンス | ダンス | Nhảy, khiêu vũ | Minna I, bài 9 |
| 9 | クラシック | クラシック | Nhạc cổ điển | Minna I, bài 9 |
| 9 | ジャズ | ジャズ | Nhạc jazz | Minna I, bài 9 |
| 9 | コンサート | コンサート | Buổi hòa nhạc | Minna I, bài 9 |
| 9 | カラオケ | カラオケ | Karaoke | Minna I, bài 9 |
| 9 | 歌舞伎 | かぶき | Kabuki (kịch truyền thống Nhật) | Minna I, bài 9 |
| 9 | ローマ字 | ローマじ | Chữ La-tinh (romaji) | Minna I, bài 9 |
| 9 | 細かいお金 | こまかいおかね | Tiền lẻ | Minna I, bài 9 |
| 9 | チケット | チケット | Vé (xem phim, hòa nhạc…) | Minna I, bài 9 |
| 9 | 主人 | しゅじん | Chồng (tôi) | Minna I, bài 9 |
| 9 | 大体 | だいたい | Đại khái, phần lớn | Minna I, bài 9 |
| 9 | 早く | はやく | Sớm; nhanh (phó từ) | Minna I, bài 9 |
| 9 | 残念です | ざんねんです | Tiếc quá | Minna I, bài 9 |
| 10 | 男の人 | おとこのひと | Người đàn ông | Minna I, bài 10 |
| 10 | 女の人 | おんなのひと | Người phụ nữ | Minna I, bài 10 |
| 10 | パンダ | パンダ | Gấu trúc | Minna I, bài 10 |
| 10 | 象 | ぞう | Con voi | Minna I, bài 10 |
| 10 | 電池 | でんち | Pin | Minna I, bài 10 |
| 10 | スイッチ | スイッチ | Công tắc | Minna I, bài 10 |
| 10 | 棚 | たな | Cái giá, kệ | Minna I, bài 10 |
| 10 | 乗り場 | のりば | Bến, chỗ lên xe | Minna I, bài 10 |
| 10 | 県 | けん | Tỉnh | Minna I, bài 10 |
| 11 | みかん | みかん | Quả quýt | Minna I, bài 11 |
| 11 | アイスクリーム | アイスクリーム | Kem | Minna I, bài 11 |
| 11 | 弟さん | おとうとさん | Em trai (của người khác) | Minna I, bài 11 |
| 11 | 妹さん | いもうとさん | Em gái (của người khác) | Minna I, bài 11 |
| 11 | どのくらい | どのくらい | Khoảng bao lâu, bao nhiêu | Minna I, bài 11 |
| 11 | 全部で | ぜんぶで | Tất cả là, tổng cộng | Minna I, bài 11 |
| 11 | かしこまりました | かしこまりました | Vâng, tôi hiểu rồi (kính ngữ) | Minna I, bài 11 |
| 11 | いってらっしゃい | いってらっしゃい | Anh/chị đi nhé | Minna I, bài 11 |
| 11 | 行ってきます | いってきます | Tôi đi đây | Minna I, bài 11 |
| 11 | 船便 | ふなびん | Gửi đường biển | Minna I, bài 11 |
| 11 | 航空便 | こうくうびん | Gửi đường hàng không | Minna I, bài 11 |
| 11 | エアメール | エアメール | Thư máy bay | Minna I, bài 11 |
| 11 | オーストラリア | オーストラリア | Nước Úc | Minna I, bài 11 |
| 12 | 世界 | せかい | Thế giới | Minna I, bài 12 |
| 12 | すきやき | すきやき | Lẩu sukiyaki (thịt bò nấu ngọt) | Minna I, bài 12 |
| 12 | 刺身 | さしみ | Sashimi (cá sống thái lát) | Minna I, bài 12 |
| 12 | すし | すし | Sushi | Minna I, bài 12 |
| 12 | てんぷら | てんぷら | Tempura (đồ chiên tẩm bột) | Minna I, bài 12 |
| 12 | レモン | レモン | Quả chanh vàng | Minna I, bài 12 |
| 12 | 生け花 | いけばな | Nghệ thuật cắm hoa Nhật | Minna I, bài 12 |
| 12 | 紅葉 | もみじ | Lá đỏ mùa thu | Minna I, bài 12 |
| 12 | どちらも | どちらも | Cả hai | Minna I, bài 12 |
| 12 | ずっと | ずっと | Hơn hẳn; suốt | Minna I, bài 12 |
| 12 | ただいま | ただいま | Tôi đã về (khi về nhà) | Minna I, bài 12 |
| 12 | おかえりなさい | おかえりなさい | Anh/chị đã về đấy à | Minna I, bài 12 |
| 12 | シンガポール | シンガポール | Singapore | Minna I, bài 12 |
| 13 | 迎えます | むかえます | Đón (ai đó) | Minna I, bài 13 |
| 13 | のどがかわきます | のどがかわきます | Khát nước | Minna I, bài 13 |
| 13 | おなかがすきます | おなかがすきます | Đói bụng | Minna I, bài 13 |
| 13 | そうしましょう | そうしましょう | Làm thế đi, cứ vậy nhé | Minna I, bài 13 |
| 13 | 美術 | びじゅつ | Mỹ thuật | Minna I, bài 13 |
| 13 | 釣り | つり | Câu cá | Minna I, bài 13 |
| 13 | スキー | スキー | Trượt tuyết | Minna I, bài 13 |
| 13 | 週末 | しゅうまつ | Cuối tuần | Minna I, bài 13 |
| 13 | 定食 | ていしょく | Cơm suất (set ăn) | Minna I, bài 13 |
| 13 | 牛どん | ぎゅうどん | Cơm thịt bò | Minna I, bài 13 |
| 13 | 別々に | べつべつに | Riêng ra (trả tiền riêng) | Minna I, bài 13 |
| 14 | エアコン | エアコン | Máy điều hòa | Minna I, bài 14 |
| 14 | 読み方 | よみかた | Cách đọc | Minna I, bài 14 |
| 14 | あとで | あとで | Lát nữa, sau | Minna I, bài 14 |
| 14 | もう少し | もうすこし | Thêm chút nữa | Minna I, bài 14 |
| 15 | 資料 | しりょう | Tài liệu | Minna I, bài 15 |
| 15 | カタログ | カタログ | Ca-ta-lô | Minna I, bài 15 |
| 15 | 時刻表 | じこくひょう | Bảng giờ tàu xe | Minna I, bài 15 |
| 15 | 製品 | せいひん | Sản phẩm | Minna I, bài 15 |
| 15 | ソフト | ソフト | Phần mềm | Minna I, bài 15 |
| 15 | 電子辞書 | でんしじしょ | Từ điển điện tử | Minna I, bài 15 |
| 15 | 経済 | けいざい | Kinh tế | Minna I, bài 15 |
| 15 | 市役所 | しやくしょ | Tòa thị chính, ủy ban thành phố | Minna I, bài 15 |
| 15 | 思い出します | おもいだします | Nhớ lại | Minna I, bài 15 |
| 15 | いらっしゃいます | いらっしゃいます | Có, ở (kính ngữ của います) | Minna I, bài 15 |
| 16 | 下ろします | おろします | Rút (tiền); hạ xuống | Minna I, bài 16 |
| 16 | 見学します | けんがくします | Tham quan học hỏi | Minna I, bài 16 |
| 16 | サービス | サービス | Dịch vụ | Minna I, bài 16 |
| 16 | ジョギング | ジョギング | Chạy bộ | Minna I, bài 16 |
| 16 | お寺 | おてら | Chùa | Minna I, bài 16 |
| 16 | どうやって | どうやって | Làm thế nào, bằng cách nào | Minna I, bài 16 |
| 16 | まず | まず | Trước hết | Minna I, bài 16 |
| 16 | 次に | つぎに | Tiếp theo | Minna I, bài 16 |
| 16 | キャッシュカード | キャッシュカード | Thẻ rút tiền (ATM) | Minna I, bài 16 |
| 16 | 暗証番号 | あんしょうばんごう | Mã PIN | Minna I, bài 16 |
| 16 | 金額 | きんがく | Số tiền | Minna I, bài 16 |
| 16 | 確認 | かくにん | Xác nhận, kiểm tra lại | Minna I, bài 16 |
| 17 | 禁煙 | きんえん | Cấm hút thuốc | Minna I, bài 17 |
| 17 | 保険証 | ほけんしょう | Thẻ bảo hiểm (y tế) | Minna I, bài 17 |
| 17 | 下着 | したぎ | Đồ lót | Minna I, bài 17 |
| 17 | 〜までに | 〜までに | Trước ~ (hạn chót) | Minna I, bài 17 |
| 17 | ですから | ですから | Vì vậy, do đó | Minna I, bài 17 |
| 17 | どうしましたか | どうしましたか | Anh/chị bị làm sao vậy? | Minna I, bài 17 |
| 17 | お大事に | おだいじに | Chúc mau khỏe | Minna I, bài 17 |
| 18 | 換えます | かえます | Đổi (tiền, đồ) | Minna I, bài 18 |
| 18 | 現金 | げんきん | Tiền mặt | Minna I, bài 18 |
| 18 | お祈り | おいのり | Sự cầu nguyện | Minna I, bài 18 |
| 18 | 馬 | うま | Con ngựa | Minna I, bài 18 |
| 18 | 特に | とくに | Đặc biệt là | Minna I, bài 18 |
| 18 | へえ | へえ | Ồ, thế à (ngạc nhiên) | Minna I, bài 18 |
| 18 | なかなか | なかなか | Mãi mà (không)…; khá là | Minna I, bài 18 |
| 18 | 本当ですか | ほんとうですか | Thật không? | Minna I, bài 18 |
| 18 | ぜひ | ぜひ | Nhất định, rất muốn | Minna I, bài 18 |
| 19 | 相撲 | すもう | Sumo (vật Nhật) | Minna I, bài 19 |
| 19 | 一度も | いちども | Chưa (một) lần nào | Minna I, bài 19 |
| 19 | おかげさまで | おかげさまで | Nhờ trời, nhờ anh/chị (mà tôi khỏe / ổn) | Minna I, bài 19 |
| 19 | 乾杯 | かんぱい | Cạn chén, nâng ly | Minna I, bài 19 |
| 19 | ダイエット | ダイエット | Ăn kiêng | Minna I, bài 19 |
| 19 | 体にいい | からだにいい | Tốt cho sức khỏe | Minna I, bài 19 |
| 20 | 修理します | しゅうりします | Sửa chữa (máy móc) | Minna I, bài 20 |
| 20 | ビザ | ビザ | Thị thực, visa | Minna I, bài 20 |
| 20 | みんなで | みんなで | Mọi người cùng nhau | Minna I, bài 20 |
| 20 | おなかがいっぱい | おなかがいっぱい | No bụng | Minna I, bài 20 |
| 21 | 役に立ちます | やくにたちます | Có ích | Minna I, bài 21 |
| 21 | 動きます | うごきます | Chuyển động, chạy (máy) | Minna I, bài 21 |
| 21 | やめます | やめます | Bỏ, thôi (việc, thói quen) | Minna I, bài 21 |
| 21 | 気をつけます | きをつけます | Chú ý, cẩn thận | Minna I, bài 21 |
| 21 | 留学します | りゅうがくします | Du học | Minna I, bài 21 |
| 21 | 無駄 | むだ | Lãng phí, vô ích | Minna I, bài 21 |
| 21 | 物価 | ぶっか | Vật giá | Minna I, bài 21 |
| 21 | 放送 | ほうそう | Phát sóng, truyền thanh | Minna I, bài 21 |
| 21 | アニメ | アニメ | Phim hoạt hình | Minna I, bài 21 |
| 21 | マンガ | マンガ | Truyện tranh | Minna I, bài 21 |
| 21 | デザイン | デザイン | Thiết kế | Minna I, bài 21 |
| 21 | 天才 | てんさい | Thiên tài | Minna I, bài 21 |
| 21 | 地球 | ちきゅう | Trái đất | Minna I, bài 21 |
| 21 | 本当に | ほんとうに | Thật sự | Minna I, bài 21 |
| 21 | そんなに | そんなに | (không) đến mức đó | Minna I, bài 21 |
| 21 | 〜について | 〜について | Về ~ | Minna I, bài 21 |
| 21 | 仕方がありません | しかたがありません | Đành chịu, không còn cách nào | Minna I, bài 21 |
| 21 | しばらくですね | しばらくですね | Lâu rồi không gặp nhỉ | Minna I, bài 21 |
| 21 | もちろん | もちろん | Tất nhiên | Minna I, bài 21 |
| 22 | スーツ | スーツ | Bộ com-lê | Minna I, bài 22 |
| 22 | ロボット | ロボット | Rô-bốt | Minna I, bài 22 |
| 22 | ユーモア | ユーモア | Sự hài hước | Minna I, bài 22 |
| 22 | えーと | えーと | Ờ… để xem nào | Minna I, bài 22 |
| 22 | おめでとうございます | おめでとうございます | Chúc mừng | Minna I, bài 22 |
| 22 | 家賃 | やちん | Tiền thuê nhà | Minna I, bài 22 |
| 22 | 和室 | わしつ | Phòng kiểu Nhật | Minna I, bài 22 |
| 22 | 押し入れ | おしいれ | Tủ âm tường kiểu Nhật | Minna I, bài 22 |
| 23 | サイズ | サイズ | Cỡ, kích thước | Minna I, bài 23 |
| 23 | 何回も | なんかいも | Nhiều lần | Minna I, bài 23 |
| 24 | 引っ越し | ひっこし | Việc chuyển nhà | Minna I, bài 24 |
| 24 | ホームステイ | ホームステイ | Ở nhà người bản xứ (homestay) | Minna I, bài 24 |
| 24 | 自分で | じぶんで | Tự mình | Minna I, bài 24 |
| 24 | ほかに | ほかに | Ngoài ra | Minna I, bài 24 |
| 25 | グループ | グループ | Nhóm | Minna I, bài 25 |
| 25 | 転勤 | てんきん | Chuyển công tác | Minna I, bài 25 |
| 25 | こと | こと | Việc, chuyện | Minna I, bài 25 |
| 25 | どうぞお元気で | どうぞおげんきで | Chúc anh/chị mạnh khỏe (khi chia tay) | Minna I, bài 25 |

## Danh sách từ chuyển về đúng bài

| Từ | Cách đọc | Bài cũ | Bài mới | Loại |
|---|---|---:|---:|---|
| 研究者 | けんきゅうしゃ | 15 | 1 | dạy muộn hơn giáo trình |
| 病院 | びょういん | 15 | 1 | dạy muộn hơn giáo trình |
| 電気 | でんき | 23 | 1 | dạy muộn hơn giáo trình |
| 車 | くるま | 5 | 2 | dạy muộn hơn giáo trình |
| ～語 | ～ご | 9 | 2 | dạy muộn hơn giáo trình |
| どうぞ | どうぞ | 14 | 2 | dạy muộn hơn giáo trình |
| 違います | ちがいます | 21 | 2 | dạy muộn hơn giáo trình |
| そう | そう | 1 | 2 | dạy sớm hơn giáo trình |
| 部屋 | へや | 10 | 3 | dạy muộn hơn giáo trình |
| 電話 | でんわ | 4 | 3 | dạy muộn hơn giáo trình |
| 靴 | くつ | 22 | 3 | dạy muộn hơn giáo trình |
| ネクタイ | ネクタイ | 22 | 3 | dạy muộn hơn giáo trình |
| ください | ください | 14 | 3 | dạy muộn hơn giáo trình |
| 図書館 | としょかん | 10 | 4 | dạy muộn hơn giáo trình |
| 美術館 | びじゅつかん | 13 | 4 | dạy muộn hơn giáo trình |
| 試験 | しけん | 18 | 4 | dạy muộn hơn giáo trình |
| 会議 | かいぎ | 21 | 4 | dạy muộn hơn giáo trình |
| 映画 | えいが | 9 | 4 | dạy muộn hơn giáo trình |
| デパート | デパート | 3 | 4 | dạy sớm hơn giáo trình |
| スーパー | スーパー | 13 | 5 | dạy muộn hơn giáo trình |
| 家族 | かぞく | 15 | 5 | dạy muộn hơn giáo trình |
| 一人で | ひとりで | 24 | 5 | dạy muộn hơn giáo trình |
| 普通 | ふつう | 20 | 5 | dạy muộn hơn giáo trình |
| 学校 | がっこう | 3 | 5 | dạy sớm hơn giáo trình |
| 彼 | かれ | 1 | 5 | dạy sớm hơn giáo trình |
| 彼女 | かのじょ | 1 | 5 | dạy sớm hơn giáo trình |
| お茶 | おちゃ | 19 | 6 | dạy muộn hơn giáo trình |
| たばこ | たばこ | 15 | 6 | dạy muộn hơn giáo trình |
| 写真 | しゃしん | 15 | 6 | dạy muộn hơn giáo trình |
| 店 | みせ | 13 | 6 | dạy muộn hơn giáo trình |
| 庭 | にわ | 10 | 6 | dạy muộn hơn giáo trình |
| 花見 | はなみ | 19 | 6 | dạy muộn hơn giáo trình |
| ちょっと | ちょっと | 9 | 6 | dạy muộn hơn giáo trình |
| いつも | いつも | 19 | 6 | dạy muộn hơn giáo trình |
| 時々 | ときどき | 19 | 6 | dạy muộn hơn giáo trình |
| それから | それから | 16 | 6 | dạy muộn hơn giáo trình |
| ええ | ええ | 1 | 6 | dạy sớm hơn giáo trình |
| 手紙 | てがみ | 2 | 6 | dạy sớm hơn giáo trình |
| 切ります | きります | 23 | 7 | dạy muộn hơn giáo trình |
| 送ります | おくります | 24 | 7 | dạy muộn hơn giáo trình |
| シャツ | シャツ | 22 | 7 | dạy muộn hơn giáo trình |
| もう | もう | 17 | 7 | dạy muộn hơn giáo trình |
| まだ | まだ | 17 | 7 | dạy muộn hơn giáo trình |
| お金 | おかね | 3 | 7 | dạy sớm hơn giáo trình |
| 切符 | きっぷ | 5 | 7 | dạy sớm hơn giáo trình |
| いただきます | いただきます | 6 | 7 | dạy sớm hơn giáo trình |
| ごちそうさま | ごちそうさま | 6 | 7 | dạy sớm hơn giáo trình |
| 消しゴム | けしゴム | 2 | 7 | dạy sớm hơn giáo trình |
| これから | これから | 4 | 7 | dạy sớm hơn giáo trình |
| 暇 | ひま | 13 | 8 | dạy muộn hơn giáo trình |
| 悪い | わるい | 21 | 8 | dạy muộn hơn giáo trình |
| 寒い | さむい | 12 | 8 | dạy muộn hơn giáo trình |
| 白い | しろい | 9 | 8 | dạy muộn hơn giáo trình |
| 黒い | くろい | 9 | 8 | dạy muộn hơn giáo trình |
| 赤い | あかい | 9 | 8 | dạy muộn hơn giáo trình |
| 青い | あおい | 9 | 8 | dạy muộn hơn giáo trình |
| 山 | やま | 12 | 8 | dạy muộn hơn giáo trình |
| 町 | まち | 13 | 8 | dạy muộn hơn giáo trình |
| あまり | あまり | 9 | 8 | dạy muộn hơn giáo trình |
| そして | そして | 16 | 8 | dạy muộn hơn giáo trình |
| 所 | ところ | 3 | 8 | dạy sớm hơn giáo trình |
| 仕事 | しごと | 4 | 8 | dạy sớm hơn giáo trình |
| 食べ物 | たべもの | 6 | 8 | dạy sớm hơn giáo trình |
| どんな | どんな | 2 | 8 | dạy sớm hơn giáo trình |
| 旅行 | りょこう | 12 | 9 | dạy muộn hơn giáo trình |
| 〜時間 | 〜じかん | 11 | 9 | dạy muộn hơn giáo trình |
| 用事 | ようじ | 22 | 9 | dạy muộn hơn giáo trình |
| 約束 | やくそく | 22 | 9 | dạy muộn hơn giáo trình |
| 子ども | こども | 23 | 9 | dạy muộn hơn giáo trình |
| 時間 | じかん | 4 | 9 | dạy sớm hơn giáo trình |
| 飲み物 | のみもの | 6 | 9 | dạy sớm hơn giáo trình |
| 奥さん | おくさん | 7 | 9 | dạy sớm hơn giáo trình |
| アルバイト | アルバイト | 1 | 9 | dạy sớm hơn giáo trình |
| 字 | じ | 2 | 9 | dạy sớm hơn giáo trình |
| 夫 | おっと | 7 | 9 | dạy sớm hơn giáo trình |
| 妻 | つま | 7 | 9 | dạy sớm hơn giáo trình |
| 家内 | かない | 7 | 9 | dạy sớm hơn giáo trình |
| ご主人 | ごしゅじん | 7 | 9 | dạy sớm hơn giáo trình |
| 男の子 | おとこのこ | 11 | 10 | dạy muộn hơn giáo trình |
| 女の子 | おんなのこ | 11 | 10 | dạy muộn hơn giáo trình |
| 木 | き | 12 | 10 | dạy muộn hơn giáo trình |
| ～屋 | ～や | 13 | 10 | dạy muộn hơn giáo trình |
| 右 | みぎ | 23 | 10 | dạy muộn hơn giáo trình |
| 左 | ひだり | 23 | 10 | dạy muộn hơn giáo trình |
| 一番 | いちばん | 12 | 10 | dạy muộn hơn giáo trình |
| 箱 | はこ | 2 | 10 | dạy sớm hơn giáo trình |
| 物 | もの | 2 | 10 | dạy sớm hơn giáo trình |
| 喫茶店 | きっさてん | 6 | 10 | dạy sớm hơn giáo trình |
| 男 | おとこ | 1 | 10 | từ N5 bổ sung — theo bài của gốc từ (giữ ≤ 6 Kanji/ngày) |
| 女 | おんな | 1 | 10 | từ N5 bổ sung — theo bài của gốc từ (giữ ≤ 6 Kanji/ngày) |
| 男性 | だんせい | 1 | 10 | từ N5 bổ sung — theo bài của gốc từ (giữ ≤ 6 Kanji/ngày) |
| 女性 | じょせい | 1 | 10 | từ N5 bổ sung — theo bài của gốc từ (giữ ≤ 6 Kanji/ngày) |
| かかります | かかります | 23 | 11 | dạy muộn hơn giáo trình |
| クラス | クラス | 15 | 11 | dạy muộn hơn giáo trình |
| 留学生 | りゅうがくせい | 1 | 11 | dạy sớm hơn giáo trình |
| みんな | みんな | 1 | 11 | dạy sớm hơn giáo trình |
| 封筒 | ふうとう | 2 | 11 | dạy sớm hơn giáo trình |
| カレー | カレー | 6 | 11 | dạy sớm hơn giáo trình |
| 両親 | りょうしん | 7 | 11 | dạy sớm hơn giáo trình |
| サンドイッチ | サンドイッチ | 6 | 11 | dạy sớm hơn giáo trình |
| 外国人 | がいこくじん | 1 | 11 | từ N5 bổ sung — theo bài của gốc từ (giữ ≤ 6 Kanji/ngày) |
| ホテル | ホテル | 13 | 12 | dạy muộn hơn giáo trình |
| 空港 | くうこう | 16 | 12 | dạy muộn hơn giáo trình |
| 初めて | はじめて | 19 | 12 | dạy muộn hơn giáo trình |
| 牛肉 | ぎゅうにく | 6 | 12 | dạy sớm hơn giáo trình |
| 豚肉 | ぶたにく | 6 | 12 | dạy sớm hơn giáo trình |
| 鶏肉 | とりにく | 6 | 12 | dạy sớm hơn giáo trình |
| 甘い | あまい | 8 | 12 | dạy sớm hơn giáo trình |
| 辛い | からい | 8 | 12 | dạy sớm hơn giáo trình |
| 重い | おもい | 8 | 12 | dạy sớm hơn giáo trình |
| 軽い | かるい | 8 | 12 | dạy sớm hơn giáo trình |
| 近い | ちかい | 8 | 12 | dạy sớm hơn giáo trình |
| 遠い | とおい | 8 | 12 | dạy sớm hơn giáo trình |
| 早い | はやい | 8 | 12 | dạy sớm hơn giáo trình |
| 速い | はやい | 8 | 12 | dạy sớm hơn giáo trình |
| 遅い | おそい | 8 | 12 | dạy sớm hơn giáo trình |
| 海 | うみ | 10 | 12 | dạy sớm hơn giáo trình |
| お祭り | おまつり | 5 | 12 | dạy sớm hơn giáo trình |
| 大変 | たいへん | 17 | 13 | dạy muộn hơn giáo trình |
| 広い | ひろい | 16 | 13 | dạy muộn hơn giáo trình |
| 狭い | せまい | 16 | 13 | dạy muộn hơn giáo trình |
| 正月 | しょうがつ | 5 | 13 | dạy sớm hơn giáo trình |
| 川 | かわ | 12 | 13 | dạy sớm hơn giáo trình |
| 使います | つかいます | 15 | 14 | dạy muộn hơn giáo trình |
| 入ります | はいります | 18 | 14 | dạy muộn hơn giáo trình |
| 出ます | でます | 23 | 14 | dạy muộn hơn giáo trình |
| 降ります | ふります | 12 | 14 | dạy muộn hơn giáo trình |
| コピーします | コピーします | 24 | 14 | dạy muộn hơn giáo trình |
| パスポート | パスポート | 17 | 14 | dạy muộn hơn giáo trình |
| 地図 | ちず | 24 | 14 | dạy muộn hơn giáo trình |
| 問題 | もんだい | 15 | 14 | dạy muộn hơn giáo trình |
| 答え | こたえ | 18 | 14 | dạy muộn hơn giáo trình |
| また | また | 19 | 14 | dạy muộn hơn giáo trình |
| 砂糖 | さとう | 13 | 14 | dạy sớm hơn giáo trình |
| 塩 | しお | 13 | 14 | dạy sớm hơn giáo trình |
| 住所 | じゅうしょ | 10 | 14 | dạy sớm hơn giáo trình |
| 研究します | けんきゅうします | 20 | 15 | dạy muộn hơn giáo trình |
| 服 | ふく | 22 | 15 | dạy muộn hơn giáo trình |
| 歯医者 | はいしゃ | 17 | 15 | dạy muộn hơn giáo trình |
| 高校生 | こうこうせい | 1 | 15 | từ N5 bổ sung — theo bài của gốc từ (giữ ≤ 6 Kanji/ngày) |
| 頭 | あたま | 18 | 16 | dạy muộn hơn giáo trình |
| おなか | おなか | 13 | 16 | dạy sớm hơn giáo trình |
| 長い | ながい | 8 | 16 | dạy sớm hơn giáo trình |
| 短い | みじかい | 8 | 16 | dạy sớm hơn giáo trình |
| 緑 | みどり | 9 | 16 | dạy sớm hơn giáo trình |
| 乗ります | のります | 15 | 16 | dạy sớm hơn giáo trình |
| 神社 | じんじゃ | 3 | 16 | dạy sớm hơn giáo trình |
| 始めます | はじめます | 14 | 16 | dạy sớm hơn giáo trình |
| 大切 | たいせつ | 21 | 17 | dạy muộn hơn giáo trình |
| 上着 | うわぎ | 22 | 17 | dạy muộn hơn giáo trình |
| のど | のど | 13 | 17 | dạy sớm hơn giáo trình |
| 危ない | あぶない | 8 | 17 | dạy sớm hơn giáo trình |
| 出かけます | でかけます | 13 | 17 | dạy sớm hơn giáo trình |
| 払います | はらいます | 13 | 17 | dạy sớm hơn giáo trình |
| 動物 | どうぶつ | 10 | 18 | dạy sớm hơn giáo trình |
| メートル | メートル | 11 | 18 | dạy sớm hơn giáo trình |
| 洗います | あらいます | 16 | 18 | dạy sớm hơn giáo trình |
| 社長 | しゃちょう | 1 | 18 | dạy sớm hơn giáo trình |
| 部長 | ぶちょう | 1 | 18 | dạy sớm hơn giáo trình |
| 課長 | かちょう | 1 | 18 | dạy sớm hơn giáo trình |
| でも | でも | 20 | 19 | dạy muộn hơn giáo trình |
| 一度 | いちど | 18 | 19 | dạy sớm hơn giáo trình |
| 練習 | れんしゅう | 18 | 19 | dạy sớm hơn giáo trình |
| 眠い | ねむい | 16 | 19 | dạy sớm hơn giáo trình |
| 無理 | むり | 17 | 19 | dạy sớm hơn giáo trình |
| こっち | こっち | 3 | 20 | dạy sớm hơn giáo trình |
| そっち | そっち | 3 | 20 | dạy sớm hơn giáo trình |
| あっち | あっち | 3 | 20 | dạy sớm hơn giáo trình |
| どっち | どっち | 3 | 20 | dạy sớm hơn giáo trình |
| 言葉 | ことば | 9 | 20 | dạy sớm hơn giáo trình |
| 初め | はじめ | 16 | 20 | dạy sớm hơn giáo trình |
| 終わり | おわり | 4 | 20 | dạy sớm hơn giáo trình |
| 着物 | きもの | 13 | 20 | dạy sớm hơn giáo trình |
| 最近 | さいきん | 19 | 21 | dạy sớm hơn giáo trình |
| すごい | すごい | 20 | 21 | dạy sớm hơn giáo trình |
| 自動車 | じどうしゃ | 5 | 21 | dạy sớm hơn giáo trình |
| 不便 | ふべん | 8 | 21 | dạy sớm hơn giáo trình |
| 話 | はなし | 9 | 21 | dạy sớm hơn giáo trình |
| 交通 | こうつう | 16 | 21 | dạy sớm hơn giáo trình |
| 夢 | ゆめ | 18 | 21 | dạy sớm hơn giáo trình |
| 都合 | つごう | 5 | 22 | dạy sớm hơn giáo trình |
| 布団 | ふとん | 10 | 22 | dạy sớm hơn giáo trình |
| 歩きます | あるきます | 16 | 23 | dạy sớm hơn giáo trình |
| 渡ります | わたります | 16 | 23 | dạy sớm hơn giáo trình |
| 交差点 | こうさてん | 16 | 23 | dạy sớm hơn giáo trình |
| 建物 | たてもの | 3 | 23 | dạy sớm hơn giáo trình |
| 湯 | ゆ | 6 | 23 | dạy sớm hơn giáo trình |
| 駐車場 | ちゅうしゃじょう | 16 | 23 | dạy sớm hơn giáo trình |
| 寂しい | さびしい | 21 | 23 | dạy sớm hơn giáo trình |
| 全部 | ぜんぶ | 11 | 24 | dạy sớm hơn giáo trình |
| 準備 | じゅんび | 18 | 24 | dạy sớm hơn giáo trình |
| 足ります | たります | 21 | 25 | dạy sớm hơn giáo trình |
| 大使館 | たいしかん | 3 | 25 | dạy sớm hơn giáo trình |
| 着きます | つきます | 15 | 25 | dạy sớm hơn giáo trình |
