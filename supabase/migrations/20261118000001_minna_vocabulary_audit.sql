-- ═══════════════════════════════════════════════════════════════════
--  Audit từ vựng N5 theo Minna no Nihongo — docs/N5_VOCABULARY_COMPLETENESS_AUDIT.md
--
--  Thêm các từ của danh mục Minna còn thiếu, chuyển các từ đang gán sai bài về đúng bài giáo trình, chia lại
--  từ trong CÙNG các ngày của mỗi bài (khung 90 ngày không đổi), Kanji vẫn học cùng ngày với từ đầu tiên chứa nó.
--  Chỉ đổi DỮ LIỆU nội dung. Không xoá từ nào. Bảng trí nhớ gắn theo id kiến thức → KHÔNG đụng.
--  Sinh tự động bằng scripts/make_migration_vocabulary_audit.py — đừng sửa tay.
-- ═══════════════════════════════════════════════════════════════════

begin;

insert into public.vocabulary (id, kana, kanji, meaning, tip, lesson, day) values
  (1097, 'わたしたち', '私たち', 'Chúng tôi, chúng ta', '〜たち = số nhiều: 私 + たち.', 'BÀI 1  ·  Chào hỏi & Giới thiệu bản thân  (14 từ)', 14),
  (1098, 'あのひと', 'あの人', 'Người kia, người ấy', 'あの (kia) + 人 (người).', 'BÀI 1  ·  Chào hỏi & Giới thiệu bản thân  (14 từ)', 14),
  (1099, 'あのかた', 'あの方', 'Vị kia (lịch sự của あの人)', '方 (かた) là cách nói kính trọng của 人.', 'BÀI 1  ·  Chào hỏi & Giới thiệu bản thân  (14 từ)', 14),
  (1100, 'きょうし', '教師', 'Giáo viên (nói về nghề của mình)', 'Tự giới thiệu nghề: 教師です. Gọi thầy cô thì dùng 先生.', 'BÀI 1  ·  Chào hỏi & Giới thiệu bản thân  (14 từ)', 14),
  (1101, 'しゃいん', '社員', 'Nhân viên (của công ty ~)', 'Đi sau tên công ty: IMCの 社員. 会社員 = nhân viên công ty nói chung.', 'BÀI 1  ·  Chào hỏi & Giới thiệu bản thân  (14 từ)', 14),
  (1102, 'エンジニア', '', 'Kỹ sư', 'Từ mượn tiếng Anh “engineer”.', 'BÀI 1  ·  Chào hỏi & Giới thiệu bản thân  (14 từ)', 14),
  (1103, 'なんさい', '何歳', 'Mấy tuổi', '何 (なん) + 歳 (さい). Lịch sự hơn: おいくつ.', 'BÀI 1  ·  Chào hỏi & Giới thiệu bản thân  (14 từ)', 15),
  (1104, 'おいくつ', '', 'Bao nhiêu tuổi (lịch sự)', 'Hỏi tuổi lịch sự của 何歳.', 'BÀI 1  ·  Chào hỏi & Giới thiệu bản thân  (14 từ)', 15),
  (1105, 'しつれいですが', '失礼ですが', 'Xin lỗi, cho tôi hỏi…', 'Mở đầu trước khi hỏi chuyện riêng (tên, tuổi…).', 'BÀI 1  ·  Chào hỏi & Giới thiệu bản thân  (14 từ)', 15),
  (1106, 'おなまえは', 'お名前は', 'Tên anh/chị là gì?', 'Hỏi tên lịch sự; câu đầy đủ: お名前は 何ですか.', 'BÀI 1  ·  Chào hỏi & Giới thiệu bản thân  (14 từ)', 16),
  (1107, 'こちらは〜さんです', '', 'Đây là anh/chị ~ (giới thiệu người khác)', 'こちら = phía này, lịch sự hơn これ khi giới thiệu người.', 'BÀI 1  ·  Chào hỏi & Giới thiệu bản thân  (14 từ)', 15),
  (1108, '〜からきました', '〜から来ました', 'Đến từ ~', 'Nói quê / nước: ベトナムから 来ました.', 'BÀI 1  ·  Chào hỏi & Giới thiệu bản thân  (14 từ)', 15),
  (1109, 'アメリカ', '', 'Nước Mỹ', 'Từ mượn: America.', 'BÀI 1  ·  Chào hỏi & Giới thiệu bản thân  (14 từ)', 15),
  (1110, 'イギリス', '', 'Nước Anh', 'Từ mượn (từ tiếng Bồ Đào Nha “Inglês”).', 'BÀI 1  ·  Chào hỏi & Giới thiệu bản thân  (14 từ)', 15),
  (1111, 'インド', '', 'Ấn Độ', 'Từ mượn: India.', 'BÀI 1  ·  Chào hỏi & Giới thiệu bản thân  (14 từ)', 15),
  (1112, 'インドネシア', '', 'Indonesia', 'Từ mượn: Indonesia.', 'BÀI 1  ·  Chào hỏi & Giới thiệu bản thân  (14 từ)', 15),
  (1113, 'かんこく', '韓国', 'Hàn Quốc', '韓 (Hàn) + 国 (quốc).', 'BÀI 1  ·  Chào hỏi & Giới thiệu bản thân  (14 từ)', 16),
  (1114, 'タイ', '', 'Thái Lan', 'Từ mượn: Thai.', 'BÀI 1  ·  Chào hỏi & Giới thiệu bản thân  (14 từ)', 15),
  (1115, 'ちゅうごく', '中国', 'Trung Quốc', '中 (trung) + 国 (quốc).', 'BÀI 1  ·  Chào hỏi & Giới thiệu bản thân  (14 từ)', 16),
  (1116, 'ドイツ', '', 'Nước Đức', 'Từ mượn (tiếng Hà Lan “Duits”).', 'BÀI 1  ·  Chào hỏi & Giới thiệu bản thân  (14 từ)', 15),
  (1117, 'にほん', '日本', 'Nhật Bản', '日 (mặt trời) + 本 (gốc) = gốc mặt trời.', 'BÀI 1  ·  Chào hỏi & Giới thiệu bản thân  (14 từ)', 16),
  (1118, 'ブラジル', '', 'Brazil', 'Từ mượn: Brazil.', 'BÀI 1  ·  Chào hỏi & Giới thiệu bản thân  (14 từ)', 15),
  (1119, 'ベトナム', '', 'Việt Nam', 'Từ mượn: Vietnam. Người Việt Nam = ベトナム人.', 'BÀI 1  ·  Chào hỏi & Giới thiệu bản thân  (14 từ)', 16),
  (1120, 'カード', '', 'Thẻ', 'Từ mượn: card.', 'BÀI 2  ·  これ・それ・あれ — Chỉ đồ vật  (14 từ)', 17),
  (1121, 'シャープペンシル', '', 'Bút chì kim', 'Từ mượn: sharp pencil (tên thương hiệu cũ).', 'BÀI 2  ·  これ・それ・あれ — Chỉ đồ vật  (14 từ)', 17),
  (1122, 'コンピューター', '', 'Máy vi tính', 'Từ mượn: computer.', 'BÀI 2  ·  これ・それ・あれ — Chỉ đồ vật  (14 từ)', 17),
  (1123, 'チョコレート', '', 'Sô-cô-la', 'Từ mượn: chocolate.', 'BÀI 2  ·  これ・それ・あれ — Chỉ đồ vật  (14 từ)', 17),
  (1124, 'にほんご', '日本語', 'Tiếng Nhật', '日本 (Nhật Bản) + 語 (tiếng).', 'BÀI 2  ·  これ・それ・あれ — Chỉ đồ vật  (14 từ)', 18),
  (1125, 'あのう', '', 'À… ờ… (ngập ngừng khi bắt chuyện)', 'Nói nhẹ trước khi hỏi / nhờ ai đó.', 'BÀI 2  ·  これ・それ・あれ — Chỉ đồ vật  (14 từ)', 18),
  (1126, 'そうですか', '', 'Thế à, vậy à', 'Đáp lại khi nhận được thông tin mới (xuống giọng).', 'BÀI 2  ·  これ・それ・あれ — Chỉ đồ vật  (14 từ)', 18),
  (1127, 'これからおせわになります', 'これからお世話になります', 'Từ nay mong được anh/chị giúp đỡ', 'Câu chào khi mới chuyển đến / mới vào làm.', 'BÀI 2  ·  これ・それ・あれ — Chỉ đồ vật  (14 từ)', 18),
  (1128, 'こちらこそよろしく', '', 'Chính tôi mới mong được giúp đỡ', 'Đáp lại どうぞ よろしく.', 'BÀI 2  ·  これ・それ・あれ — Chỉ đồ vật  (14 từ)', 18),
  (1129, 'ロビー', '', 'Sảnh (khách sạn, tòa nhà)', 'Từ mượn: lobby.', 'BÀI 3  ·  ここ・そこ・あそこ — Chỉ nơi chốn  (14 từ)', 19),
  (1130, 'エスカレーター', '', 'Thang cuốn', 'Từ mượn: escalator.', 'BÀI 3  ·  ここ・そこ・あそこ — Chỉ nơi chốn  (14 từ)', 19),
  (1131, 'じどうはんばいき', '自動販売機', 'Máy bán hàng tự động', '自動 (tự động) + 販売 (bán) + 機 (máy).', 'BÀI 3  ·  ここ・そこ・あそこ — Chỉ nơi chốn  (14 từ)', 19),
  (1132, 'ワイン', '', 'Rượu vang', 'Từ mượn: wine.', 'BÀI 3  ·  ここ・そこ・あそこ — Chỉ nơi chốn  (14 từ)', 20),
  (1133, 'ちか', '地下', 'Tầng hầm, dưới mặt đất', '地 (đất) + 下 (dưới).', 'BÀI 3  ·  ここ・そこ・あそこ — Chỉ nơi chốn  (14 từ)', 20),
  (1134, 'なんがい', '何階', 'Tầng mấy', '何 + 階; 階 sau なん đọc là がい.', 'BÀI 3  ·  ここ・そこ・あそこ — Chỉ nơi chốn  (14 từ)', 20),
  (1135, 'みせてください', '見せてください', 'Cho tôi xem ~', '〜を 見せてください: nhờ người bán đưa xem hàng.', 'BÀI 3  ·  ここ・そこ・あそこ — Chỉ nơi chốn  (14 từ)', 21),
  (1136, 'イタリア', '', 'Nước Ý', 'Từ mượn: Italia.', 'BÀI 3  ·  ここ・そこ・あそこ — Chỉ nơi chốn  (14 từ)', 21),
  (1137, 'スイス', '', 'Thụy Sĩ', 'Từ mượn: Suisse.', 'BÀI 3  ·  ここ・そこ・あそこ — Chỉ nơi chốn  (14 từ)', 21),
  (1138, 'フランス', '', 'Nước Pháp', 'Từ mượn: France.', 'BÀI 3  ·  ここ・そこ・あそこ — Chỉ nơi chốn  (14 từ)', 21),
  (1139, 'なんじ', '何時', 'Mấy giờ', '何 + 時.', 'BÀI 4  ·  Giờ giấc & Thì của động từ  (14 từ)', 24),
  (1140, 'なんぷん', '何分', 'Mấy phút', '何 + 分; sau ん đọc là ぷん.', 'BÀI 4  ·  Giờ giấc & Thì của động từ  (14 từ)', 24),
  (1141, 'ひるやすみ', '昼休み', 'Giờ nghỉ trưa', '昼 (trưa) + 休み (nghỉ).', 'BÀI 4  ·  Giờ giấc & Thì của động từ  (14 từ)', 24),
  (1142, 'なんようび', '何曜日', 'Thứ mấy', '何 + 曜日.', 'BÀI 4  ·  Giờ giấc & Thì của động từ  (14 từ)', 25),
  (1143, 'たいへんですね', '大変ですね', 'Vất vả nhỉ', 'Câu cảm thông khi nghe ai đó bận, mệt.', 'BÀI 4  ·  Giờ giấc & Thì của động từ  (14 từ)', 25),
  (1144, 'なんばん', '何番', 'Số mấy', '何 + 番 (số thứ tự): 電話番号は 何番ですか.', 'BÀI 4  ·  Giờ giấc & Thì của động từ  (14 từ)', 25),
  (1145, 'なんねん', '何年', 'Năm nào; mấy năm', '何 + 年.', 'BÀI 5  ·  Đi lại — Phương tiện & Điểm đến  (14 từ)', 28),
  (1146, 'なんがつ', '何月', 'Tháng mấy', '何 + 月.', 'BÀI 5  ·  Đi lại — Phương tiện & Điểm đến  (14 từ)', 28),
  (1147, 'じゅうよっか', '十四日', 'Ngày 14', 'Đọc đặc biệt よっか như 四日.', 'BÀI 5  ·  Đi lại — Phương tiện & Điểm đến  (14 từ)', 29),
  (1148, 'にじゅうよっか', '二十四日', 'Ngày 24', 'Đọc đặc biệt よっか như 四日.', 'BÀI 5  ·  Đi lại — Phương tiện & Điểm đến  (14 từ)', 29),
  (1149, 'なんにち', '何日', 'Ngày mấy; mấy ngày', '何 + 日.', 'BÀI 5  ·  Đi lại — Phương tiện & Điểm đến  (14 từ)', 29),
  (1150, '〜ばんせん', '〜番線', 'Đường ray / sân ga số ~', '5番線 = sân ga số 5.', 'BÀI 5  ·  Đi lại — Phương tiện & Điểm đến  (14 từ)', 29),
  (1151, 'つぎの', '次の', '~ tiếp theo', '次の 電車 = chuyến tàu tiếp theo.', 'BÀI 5  ·  Đi lại — Phương tiện & Điểm đến  (14 từ)', 29),
  (1152, 'ミルク', '', 'Sữa', 'Từ mượn: milk (= 牛乳).', 'BÀI 6  ·  Tân ngữ を & Rủ rê  (14 từ)', 31),
  (1153, 'ジュース', '', 'Nước hoa quả', 'Từ mượn: juice.', 'BÀI 6  ·  Tân ngữ を & Rủ rê  (14 từ)', 31),
  (1154, 'ビール', '', 'Bia', 'Từ mượn (tiếng Hà Lan “bier”).', 'BÀI 6  ·  Tân ngữ を & Rủ rê  (14 từ)', 31),
  (1155, 'レポート', '', 'Báo cáo', 'Từ mượn: report.', 'BÀI 6  ·  Tân ngữ を & Rủ rê  (14 từ)', 31),
  (1156, 'ビデオ', '', 'Video', 'Từ mượn: video.', 'BÀI 6  ·  Tân ngữ を & Rủ rê  (14 từ)', 31),
  (1157, 'テニス', '', 'Quần vợt', 'Từ mượn: tennis. テニスを します.', 'BÀI 6  ·  Tân ngữ を & Rủ rê  (14 từ)', 31),
  (1158, 'サッカー', '', 'Bóng đá', 'Từ mượn: soccer. サッカーを します.', 'BÀI 6  ·  Tân ngữ を & Rủ rê  (14 từ)', 31),
  (1159, 'いいですね', '', 'Hay đấy, được đấy', 'Đồng ý khi được rủ.', 'BÀI 6  ·  Tân ngữ を & Rủ rê  (14 từ)', 32),
  (1160, 'じゃ、また', '', 'Thế nhé, hẹn gặp lại', 'Chào tạm biệt thân mật; じゃ、また あした = mai gặp lại.', 'BÀI 6  ·  Tân ngữ を & Rủ rê  (14 từ)', 32),
  (1161, 'メキシコ', '', 'Mexico', 'Từ mượn: Mexico.', 'BÀI 6  ·  Tân ngữ を & Rủ rê  (14 từ)', 32),
  (1162, 'はさみ', '', 'Cái kéo', 'Thường viết bằng kana.', 'BÀI 7  ·  Cho & Nhận, Công cụ で  (14 từ)', 34),
  (1163, 'ケータイ', '', 'Điện thoại di động', 'Viết tắt của 携帯電話 (けいたいでんわ).', 'BÀI 7  ·  Cho & Nhận, Công cụ で  (14 từ)', 34),
  (1164, 'メール', '', 'Thư điện tử, email', 'Từ mượn: mail.', 'BÀI 7  ·  Cho & Nhận, Công cụ で  (14 từ)', 34),
  (1165, 'ねんがじょう', '年賀状', 'Thiệp chúc Tết', '年 (năm) + 賀 (chúc) + 状 (thư).', 'BÀI 7  ·  Cho & Nhận, Công cụ で  (14 từ)', 34),
  (1166, 'パンチ', '', 'Cái đục lỗ (giấy)', 'Từ mượn: punch.', 'BÀI 7  ·  Cho & Nhận, Công cụ で  (14 từ)', 34),
  (1167, 'ホッチキス', '', 'Cái dập ghim', 'Tên thương hiệu Hotchkiss.', 'BÀI 7  ·  Cho & Nhận, Công cụ で  (14 từ)', 34),
  (1168, 'セロテープ', '', 'Băng dính trong', 'Tên thương hiệu (cellophane tape).', 'BÀI 7  ·  Cho & Nhận, Công cụ で  (14 từ)', 34),
  (1169, 'クリスマス', '', 'Giáng sinh', 'Từ mượn: Christmas.', 'BÀI 7  ·  Cho & Nhận, Công cụ で  (14 từ)', 34),
  (1170, 'すてきですね', '', 'Đẹp quá nhỉ, tuyệt nhỉ', 'Khen đồ vật, quần áo, nơi chốn.', 'BÀI 7  ·  Cho & Nhận, Công cụ で  (14 từ)', 35),
  (1171, 'いらっしゃい', '', 'Mời vào (chào khách đến nhà)', 'Chủ nhà nói khi khách tới.', 'BÀI 7  ·  Cho & Nhận, Công cụ で  (14 từ)', 35),
  (1172, 'しつれいします', '失礼します', 'Xin phép (khi vào / ra về)', 'Nói khi bước vào phòng hoặc khi ra về.', 'BÀI 7  ·  Cho & Nhận, Công cụ で  (14 từ)', 35),
  (1173, 'いかがですか', '', 'Anh/chị dùng ~ nhé? / ~ thế nào ạ?', 'Cách mời lịch sự: コーヒーは いかがですか.', 'BÀI 7  ·  Cho & Nhận, Công cụ で  (14 từ)', 35),
  (1174, 'スペイン', '', 'Tây Ban Nha', 'Từ mượn: Spain.', 'BÀI 7  ·  Cho & Nhận, Công cụ で  (14 từ)', 35),
  (1175, 'ハンサム', '', 'Đẹp trai', 'Tính từ な: ハンサムな 人.', 'BÀI 8  ·  Tính từ  (14 từ)', 36),
  (1176, 'しんせつ', '親切', 'Tốt bụng, tử tế', 'Tính từ な: 親切な 人.', 'BÀI 8  ·  Tính từ  (14 từ)', 36),
  (1177, 'すてき', '素敵', 'Đẹp, tuyệt', 'Tính từ な: すてきな かばん.', 'BÀI 8  ·  Tính từ  (14 từ)', 36),
  (1178, 'さくら', '桜', 'Hoa anh đào; cây anh đào', 'Biểu tượng mùa xuân Nhật Bản.', 'BÀI 8  ·  Tính từ  (14 từ)', 37),
  (1179, 'りょう', '寮', 'Ký túc xá', 'Nơi ở của sinh viên / nhân viên.', 'BÀI 8  ·  Tính từ  (14 từ)', 37),
  (1180, 'せいかつ', '生活', 'Cuộc sống, sinh hoạt', '日本の 生活 = cuộc sống ở Nhật.', 'BÀI 8  ·  Tính từ  (14 từ)', 37),
  (1181, 'おげんきですか', 'お元気ですか', 'Anh/chị có khỏe không?', 'Hỏi thăm người lâu ngày không gặp.', 'BÀI 8  ·  Tính từ  (14 từ)', 38),
  (1182, 'そうですね', '', 'Ừ nhỉ; để xem nào…', 'Đồng tình, hoặc ngập ngừng khi suy nghĩ.', 'BÀI 8  ·  Tính từ  (14 từ)', 38),
  (1183, 'けっこうです', '結構です', 'Đủ rồi, không cần ạ', 'Từ chối lịch sự khi được mời thêm.', 'BÀI 8  ·  Tính từ  (14 từ)', 38),
  (1184, 'そろそろしつれいします', 'そろそろ失礼します', 'Đã đến lúc tôi xin phép về', 'Nói khi ra về sau khi đến chơi.', 'BÀI 8  ·  Tính từ  (14 từ)', 38),
  (1185, 'やきゅう', '野球', 'Bóng chày', '野 (đồng) + 球 (bóng).', 'BÀI 9  ·  Thích / Giỏi / Có & Lý do から  (14 từ)', 39),
  (1186, 'ダンス', '', 'Nhảy, khiêu vũ', 'Từ mượn: dance.', 'BÀI 9  ·  Thích / Giỏi / Có & Lý do から  (14 từ)', 39),
  (1187, 'クラシック', '', 'Nhạc cổ điển', 'Từ mượn: classic.', 'BÀI 9  ·  Thích / Giỏi / Có & Lý do から  (14 từ)', 39),
  (1188, 'ジャズ', '', 'Nhạc jazz', 'Từ mượn: jazz.', 'BÀI 9  ·  Thích / Giỏi / Có & Lý do から  (14 từ)', 39),
  (1189, 'コンサート', '', 'Buổi hòa nhạc', 'Từ mượn: concert.', 'BÀI 9  ·  Thích / Giỏi / Có & Lý do から  (14 từ)', 39),
  (1190, 'カラオケ', '', 'Karaoke', 'Từ gốc Nhật: カラ (trống) + オケ (dàn nhạc).', 'BÀI 9  ·  Thích / Giỏi / Có & Lý do から  (14 từ)', 39),
  (1191, 'かぶき', '歌舞伎', 'Kabuki (kịch truyền thống Nhật)', '歌 (ca) + 舞 (múa) + 伎 (kỹ).', 'BÀI 9  ·  Thích / Giỏi / Có & Lý do から  (14 từ)', 39),
  (1192, 'ローマじ', 'ローマ字', 'Chữ La-tinh (romaji)', 'ローマ (La Mã) + 字 (chữ).', 'BÀI 9  ·  Thích / Giỏi / Có & Lý do から  (14 từ)', 40),
  (1193, 'こまかいおかね', '細かいお金', 'Tiền lẻ', '細かい (nhỏ, vụn) + お金 (tiền).', 'BÀI 9  ·  Thích / Giỏi / Có & Lý do から  (14 từ)', 40),
  (1194, 'チケット', '', 'Vé (xem phim, hòa nhạc…)', 'Từ mượn: ticket. Vé tàu xe thường là 切符.', 'BÀI 9  ·  Thích / Giỏi / Có & Lý do から  (14 từ)', 40),
  (1195, 'しゅじん', '主人', 'Chồng (tôi)', 'Nói về chồng mình; chồng người khác: ご主人.', 'BÀI 9  ·  Thích / Giỏi / Có & Lý do から  (14 từ)', 40),
  (1196, 'だいたい', '大体', 'Đại khái, phần lớn', 'だいたい わかります = hiểu đại khái.', 'BÀI 9  ·  Thích / Giỏi / Có & Lý do から  (14 từ)', 40),
  (1197, 'はやく', '早く', 'Sớm; nhanh (phó từ)', '早い → 早く: はやく かえります.', 'BÀI 9  ·  Thích / Giỏi / Có & Lý do から  (14 từ)', 41),
  (1198, 'ざんねんです', '残念です', 'Tiếc quá', 'Nói khi không thể nhận lời / không được như ý.', 'BÀI 9  ·  Thích / Giỏi / Có & Lý do から  (14 từ)', 41),
  (1199, 'おとこのひと', '男の人', 'Người đàn ông', '男 (nam) + の + 人.', 'BÀI 10  ·  Tồn tại — あります / います & Vị trí  (14 từ)', 43),
  (1200, 'おんなのひと', '女の人', 'Người phụ nữ', '女 (nữ) + の + 人.', 'BÀI 10  ·  Tồn tại — あります / います & Vị trí  (14 từ)', 43),
  (1201, 'パンダ', '', 'Gấu trúc', 'Từ mượn: panda.', 'BÀI 10  ·  Tồn tại — あります / います & Vị trí  (14 từ)', 43),
  (1202, 'ぞう', '象', 'Con voi', 'Chữ 象 vẽ con voi có vòi dài.', 'BÀI 10  ·  Tồn tại — あります / います & Vị trí  (14 từ)', 43),
  (1203, 'でんち', '電池', 'Pin', '電 (điện) + 池 (ao, chứa).', 'BÀI 10  ·  Tồn tại — あります / います & Vị trí  (14 từ)', 43),
  (1204, 'スイッチ', '', 'Công tắc', 'Từ mượn: switch.', 'BÀI 10  ·  Tồn tại — あります / います & Vị trí  (14 từ)', 43),
  (1205, 'たな', '棚', 'Cái giá, kệ', '本棚 (ほんだな) = giá sách.', 'BÀI 10  ·  Tồn tại — あります / います & Vị trí  (14 từ)', 43),
  (1206, 'のりば', '乗り場', 'Bến, chỗ lên xe', '乗ります (lên) + 場 (chỗ): タクシー乗り場.', 'BÀI 10  ·  Tồn tại — あります / います & Vị trí  (14 từ)', 44),
  (1207, 'けん', '県', 'Tỉnh', 'Đơn vị hành chính: 大阪府, 奈良県…', 'BÀI 10  ·  Tồn tại — あります / います & Vị trí  (14 từ)', 44),
  (1208, 'みかん', '', 'Quả quýt', 'Loại quýt phổ biến ở Nhật.', 'BÀI 11  ·  Số đếm & Lượng từ  (14 từ)', 46),
  (1209, 'アイスクリーム', '', 'Kem', 'Từ mượn: ice cream.', 'BÀI 11  ·  Số đếm & Lượng từ  (14 từ)', 46),
  (1210, 'おとうとさん', '弟さん', 'Em trai (của người khác)', 'Gọi em trai người khác: 弟 + さん.', 'BÀI 11  ·  Số đếm & Lượng từ  (14 từ)', 47),
  (1211, 'いもうとさん', '妹さん', 'Em gái (của người khác)', 'Gọi em gái người khác: 妹 + さん.', 'BÀI 11  ·  Số đếm & Lượng từ  (14 từ)', 47),
  (1212, 'どのくらい', '', 'Khoảng bao lâu, bao nhiêu', 'Hỏi mức độ, thời gian: どのくらい かかりますか.', 'BÀI 11  ·  Số đếm & Lượng từ  (14 từ)', 47),
  (1213, 'ぜんぶで', '全部で', 'Tất cả là, tổng cộng', 'ぜんぶで いくらですか = tất cả bao nhiêu tiền.', 'BÀI 11  ·  Số đếm & Lượng từ  (14 từ)', 47),
  (1214, 'かしこまりました', '', 'Vâng, tôi hiểu rồi (kính ngữ)', 'Nhân viên nói với khách; lịch sự hơn わかりました.', 'BÀI 11  ·  Số đếm & Lượng từ  (14 từ)', 47),
  (1215, 'いってらっしゃい', '', 'Anh/chị đi nhé', 'Người ở nhà nói với người đi ra ngoài.', 'BÀI 11  ·  Số đếm & Lượng từ  (14 từ)', 47),
  (1216, 'いってきます', '行ってきます', 'Tôi đi đây', 'Người đi ra ngoài nói; đáp lại いってらっしゃい.', 'BÀI 11  ·  Số đếm & Lượng từ  (14 từ)', 47),
  (1217, 'ふなびん', '船便', 'Gửi đường biển', '船 (thuyền) + 便 (chuyến gửi).', 'BÀI 11  ·  Số đếm & Lượng từ  (14 từ)', 47),
  (1218, 'こうくうびん', '航空便', 'Gửi đường hàng không', '航空 (hàng không) + 便.', 'BÀI 11  ·  Số đếm & Lượng từ  (14 từ)', 47),
  (1219, 'エアメール', '', 'Thư máy bay', 'Từ mượn: airmail (= 航空便).', 'BÀI 11  ·  Số đếm & Lượng từ  (14 từ)', 47),
  (1220, 'オーストラリア', '', 'Nước Úc', 'Từ mượn: Australia.', 'BÀI 11  ·  Số đếm & Lượng từ  (14 từ)', 47),
  (1221, 'せかい', '世界', 'Thế giới', '世 (thế) + 界 (giới).', 'BÀI 12  ·  Quá khứ của tính từ & So sánh  (14 từ)', 50),
  (1222, 'すきやき', '', 'Lẩu sukiyaki (thịt bò nấu ngọt)', 'Món lẩu Nhật.', 'BÀI 12  ·  Quá khứ của tính từ & So sánh  (14 từ)', 50),
  (1223, 'さしみ', '刺身', 'Sashimi (cá sống thái lát)', '刺 (đâm) + 身 (thịt).', 'BÀI 12  ·  Quá khứ của tính từ & So sánh  (14 từ)', 50),
  (1224, 'すし', '', 'Sushi', 'Thường viết すし hoặc 寿司.', 'BÀI 12  ·  Quá khứ của tính từ & So sánh  (14 từ)', 50),
  (1225, 'てんぷら', '', 'Tempura (đồ chiên tẩm bột)', 'Món chiên Nhật.', 'BÀI 12  ·  Quá khứ của tính từ & So sánh  (14 từ)', 50),
  (1226, 'レモン', '', 'Quả chanh vàng', 'Từ mượn: lemon.', 'BÀI 12  ·  Quá khứ của tính từ & So sánh  (14 từ)', 50),
  (1227, 'いけばな', '生け花', 'Nghệ thuật cắm hoa Nhật', '生ける (cắm hoa) + 花.', 'BÀI 12  ·  Quá khứ của tính từ & So sánh  (14 từ)', 50),
  (1228, 'もみじ', '紅葉', 'Lá đỏ mùa thu', '紅 (đỏ) + 葉 (lá).', 'BÀI 12  ·  Quá khứ của tính từ & So sánh  (14 từ)', 50),
  (1229, 'どちらも', '', 'Cả hai', 'Trả lời câu hỏi “cái nào hơn”: どちらも すきです.', 'BÀI 12  ·  Quá khứ của tính từ & So sánh  (14 từ)', 50),
  (1230, 'ずっと', '', 'Hơn hẳn; suốt', 'ずっと 大きい = lớn hơn hẳn.', 'BÀI 12  ·  Quá khứ của tính từ & So sánh  (14 từ)', 50),
  (1231, 'ただいま', '', 'Tôi đã về (khi về nhà)', 'Đáp lại: おかえりなさい.', 'BÀI 12  ·  Quá khứ của tính từ & So sánh  (14 từ)', 50),
  (1232, 'おかえりなさい', '', 'Anh/chị đã về đấy à', 'Người ở nhà nói với người vừa về.', 'BÀI 12  ·  Quá khứ của tính từ & So sánh  (14 từ)', 50),
  (1233, 'シンガポール', '', 'Singapore', 'Từ mượn: Singapore.', 'BÀI 12  ·  Quá khứ của tính từ & So sánh  (14 từ)', 50),
  (1234, 'むかえます', '迎えます', 'Đón (ai đó)', '駅へ 友だちを 迎えに 行きます.', 'BÀI 13  ·  Mong muốn — たい & ほしい  (14 từ)', 53),
  (1235, 'のどがかわきます', '', 'Khát nước', 'のど (họng) + かわきます (khô).', 'BÀI 13  ·  Mong muốn — たい & ほしい  (14 từ)', 53),
  (1236, 'おなかがすきます', '', 'Đói bụng', 'おなか (bụng) + すきます (trống).', 'BÀI 13  ·  Mong muốn — たい & ほしい  (14 từ)', 53),
  (1237, 'そうしましょう', '', 'Làm thế đi, cứ vậy nhé', 'Đồng ý với đề nghị.', 'BÀI 13  ·  Mong muốn — たい & ほしい  (14 từ)', 53),
  (1238, 'びじゅつ', '美術', 'Mỹ thuật', '美 (đẹp) + 術 (thuật).', 'BÀI 13  ·  Mong muốn — たい & ほしい  (14 từ)', 53),
  (1239, 'つり', '釣り', 'Câu cá', '釣ります (câu) → 釣り.', 'BÀI 13  ·  Mong muốn — たい & ほしい  (14 từ)', 53),
  (1240, 'スキー', '', 'Trượt tuyết', 'Từ mượn: ski. スキーを します.', 'BÀI 13  ·  Mong muốn — たい & ほしい  (14 từ)', 53),
  (1241, 'しゅうまつ', '週末', 'Cuối tuần', '週 (tuần) + 末 (cuối).', 'BÀI 13  ·  Mong muốn — たい & ほしい  (14 từ)', 53),
  (1242, 'ていしょく', '定食', 'Cơm suất (set ăn)', '定 (cố định) + 食 (ăn).', 'BÀI 13  ·  Mong muốn — たい & ほしい  (14 từ)', 53),
  (1243, 'ぎゅうどん', '牛どん', 'Cơm thịt bò', '牛 (bò) + どん (bát cơm).', 'BÀI 13  ·  Mong muốn — たい & ほしい  (14 từ)', 54),
  (1244, 'べつべつに', '別々に', 'Riêng ra (trả tiền riêng)', '別々に おねがいします = tính riêng.', 'BÀI 13  ·  Mong muốn — たい & ほしい  (14 từ)', 54),
  (1245, 'エアコン', '', 'Máy điều hòa', 'Viết tắt của air conditioner.', 'BÀI 14  ·  Thể て & Yêu cầu  (14 từ)', 55),
  (1246, 'よみかた', '読み方', 'Cách đọc', '読みます → 読み + 方 (cách).', 'BÀI 14  ·  Thể て & Yêu cầu  (14 từ)', 56),
  (1247, 'あとで', '', 'Lát nữa, sau', 'あとで 電話します.', 'BÀI 14  ·  Thể て & Yêu cầu  (14 từ)', 56),
  (1248, 'もうすこし', 'もう少し', 'Thêm chút nữa', 'もう少し ゆっくり おねがいします.', 'BÀI 14  ·  Thể て & Yêu cầu  (14 từ)', 56),
  (1249, 'しりょう', '資料', 'Tài liệu', '資 (tư liệu) + 料 (liệu).', 'BÀI 15  ·  Cho phép & Cấm đoán  (14 từ)', 57),
  (1250, 'カタログ', '', 'Ca-ta-lô', 'Từ mượn: catalog.', 'BÀI 15  ·  Cho phép & Cấm đoán  (14 từ)', 57),
  (1251, 'じこくひょう', '時刻表', 'Bảng giờ tàu xe', '時刻 (giờ) + 表 (bảng).', 'BÀI 15  ·  Cho phép & Cấm đoán  (14 từ)', 57),
  (1252, 'せいひん', '製品', 'Sản phẩm', '製 (chế tạo) + 品 (phẩm).', 'BÀI 15  ·  Cho phép & Cấm đoán  (14 từ)', 57),
  (1253, 'ソフト', '', 'Phần mềm', 'Viết tắt của software.', 'BÀI 15  ·  Cho phép & Cấm đoán  (14 từ)', 57),
  (1254, 'でんしじしょ', '電子辞書', 'Từ điển điện tử', '電子 (điện tử) + 辞書 (từ điển).', 'BÀI 15  ·  Cho phép & Cấm đoán  (14 từ)', 57),
  (1255, 'けいざい', '経済', 'Kinh tế', '経 (kinh) + 済 (tế).', 'BÀI 15  ·  Cho phép & Cấm đoán  (14 từ)', 57),
  (1256, 'しやくしょ', '市役所', 'Tòa thị chính, ủy ban thành phố', '市 (thành phố) + 役所 (công sở).', 'BÀI 15  ·  Cho phép & Cấm đoán  (14 từ)', 57),
  (1257, 'おもいだします', '思い出します', 'Nhớ lại', '思います + 出します.', 'BÀI 15  ·  Cho phép & Cấm đoán  (14 từ)', 58),
  (1258, 'いらっしゃいます', '', 'Có, ở (kính ngữ của います)', '先生は いらっしゃいますか.', 'BÀI 15  ·  Cho phép & Cấm đoán  (14 từ)', 58),
  (1259, 'おろします', '下ろします', 'Rút (tiền); hạ xuống', 'お金を 下ろします = rút tiền.', 'BÀI 16  ·  Nối câu bằng thể て  (14 từ)', 59),
  (1260, 'けんがくします', '見学します', 'Tham quan học hỏi', '見 (xem) + 学 (học).', 'BÀI 16  ·  Nối câu bằng thể て  (14 từ)', 59),
  (1261, 'サービス', '', 'Dịch vụ', 'Từ mượn: service.', 'BÀI 16  ·  Nối câu bằng thể て  (14 từ)', 60),
  (1262, 'ジョギング', '', 'Chạy bộ', 'Từ mượn: jogging. ジョギングを します.', 'BÀI 16  ·  Nối câu bằng thể て  (14 từ)', 60),
  (1263, 'おてら', 'お寺', 'Chùa', '寺 (tự) = chùa.', 'BÀI 16  ·  Nối câu bằng thể て  (14 từ)', 61),
  (1264, 'どうやって', '', 'Làm thế nào, bằng cách nào', 'どうやって 行きますか.', 'BÀI 16  ·  Nối câu bằng thể て  (14 từ)', 60),
  (1265, 'まず', '', 'Trước hết', 'Dùng khi giải thích các bước: まず…、つぎに….', 'BÀI 16  ·  Nối câu bằng thể て  (14 từ)', 60),
  (1266, 'つぎに', '次に', 'Tiếp theo', '次 (tiếp) + に.', 'BÀI 16  ·  Nối câu bằng thể て  (14 từ)', 60),
  (1267, 'キャッシュカード', '', 'Thẻ rút tiền (ATM)', 'Từ mượn: cash card.', 'BÀI 16  ·  Nối câu bằng thể て  (14 từ)', 60),
  (1268, 'あんしょうばんごう', '暗証番号', 'Mã PIN', '暗証 (mật mã) + 番号 (số).', 'BÀI 16  ·  Nối câu bằng thể て  (14 từ)', 60),
  (1269, 'きんがく', '金額', 'Số tiền', '金 (tiền) + 額 (mức).', 'BÀI 16  ·  Nối câu bằng thể て  (14 từ)', 60),
  (1270, 'かくにん', '確認', 'Xác nhận, kiểm tra lại', '確 (chắc) + 認 (nhận).', 'BÀI 16  ·  Nối câu bằng thể て  (14 từ)', 61),
  (1271, 'きんえん', '禁煙', 'Cấm hút thuốc', '禁 (cấm) + 煙 (khói).', 'BÀI 17  ·  Thể ない — Cấm, Bắt buộc, Không cần  (14 từ)', 63),
  (1272, 'ほけんしょう', '保険証', 'Thẻ bảo hiểm (y tế)', '保険 (bảo hiểm) + 証 (giấy chứng).', 'BÀI 17  ·  Thể ない — Cấm, Bắt buộc, Không cần  (14 từ)', 63),
  (1273, 'したぎ', '下着', 'Đồ lót', '下 (dưới) + 着 (mặc).', 'BÀI 17  ·  Thể ない — Cấm, Bắt buộc, Không cần  (14 từ)', 64),
  (1274, '〜までに', '', 'Trước ~ (hạn chót)', '金曜日までに = trước thứ Sáu. Khác まで (cho đến).', 'BÀI 17  ·  Thể ない — Cấm, Bắt buộc, Không cần  (14 từ)', 64),
  (1275, 'ですから', '', 'Vì vậy, do đó', 'Nối hai câu chỉ kết quả.', 'BÀI 17  ·  Thể ない — Cấm, Bắt buộc, Không cần  (14 từ)', 64),
  (1276, 'どうしましたか', '', 'Anh/chị bị làm sao vậy?', 'Bác sĩ / người khác hỏi khi thấy có chuyện.', 'BÀI 17  ·  Thể ない — Cấm, Bắt buộc, Không cần  (14 từ)', 64),
  (1277, 'おだいじに', 'お大事に', 'Chúc mau khỏe', 'Nói với người ốm.', 'BÀI 17  ·  Thể ない — Cấm, Bắt buộc, Không cần  (14 từ)', 64),
  (1278, 'かえます', '換えます', 'Đổi (tiền, đồ)', 'ドルを 円に 換えます. Khác 変えます (thay đổi).', 'BÀI 18  ·  Thể từ điển & Khả năng  (14 từ)', 65),
  (1279, 'げんきん', '現金', 'Tiền mặt', '現 (hiện) + 金 (tiền).', 'BÀI 18  ·  Thể từ điển & Khả năng  (14 từ)', 65),
  (1280, 'おいのり', 'お祈り', 'Sự cầu nguyện', '祈ります (cầu nguyện) → お祈り.', 'BÀI 18  ·  Thể từ điển & Khả năng  (14 từ)', 66),
  (1281, 'うま', '馬', 'Con ngựa', 'Chữ 馬 vẽ con ngựa có bờm và bốn chân.', 'BÀI 18  ·  Thể từ điển & Khả năng  (14 từ)', 66),
  (1282, 'とくに', '特に', 'Đặc biệt là', '特 (đặc) + に.', 'BÀI 18  ·  Thể từ điển & Khả năng  (14 từ)', 66),
  (1283, 'へえ', '', 'Ồ, thế à (ngạc nhiên)', 'Cảm thán khi nghe chuyện lạ.', 'BÀI 18  ·  Thể từ điển & Khả năng  (14 từ)', 66),
  (1284, 'なかなか', '', 'Mãi mà (không)…; khá là', 'なかなか 寝られません; なかなか おもしろい.', 'BÀI 18  ·  Thể từ điển & Khả năng  (14 từ)', 66),
  (1285, 'ほんとうですか', '本当ですか', 'Thật không?', '本当 (thật) + ですか.', 'BÀI 18  ·  Thể từ điển & Khả năng  (14 từ)', 66),
  (1286, 'ぜひ', '', 'Nhất định, rất muốn', 'ぜひ 行きたいです.', 'BÀI 18  ·  Thể từ điển & Khả năng  (14 từ)', 66),
  (1287, 'すもう', '相撲', 'Sumo (vật Nhật)', '相 (tương) + 撲 (đánh).', 'BÀI 19  ·  Thể た — Kinh nghiệm & Liệt kê  (14 từ)', 67),
  (1288, 'いちども', '一度も', 'Chưa (một) lần nào', 'Đi với phủ định: 一度も 行った ことが ありません.', 'BÀI 19  ·  Thể た — Kinh nghiệm & Liệt kê  (14 từ)', 67),
  (1289, 'おかげさまで', '', 'Nhờ trời, nhờ anh/chị (mà tôi khỏe / ổn)', 'Đáp lại khi được hỏi thăm.', 'BÀI 19  ·  Thể た — Kinh nghiệm & Liệt kê  (14 từ)', 67),
  (1290, 'かんぱい', '乾杯', 'Cạn chén, nâng ly', '乾 (khô) + 杯 (chén).', 'BÀI 19  ·  Thể た — Kinh nghiệm & Liệt kê  (14 từ)', 68),
  (1291, 'ダイエット', '', 'Ăn kiêng', 'Từ mượn: diet.', 'BÀI 19  ·  Thể た — Kinh nghiệm & Liệt kê  (14 từ)', 68),
  (1292, 'からだにいい', '体にいい', 'Tốt cho sức khỏe', '体 (cơ thể) + に + いい.', 'BÀI 19  ·  Thể た — Kinh nghiệm & Liệt kê  (14 từ)', 68),
  (1293, 'しゅうりします', '修理します', 'Sửa chữa (máy móc)', '修 (tu) + 理 (lý).', 'BÀI 20  ·  Thể thông thường (普通形)  (14 từ)', 69),
  (1294, 'ビザ', '', 'Thị thực, visa', 'Từ mượn: visa.', 'BÀI 20  ·  Thể thông thường (普通形)  (14 từ)', 69),
  (1295, 'みんなで', '', 'Mọi người cùng nhau', 'みんな + で: みんなで 行こう.', 'BÀI 20  ·  Thể thông thường (普通形)  (14 từ)', 69),
  (1296, 'おなかがいっぱい', '', 'No bụng', 'おなか (bụng) + いっぱい (đầy).', 'BÀI 20  ·  Thể thông thường (普通形)  (14 từ)', 70),
  (1297, 'やくにたちます', '役に立ちます', 'Có ích', '役 (vai trò) + に + 立ちます.', 'BÀI 21  ·  Ý kiến — と 思います / と 言います  (14 từ)', 72),
  (1298, 'うごきます', '動きます', 'Chuyển động, chạy (máy)', '時計が 動きません = đồng hồ không chạy.', 'BÀI 21  ·  Ý kiến — と 思います / と 言います  (14 từ)', 72),
  (1299, 'やめます', '', 'Bỏ, thôi (việc, thói quen)', '会社を やめます; たばこを やめます.', 'BÀI 21  ·  Ý kiến — と 思います / と 言います  (14 từ)', 72),
  (1300, 'きをつけます', '気をつけます', 'Chú ý, cẩn thận', '車に 気をつけます.', 'BÀI 21  ·  Ý kiến — と 思います / と 言います  (14 từ)', 72),
  (1301, 'りゅうがくします', '留学します', 'Du học', '留 (lưu) + 学 (học).', 'BÀI 21  ·  Ý kiến — と 思います / と 言います  (14 từ)', 72),
  (1302, 'むだ', '無駄', 'Lãng phí, vô ích', 'Tính từ な: むだな お金.', 'BÀI 21  ·  Ý kiến — と 思います / と 言います  (14 từ)', 72),
  (1303, 'ぶっか', '物価', 'Vật giá', '物 (vật) + 価 (giá).', 'BÀI 21  ·  Ý kiến — と 思います / と 言います  (14 từ)', 72),
  (1304, 'ほうそう', '放送', 'Phát sóng, truyền thanh', '放 (phóng) + 送 (tống).', 'BÀI 21  ·  Ý kiến — と 思います / と 言います  (14 từ)', 72),
  (1305, 'アニメ', '', 'Phim hoạt hình', 'Viết tắt của animation.', 'BÀI 21  ·  Ý kiến — と 思います / と 言います  (14 từ)', 72),
  (1306, 'マンガ', '', 'Truyện tranh', 'Còn viết 漫画.', 'BÀI 21  ·  Ý kiến — と 思います / と 言います  (14 từ)', 72),
  (1307, 'デザイン', '', 'Thiết kế', 'Từ mượn: design.', 'BÀI 21  ·  Ý kiến — と 思います / と 言います  (14 từ)', 72),
  (1308, 'てんさい', '天才', 'Thiên tài', '天 (trời) + 才 (tài).', 'BÀI 21  ·  Ý kiến — と 思います / と 言います  (14 từ)', 72),
  (1309, 'ちきゅう', '地球', 'Trái đất', '地 (đất) + 球 (quả cầu).', 'BÀI 21  ·  Ý kiến — と 思います / と 言います  (14 từ)', 72),
  (1310, 'ほんとうに', '本当に', 'Thật sự', '本当 + に.', 'BÀI 21  ·  Ý kiến — と 思います / と 言います  (14 từ)', 73),
  (1311, 'そんなに', '', '(không) đến mức đó', 'Đi với phủ định: そんなに 高くないです.', 'BÀI 21  ·  Ý kiến — と 思います / と 言います  (14 từ)', 73),
  (1312, '〜について', '', 'Về ~', '日本の 生活について 話します.', 'BÀI 21  ·  Ý kiến — と 思います / と 言います  (14 từ)', 73),
  (1313, 'しかたがありません', '仕方がありません', 'Đành chịu, không còn cách nào', '仕方 (cách làm) + が ありません.', 'BÀI 21  ·  Ý kiến — と 思います / と 言います  (14 từ)', 73),
  (1314, 'しばらくですね', '', 'Lâu rồi không gặp nhỉ', 'Chào khi gặp lại sau một thời gian.', 'BÀI 21  ·  Ý kiến — と 思います / と 言います  (14 từ)', 73),
  (1315, 'もちろん', '', 'Tất nhiên', 'もちろん 行きます.', 'BÀI 21  ·  Ý kiến — と 思います / と 言います  (14 từ)', 73),
  (1316, 'スーツ', '', 'Bộ com-lê', 'Từ mượn: suit.', 'BÀI 22  ·  Mệnh đề bổ nghĩa danh từ  (14 từ)', 74),
  (1317, 'ロボット', '', 'Rô-bốt', 'Từ mượn: robot.', 'BÀI 22  ·  Mệnh đề bổ nghĩa danh từ  (14 từ)', 74),
  (1318, 'ユーモア', '', 'Sự hài hước', 'Từ mượn: humor.', 'BÀI 22  ·  Mệnh đề bổ nghĩa danh từ  (14 từ)', 74),
  (1319, 'えーと', '', 'Ờ… để xem nào', 'Nói khi đang nghĩ.', 'BÀI 22  ·  Mệnh đề bổ nghĩa danh từ  (14 từ)', 74),
  (1320, 'おめでとうございます', '', 'Chúc mừng', 'Dùng cho sinh nhật, kết hôn, năm mới…', 'BÀI 22  ·  Mệnh đề bổ nghĩa danh từ  (14 từ)', 74),
  (1321, 'やちん', '家賃', 'Tiền thuê nhà', '家 (nhà) + 賃 (tiền công).', 'BÀI 22  ·  Mệnh đề bổ nghĩa danh từ  (14 từ)', 74),
  (1322, 'わしつ', '和室', 'Phòng kiểu Nhật', '和 (Nhật) + 室 (phòng).', 'BÀI 22  ·  Mệnh đề bổ nghĩa danh từ  (14 từ)', 74),
  (1323, 'おしいれ', '押し入れ', 'Tủ âm tường kiểu Nhật', '押す (đẩy) + 入れる (cất): nơi cất chăn đệm.', 'BÀI 22  ·  Mệnh đề bổ nghĩa danh từ  (14 từ)', 74),
  (1324, 'サイズ', '', 'Cỡ, kích thước', 'Từ mượn: size.', 'BÀI 23  ·  とき & Điều kiện と  (14 từ)', 75),
  (1325, 'なんかいも', '何回も', 'Nhiều lần', '何回 + も.', 'BÀI 23  ·  とき & Điều kiện と  (14 từ)', 75),
  (1326, 'ひっこし', '引っ越し', 'Việc chuyển nhà', '引っ越します → 引っ越し.', 'BÀI 24  ·  Cho & Nhận nâng cao — てあげる / てもらう / てくれる  (14 từ)', 77),
  (1327, 'ホームステイ', '', 'Ở nhà người bản xứ (homestay)', 'Từ mượn: homestay.', 'BÀI 24  ·  Cho & Nhận nâng cao — てあげる / てもらう / てくれる  (14 từ)', 77),
  (1328, 'じぶんで', '自分で', 'Tự mình', '自分 (bản thân) + で.', 'BÀI 24  ·  Cho & Nhận nâng cao — てあげる / てもらう / てくれる  (14 từ)', 78),
  (1329, 'ほかに', '', 'Ngoài ra', 'ほかに 何か ありますか.', 'BÀI 24  ·  Cho & Nhận nâng cao — てあげる / てもらう / てくれる  (14 từ)', 78),
  (1330, 'グループ', '', 'Nhóm', 'Từ mượn: group.', 'BÀI 25  ·  Giả định — たら & ても  (14 từ)', 79),
  (1331, 'てんきん', '転勤', 'Chuyển công tác', '転 (chuyển) + 勤 (làm việc).', 'BÀI 25  ·  Giả định — たら & ても  (14 từ)', 79),
  (1332, 'こと', '', 'Việc, chuyện', 'わたしの こと = chuyện về tôi.', 'BÀI 25  ·  Giả định — たら & ても  (14 từ)', 79),
  (1333, 'どうぞおげんきで', 'どうぞお元気で', 'Chúc anh/chị mạnh khỏe (khi chia tay)', 'Lời chào khi chia tay lâu dài.', 'BÀI 25  ·  Giả định — たら & ても  (14 từ)', 80)
on conflict (id) do update set kana = excluded.kana, kanji = excluded.kanji, meaning = excluded.meaning, tip = excluded.tip, lesson = excluded.lesson, day = excluded.day;

update public.vocabulary as t set lesson = v.lesson, day = v.day::int from (values
  (1, 'BÀI 1  ·  Chào hỏi & Giới thiệu bản thân  (14 từ)', 14),
  (2, 'BÀI 1  ·  Chào hỏi & Giới thiệu bản thân  (14 từ)', 14),
  (3, 'BÀI 1  ·  Chào hỏi & Giới thiệu bản thân  (14 từ)', 14),
  (4, 'BÀI 1  ·  Chào hỏi & Giới thiệu bản thân  (14 từ)', 14),
  (5, 'BÀI 1  ·  Chào hỏi & Giới thiệu bản thân  (14 từ)', 14),
  (6, 'BÀI 1  ·  Chào hỏi & Giới thiệu bản thân  (14 từ)', 14),
  (7, 'BÀI 1  ·  Chào hỏi & Giới thiệu bản thân  (14 từ)', 15),
  (8, 'BÀI 1  ·  Chào hỏi & Giới thiệu bản thân  (14 từ)', 15),
  (9, 'BÀI 1  ·  Chào hỏi & Giới thiệu bản thân  (14 từ)', 16),
  (10, 'BÀI 1  ·  Chào hỏi & Giới thiệu bản thân  (14 từ)', 15),
  (11, 'BÀI 1  ·  Chào hỏi & Giới thiệu bản thân  (14 từ)', 14),
  (12, 'BÀI 1  ·  Chào hỏi & Giới thiệu bản thân  (14 từ)', 14),
  (13, 'BÀI 1  ·  Chào hỏi & Giới thiệu bản thân  (14 từ)', 6),
  (14, 'BÀI 1  ·  Chào hỏi & Giới thiệu bản thân  (14 từ)', 15),
  (15, 'BÀI 2  ·  これ・それ・あれ — Chỉ đồ vật  (14 từ)', 17),
  (16, 'BÀI 2  ·  これ・それ・あれ — Chỉ đồ vật  (14 từ)', 17),
  (17, 'BÀI 2  ·  これ・それ・あれ — Chỉ đồ vật  (14 từ)', 17),
  (18, 'BÀI 2  ·  これ・それ・あれ — Chỉ đồ vật  (14 từ)', 17),
  (19, 'BÀI 2  ·  これ・それ・あれ — Chỉ đồ vật  (14 từ)', 17),
  (20, 'BÀI 2  ·  これ・それ・あれ — Chỉ đồ vật  (14 từ)', 17),
  (21, 'BÀI 2  ·  これ・それ・あれ — Chỉ đồ vật  (14 từ)', 17),
  (22, 'BÀI 2  ·  これ・それ・あれ — Chỉ đồ vật  (14 từ)', 17),
  (23, 'BÀI 2  ·  これ・それ・あれ — Chỉ đồ vật  (14 từ)', 17),
  (24, 'BÀI 2  ·  これ・それ・あれ — Chỉ đồ vật  (14 từ)', 17),
  (25, 'BÀI 2  ·  これ・それ・あれ — Chỉ đồ vật  (14 từ)', 9),
  (26, 'BÀI 2  ·  これ・それ・あれ — Chỉ đồ vật  (14 từ)', 9),
  (27, 'BÀI 2  ·  これ・それ・あれ — Chỉ đồ vật  (14 từ)', 17),
  (28, 'BÀI 2  ·  これ・それ・あれ — Chỉ đồ vật  (14 từ)', 17),
  (29, 'BÀI 3  ·  ここ・そこ・あそこ — Chỉ nơi chốn  (14 từ)', 19),
  (30, 'BÀI 3  ·  ここ・そこ・あそこ — Chỉ nơi chốn  (14 từ)', 19),
  (31, 'BÀI 3  ·  ここ・そこ・あそこ — Chỉ nơi chốn  (14 từ)', 19),
  (32, 'BÀI 3  ·  ここ・そこ・あそこ — Chỉ nơi chốn  (14 từ)', 19),
  (33, 'BÀI 3  ·  ここ・そこ・あそこ — Chỉ nơi chốn  (14 từ)', 19),
  (34, 'BÀI 3  ·  ここ・そこ・あそこ — Chỉ nơi chốn  (14 từ)', 19),
  (35, 'BÀI 3  ·  ここ・そこ・あそこ — Chỉ nơi chốn  (14 từ)', 19),
  (36, 'BÀI 3  ·  ここ・そこ・あそこ — Chỉ nơi chốn  (14 từ)', 19),
  (37, 'BÀI 3  ·  ここ・そこ・あそこ — Chỉ nơi chốn  (14 từ)', 20),
  (38, 'BÀI 3  ·  ここ・そこ・あそこ — Chỉ nơi chốn  (14 từ)', 20),
  (39, 'BÀI 3  ·  ここ・そこ・あそこ — Chỉ nơi chốn  (14 từ)', 20),
  (40, 'BÀI 3  ·  ここ・そこ・あそこ — Chỉ nơi chốn  (14 từ)', 20),
  (41, 'BÀI 3  ·  ここ・そこ・あそこ — Chỉ nơi chốn  (14 từ)', 20),
  (42, 'BÀI 3  ·  ここ・そこ・あそこ — Chỉ nơi chốn  (14 từ)', 20),
  (43, 'BÀI 4  ·  Giờ giấc & Thì của động từ  (14 từ)', 23),
  (44, 'BÀI 4  ·  Giờ giấc & Thì của động từ  (14 từ)', 23),
  (45, 'BÀI 4  ·  Giờ giấc & Thì của động từ  (14 từ)', 23),
  (46, 'BÀI 4  ·  Giờ giấc & Thì của động từ  (14 từ)', 23),
  (47, 'BÀI 4  ·  Giờ giấc & Thì của động từ  (14 từ)', 23),
  (48, 'BÀI 4  ·  Giờ giấc & Thì của động từ  (14 từ)', 23),
  (49, 'BÀI 4  ·  Giờ giấc & Thì của động từ  (14 từ)', 24),
  (50, 'BÀI 4  ·  Giờ giấc & Thì của động từ  (14 từ)', 24),
  (51, 'BÀI 4  ·  Giờ giấc & Thì của động từ  (14 từ)', 24),
  (52, 'BÀI 4  ·  Giờ giấc & Thì của động từ  (14 từ)', 25),
  (53, 'BÀI 4  ·  Giờ giấc & Thì của động từ  (14 từ)', 23),
  (54, 'BÀI 4  ·  Giờ giấc & Thì của động từ  (14 từ)', 23),
  (55, 'BÀI 4  ·  Giờ giấc & Thì của động từ  (14 từ)', 23),
  (56, 'BÀI 4  ·  Giờ giấc & Thì của động từ  (14 từ)', 23),
  (57, 'BÀI 5  ·  Đi lại — Phương tiện & Điểm đến  (14 từ)', 27),
  (58, 'BÀI 5  ·  Đi lại — Phương tiện & Điểm đến  (14 từ)', 27),
  (59, 'BÀI 5  ·  Đi lại — Phương tiện & Điểm đến  (14 từ)', 27),
  (60, 'BÀI 5  ·  Đi lại — Phương tiện & Điểm đến  (14 từ)', 27),
  (61, 'BÀI 5  ·  Đi lại — Phương tiện & Điểm đến  (14 từ)', 27),
  (62, 'BÀI 5  ·  Đi lại — Phương tiện & Điểm đến  (14 từ)', 27),
  (63, 'BÀI 5  ·  Đi lại — Phương tiện & Điểm đến  (14 từ)', 27),
  (64, 'BÀI 5  ·  Đi lại — Phương tiện & Điểm đến  (14 từ)', 27),
  (65, 'BÀI 5  ·  Đi lại — Phương tiện & Điểm đến  (14 từ)', 27),
  (66, 'BÀI 5  ·  Đi lại — Phương tiện & Điểm đến  (14 từ)', 27),
  (67, 'BÀI 5  ·  Đi lại — Phương tiện & Điểm đến  (14 từ)', 27),
  (68, 'BÀI 5  ·  Đi lại — Phương tiện & Điểm đến  (14 từ)', 28),
  (69, 'BÀI 5  ·  Đi lại — Phương tiện & Điểm đến  (14 từ)', 28),
  (70, 'BÀI 5  ·  Đi lại — Phương tiện & Điểm đến  (14 từ)', 29),
  (71, 'BÀI 6  ·  Tân ngữ を & Rủ rê  (14 từ)', 30),
  (72, 'BÀI 6  ·  Tân ngữ を & Rủ rê  (14 từ)', 30),
  (73, 'BÀI 6  ·  Tân ngữ を & Rủ rê  (14 từ)', 30),
  (74, 'BÀI 6  ·  Tân ngữ を & Rủ rê  (14 từ)', 30),
  (75, 'BÀI 6  ·  Tân ngữ を & Rủ rê  (14 từ)', 30),
  (76, 'BÀI 6  ·  Tân ngữ を & Rủ rê  (14 từ)', 30),
  (77, 'BÀI 6  ·  Tân ngữ を & Rủ rê  (14 từ)', 30),
  (78, 'BÀI 6  ·  Tân ngữ を & Rủ rê  (14 từ)', 30),
  (79, 'BÀI 6  ·  Tân ngữ を & Rủ rê  (14 từ)', 30),
  (80, 'BÀI 6  ·  Tân ngữ を & Rủ rê  (14 từ)', 30),
  (81, 'BÀI 6  ·  Tân ngữ を & Rủ rê  (14 từ)', 30),
  (82, 'BÀI 6  ·  Tân ngữ を & Rủ rê  (14 từ)', 30),
  (83, 'BÀI 6  ·  Tân ngữ を & Rủ rê  (14 từ)', 30),
  (84, 'BÀI 6  ·  Tân ngữ を & Rủ rê  (14 từ)', 30),
  (85, 'BÀI 7  ·  Cho & Nhận, Công cụ で  (14 từ)', 34),
  (86, 'BÀI 7  ·  Cho & Nhận, Công cụ で  (14 từ)', 34),
  (87, 'BÀI 7  ·  Cho & Nhận, Công cụ で  (14 từ)', 34),
  (88, 'BÀI 7  ·  Cho & Nhận, Công cụ で  (14 từ)', 34),
  (89, 'BÀI 7  ·  Cho & Nhận, Công cụ で  (14 từ)', 34),
  (90, 'BÀI 7  ·  Cho & Nhận, Công cụ で  (14 từ)', 34),
  (91, 'BÀI 7  ·  Cho & Nhận, Công cụ で  (14 từ)', 34),
  (92, 'BÀI 7  ·  Cho & Nhận, Công cụ で  (14 từ)', 34),
  (93, 'BÀI 7  ·  Cho & Nhận, Công cụ で  (14 từ)', 34),
  (94, 'BÀI 7  ·  Cho & Nhận, Công cụ で  (14 từ)', 34),
  (95, 'BÀI 7  ·  Cho & Nhận, Công cụ で  (14 từ)', 34),
  (96, 'BÀI 7  ·  Cho & Nhận, Công cụ で  (14 từ)', 34),
  (97, 'BÀI 7  ·  Cho & Nhận, Công cụ で  (14 từ)', 34),
  (98, 'BÀI 7  ·  Cho & Nhận, Công cụ で  (14 từ)', 34),
  (99, 'BÀI 8  ·  Tính từ  (14 từ)', 36),
  (100, 'BÀI 8  ·  Tính từ  (14 từ)', 36),
  (101, 'BÀI 8  ·  Tính từ  (14 từ)', 36),
  (102, 'BÀI 8  ·  Tính từ  (14 từ)', 36),
  (103, 'BÀI 8  ·  Tính từ  (14 từ)', 36),
  (104, 'BÀI 8  ·  Tính từ  (14 từ)', 37),
  (105, 'BÀI 8  ·  Tính từ  (14 từ)', 37),
  (106, 'BÀI 8  ·  Tính từ  (14 từ)', 37),
  (107, 'BÀI 8  ·  Tính từ  (14 từ)', 37),
  (112, 'BÀI 8  ·  Tính từ  (14 từ)', 38),
  (113, 'BÀI 9  ·  Thích / Giỏi / Có & Lý do から  (14 từ)', 41),
  (114, 'BÀI 9  ·  Thích / Giỏi / Có & Lý do から  (14 từ)', 41),
  (115, 'BÀI 9  ·  Thích / Giỏi / Có & Lý do から  (14 từ)', 41),
  (116, 'BÀI 9  ·  Thích / Giỏi / Có & Lý do から  (14 từ)', 41),
  (117, 'BÀI 9  ·  Thích / Giỏi / Có & Lý do から  (14 từ)', 39),
  (118, 'BÀI 9  ·  Thích / Giỏi / Có & Lý do から  (14 từ)', 39),
  (119, 'BÀI 9  ·  Thích / Giỏi / Có & Lý do から  (14 từ)', 39),
  (120, 'BÀI 9  ·  Thích / Giỏi / Có & Lý do から  (14 từ)', 39),
  (121, 'BÀI 4  ·  Giờ giấc & Thì của động từ  (14 từ)', 24),
  (122, 'BÀI 9  ·  Thích / Giỏi / Có & Lý do から  (14 từ)', 39),
  (123, 'BÀI 9  ·  Thích / Giỏi / Có & Lý do から  (14 từ)', 40),
  (124, 'BÀI 8  ·  Tính từ  (14 từ)', 37),
  (125, 'BÀI 9  ·  Thích / Giỏi / Có & Lý do から  (14 từ)', 40),
  (126, 'BÀI 9  ·  Thích / Giỏi / Có & Lý do から  (14 từ)', 41),
  (127, 'BÀI 10  ·  Tồn tại — あります / います & Vị trí  (14 từ)', 43),
  (128, 'BÀI 10  ·  Tồn tại — あります / います & Vị trí  (14 từ)', 44),
  (129, 'BÀI 10  ·  Tồn tại — あります / います & Vị trí  (14 từ)', 44),
  (130, 'BÀI 10  ·  Tồn tại — あります / います & Vị trí  (14 từ)', 44),
  (131, 'BÀI 10  ·  Tồn tại — あります / います & Vị trí  (14 từ)', 44),
  (132, 'BÀI 10  ·  Tồn tại — あります / います & Vị trí  (14 từ)', 44),
  (133, 'BÀI 10  ·  Tồn tại — あります / います & Vị trí  (14 từ)', 44),
  (134, 'BÀI 10  ·  Tồn tại — あります / います & Vị trí  (14 từ)', 44),
  (135, 'BÀI 10  ·  Tồn tại — あります / います & Vị trí  (14 từ)', 44),
  (136, 'BÀI 10  ·  Tồn tại — あります / います & Vị trí  (14 từ)', 44),
  (137, 'BÀI 10  ·  Tồn tại — あります / います & Vị trí  (14 từ)', 45),
  (138, 'BÀI 3  ·  ここ・そこ・あそこ — Chỉ nơi chốn  (14 từ)', 19),
  (139, 'BÀI 6  ·  Tân ngữ を & Rủ rê  (14 từ)', 31),
  (140, 'BÀI 10  ·  Tồn tại — あります / います & Vị trí  (14 từ)', 44),
  (141, 'BÀI 11  ·  Số đếm & Lượng từ  (14 từ)', 48),
  (142, 'BÀI 11  ·  Số đếm & Lượng từ  (14 từ)', 46),
  (143, 'BÀI 11  ·  Số đếm & Lượng từ  (14 từ)', 46),
  (144, 'BÀI 11  ·  Số đếm & Lượng từ  (14 từ)', 46),
  (145, 'BÀI 11  ·  Số đếm & Lượng từ  (14 từ)', 48),
  (146, 'BÀI 11  ·  Số đếm & Lượng từ  (14 từ)', 46),
  (147, 'BÀI 9  ·  Thích / Giỏi / Có & Lý do から  (14 từ)', 40),
  (148, 'BÀI 11  ·  Số đếm & Lượng từ  (14 từ)', 47),
  (149, 'BÀI 11  ·  Số đếm & Lượng từ  (14 từ)', 47),
  (150, 'BÀI 11  ·  Số đếm & Lượng từ  (14 từ)', 48),
  (151, 'BÀI 11  ·  Số đếm & Lượng từ  (14 từ)', 46),
  (152, 'BÀI 11  ·  Số đếm & Lượng từ  (14 từ)', 46),
  (153, 'BÀI 11  ·  Số đếm & Lượng từ  (14 từ)', 46),
  (154, 'BÀI 11  ·  Số đếm & Lượng từ  (14 từ)', 47),
  (155, 'BÀI 8  ·  Tính từ  (14 từ)', 36),
  (156, 'BÀI 12  ·  Quá khứ của tính từ & So sánh  (14 từ)', 50),
  (157, 'BÀI 12  ·  Quá khứ của tính từ & So sánh  (14 từ)', 49),
  (158, 'BÀI 12  ·  Quá khứ của tính từ & So sánh  (14 từ)', 49),
  (159, 'BÀI 12  ·  Quá khứ của tính từ & So sánh  (14 từ)', 49),
  (160, 'BÀI 12  ·  Quá khứ của tính từ & So sánh  (14 từ)', 49),
  (161, 'BÀI 12  ·  Quá khứ của tính từ & So sánh  (14 từ)', 49),
  (162, 'BÀI 12  ·  Quá khứ của tính từ & So sánh  (14 từ)', 50),
  (163, 'BÀI 12  ·  Quá khứ của tính từ & So sánh  (14 từ)', 50),
  (164, 'BÀI 10  ·  Tồn tại — あります / います & Vị trí  (14 từ)', 44),
  (165, 'BÀI 12  ·  Quá khứ của tính từ & So sánh  (14 từ)', 50),
  (166, 'BÀI 12  ·  Quá khứ của tính từ & So sánh  (14 từ)', 49),
  (167, 'BÀI 12  ·  Quá khứ của tính từ & So sánh  (14 từ)', 49),
  (168, 'BÀI 12  ·  Quá khứ của tính từ & So sánh  (14 từ)', 49),
  (169, 'BÀI 13  ·  Mong muốn — たい & ほしい  (14 từ)', 53),
  (170, 'BÀI 13  ·  Mong muốn — たい & ほしい  (14 từ)', 54),
  (171, 'BÀI 13  ·  Mong muốn — たい & ほしい  (14 từ)', 54),
  (172, 'BÀI 13  ·  Mong muốn — たい & ほしい  (14 từ)', 54),
  (173, 'BÀI 13  ·  Mong muốn — たい & ほしい  (14 từ)', 54),
  (174, 'BÀI 13  ·  Mong muốn — たい & ほしい  (14 từ)', 54),
  (175, 'BÀI 13  ·  Mong muốn — たい & ほしい  (14 từ)', 53),
  (176, 'BÀI 13  ·  Mong muốn — たい & ほしい  (14 từ)', 53),
  (177, 'BÀI 16  ·  Nối câu bằng thể て  (14 từ)', 60),
  (178, 'BÀI 17  ·  Thể ない — Cấm, Bắt buộc, Không cần  (14 từ)', 64),
  (179, 'BÀI 13  ·  Mong muốn — たい & ほしい  (14 từ)', 53),
  (180, 'BÀI 4  ·  Giờ giấc & Thì của động từ  (14 từ)', 23),
  (181, 'BÀI 13  ·  Mong muốn — たい & ほしい  (14 từ)', 54),
  (182, 'BÀI 13  ·  Mong muốn — たい & ほしい  (14 từ)', 53),
  (183, 'BÀI 14  ·  Thể て & Yêu cầu  (14 từ)', 55),
  (184, 'BÀI 14  ·  Thể て & Yêu cầu  (14 từ)', 55),
  (185, 'BÀI 14  ·  Thể て & Yêu cầu  (14 từ)', 55),
  (186, 'BÀI 14  ·  Thể て & Yêu cầu  (14 từ)', 55),
  (187, 'BÀI 14  ·  Thể て & Yêu cầu  (14 từ)', 55),
  (188, 'BÀI 14  ·  Thể て & Yêu cầu  (14 từ)', 55),
  (189, 'BÀI 14  ·  Thể て & Yêu cầu  (14 từ)', 55),
  (190, 'BÀI 14  ·  Thể て & Yêu cầu  (14 từ)', 56),
  (191, 'BÀI 14  ·  Thể て & Yêu cầu  (14 từ)', 55),
  (192, 'BÀI 14  ·  Thể て & Yêu cầu  (14 từ)', 55),
  (193, 'BÀI 14  ·  Thể て & Yêu cầu  (14 từ)', 55),
  (194, 'BÀI 14  ·  Thể て & Yêu cầu  (14 từ)', 55),
  (195, 'BÀI 14  ·  Thể て & Yêu cầu  (14 từ)', 56),
  (196, 'BÀI 14  ·  Thể て & Yêu cầu  (14 từ)', 56),
  (197, 'BÀI 15  ·  Cho phép & Cấm đoán  (14 từ)', 57),
  (198, 'BÀI 14  ·  Thể て & Yêu cầu  (14 từ)', 55),
  (199, 'BÀI 15  ·  Cho phép & Cấm đoán  (14 từ)', 57),
  (200, 'BÀI 15  ·  Cho phép & Cấm đoán  (14 từ)', 57),
  (201, 'BÀI 15  ·  Cho phép & Cấm đoán  (14 từ)', 57),
  (202, 'BÀI 15  ·  Cho phép & Cấm đoán  (14 từ)', 58),
  (203, 'BÀI 1  ·  Chào hỏi & Giới thiệu bản thân  (14 từ)', 14),
  (204, 'BÀI 15  ·  Cho phép & Cấm đoán  (14 từ)', 57),
  (205, 'BÀI 1  ·  Chào hỏi & Giới thiệu bản thân  (14 từ)', 14),
  (206, 'BÀI 5  ·  Đi lại — Phương tiện & Điểm đến  (14 từ)', 27),
  (207, 'BÀI 15  ·  Cho phép & Cấm đoán  (14 từ)', 58),
  (208, 'BÀI 6  ·  Tân ngữ を & Rủ rê  (14 từ)', 31),
  (209, 'BÀI 15  ·  Cho phép & Cấm đoán  (14 từ)', 58),
  (210, 'BÀI 6  ·  Tân ngữ を & Rủ rê  (14 từ)', 31),
  (211, 'BÀI 16  ·  Nối câu bằng thể て  (14 từ)', 59),
  (212, 'BÀI 16  ·  Nối câu bằng thể て  (14 từ)', 59),
  (213, 'BÀI 16  ·  Nối câu bằng thể て  (14 từ)', 59),
  (214, 'BÀI 16  ·  Nối câu bằng thể て  (14 từ)', 59),
  (215, 'BÀI 16  ·  Nối câu bằng thể て  (14 từ)', 61),
  (216, 'BÀI 23  ·  とき & Điều kiện と  (14 từ)', 75),
  (217, 'BÀI 23  ·  とき & Điều kiện と  (14 từ)', 75),
  (218, 'BÀI 13  ·  Mong muốn — たい & ほしい  (14 từ)', 53),
  (219, 'BÀI 13  ·  Mong muốn — たい & ほしい  (14 từ)', 53),
  (220, 'BÀI 16  ·  Nối câu bằng thể て  (14 từ)', 59),
  (221, 'BÀI 16  ·  Nối câu bằng thể て  (14 từ)', 59),
  (222, 'BÀI 16  ·  Nối câu bằng thể て  (14 từ)', 59),
  (223, 'BÀI 16  ·  Nối câu bằng thể て  (14 từ)', 61),
  (224, 'BÀI 23  ·  とき & Điều kiện と  (14 từ)', 75),
  (225, 'BÀI 17  ·  Thể ない — Cấm, Bắt buộc, Không cần  (14 từ)', 63),
  (226, 'BÀI 17  ·  Thể ない — Cấm, Bắt buộc, Không cần  (14 từ)', 63),
  (227, 'BÀI 17  ·  Thể ない — Cấm, Bắt buộc, Không cần  (14 từ)', 63),
  (228, 'BÀI 17  ·  Thể ない — Cấm, Bắt buộc, Không cần  (14 từ)', 63),
  (229, 'BÀI 17  ·  Thể ない — Cấm, Bắt buộc, Không cần  (14 từ)', 63),
  (230, 'BÀI 17  ·  Thể ない — Cấm, Bắt buộc, Không cần  (14 từ)', 63),
  (232, 'BÀI 17  ·  Thể ない — Cấm, Bắt buộc, Không cần  (14 từ)', 63),
  (233, 'BÀI 13  ·  Mong muốn — たい & ほしい  (14 từ)', 53),
  (234, 'BÀI 14  ·  Thể て & Yêu cầu  (14 từ)', 55),
  (235, 'BÀI 17  ·  Thể ない — Cấm, Bắt buộc, Không cần  (14 từ)', 63),
  (236, 'BÀI 17  ·  Thể ない — Cấm, Bắt buộc, Không cần  (14 từ)', 63),
  (237, 'BÀI 17  ·  Thể ない — Cấm, Bắt buộc, Không cần  (14 từ)', 63),
  (238, 'BÀI 17  ·  Thể ない — Cấm, Bắt buộc, Không cần  (14 từ)', 64),
  (239, 'BÀI 18  ·  Thể từ điển & Khả năng  (14 từ)', 65),
  (240, 'BÀI 18  ·  Thể từ điển & Khả năng  (14 từ)', 65),
  (241, 'BÀI 18  ·  Thể từ điển & Khả năng  (14 từ)', 65),
  (242, 'BÀI 18  ·  Thể từ điển & Khả năng  (14 từ)', 65),
  (243, 'BÀI 18  ·  Thể từ điển & Khả năng  (14 từ)', 65),
  (244, 'BÀI 18  ·  Thể từ điển & Khả năng  (14 từ)', 65),
  (245, 'BÀI 18  ·  Thể từ điển & Khả năng  (14 từ)', 65),
  (246, 'BÀI 18  ·  Thể từ điển & Khả năng  (14 từ)', 65),
  (247, 'BÀI 18  ·  Thể từ điển & Khả năng  (14 từ)', 65),
  (248, 'BÀI 18  ·  Thể từ điển & Khả năng  (14 từ)', 65),
  (249, 'BÀI 18  ·  Thể từ điển & Khả năng  (14 từ)', 66),
  (250, 'BÀI 14  ·  Thể て & Yêu cầu  (14 từ)', 55),
  (251, 'BÀI 16  ·  Nối câu bằng thể て  (14 từ)', 59),
  (252, 'BÀI 19  ·  Thể た — Kinh nghiệm & Liệt kê  (14 từ)', 67),
  (253, 'BÀI 19  ·  Thể た — Kinh nghiệm & Liệt kê  (14 từ)', 67),
  (254, 'BÀI 19  ·  Thể た — Kinh nghiệm & Liệt kê  (14 từ)', 67),
  (255, 'BÀI 19  ·  Thể た — Kinh nghiệm & Liệt kê  (14 từ)', 67),
  (256, 'BÀI 19  ·  Thể た — Kinh nghiệm & Liệt kê  (14 từ)', 67),
  (257, 'BÀI 19  ·  Thể た — Kinh nghiệm & Liệt kê  (14 từ)', 68),
  (258, 'BÀI 19  ·  Thể た — Kinh nghiệm & Liệt kê  (14 từ)', 67),
  (259, 'BÀI 19  ·  Thể た — Kinh nghiệm & Liệt kê  (14 từ)', 67),
  (260, 'BÀI 19  ·  Thể た — Kinh nghiệm & Liệt kê  (14 từ)', 67),
  (261, 'BÀI 19  ·  Thể た — Kinh nghiệm & Liệt kê  (14 từ)', 67),
  (262, 'BÀI 19  ·  Thể た — Kinh nghiệm & Liệt kê  (14 từ)', 67),
  (263, 'BÀI 19  ·  Thể た — Kinh nghiệm & Liệt kê  (14 từ)', 67),
  (264, 'BÀI 19  ·  Thể た — Kinh nghiệm & Liệt kê  (14 từ)', 67),
  (265, 'BÀI 6  ·  Tân ngữ を & Rủ rê  (14 từ)', 31),
  (266, 'BÀI 21  ·  Ý kiến — と 思います / と 言います  (14 từ)', 72),
  (267, 'BÀI 20  ·  Thể thông thường (普通形)  (14 từ)', 69),
  (268, 'BÀI 20  ·  Thể thông thường (普通形)  (14 từ)', 69),
  (269, 'BÀI 20  ·  Thể thông thường (普通形)  (14 từ)', 69),
  (270, 'BÀI 20  ·  Thể thông thường (普通形)  (14 từ)', 70),
  (271, 'BÀI 20  ·  Thể thông thường (普通形)  (14 từ)', 69),
  (272, 'BÀI 20  ·  Thể thông thường (普通形)  (14 từ)', 69),
  (273, 'BÀI 5  ·  Đi lại — Phương tiện & Điểm đến  (14 từ)', 29),
  (274, 'BÀI 15  ·  Cho phép & Cấm đoán  (14 từ)', 57),
  (275, 'BÀI 20  ·  Thể thông thường (普通形)  (14 từ)', 70),
  (276, 'BÀI 20  ·  Thể thông thường (普通形)  (14 từ)', 70),
  (277, 'BÀI 20  ·  Thể thông thường (普通形)  (14 từ)', 70),
  (278, 'BÀI 20  ·  Thể thông thường (普通形)  (14 từ)', 69),
  (279, 'BÀI 21  ·  Ý kiến — と 思います / と 言います  (14 từ)', 72),
  (280, 'BÀI 20  ·  Thể thông thường (普通形)  (14 từ)', 70),
  (281, 'BÀI 21  ·  Ý kiến — と 思います / と 言います  (14 từ)', 72),
  (282, 'BÀI 21  ·  Ý kiến — と 思います / と 言います  (14 từ)', 72),
  (283, 'BÀI 25  ·  Giả định — たら & ても  (14 từ)', 79),
  (284, 'BÀI 21  ·  Ý kiến — と 思います / と 言います  (14 từ)', 72),
  (285, 'BÀI 21  ·  Ý kiến — と 思います / と 言います  (14 từ)', 72),
  (286, 'BÀI 21  ·  Ý kiến — と 思います / と 言います  (14 từ)', 72),
  (287, 'BÀI 4  ·  Giờ giấc & Thì của động từ  (14 từ)', 24),
  (288, 'BÀI 21  ·  Ý kiến — と 思います / と 言います  (14 từ)', 72),
  (289, 'BÀI 21  ·  Ý kiến — と 思います / と 言います  (14 từ)', 73),
  (290, 'BÀI 21  ·  Ý kiến — と 思います / と 言います  (14 từ)', 72),
  (291, 'BÀI 21  ·  Ý kiến — と 思います / と 言います  (14 từ)', 73),
  (292, 'BÀI 21  ·  Ý kiến — と 思います / と 言います  (14 từ)', 72),
  (293, 'BÀI 21  ·  Ý kiến — と 思います / と 言います  (14 từ)', 73),
  (294, 'BÀI 21  ·  Ý kiến — と 思います / と 言います  (14 từ)', 73),
  (295, 'BÀI 22  ·  Mệnh đề bổ nghĩa danh từ  (14 từ)', 74),
  (296, 'BÀI 22  ·  Mệnh đề bổ nghĩa danh từ  (14 từ)', 74),
  (297, 'BÀI 22  ·  Mệnh đề bổ nghĩa danh từ  (14 từ)', 74),
  (298, 'BÀI 22  ·  Mệnh đề bổ nghĩa danh từ  (14 từ)', 74),
  (299, 'BÀI 22  ·  Mệnh đề bổ nghĩa danh từ  (14 từ)', 74),
  (300, 'BÀI 9  ·  Thích / Giỏi / Có & Lý do から  (14 từ)', 40),
  (301, 'BÀI 9  ·  Thích / Giỏi / Có & Lý do から  (14 từ)', 40),
  (302, 'BÀI 9  ·  Thích / Giỏi / Có & Lý do から  (14 từ)', 40),
  (303, 'BÀI 22  ·  Mệnh đề bổ nghĩa danh từ  (14 từ)', 74),
  (304, 'BÀI 22  ·  Mệnh đề bổ nghĩa danh từ  (14 từ)', 74),
  (305, 'BÀI 22  ·  Mệnh đề bổ nghĩa danh từ  (14 từ)', 74),
  (306, 'BÀI 6  ·  Tân ngữ を & Rủ rê  (14 từ)', 32),
  (308, 'BÀI 22  ·  Mệnh đề bổ nghĩa danh từ  (14 từ)', 74),
  (309, 'BÀI 23  ·  とき & Điều kiện と  (14 từ)', 75),
  (311, 'BÀI 23  ·  とき & Điều kiện と  (14 từ)', 75),
  (312, 'BÀI 23  ·  とき & Điều kiện と  (14 từ)', 75),
  (313, 'BÀI 23  ·  とき & Điều kiện と  (14 từ)', 75),
  (315, 'BÀI 23  ·  とき & Điều kiện と  (14 từ)', 75),
  (316, 'BÀI 23  ·  とき & Điều kiện と  (14 từ)', 75),
  (317, 'BÀI 23  ·  とき & Điều kiện と  (14 từ)', 75),
  (320, 'BÀI 23  ·  とき & Điều kiện と  (14 từ)', 75),
  (321, 'BÀI 23  ·  とき & Điều kiện と  (14 từ)', 75),
  (322, 'BÀI 9  ·  Thích / Giỏi / Có & Lý do から  (14 từ)', 40),
  (323, 'BÀI 24  ·  Cho & Nhận nâng cao — てあげる / てもらう / てくれる  (14 từ)', 77),
  (324, 'BÀI 24  ·  Cho & Nhận nâng cao — てあげる / てもらう / てくれる  (14 từ)', 77),
  (325, 'BÀI 24  ·  Cho & Nhận nâng cao — てあげる / てもらう / てくれる  (14 từ)', 77),
  (326, 'BÀI 7  ·  Cho & Nhận, Công cụ で  (14 từ)', 34),
  (327, 'BÀI 24  ·  Cho & Nhận nâng cao — てあげる / てもらう / てくれる  (14 từ)', 77),
  (328, 'BÀI 24  ·  Cho & Nhận nâng cao — てあげる / てもらう / てくれる  (14 từ)', 77),
  (329, 'BÀI 24  ·  Cho & Nhận nâng cao — てあげる / てもらう / てくれる  (14 từ)', 77),
  (331, 'BÀI 24  ·  Cho & Nhận nâng cao — てあげる / てもらう / てくれる  (14 từ)', 77),
  (332, 'BÀI 24  ·  Cho & Nhận nâng cao — てあげる / てもらう / てくれる  (14 từ)', 78),
  (333, 'BÀI 24  ·  Cho & Nhận nâng cao — てあげる / てもらう / てくれる  (14 từ)', 78),
  (334, 'BÀI 14  ·  Thể て & Yêu cầu  (14 từ)', 55),
  (335, 'BÀI 24  ·  Cho & Nhận nâng cao — てあげる / てもらう / てくれる  (14 từ)', 78),
  (336, 'BÀI 5  ·  Đi lại — Phương tiện & Điểm đến  (14 từ)', 27),
  (337, 'BÀI 25  ·  Giả định — たら & ても  (14 từ)', 80),
  (338, 'BÀI 25  ·  Giả định — たら & ても  (14 từ)', 79),
  (339, 'BÀI 25  ·  Giả định — たら & ても  (14 từ)', 79),
  (340, 'BÀI 25  ·  Giả định — たら & ても  (14 từ)', 79),
  (341, 'BÀI 25  ·  Giả định — たら & ても  (14 từ)', 79),
  (342, 'BÀI 25  ·  Giả định — たら & ても  (14 từ)', 79),
  (343, 'BÀI 25  ·  Giả định — たら & ても  (14 từ)', 80),
  (344, 'BÀI 25  ·  Giả định — たら & ても  (14 từ)', 80),
  (345, 'BÀI 25  ·  Giả định — たら & ても  (14 từ)', 79),
  (346, 'BÀI 25  ·  Giả định — たら & ても  (14 từ)', 80),
  (347, 'BÀI 25  ·  Giả định — たら & ても  (14 từ)', 80),
  (348, 'BÀI 25  ·  Giả định — たら & ても  (14 từ)', 80),
  (349, 'BÀI 25  ·  Giả định — たら & ても  (14 từ)', 80),
  (350, 'BÀI 25  ·  Giả định — たら & ても  (14 từ)', 80),
  (351, 'Chào hỏi & từ Katakana (giai đoạn chữ cái)', 4),
  (352, 'Chào hỏi & từ Katakana (giai đoạn chữ cái)', 4),
  (353, 'Chào hỏi & từ Katakana (giai đoạn chữ cái)', 4),
  (354, 'Chào hỏi & từ Katakana (giai đoạn chữ cái)', 4),
  (355, 'Chào hỏi & từ Katakana (giai đoạn chữ cái)', 4),
  (356, 'Chào hỏi & từ Katakana (giai đoạn chữ cái)', 9),
  (357, 'Chào hỏi & từ Katakana (giai đoạn chữ cái)', 7),
  (358, 'Chào hỏi & từ Katakana (giai đoạn chữ cái)', 4),
  (359, 'Chào hỏi & từ Katakana (giai đoạn chữ cái)', 4),
  (360, 'Chào hỏi & từ Katakana (giai đoạn chữ cái)', 7),
  (361, 'Chào hỏi & từ Katakana (giai đoạn chữ cái)', 9),
  (362, 'Chào hỏi & từ Katakana (giai đoạn chữ cái)', 6),
  (363, 'Chào hỏi & từ Katakana (giai đoạn chữ cái)', 6),
  (364, 'Chào hỏi & từ Katakana (giai đoạn chữ cái)', 7),
  (365, 'Chào hỏi & từ Katakana (giai đoạn chữ cái)', 9),
  (366, 'Chào hỏi & từ Katakana (giai đoạn chữ cái)', 6),
  (367, 'Chào hỏi & từ Katakana (giai đoạn chữ cái)', 6),
  (368, 'Chào hỏi & từ Katakana (giai đoạn chữ cái)', 8),
  (369, 'Chào hỏi & từ Katakana (giai đoạn chữ cái)', 9),
  (370, 'Chào hỏi & từ Katakana (giai đoạn chữ cái)', 6),
  (371, 'Chào hỏi & từ Katakana (giai đoạn chữ cái)', 8),
  (372, 'Chào hỏi & từ Katakana (giai đoạn chữ cái)', 9),
  (373, 'BÀI 1  ·  Chào hỏi & Giới thiệu bản thân  (14 từ)', 6),
  (374, 'BÀI 6  ·  Tân ngữ を & Rủ rê  (14 từ)', 7),
  (375, 'BÀI 1  ·  Chào hỏi & Giới thiệu bản thân  (14 từ)', 7),
  (376, 'BÀI 1  ·  Chào hỏi & Giới thiệu bản thân  (14 từ)', 15),
  (377, 'BÀI 11  ·  Số đếm & Lượng từ  (14 từ)', 48),
  (378, 'BÀI 11  ·  Số đếm & Lượng từ  (14 từ)', 47),
  (379, 'BÀI 1  ·  Chào hỏi & Giới thiệu bản thân  (14 từ)', 16),
  (380, 'BÀI 11  ·  Số đếm & Lượng từ  (14 từ)', 47),
  (381, 'BÀI 1  ·  Chào hỏi & Giới thiệu bản thân  (14 từ)', 16),
  (382, 'BÀI 2  ·  これ・それ・あれ — Chỉ đồ vật  (14 từ)', 17),
  (383, 'BÀI 2  ·  これ・それ・あれ — Chỉ đồ vật  (14 từ)', 17),
  (384, 'BÀI 2  ·  これ・それ・あれ — Chỉ đồ vật  (14 từ)', 17),
  (385, 'BÀI 2  ·  これ・それ・あれ — Chỉ đồ vật  (14 từ)', 17),
  (386, 'BÀI 2  ·  これ・それ・あれ — Chỉ đồ vật  (14 từ)', 17),
  (387, 'BÀI 2  ·  これ・それ・あれ — Chỉ đồ vật  (14 từ)', 17),
  (388, 'BÀI 2  ·  これ・それ・あれ — Chỉ đồ vật  (14 từ)', 17),
  (389, 'BÀI 2  ·  これ・それ・あれ — Chỉ đồ vật  (14 từ)', 17),
  (390, 'BÀI 2  ·  これ・それ・あれ — Chỉ đồ vật  (14 từ)', 18),
  (391, 'BÀI 6  ·  Tân ngữ を & Rủ rê  (14 từ)', 31),
  (392, 'BÀI 11  ·  Số đếm & Lượng từ  (14 từ)', 46),
  (393, 'BÀI 2  ·  これ・それ・あれ — Chỉ đồ vật  (14 từ)', 18),
  (394, 'BÀI 10  ·  Tồn tại — あります / います & Vị trí  (14 từ)', 43),
  (395, 'BÀI 2  ·  これ・それ・あれ — Chỉ đồ vật  (14 từ)', 18),
  (396, 'BÀI 2  ·  これ・それ・あれ — Chỉ đồ vật  (14 từ)', 18),
  (397, 'BÀI 10  ·  Tồn tại — あります / います & Vị trí  (14 từ)', 43),
  (398, 'BÀI 2  ·  これ・それ・あれ — Chỉ đồ vật  (14 từ)', 18),
  (399, 'BÀI 2  ·  これ・それ・あれ — Chỉ đồ vật  (14 từ)', 18),
  (400, 'BÀI 3  ·  ここ・そこ・あそこ — Chỉ nơi chốn  (14 từ)', 19),
  (401, 'BÀI 3  ·  ここ・そこ・あそこ — Chỉ nơi chốn  (14 từ)', 19),
  (402, 'BÀI 3  ·  ここ・そこ・あそこ — Chỉ nơi chốn  (14 từ)', 19),
  (403, 'BÀI 3  ·  ここ・そこ・あそこ — Chỉ nơi chốn  (14 từ)', 19),
  (404, 'BÀI 3  ·  ここ・そこ・あそこ — Chỉ nơi chốn  (14 từ)', 19),
  (405, 'BÀI 3  ·  ここ・そこ・あそこ — Chỉ nơi chốn  (14 từ)', 19),
  (406, 'BÀI 3  ·  ここ・そこ・あそこ — Chỉ nơi chốn  (14 từ)', 19),
  (407, 'BÀI 20  ·  Thể thông thường (普通形)  (14 từ)', 69),
  (408, 'BÀI 20  ·  Thể thông thường (普通形)  (14 từ)', 69),
  (409, 'BÀI 20  ·  Thể thông thường (普通形)  (14 từ)', 69),
  (410, 'BÀI 20  ·  Thể thông thường (普通形)  (14 từ)', 69),
  (411, 'BÀI 4  ·  Giờ giấc & Thì của động từ  (14 từ)', 23),
  (412, 'BÀI 23  ·  とき & Điều kiện と  (14 từ)', 75),
  (413, 'BÀI 3  ·  ここ・そこ・あそこ — Chỉ nơi chốn  (14 từ)', 21),
  (414, 'BÀI 3  ·  ここ・そこ・あそこ — Chỉ nơi chốn  (14 từ)', 21),
  (415, 'BÀI 3  ·  ここ・そこ・あそこ — Chỉ nơi chốn  (14 từ)', 21),
  (416, 'BÀI 3  ·  ここ・そこ・あそこ — Chỉ nơi chốn  (14 từ)', 21),
  (417, 'BÀI 3  ·  ここ・そこ・あそこ — Chỉ nơi chốn  (14 từ)', 21),
  (418, 'BÀI 25  ·  Giả định — たら & ても  (14 từ)', 79),
  (419, 'BÀI 8  ·  Tính từ  (14 từ)', 37),
  (420, 'BÀI 7  ·  Cho & Nhận, Công cụ で  (14 từ)', 34),
  (421, 'BÀI 5  ·  Đi lại — Phương tiện & Điểm đến  (14 từ)', 27),
  (422, 'BÀI 4  ·  Giờ giấc & Thì của động từ  (14 từ)', 24),
  (423, 'BÀI 4  ·  Giờ giấc & Thì của động từ  (14 từ)', 24),
  (424, 'BÀI 4  ·  Giờ giấc & Thì của động từ  (14 từ)', 24),
  (425, 'BÀI 4  ·  Giờ giấc & Thì của động từ  (14 từ)', 24),
  (426, 'BÀI 4  ·  Giờ giấc & Thì của động từ  (14 từ)', 24),
  (427, 'BÀI 4  ·  Giờ giấc & Thì của động từ  (14 từ)', 24),
  (428, 'BÀI 4  ·  Giờ giấc & Thì của động từ  (14 từ)', 24),
  (429, 'BÀI 4  ·  Giờ giấc & Thì của động từ  (14 từ)', 26),
  (430, 'BÀI 4  ·  Giờ giấc & Thì của động từ  (14 từ)', 24),
  (431, 'BÀI 4  ·  Giờ giấc & Thì của động từ  (14 từ)', 24),
  (432, 'BÀI 4  ·  Giờ giấc & Thì của động từ  (14 từ)', 26),
  (433, 'BÀI 4  ·  Giờ giấc & Thì của động từ  (14 từ)', 25),
  (434, 'BÀI 4  ·  Giờ giấc & Thì của động từ  (14 từ)', 25),
  (435, 'BÀI 4  ·  Giờ giấc & Thì của động từ  (14 từ)', 25),
  (436, 'BÀI 4  ·  Giờ giấc & Thì của động từ  (14 từ)', 25),
  (437, 'BÀI 4  ·  Giờ giấc & Thì của động từ  (14 từ)', 25),
  (438, 'BÀI 4  ·  Giờ giấc & Thì của động từ  (14 từ)', 25),
  (439, 'BÀI 4  ·  Giờ giấc & Thì của động từ  (14 từ)', 25),
  (440, 'BÀI 4  ·  Giờ giấc & Thì của động từ  (14 từ)', 25),
  (441, 'BÀI 4  ·  Giờ giấc & Thì của động từ  (14 từ)', 25),
  (442, 'BÀI 4  ·  Giờ giấc & Thì của động từ  (14 từ)', 24),
  (443, 'BÀI 8  ·  Tính từ  (14 từ)', 37),
  (444, 'BÀI 4  ·  Giờ giấc & Thì của động từ  (14 từ)', 25),
  (445, 'BÀI 3  ·  ここ・そこ・あそこ — Chỉ nơi chốn  (14 từ)', 20),
  (446, 'BÀI 4  ·  Giờ giấc & Thì của động từ  (14 từ)', 26),
  (447, 'BÀI 4  ·  Giờ giấc & Thì của động từ  (14 từ)', 26),
  (448, 'BÀI 4  ·  Giờ giấc & Thì của động từ  (14 từ)', 26),
  (449, 'BÀI 21  ·  Ý kiến — と 思います / と 言います  (14 từ)', 72),
  (450, 'BÀI 7  ·  Cho & Nhận, Công cụ で  (14 từ)', 34),
  (451, 'BÀI 5  ·  Đi lại — Phương tiện & Điểm đến  (14 từ)', 28),
  (452, 'BÀI 5  ·  Đi lại — Phương tiện & Điểm đến  (14 từ)', 28),
  (453, 'BÀI 5  ·  Đi lại — Phương tiện & Điểm đến  (14 từ)', 28),
  (454, 'BÀI 5  ·  Đi lại — Phương tiện & Điểm đến  (14 từ)', 28),
  (455, 'BÀI 5  ·  Đi lại — Phương tiện & Điểm đến  (14 từ)', 28),
  (456, 'BÀI 5  ·  Đi lại — Phương tiện & Điểm đến  (14 từ)', 28),
  (457, 'BÀI 5  ·  Đi lại — Phương tiện & Điểm đến  (14 từ)', 28),
  (458, 'BÀI 5  ·  Đi lại — Phương tiện & Điểm đến  (14 từ)', 29),
  (459, 'BÀI 5  ·  Đi lại — Phương tiện & Điểm đến  (14 từ)', 29),
  (460, 'BÀI 5  ·  Đi lại — Phương tiện & Điểm đến  (14 từ)', 29),
  (461, 'BÀI 5  ·  Đi lại — Phương tiện & Điểm đến  (14 từ)', 29),
  (462, 'BÀI 5  ·  Đi lại — Phương tiện & Điểm đến  (14 từ)', 27),
  (463, 'BÀI 5  ·  Đi lại — Phương tiện & Điểm đến  (14 từ)', 28),
  (464, 'BÀI 5  ·  Đi lại — Phương tiện & Điểm đến  (14 từ)', 29),
  (465, 'BÀI 5  ·  Đi lại — Phương tiện & Điểm đến  (14 từ)', 28),
  (466, 'BÀI 5  ·  Đi lại — Phương tiện & Điểm đến  (14 từ)', 28),
  (467, 'BÀI 5  ·  Đi lại — Phương tiện & Điểm đến  (14 từ)', 29),
  (468, 'BÀI 5  ·  Đi lại — Phương tiện & Điểm đến  (14 từ)', 28),
  (469, 'BÀI 5  ·  Đi lại — Phương tiện & Điểm đến  (14 từ)', 28),
  (470, 'BÀI 5  ·  Đi lại — Phương tiện & Điểm đến  (14 từ)', 28),
  (471, 'BÀI 5  ·  Đi lại — Phương tiện & Điểm đến  (14 từ)', 29),
  (472, 'BÀI 5  ·  Đi lại — Phương tiện & Điểm đến  (14 từ)', 29),
  (473, 'BÀI 5  ·  Đi lại — Phương tiện & Điểm đến  (14 từ)', 29),
  (474, 'BÀI 5  ·  Đi lại — Phương tiện & Điểm đến  (14 từ)', 29),
  (475, 'BÀI 5  ·  Đi lại — Phương tiện & Điểm đến  (14 từ)', 29),
  (476, 'BÀI 6  ·  Tân ngữ を & Rủ rê  (14 từ)', 30),
  (477, 'BÀI 6  ·  Tân ngữ を & Rủ rê  (14 từ)', 30),
  (478, 'BÀI 6  ·  Tân ngữ を & Rủ rê  (14 từ)', 30),
  (479, 'BÀI 6  ·  Tân ngữ を & Rủ rê  (14 từ)', 32),
  (480, 'BÀI 8  ·  Tính từ  (14 từ)', 37),
  (481, 'BÀI 9  ·  Thích / Giỏi / Có & Lý do から  (14 từ)', 39),
  (482, 'BÀI 6  ·  Tân ngữ を & Rủ rê  (14 từ)', 31),
  (483, 'BÀI 6  ·  Tân ngữ を & Rủ rê  (14 từ)', 31),
  (484, 'BÀI 6  ·  Tân ngữ を & Rủ rê  (14 từ)', 31),
  (485, 'BÀI 6  ·  Tân ngữ を & Rủ rê  (14 từ)', 31),
  (486, 'BÀI 6  ·  Tân ngữ を & Rủ rê  (14 từ)', 31),
  (487, 'BÀI 12  ·  Quá khứ của tính từ & So sánh  (14 từ)', 50),
  (488, 'BÀI 12  ·  Quá khứ của tính từ & So sánh  (14 từ)', 50),
  (489, 'BÀI 12  ·  Quá khứ của tính từ & So sánh  (14 từ)', 50),
  (490, 'BÀI 11  ·  Số đếm & Lượng từ  (14 từ)', 46),
  (491, 'BÀI 7  ·  Cho & Nhận, Công cụ で  (14 từ)', 35),
  (492, 'BÀI 7  ·  Cho & Nhận, Công cụ で  (14 từ)', 35),
  (493, 'BÀI 10  ·  Tồn tại — あります / います & Vị trí  (14 từ)', 44),
  (494, 'BÀI 6  ·  Tân ngữ を & Rủ rê  (14 từ)', 31),
  (495, 'BÀI 7  ·  Cho & Nhận, Công cụ で  (14 từ)', 34),
  (496, 'BÀI 7  ·  Cho & Nhận, Công cụ で  (14 từ)', 34),
  (497, 'BÀI 7  ·  Cho & Nhận, Công cụ で  (14 từ)', 35),
  (498, 'BÀI 7  ·  Cho & Nhận, Công cụ で  (14 từ)', 35),
  (499, 'BÀI 7  ·  Cho & Nhận, Công cụ で  (14 từ)', 35),
  (500, 'BÀI 7  ·  Cho & Nhận, Công cụ で  (14 từ)', 35),
  (501, 'BÀI 7  ·  Cho & Nhận, Công cụ で  (14 từ)', 35),
  (502, 'BÀI 7  ·  Cho & Nhận, Công cụ で  (14 từ)', 35),
  (503, 'BÀI 7  ·  Cho & Nhận, Công cụ で  (14 từ)', 35),
  (504, 'BÀI 7  ·  Cho & Nhận, Công cụ で  (14 từ)', 35),
  (505, 'BÀI 11  ·  Số đếm & Lượng từ  (14 từ)', 46),
  (506, 'BÀI 9  ·  Thích / Giỏi / Có & Lý do から  (14 từ)', 40),
  (507, 'BÀI 8  ·  Tính từ  (14 từ)', 36),
  (508, 'BÀI 8  ·  Tính từ  (14 từ)', 37),
  (509, 'BÀI 8  ·  Tính từ  (14 từ)', 38),
  (510, 'BÀI 12  ·  Quá khứ của tính từ & So sánh  (14 từ)', 49),
  (511, 'BÀI 12  ·  Quá khứ của tính từ & So sánh  (14 từ)', 49),
  (512, 'BÀI 12  ·  Quá khứ của tính từ & So sánh  (14 từ)', 49),
  (513, 'BÀI 12  ·  Quá khứ của tính từ & So sánh  (14 từ)', 49),
  (514, 'BÀI 16  ·  Nối câu bằng thể て  (14 từ)', 59),
  (515, 'BÀI 16  ·  Nối câu bằng thể て  (14 từ)', 59),
  (516, 'BÀI 12  ·  Quá khứ của tính từ & So sánh  (14 từ)', 49),
  (517, 'BÀI 12  ·  Quá khứ của tính từ & So sánh  (14 từ)', 49),
  (518, 'BÀI 12  ·  Quá khứ của tính từ & So sánh  (14 từ)', 49),
  (519, 'BÀI 12  ·  Quá khứ của tính từ & So sánh  (14 từ)', 49),
  (520, 'BÀI 12  ·  Quá khứ của tính từ & So sánh  (14 từ)', 49),
  (521, 'BÀI 8  ·  Tính từ  (14 từ)', 37),
  (522, 'BÀI 8  ·  Tính từ  (14 từ)', 38),
  (523, 'BÀI 8  ·  Tính từ  (14 từ)', 38),
  (524, 'BÀI 8  ·  Tính từ  (14 từ)', 38),
  (525, 'BÀI 8  ·  Tính từ  (14 từ)', 38),
  (526, 'BÀI 8  ·  Tính từ  (14 từ)', 36),
  (527, 'BÀI 8  ·  Tính từ  (14 từ)', 38),
  (528, 'BÀI 17  ·  Thể ない — Cấm, Bắt buộc, Không cần  (14 từ)', 63),
  (529, 'BÀI 8  ·  Tính từ  (14 từ)', 38),
  (530, 'BÀI 8  ·  Tính từ  (14 từ)', 38),
  (531, 'BÀI 8  ·  Tính từ  (14 từ)', 38),
  (532, 'BÀI 8  ·  Tính từ  (14 từ)', 38),
  (533, 'BÀI 8  ·  Tính từ  (14 từ)', 36),
  (534, 'BÀI 8  ·  Tính từ  (14 từ)', 36),
  (535, 'BÀI 8  ·  Tính từ  (14 từ)', 36),
  (536, 'BÀI 8  ·  Tính từ  (14 từ)', 36),
  (537, 'BÀI 8  ·  Tính từ  (14 từ)', 36),
  (538, 'BÀI 8  ·  Tính từ  (14 từ)', 36),
  (539, 'BÀI 8  ·  Tính từ  (14 từ)', 36),
  (540, 'BÀI 8  ·  Tính từ  (14 từ)', 36),
  (541, 'BÀI 8  ·  Tính từ  (14 từ)', 38),
  (542, 'BÀI 8  ·  Tính từ  (14 từ)', 38),
  (543, 'BÀI 8  ·  Tính từ  (14 từ)', 38),
  (544, 'BÀI 8  ·  Tính từ  (14 từ)', 38),
  (545, 'BÀI 8  ·  Tính từ  (14 từ)', 38),
  (546, 'BÀI 8  ·  Tính từ  (14 từ)', 38),
  (547, 'BÀI 8  ·  Tính từ  (14 từ)', 37),
  (548, 'BÀI 8  ·  Tính từ  (14 từ)', 37),
  (549, 'BÀI 8  ·  Tính từ  (14 từ)', 38),
  (550, 'BÀI 9  ·  Thích / Giỏi / Có & Lý do から  (14 từ)', 41),
  (551, 'BÀI 9  ·  Thích / Giỏi / Có & Lý do から  (14 từ)', 41),
  (552, 'BÀI 8  ·  Tính từ  (14 từ)', 37),
  (553, 'BÀI 9  ·  Thích / Giỏi / Có & Lý do から  (14 từ)', 41),
  (554, 'BÀI 8  ·  Tính từ  (14 từ)', 37),
  (555, 'BÀI 9  ·  Thích / Giỏi / Có & Lý do から  (14 từ)', 41),
  (556, 'BÀI 8  ·  Tính từ  (14 từ)', 37),
  (557, 'BÀI 8  ·  Tính từ  (14 từ)', 37),
  (558, 'BÀI 9  ·  Thích / Giỏi / Có & Lý do から  (14 từ)', 41),
  (559, 'BÀI 9  ·  Thích / Giỏi / Có & Lý do から  (14 từ)', 41),
  (560, 'BÀI 9  ·  Thích / Giỏi / Có & Lý do から  (14 từ)', 41),
  (561, 'BÀI 16  ·  Nối câu bằng thể て  (14 từ)', 60),
  (562, 'BÀI 9  ·  Thích / Giỏi / Có & Lý do から  (14 từ)', 39),
  (563, 'BÀI 9  ·  Thích / Giỏi / Có & Lý do から  (14 từ)', 41),
  (564, 'BÀI 9  ·  Thích / Giỏi / Có & Lý do から  (14 từ)', 39),
  (565, 'BÀI 9  ·  Thích / Giỏi / Có & Lý do から  (14 từ)', 41),
  (566, 'BÀI 9  ·  Thích / Giỏi / Có & Lý do から  (14 từ)', 39),
  (567, 'BÀI 9  ·  Thích / Giỏi / Có & Lý do から  (14 từ)', 39),
  (568, 'BÀI 9  ·  Thích / Giỏi / Có & Lý do から  (14 từ)', 39),
  (569, 'BÀI 9  ·  Thích / Giỏi / Có & Lý do から  (14 từ)', 39),
  (570, 'BÀI 9  ·  Thích / Giỏi / Có & Lý do から  (14 từ)', 41),
  (571, 'BÀI 9  ·  Thích / Giỏi / Có & Lý do から  (14 từ)', 39),
  (572, 'BÀI 9  ·  Thích / Giỏi / Có & Lý do から  (14 từ)', 41),
  (573, 'BÀI 20  ·  Thể thông thường (普通形)  (14 từ)', 69),
  (574, 'BÀI 9  ·  Thích / Giỏi / Có & Lý do から  (14 từ)', 41),
  (575, 'BÀI 9  ·  Thích / Giỏi / Có & Lý do から  (14 từ)', 40),
  (576, 'BÀI 9  ·  Thích / Giỏi / Có & Lý do から  (14 từ)', 40),
  (577, 'BÀI 6  ·  Tân ngữ を & Rủ rê  (14 từ)', 31),
  (578, 'BÀI 10  ·  Tồn tại — あります / います & Vị trí  (14 từ)', 43),
  (579, 'BÀI 10  ·  Tồn tại — あります / います & Vị trí  (14 từ)', 43),
  (580, 'BÀI 10  ·  Tồn tại — あります / います & Vị trí  (14 từ)', 45),
  (581, 'BÀI 18  ·  Thể từ điển & Khả năng  (14 từ)', 65),
  (582, 'BÀI 10  ·  Tồn tại — あります / います & Vị trí  (14 từ)', 45),
  (583, 'BÀI 10  ·  Tồn tại — あります / います & Vị trí  (14 từ)', 45),
  (584, 'BÀI 12  ·  Quá khứ của tính từ & So sánh  (14 từ)', 50),
  (585, 'BÀI 10  ·  Tồn tại — あります / います & Vị trí  (14 từ)', 44),
  (586, 'BÀI 10  ·  Tồn tại — あります / います & Vị trí  (14 từ)', 45),
  (587, 'BÀI 10  ·  Tồn tại — あります / います & Vị trí  (14 từ)', 45),
  (588, 'BÀI 10  ·  Tồn tại — あります / います & Vị trí  (14 từ)', 45),
  (589, 'BÀI 4  ·  Giờ giấc & Thì của động từ  (14 từ)', 23),
  (590, 'BÀI 10  ·  Tồn tại — あります / います & Vị trí  (14 từ)', 45),
  (591, 'BÀI 10  ·  Tồn tại — あります / います & Vị trí  (14 từ)', 43),
  (592, 'BÀI 10  ·  Tồn tại — あります / います & Vị trí  (14 từ)', 43),
  (593, 'BÀI 10  ·  Tồn tại — あります / います & Vị trí  (14 từ)', 43),
  (594, 'BÀI 10  ·  Tồn tại — あります / います & Vị trí  (14 từ)', 43),
  (595, 'BÀI 10  ·  Tồn tại — あります / います & Vị trí  (14 từ)', 45),
  (596, 'BÀI 10  ·  Tồn tại — あります / います & Vị trí  (14 từ)', 43),
  (597, 'BÀI 10  ·  Tồn tại — あります / います & Vị trí  (14 từ)', 44),
  (598, 'BÀI 10  ·  Tồn tại — あります / います & Vị trí  (14 từ)', 45),
  (599, 'BÀI 10  ·  Tồn tại — あります / います & Vị trí  (14 từ)', 45),
  (600, 'BÀI 10  ·  Tồn tại — あります / います & Vị trí  (14 từ)', 45),
  (601, 'BÀI 10  ·  Tồn tại — あります / います & Vị trí  (14 từ)', 45),
  (602, 'BÀI 10  ·  Tồn tại — あります / います & Vị trí  (14 từ)', 43),
  (603, 'BÀI 10  ·  Tồn tại — あります / います & Vị trí  (14 từ)', 45),
  (604, 'BÀI 11  ·  Số đếm & Lượng từ  (14 từ)', 46),
  (605, 'BÀI 11  ·  Số đếm & Lượng từ  (14 từ)', 46),
  (606, 'BÀI 11  ·  Số đếm & Lượng từ  (14 từ)', 46),
  (607, 'BÀI 11  ·  Số đếm & Lượng từ  (14 từ)', 46),
  (608, 'BÀI 11  ·  Số đếm & Lượng từ  (14 từ)', 46),
  (609, 'BÀI 11  ·  Số đếm & Lượng từ  (14 từ)', 46),
  (610, 'BÀI 11  ·  Số đếm & Lượng từ  (14 từ)', 46),
  (611, 'BÀI 11  ·  Số đếm & Lượng từ  (14 từ)', 46),
  (612, 'BÀI 11  ·  Số đếm & Lượng từ  (14 từ)', 46),
  (613, 'BÀI 11  ·  Số đếm & Lượng từ  (14 từ)', 46),
  (614, 'BÀI 11  ·  Số đếm & Lượng từ  (14 từ)', 48),
  (615, 'BÀI 11  ·  Số đếm & Lượng từ  (14 từ)', 46),
  (616, 'BÀI 11  ·  Số đếm & Lượng từ  (14 từ)', 47),
  (617, 'BÀI 11  ·  Số đếm & Lượng từ  (14 từ)', 47),
  (618, 'BÀI 11  ·  Số đếm & Lượng từ  (14 từ)', 47),
  (619, 'BÀI 11  ·  Số đếm & Lượng từ  (14 từ)', 47),
  (620, 'BÀI 11  ·  Số đếm & Lượng từ  (14 từ)', 47),
  (621, 'BÀI 11  ·  Số đếm & Lượng từ  (14 từ)', 47),
  (622, 'BÀI 11  ·  Số đếm & Lượng từ  (14 từ)', 48),
  (623, 'BÀI 11  ·  Số đếm & Lượng từ  (14 từ)', 48),
  (624, 'BÀI 10  ·  Tồn tại — あります / います & Vị trí  (14 từ)', 43),
  (625, 'BÀI 10  ·  Tồn tại — あります / います & Vị trí  (14 từ)', 43),
  (626, 'BÀI 11  ·  Số đếm & Lượng từ  (14 từ)', 47),
  (627, 'BÀI 11  ·  Số đếm & Lượng từ  (14 từ)', 48),
  (628, 'BÀI 11  ·  Số đếm & Lượng từ  (14 từ)', 48),
  (629, 'BÀI 18  ·  Thể từ điển & Khả năng  (14 từ)', 65),
  (630, 'BÀI 11  ·  Số đếm & Lượng từ  (14 từ)', 48),
  (631, 'BÀI 11  ·  Số đếm & Lượng từ  (14 từ)', 48),
  (632, 'BÀI 24  ·  Cho & Nhận nâng cao — てあげる / てもらう / てくれる  (14 từ)', 78),
  (633, 'BÀI 11  ·  Số đếm & Lượng từ  (14 từ)', 48),
  (634, 'BÀI 11  ·  Số đếm & Lượng từ  (14 từ)', 48),
  (635, 'BÀI 12  ·  Quá khứ của tính từ & So sánh  (14 từ)', 49),
  (636, 'BÀI 12  ·  Quá khứ của tính từ & So sánh  (14 từ)', 49),
  (637, 'BÀI 12  ·  Quá khứ của tính từ & So sánh  (14 từ)', 50),
  (638, 'BÀI 12  ·  Quá khứ của tính từ & So sánh  (14 từ)', 51),
  (639, 'BÀI 12  ·  Quá khứ của tính từ & So sánh  (14 từ)', 51),
  (640, 'BÀI 12  ·  Quá khứ của tính từ & So sánh  (14 từ)', 51),
  (641, 'BÀI 12  ·  Quá khứ của tính từ & So sánh  (14 từ)', 51),
  (642, 'BÀI 12  ·  Quá khứ của tính từ & So sánh  (14 từ)', 51),
  (643, 'BÀI 14  ·  Thể て & Yêu cầu  (14 từ)', 55),
  (644, 'BÀI 12  ·  Quá khứ của tính từ & So sánh  (14 từ)', 51),
  (645, 'BÀI 12  ·  Quá khứ của tính từ & So sánh  (14 từ)', 51),
  (646, 'BÀI 12  ·  Quá khứ của tính từ & So sánh  (14 từ)', 51),
  (647, 'BÀI 9  ·  Thích / Giỏi / Có & Lý do から  (14 từ)', 39),
  (648, 'BÀI 12  ·  Quá khứ của tính từ & So sánh  (14 từ)', 50),
  (649, 'BÀI 8  ·  Tính từ  (14 từ)', 36),
  (650, 'BÀI 13  ·  Mong muốn — たい & ほしい  (14 từ)', 53),
  (651, 'BÀI 13  ·  Mong muốn — たい & ほしい  (14 từ)', 53),
  (652, 'BÀI 13  ·  Mong muốn — たい & ほしい  (14 từ)', 54),
  (653, 'BÀI 17  ·  Thể ない — Cấm, Bắt buộc, Không cần  (14 từ)', 63),
  (654, 'BÀI 12  ·  Quá khứ của tính từ & So sánh  (14 từ)', 50),
  (655, 'BÀI 8  ·  Tính từ  (14 từ)', 37),
  (656, 'BÀI 13  ·  Mong muốn — たい & ほしい  (14 từ)', 54),
  (657, 'BÀI 13  ·  Mong muốn — たい & ほしい  (14 từ)', 54),
  (658, 'BÀI 14  ·  Thể て & Yêu cầu  (14 từ)', 55),
  (659, 'BÀI 14  ·  Thể て & Yêu cầu  (14 từ)', 55),
  (660, 'BÀI 13  ·  Mong muốn — たい & ほしい  (14 từ)', 54),
  (661, 'BÀI 13  ·  Mong muốn — たい & ほしい  (14 từ)', 54),
  (662, 'BÀI 14  ·  Thể て & Yêu cầu  (14 từ)', 55),
  (663, 'BÀI 14  ·  Thể て & Yêu cầu  (14 từ)', 55),
  (664, 'BÀI 14  ·  Thể て & Yêu cầu  (14 từ)', 56),
  (665, 'BÀI 14  ·  Thể て & Yêu cầu  (14 từ)', 55),
  (666, 'BÀI 14  ·  Thể て & Yêu cầu  (14 từ)', 56),
  (667, 'BÀI 14  ·  Thể て & Yêu cầu  (14 từ)', 56),
  (668, 'BÀI 14  ·  Thể て & Yêu cầu  (14 từ)', 56),
  (669, 'BÀI 14  ·  Thể て & Yêu cầu  (14 từ)', 56),
  (670, 'BÀI 14  ·  Thể て & Yêu cầu  (14 từ)', 56),
  (671, 'BÀI 14  ·  Thể て & Yêu cầu  (14 từ)', 56),
  (672, 'BÀI 14  ·  Thể て & Yêu cầu  (14 từ)', 56),
  (673, 'BÀI 14  ·  Thể て & Yêu cầu  (14 từ)', 56),
  (674, 'BÀI 3  ·  ここ・そこ・あそこ — Chỉ nơi chốn  (14 từ)', 21),
  (675, 'BÀI 2  ·  これ・それ・あれ — Chỉ đồ vật  (14 từ)', 18),
  (676, 'BÀI 14  ·  Thể て & Yêu cầu  (14 từ)', 56),
  (677, 'BÀI 14  ·  Thể て & Yêu cầu  (14 từ)', 56),
  (678, 'BÀI 15  ·  Cho phép & Cấm đoán  (14 từ)', 58),
  (679, 'BÀI 15  ·  Cho phép & Cấm đoán  (14 từ)', 58),
  (680, 'BÀI 25  ·  Giả định — たら & ても  (14 từ)', 79),
  (681, 'BÀI 16  ·  Nối câu bằng thể て  (14 từ)', 59),
  (682, 'BÀI 15  ·  Cho phép & Cấm đoán  (14 từ)', 58),
  (683, 'BÀI 15  ·  Cho phép & Cấm đoán  (14 từ)', 58),
  (684, 'BÀI 15  ·  Cho phép & Cấm đoán  (14 từ)', 58),
  (685, 'BÀI 15  ·  Cho phép & Cấm đoán  (14 từ)', 58),
  (686, 'BÀI 14  ·  Thể て & Yêu cầu  (14 từ)', 56),
  (687, 'BÀI 15  ·  Cho phép & Cấm đoán  (14 từ)', 58),
  (688, 'BÀI 15  ·  Cho phép & Cấm đoán  (14 từ)', 58),
  (689, 'BÀI 15  ·  Cho phép & Cấm đoán  (14 từ)', 58),
  (690, 'BÀI 15  ·  Cho phép & Cấm đoán  (14 từ)', 58),
  (691, 'BÀI 11  ·  Số đếm & Lượng từ  (14 từ)', 47),
  (692, 'BÀI 16  ·  Nối câu bằng thể て  (14 từ)', 59),
  (693, 'BÀI 16  ·  Nối câu bằng thể て  (14 từ)', 60),
  (694, 'BÀI 16  ·  Nối câu bằng thể て  (14 từ)', 60),
  (695, 'BÀI 16  ·  Nối câu bằng thể て  (14 từ)', 61),
  (696, 'BÀI 16  ·  Nối câu bằng thể て  (14 từ)', 61),
  (697, 'BÀI 18  ·  Thể từ điển & Khả năng  (14 từ)', 65),
  (698, 'BÀI 16  ·  Nối câu bằng thể て  (14 từ)', 61),
  (699, 'BÀI 16  ·  Nối câu bằng thể て  (14 từ)', 60),
  (700, 'BÀI 16  ·  Nối câu bằng thể て  (14 từ)', 61),
  (701, 'BÀI 20  ·  Thể thông thường (普通形)  (14 từ)', 69),
  (702, 'BÀI 6  ·  Tân ngữ を & Rủ rê  (14 từ)', 32),
  (703, 'BÀI 16  ·  Nối câu bằng thể て  (14 từ)', 61),
  (704, 'BÀI 17  ·  Thể ない — Cấm, Bắt buộc, Không cần  (14 từ)', 64),
  (705, 'BÀI 17  ·  Thể ない — Cấm, Bắt buộc, Không cần  (14 từ)', 64),
  (706, 'BÀI 17  ·  Thể ない — Cấm, Bắt buộc, Không cần  (14 từ)', 64),
  (707, 'BÀI 17  ·  Thể ない — Cấm, Bắt buộc, Không cần  (14 từ)', 63),
  (708, 'BÀI 17  ·  Thể ない — Cấm, Bắt buộc, Không cần  (14 từ)', 63),
  (709, 'BÀI 17  ·  Thể ない — Cấm, Bắt buộc, Không cần  (14 từ)', 63),
  (710, 'BÀI 17  ·  Thể ない — Cấm, Bắt buộc, Không cần  (14 từ)', 63),
  (711, 'BÀI 17  ·  Thể ない — Cấm, Bắt buộc, Không cần  (14 từ)', 64),
  (712, 'BÀI 7  ·  Cho & Nhận, Công cụ で  (14 từ)', 35),
  (713, 'BÀI 7  ·  Cho & Nhận, Công cụ で  (14 từ)', 35),
  (714, 'BÀI 19  ·  Thể た — Kinh nghiệm & Liệt kê  (14 từ)', 67),
  (715, 'BÀI 18  ·  Thể từ điển & Khả năng  (14 từ)', 66),
  (716, 'BÀI 18  ·  Thể từ điển & Khả năng  (14 từ)', 66),
  (717, 'BÀI 18  ·  Thể từ điển & Khả năng  (14 từ)', 66),
  (718, 'BÀI 18  ·  Thể từ điển & Khả năng  (14 từ)', 66),
  (719, 'BÀI 18  ·  Thể từ điển & Khả năng  (14 từ)', 66),
  (720, 'BÀI 18  ·  Thể từ điển & Khả năng  (14 từ)', 66),
  (721, 'BÀI 18  ·  Thể từ điển & Khả năng  (14 từ)', 66),
  (722, 'BÀI 12  ·  Quá khứ của tính từ & So sánh  (14 từ)', 50),
  (723, 'BÀI 6  ·  Tân ngữ を & Rủ rê  (14 từ)', 31),
  (724, 'BÀI 6  ·  Tân ngữ を & Rủ rê  (14 từ)', 31),
  (725, 'BÀI 19  ·  Thể た — Kinh nghiệm & Liệt kê  (14 từ)', 68),
  (726, 'BÀI 14  ·  Thể て & Yêu cầu  (14 từ)', 56),
  (727, 'BÀI 19  ·  Thể た — Kinh nghiệm & Liệt kê  (14 từ)', 68),
  (728, 'BÀI 20  ·  Thể thông thường (普通形)  (14 từ)', 70),
  (729, 'BÀI 20  ·  Thể thông thường (普通形)  (14 từ)', 70),
  (730, 'BÀI 19  ·  Thể た — Kinh nghiệm & Liệt kê  (14 từ)', 68),
  (731, 'BÀI 20  ·  Thể thông thường (普通形)  (14 từ)', 70),
  (732, 'BÀI 20  ·  Thể thông thường (普通形)  (14 từ)', 70),
  (733, 'BÀI 20  ·  Thể thông thường (普通形)  (14 từ)', 70),
  (734, 'BÀI 2  ·  これ・それ・あれ — Chỉ đồ vật  (14 từ)', 18),
  (735, 'BÀI 17  ·  Thể ない — Cấm, Bắt buộc, Không cần  (14 từ)', 63),
  (736, 'BÀI 8  ·  Tính từ  (14 từ)', 36),
  (737, 'BÀI 21  ·  Ý kiến — と 思います / と 言います  (14 từ)', 73),
  (738, 'BÀI 21  ·  Ý kiến — と 思います / と 言います  (14 từ)', 73),
  (739, 'BÀI 17  ·  Thể ない — Cấm, Bắt buộc, Không cần  (14 từ)', 63),
  (740, 'BÀI 22  ·  Mệnh đề bổ nghĩa danh từ  (14 từ)', 74),
  (741, 'BÀI 22  ·  Mệnh đề bổ nghĩa danh từ  (14 từ)', 74),
  (742, 'BÀI 7  ·  Cho & Nhận, Công cụ で  (14 từ)', 34),
  (743, 'BÀI 22  ·  Mệnh đề bổ nghĩa danh từ  (14 từ)', 74),
  (744, 'BÀI 22  ·  Mệnh đề bổ nghĩa danh từ  (14 từ)', 74),
  (745, 'BÀI 22  ·  Mệnh đề bổ nghĩa danh từ  (14 từ)', 74),
  (746, 'BÀI 22  ·  Mệnh đề bổ nghĩa danh từ  (14 từ)', 74),
  (747, 'BÀI 3  ·  ここ・そこ・あそこ — Chỉ nơi chốn  (14 từ)', 20),
  (748, 'BÀI 22  ·  Mệnh đề bổ nghĩa danh từ  (14 từ)', 74),
  (749, 'BÀI 10  ·  Tồn tại — あります / います & Vị trí  (14 từ)', 45),
  (750, 'BÀI 3  ·  ここ・そこ・あそこ — Chỉ nơi chốn  (14 từ)', 20),
  (751, 'BÀI 2  ·  これ・それ・あれ — Chỉ đồ vật  (14 từ)', 18),
  (752, 'BÀI 15  ·  Cho phép & Cấm đoán  (14 từ)', 57),
  (753, 'BÀI 22  ·  Mệnh đề bổ nghĩa danh từ  (14 từ)', 74),
  (754, 'BÀI 10  ·  Tồn tại — あります / います & Vị trí  (14 từ)', 45),
  (755, 'BÀI 2  ·  これ・それ・あれ — Chỉ đồ vật  (14 từ)', 18),
  (756, 'BÀI 23  ·  とき & Điều kiện と  (14 từ)', 75),
  (757, 'BÀI 1  ·  Chào hỏi & Giới thiệu bản thân  (14 từ)', 15),
  (758, 'BÀI 23  ·  とき & Điều kiện と  (14 từ)', 75),
  (759, 'BÀI 11  ·  Số đếm & Lượng từ  (14 từ)', 46),
  (760, 'BÀI 7  ·  Cho & Nhận, Công cụ で  (14 từ)', 34),
  (761, 'BÀI 23  ·  とき & Điều kiện と  (14 từ)', 76),
  (762, 'BÀI 23  ·  とき & Điều kiện と  (14 từ)', 76),
  (763, 'BÀI 14  ·  Thể て & Yêu cầu  (14 từ)', 55),
  (764, 'BÀI 24  ·  Cho & Nhận nâng cao — てあげる / てもらう / てくれる  (14 từ)', 78),
  (765, 'BÀI 14  ·  Thể て & Yêu cầu  (14 từ)', 55),
  (766, 'BÀI 25  ·  Giả định — たら & ても  (14 từ)', 80),
  (767, 'BÀI 1  ·  Chào hỏi & Giới thiệu bản thân  (14 từ)', 14),
  (768, 'BÀI 1  ·  Chào hỏi & Giới thiệu bản thân  (14 từ)', 16),
  (769, 'BÀI 5  ·  Đi lại — Phương tiện & Điểm đến  (14 từ)', 27),
  (770, 'BÀI 5  ·  Đi lại — Phương tiện & Điểm đến  (14 từ)', 27),
  (771, 'BÀI 1  ·  Chào hỏi & Giới thiệu bản thân  (14 từ)', 14),
  (772, 'BÀI 1  ·  Chào hỏi & Giới thiệu bản thân  (14 từ)', 14),
  (773, 'BÀI 1  ·  Chào hỏi & Giới thiệu bản thân  (14 từ)', 16),
  (774, 'BÀI 2  ·  これ・それ・あれ — Chỉ đồ vật  (14 từ)', 18),
  (775, 'BÀI 1  ·  Chào hỏi & Giới thiệu bản thân  (14 từ)', 16),
  (776, 'BÀI 1  ·  Chào hỏi & Giới thiệu bản thân  (14 từ)', 16),
  (777, 'BÀI 1  ·  Chào hỏi & Giới thiệu bản thân  (14 từ)', 16),
  (778, 'BÀI 1  ·  Chào hỏi & Giới thiệu bản thân  (14 từ)', 15),
  (779, 'BÀI 10  ·  Tồn tại — あります / います & Vị trí  (14 từ)', 45),
  (780, 'BÀI 10  ·  Tồn tại — あります / います & Vị trí  (14 từ)', 45),
  (781, 'BÀI 10  ·  Tồn tại — あります / います & Vị trí  (14 từ)', 45),
  (782, 'BÀI 10  ·  Tồn tại — あります / います & Vị trí  (14 từ)', 45),
  (783, 'BÀI 1  ·  Chào hỏi & Giới thiệu bản thân  (14 từ)', 16),
  (784, 'BÀI 1  ·  Chào hỏi & Giới thiệu bản thân  (14 từ)', 16),
  (785, 'BÀI 1  ·  Chào hỏi & Giới thiệu bản thân  (14 từ)', 16),
  (786, 'BÀI 15  ·  Cho phép & Cấm đoán  (14 từ)', 58),
  (787, 'BÀI 1  ·  Chào hỏi & Giới thiệu bản thân  (14 từ)', 16),
  (788, 'BÀI 18  ·  Thể từ điển & Khả năng  (14 từ)', 65),
  (789, 'BÀI 18  ·  Thể từ điển & Khả năng  (14 từ)', 65),
  (790, 'BÀI 18  ·  Thể từ điển & Khả năng  (14 từ)', 65),
  (791, 'BÀI 1  ·  Chào hỏi & Giới thiệu bản thân  (14 từ)', 16),
  (792, 'BÀI 9  ·  Thích / Giỏi / Có & Lý do から  (14 từ)', 40),
  (793, 'BÀI 8  ·  Tính từ  (14 từ)', 37),
  (794, 'BÀI 2  ·  これ・それ・あれ — Chỉ đồ vật  (14 từ)', 18),
  (795, 'BÀI 2  ·  これ・それ・あれ — Chỉ đồ vật  (14 từ)', 18),
  (796, 'BÀI 7  ·  Cho & Nhận, Công cụ で  (14 từ)', 34),
  (797, 'BÀI 2  ·  これ・それ・あれ — Chỉ đồ vật  (14 từ)', 18),
  (798, 'BÀI 2  ·  これ・それ・あれ — Chỉ đồ vật  (14 từ)', 18),
  (799, 'BÀI 2  ·  これ・それ・あれ — Chỉ đồ vật  (14 từ)', 18),
  (800, 'BÀI 9  ·  Thích / Giỏi / Có & Lý do から  (14 từ)', 39),
  (801, 'BÀI 2  ·  これ・それ・あれ — Chỉ đồ vật  (14 từ)', 18),
  (802, 'BÀI 2  ·  これ・それ・あれ — Chỉ đồ vật  (14 từ)', 18),
  (803, 'BÀI 2  ·  これ・それ・あれ — Chỉ đồ vật  (14 từ)', 18),
  (804, 'BÀI 2  ·  これ・それ・あれ — Chỉ đồ vật  (14 từ)', 18),
  (805, 'BÀI 2  ·  これ・それ・あれ — Chỉ đồ vật  (14 từ)', 18),
  (806, 'BÀI 3  ·  ここ・そこ・あそこ — Chỉ nơi chốn  (14 từ)', 20),
  (807, 'BÀI 3  ·  ここ・そこ・あそこ — Chỉ nơi chốn  (14 từ)', 20),
  (808, 'BÀI 3  ·  ここ・そこ・あそこ — Chỉ nơi chốn  (14 từ)', 21),
  (809, 'BÀI 3  ·  ここ・そこ・あそこ — Chỉ nơi chốn  (14 từ)', 21),
  (810, 'BÀI 3  ·  ここ・そこ・あそこ — Chỉ nơi chốn  (14 từ)', 20),
  (811, 'BÀI 3  ·  ここ・そこ・あそこ — Chỉ nơi chốn  (14 từ)', 21),
  (812, 'BÀI 3  ·  ここ・そこ・あそこ — Chỉ nơi chốn  (14 từ)', 19),
  (813, 'BÀI 16  ·  Nối câu bằng thể て  (14 từ)', 60),
  (814, 'BÀI 3  ·  ここ・そこ・あそこ — Chỉ nơi chốn  (14 từ)', 21),
  (815, 'BÀI 4  ·  Giờ giấc & Thì của động từ  (14 từ)', 23),
  (816, 'BÀI 4  ·  Giờ giấc & Thì của động từ  (14 từ)', 23),
  (817, 'BÀI 4  ·  Giờ giấc & Thì của động từ  (14 từ)', 26),
  (818, 'BÀI 4  ·  Giờ giấc & Thì của động từ  (14 từ)', 26),
  (819, 'BÀI 4  ·  Giờ giấc & Thì của động từ  (14 từ)', 24),
  (820, 'BÀI 4  ·  Giờ giấc & Thì của động từ  (14 từ)', 26),
  (821, 'BÀI 4  ·  Giờ giấc & Thì của động từ  (14 từ)', 26),
  (822, 'BÀI 4  ·  Giờ giấc & Thì của động từ  (14 từ)', 26),
  (823, 'BÀI 4  ·  Giờ giấc & Thì của động từ  (14 từ)', 26),
  (824, 'BÀI 4  ·  Giờ giấc & Thì của động từ  (14 từ)', 26),
  (825, 'BÀI 4  ·  Giờ giấc & Thì của động từ  (14 từ)', 26),
  (826, 'BÀI 4  ·  Giờ giấc & Thì của động từ  (14 từ)', 26),
  (827, 'BÀI 4  ·  Giờ giấc & Thì của động từ  (14 từ)', 26),
  (828, 'BÀI 4  ·  Giờ giấc & Thì của động từ  (14 từ)', 26),
  (829, 'BÀI 20  ·  Thể thông thường (普通形)  (14 từ)', 69),
  (830, 'BÀI 4  ·  Giờ giấc & Thì của động từ  (14 từ)', 26),
  (831, 'BÀI 4  ·  Giờ giấc & Thì của động từ  (14 từ)', 26),
  (832, 'BÀI 4  ·  Giờ giấc & Thì của động từ  (14 từ)', 26),
  (833, 'BÀI 4  ·  Giờ giấc & Thì của động từ  (14 từ)', 26),
  (834, 'BÀI 4  ·  Giờ giấc & Thì của động từ  (14 từ)', 26),
  (835, 'BÀI 7  ·  Cho & Nhận, Công cụ で  (14 từ)', 35),
  (836, 'BÀI 4  ·  Giờ giấc & Thì của động từ  (14 từ)', 26),
  (837, 'BÀI 5  ·  Đi lại — Phương tiện & Điểm đến  (14 từ)', 28),
  (838, 'BÀI 5  ·  Đi lại — Phương tiện & Điểm đến  (14 từ)', 29),
  (839, 'BÀI 5  ·  Đi lại — Phương tiện & Điểm đến  (14 từ)', 28),
  (840, 'BÀI 5  ·  Đi lại — Phương tiện & Điểm đến  (14 từ)', 29),
  (841, 'BÀI 5  ·  Đi lại — Phương tiện & Điểm đến  (14 từ)', 28),
  (842, 'BÀI 13  ·  Mong muốn — たい & ほしい  (14 từ)', 53),
  (843, 'BÀI 12  ·  Quá khứ của tính từ & So sánh  (14 từ)', 50),
  (844, 'BÀI 5  ·  Đi lại — Phương tiện & Điểm đến  (14 từ)', 29),
  (845, 'BÀI 22  ·  Mệnh đề bổ nghĩa danh từ  (14 từ)', 74),
  (846, 'BÀI 5  ·  Đi lại — Phương tiện & Điểm đến  (14 từ)', 29),
  (847, 'BÀI 5  ·  Đi lại — Phương tiện & Điểm đến  (14 từ)', 27),
  (848, 'BÀI 2  ·  これ・それ・あれ — Chỉ đồ vật  (14 từ)', 17),
  (849, 'BÀI 5  ·  Đi lại — Phương tiện & Điểm đến  (14 từ)', 29),
  (850, 'BÀI 5  ·  Đi lại — Phương tiện & Điểm đến  (14 từ)', 27),
  (851, 'BÀI 5  ·  Đi lại — Phương tiện & Điểm đến  (14 từ)', 29),
  (852, 'BÀI 5  ·  Đi lại — Phương tiện & Điểm đến  (14 từ)', 29),
  (853, 'BÀI 5  ·  Đi lại — Phương tiện & Điểm đến  (14 từ)', 29),
  (854, 'BÀI 6  ·  Tân ngữ を & Rủ rê  (14 từ)', 32),
  (855, 'BÀI 6  ·  Tân ngữ を & Rủ rê  (14 từ)', 32),
  (856, 'BÀI 6  ·  Tân ngữ を & Rủ rê  (14 từ)', 32),
  (857, 'BÀI 6  ·  Tân ngữ を & Rủ rê  (14 từ)', 32),
  (858, 'BÀI 6  ·  Tân ngữ を & Rủ rê  (14 từ)', 32),
  (859, 'BÀI 11  ·  Số đếm & Lượng từ  (14 từ)', 46),
  (860, 'BÀI 6  ·  Tân ngữ を & Rủ rê  (14 từ)', 32),
  (861, 'BÀI 6  ·  Tân ngữ を & Rủ rê  (14 từ)', 32),
  (862, 'BÀI 6  ·  Tân ngữ を & Rủ rê  (14 từ)', 32),
  (863, 'BÀI 6  ·  Tân ngữ を & Rủ rê  (14 từ)', 32),
  (864, 'BÀI 6  ·  Tân ngữ を & Rủ rê  (14 từ)', 31),
  (865, 'BÀI 23  ·  とき & Điều kiện と  (14 từ)', 75),
  (866, 'BÀI 6  ·  Tân ngữ を & Rủ rê  (14 từ)', 32),
  (867, 'BÀI 6  ·  Tân ngữ を & Rủ rê  (14 từ)', 32),
  (868, 'BÀI 6  ·  Tân ngữ を & Rủ rê  (14 từ)', 32),
  (869, 'BÀI 6  ·  Tân ngữ を & Rủ rê  (14 từ)', 32),
  (870, 'BÀI 6  ·  Tân ngữ を & Rủ rê  (14 từ)', 32),
  (871, 'BÀI 6  ·  Tân ngữ を & Rủ rê  (14 từ)', 32),
  (872, 'BÀI 6  ·  Tân ngữ を & Rủ rê  (14 từ)', 32),
  (873, 'BÀI 6  ·  Tân ngữ を & Rủ rê  (14 từ)', 32),
  (874, 'BÀI 6  ·  Tân ngữ を & Rủ rê  (14 từ)', 30),
  (875, 'BÀI 7  ·  Cho & Nhận, Công cụ で  (14 từ)', 34),
  (876, 'BÀI 7  ·  Cho & Nhận, Công cụ で  (14 từ)', 34),
  (877, 'BÀI 7  ·  Cho & Nhận, Công cụ で  (14 từ)', 35),
  (878, 'BÀI 7  ·  Cho & Nhận, Công cụ で  (14 từ)', 35),
  (879, 'BÀI 9  ·  Thích / Giỏi / Có & Lý do から  (14 từ)', 40),
  (880, 'BÀI 9  ·  Thích / Giỏi / Có & Lý do から  (14 từ)', 40),
  (881, 'BÀI 9  ·  Thích / Giỏi / Có & Lý do から  (14 từ)', 40),
  (882, 'BÀI 9  ·  Thích / Giỏi / Có & Lý do から  (14 từ)', 40),
  (883, 'BÀI 7  ·  Cho & Nhận, Công cụ で  (14 từ)', 35),
  (884, 'BÀI 7  ·  Cho & Nhận, Công cụ で  (14 từ)', 35),
  (885, 'BÀI 7  ·  Cho & Nhận, Công cụ で  (14 từ)', 35),
  (886, 'BÀI 7  ·  Cho & Nhận, Công cụ で  (14 từ)', 35),
  (887, 'BÀI 7  ·  Cho & Nhận, Công cụ で  (14 từ)', 35),
  (888, 'BÀI 7  ·  Cho & Nhận, Công cụ で  (14 từ)', 35),
  (889, 'BÀI 7  ·  Cho & Nhận, Công cụ で  (14 từ)', 35),
  (890, 'BÀI 7  ·  Cho & Nhận, Công cụ で  (14 từ)', 35),
  (891, 'BÀI 7  ·  Cho & Nhận, Công cụ で  (14 từ)', 35),
  (892, 'BÀI 7  ·  Cho & Nhận, Công cụ で  (14 từ)', 35),
  (893, 'BÀI 7  ·  Cho & Nhận, Công cụ で  (14 từ)', 35),
  (894, 'BÀI 7  ·  Cho & Nhận, Công cụ で  (14 từ)', 35),
  (895, 'BÀI 7  ·  Cho & Nhận, Công cụ で  (14 từ)', 35),
  (896, 'BÀI 7  ·  Cho & Nhận, Công cụ で  (14 từ)', 35),
  (897, 'BÀI 8  ·  Tính từ  (14 từ)', 36),
  (898, 'BÀI 8  ·  Tính từ  (14 từ)', 38),
  (899, 'BÀI 8  ·  Tính từ  (14 từ)', 36),
  (900, 'BÀI 21  ·  Ý kiến — と 思います / と 言います  (14 từ)', 72),
  (901, 'BÀI 8  ·  Tính từ  (14 từ)', 38),
  (902, 'BÀI 8  ·  Tính từ  (14 từ)', 38),
  (903, 'BÀI 8  ·  Tính từ  (14 từ)', 38),
  (904, 'BÀI 8  ·  Tính từ  (14 từ)', 38),
  (905, 'BÀI 8  ·  Tính từ  (14 từ)', 38),
  (906, 'BÀI 2  ·  これ・それ・あれ — Chỉ đồ vật  (14 từ)', 18),
  (907, 'BÀI 9  ·  Thích / Giỏi / Có & Lý do から  (14 từ)', 40),
  (908, 'BÀI 9  ·  Thích / Giỏi / Có & Lý do から  (14 từ)', 40),
  (909, 'BÀI 9  ·  Thích / Giỏi / Có & Lý do から  (14 từ)', 41),
  (910, 'BÀI 9  ·  Thích / Giỏi / Có & Lý do から  (14 từ)', 41),
  (911, 'BÀI 9  ·  Thích / Giỏi / Có & Lý do から  (14 từ)', 41),
  (912, 'BÀI 9  ·  Thích / Giỏi / Có & Lý do から  (14 từ)', 41),
  (913, 'BÀI 9  ·  Thích / Giỏi / Có & Lý do から  (14 từ)', 41),
  (914, 'BÀI 21  ·  Ý kiến — と 思います / と 言います  (14 từ)', 72),
  (915, 'BÀI 10  ·  Tồn tại — あります / います & Vị trí  (14 từ)', 45),
  (916, 'BÀI 22  ·  Mệnh đề bổ nghĩa danh từ  (14 từ)', 74),
  (917, 'BÀI 10  ·  Tồn tại — あります / います & Vị trí  (14 từ)', 45),
  (918, 'BÀI 10  ·  Tồn tại — あります / います & Vị trí  (14 từ)', 45),
  (919, 'BÀI 10  ·  Tồn tại — あります / います & Vị trí  (14 từ)', 45),
  (920, 'BÀI 14  ·  Thể て & Yêu cầu  (14 từ)', 55),
  (921, 'BÀI 10  ·  Tồn tại — あります / います & Vị trí  (14 từ)', 45),
  (922, 'BÀI 11  ·  Số đếm & Lượng từ  (14 từ)', 48),
  (923, 'BÀI 11  ·  Số đếm & Lượng từ  (14 từ)', 48),
  (924, 'BÀI 11  ·  Số đếm & Lượng từ  (14 từ)', 48),
  (925, 'BÀI 11  ·  Số đếm & Lượng từ  (14 từ)', 48),
  (926, 'BÀI 11  ·  Số đếm & Lượng từ  (14 từ)', 48),
  (927, 'BÀI 11  ·  Số đếm & Lượng từ  (14 từ)', 48),
  (928, 'BÀI 11  ·  Số đếm & Lượng từ  (14 từ)', 48),
  (929, 'BÀI 11  ·  Số đếm & Lượng từ  (14 từ)', 48),
  (930, 'BÀI 11  ·  Số đếm & Lượng từ  (14 từ)', 48),
  (931, 'BÀI 11  ·  Số đếm & Lượng từ  (14 từ)', 46),
  (932, 'BÀI 11  ·  Số đếm & Lượng từ  (14 từ)', 48),
  (933, 'BÀI 11  ·  Số đếm & Lượng từ  (14 từ)', 48),
  (934, 'BÀI 11  ·  Số đếm & Lượng từ  (14 từ)', 46),
  (935, 'BÀI 11  ·  Số đếm & Lượng từ  (14 từ)', 48),
  (936, 'BÀI 11  ·  Số đếm & Lượng từ  (14 từ)', 48),
  (937, 'BÀI 11  ·  Số đếm & Lượng từ  (14 từ)', 48),
  (938, 'BÀI 11  ·  Số đếm & Lượng từ  (14 từ)', 47),
  (939, 'BÀI 12  ·  Quá khứ của tính từ & So sánh  (14 từ)', 51),
  (940, 'BÀI 12  ·  Quá khứ của tính từ & So sánh  (14 từ)', 51),
  (941, 'BÀI 12  ·  Quá khứ của tính từ & So sánh  (14 từ)', 51),
  (942, 'BÀI 12  ·  Quá khứ của tính từ & So sánh  (14 từ)', 51),
  (943, 'BÀI 12  ·  Quá khứ của tính từ & So sánh  (14 từ)', 51),
  (944, 'BÀI 12  ·  Quá khứ của tính từ & So sánh  (14 từ)', 51),
  (945, 'BÀI 12  ·  Quá khứ của tính từ & So sánh  (14 từ)', 51),
  (946, 'BÀI 12  ·  Quá khứ của tính từ & So sánh  (14 từ)', 51),
  (947, 'BÀI 12  ·  Quá khứ của tính từ & So sánh  (14 từ)', 51),
  (948, 'BÀI 12  ·  Quá khứ của tính từ & So sánh  (14 từ)', 51),
  (949, 'BÀI 8  ·  Tính từ  (14 từ)', 37),
  (950, 'BÀI 13  ·  Mong muốn — たい & ほしい  (14 từ)', 53),
  (951, 'BÀI 12  ·  Quá khứ của tính từ & So sánh  (14 từ)', 51),
  (952, 'BÀI 12  ·  Quá khứ của tính từ & So sánh  (14 từ)', 51),
  (953, 'BÀI 12  ·  Quá khứ của tính từ & So sánh  (14 từ)', 51),
  (954, 'BÀI 12  ·  Quá khứ của tính từ & So sánh  (14 từ)', 51),
  (955, 'BÀI 12  ·  Quá khứ của tính từ & So sánh  (14 từ)', 51),
  (956, 'BÀI 10  ·  Tồn tại — あります / います & Vị trí  (14 từ)', 43),
  (957, 'BÀI 12  ·  Quá khứ của tính từ & So sánh  (14 từ)', 49),
  (958, 'BÀI 12  ·  Quá khứ của tính từ & So sánh  (14 từ)', 51),
  (959, 'BÀI 12  ·  Quá khứ của tính từ & So sánh  (14 từ)', 51),
  (960, 'BÀI 12  ·  Quá khứ của tính từ & So sánh  (14 từ)', 51),
  (961, 'BÀI 12  ·  Quá khứ của tính từ & So sánh  (14 từ)', 51),
  (962, 'BÀI 6  ·  Tân ngữ を & Rủ rê  (14 từ)', 31),
  (963, 'BÀI 10  ·  Tồn tại — あります / います & Vị trí  (14 từ)', 44),
  (964, 'BÀI 5  ·  Đi lại — Phương tiện & Điểm đến  (14 từ)', 27),
  (965, 'BÀI 13  ·  Mong muốn — たい & ほしい  (14 từ)', 54),
  (966, 'BÀI 13  ·  Mong muốn — たい & ほしい  (14 từ)', 54),
  (967, 'BÀI 13  ·  Mong muốn — たい & ほしい  (14 từ)', 54),
  (968, 'BÀI 17  ·  Thể ない — Cấm, Bắt buộc, Không cần  (14 từ)', 63),
  (969, 'BÀI 13  ·  Mong muốn — たい & ほしい  (14 từ)', 54),
  (970, 'BÀI 13  ·  Mong muốn — たい & ほしい  (14 từ)', 54),
  (971, 'BÀI 13  ·  Mong muốn — たい & ほしい  (14 từ)', 54),
  (972, 'BÀI 20  ·  Thể thông thường (普通形)  (14 từ)', 69),
  (973, 'BÀI 13  ·  Mong muốn — たい & ほしい  (14 từ)', 54),
  (974, 'BÀI 13  ·  Mong muốn — たい & ほしい  (14 từ)', 54),
  (975, 'BÀI 13  ·  Mong muốn — たい & ほしい  (14 từ)', 54),
  (976, 'BÀI 13  ·  Mong muốn — たい & ほしい  (14 từ)', 54),
  (977, 'BÀI 14  ·  Thể て & Yêu cầu  (14 từ)', 55),
  (978, 'BÀI 14  ·  Thể て & Yêu cầu  (14 từ)', 56),
  (979, 'BÀI 14  ·  Thể て & Yêu cầu  (14 từ)', 56),
  (980, 'BÀI 14  ·  Thể て & Yêu cầu  (14 từ)', 56),
  (981, 'BÀI 14  ·  Thể て & Yêu cầu  (14 từ)', 56),
  (982, 'BÀI 16  ·  Nối câu bằng thể て  (14 từ)', 59),
  (983, 'BÀI 14  ·  Thể て & Yêu cầu  (14 từ)', 56),
  (984, 'BÀI 14  ·  Thể て & Yêu cầu  (14 từ)', 56),
  (985, 'BÀI 14  ·  Thể て & Yêu cầu  (14 từ)', 56),
  (986, 'BÀI 14  ·  Thể て & Yêu cầu  (14 từ)', 56),
  (987, 'BÀI 14  ·  Thể て & Yêu cầu  (14 từ)', 56),
  (988, 'BÀI 16  ·  Nối câu bằng thể て  (14 từ)', 59),
  (989, 'BÀI 16  ·  Nối câu bằng thể て  (14 từ)', 59),
  (990, 'BÀI 16  ·  Nối câu bằng thể て  (14 từ)', 60),
  (991, 'BÀI 16  ·  Nối câu bằng thể て  (14 từ)', 60),
  (992, 'BÀI 16  ·  Nối câu bằng thể て  (14 từ)', 60),
  (993, 'BÀI 16  ·  Nối câu bằng thể て  (14 từ)', 61),
  (994, 'BÀI 16  ·  Nối câu bằng thể て  (14 từ)', 61),
  (995, 'BÀI 16  ·  Nối câu bằng thể て  (14 từ)', 61),
  (996, 'BÀI 16  ·  Nối câu bằng thể て  (14 từ)', 60),
  (997, 'BÀI 16  ·  Nối câu bằng thể て  (14 từ)', 61),
  (998, 'BÀI 16  ·  Nối câu bằng thể て  (14 từ)', 60),
  (999, 'BÀI 16  ·  Nối câu bằng thể て  (14 từ)', 59),
  (1000, 'BÀI 16  ·  Nối câu bằng thể て  (14 từ)', 61),
  (1001, 'BÀI 16  ·  Nối câu bằng thể て  (14 từ)', 61),
  (1002, 'BÀI 16  ·  Nối câu bằng thể て  (14 từ)', 61),
  (1003, 'BÀI 16  ·  Nối câu bằng thể て  (14 từ)', 61),
  (1004, 'BÀI 19  ·  Thể た — Kinh nghiệm & Liệt kê  (14 từ)', 67),
  (1005, 'BÀI 16  ·  Nối câu bằng thể て  (14 từ)', 61),
  (1006, 'BÀI 16  ·  Nối câu bằng thể て  (14 từ)', 61),
  (1007, 'BÀI 16  ·  Nối câu bằng thể て  (14 từ)', 61),
  (1008, 'BÀI 16  ·  Nối câu bằng thể て  (14 từ)', 61),
  (1009, 'BÀI 16  ·  Nối câu bằng thể て  (14 từ)', 59),
  (1010, 'BÀI 16  ·  Nối câu bằng thể て  (14 từ)', 61),
  (1011, 'BÀI 21  ·  Ý kiến — と 思います / と 言います  (14 từ)', 72),
  (1012, 'BÀI 12  ·  Quá khứ của tính từ & So sánh  (14 từ)', 50),
  (1013, 'BÀI 23  ·  とき & Điều kiện と  (14 từ)', 75),
  (1014, 'BÀI 16  ·  Nối câu bằng thể て  (14 từ)', 61),
  (1015, 'BÀI 8  ·  Tính từ  (14 từ)', 38),
  (1016, 'BÀI 15  ·  Cho phép & Cấm đoán  (14 từ)', 57),
  (1017, 'BÀI 17  ·  Thể ない — Cấm, Bắt buộc, Không cần  (14 từ)', 64),
  (1018, 'BÀI 17  ·  Thể ない — Cấm, Bắt buộc, Không cần  (14 từ)', 64),
  (1019, 'BÀI 17  ·  Thể ない — Cấm, Bắt buộc, Không cần  (14 từ)', 64),
  (1020, 'BÀI 17  ·  Thể ない — Cấm, Bắt buộc, Không cần  (14 từ)', 64),
  (1021, 'BÀI 17  ·  Thể ない — Cấm, Bắt buộc, Không cần  (14 từ)', 64),
  (1022, 'BÀI 17  ·  Thể ない — Cấm, Bắt buộc, Không cần  (14 từ)', 64),
  (1023, 'BÀI 17  ·  Thể ない — Cấm, Bắt buộc, Không cần  (14 từ)', 64),
  (1024, 'BÀI 17  ·  Thể ない — Cấm, Bắt buộc, Không cần  (14 từ)', 64),
  (1025, 'BÀI 17  ·  Thể ない — Cấm, Bắt buộc, Không cần  (14 từ)', 64),
  (1026, 'BÀI 19  ·  Thể た — Kinh nghiệm & Liệt kê  (14 từ)', 68),
  (1027, 'BÀI 17  ·  Thể ない — Cấm, Bắt buộc, Không cần  (14 từ)', 64),
  (1028, 'BÀI 17  ·  Thể ない — Cấm, Bắt buộc, Không cần  (14 từ)', 64),
  (1029, 'BÀI 18  ·  Thể từ điển & Khả năng  (14 từ)', 66),
  (1030, 'BÀI 18  ·  Thể từ điển & Khả năng  (14 từ)', 66),
  (1031, 'BÀI 4  ·  Giờ giấc & Thì của động từ  (14 từ)', 24),
  (1032, 'BÀI 14  ·  Thể て & Yêu cầu  (14 từ)', 56),
  (1033, 'BÀI 21  ·  Ý kiến — と 思います / と 言います  (14 từ)', 72),
  (1034, 'BÀI 24  ·  Cho & Nhận nâng cao — てあげる / てもらう / てくれる  (14 từ)', 77),
  (1035, 'BÀI 18  ·  Thể từ điển & Khả năng  (14 từ)', 66),
  (1036, 'BÀI 19  ·  Thể た — Kinh nghiệm & Liệt kê  (14 từ)', 68),
  (1037, 'BÀI 19  ·  Thể た — Kinh nghiệm & Liệt kê  (14 từ)', 68),
  (1038, 'BÀI 19  ·  Thể た — Kinh nghiệm & Liệt kê  (14 từ)', 68),
  (1039, 'BÀI 19  ·  Thể た — Kinh nghiệm & Liệt kê  (14 từ)', 68),
  (1040, 'BÀI 19  ·  Thể た — Kinh nghiệm & Liệt kê  (14 từ)', 68),
  (1041, 'BÀI 19  ·  Thể た — Kinh nghiệm & Liệt kê  (14 từ)', 68),
  (1042, 'BÀI 19  ·  Thể た — Kinh nghiệm & Liệt kê  (14 từ)', 68),
  (1043, 'BÀI 6  ·  Tân ngữ を & Rủ rê  (14 từ)', 32),
  (1044, 'BÀI 19  ·  Thể た — Kinh nghiệm & Liệt kê  (14 từ)', 68),
  (1045, 'BÀI 19  ·  Thể た — Kinh nghiệm & Liệt kê  (14 từ)', 68),
  (1046, 'BÀI 19  ·  Thể た — Kinh nghiệm & Liệt kê  (14 từ)', 68),
  (1047, 'BÀI 20  ·  Thể thông thường (普通形)  (14 từ)', 70),
  (1048, 'BÀI 20  ·  Thể thông thường (普通形)  (14 từ)', 70),
  (1049, 'BÀI 20  ·  Thể thông thường (普通形)  (14 từ)', 70),
  (1050, 'BÀI 20  ·  Thể thông thường (普通形)  (14 từ)', 70),
  (1051, 'BÀI 20  ·  Thể thông thường (普通形)  (14 từ)', 70),
  (1052, 'BÀI 20  ·  Thể thông thường (普通形)  (14 từ)', 70),
  (1053, 'BÀI 20  ·  Thể thông thường (普通形)  (14 từ)', 70),
  (1054, 'BÀI 20  ·  Thể thông thường (普通形)  (14 từ)', 70),
  (1055, 'BÀI 20  ·  Thể thông thường (普通形)  (14 từ)', 70),
  (1056, 'BÀI 21  ·  Ý kiến — と 思います / と 言います  (14 từ)', 73),
  (1057, 'BÀI 21  ·  Ý kiến — と 思います / と 言います  (14 từ)', 73),
  (1058, 'BÀI 21  ·  Ý kiến — と 思います / と 言います  (14 từ)', 73),
  (1059, 'BÀI 21  ·  Ý kiến — と 思います / と 言います  (14 từ)', 73),
  (1060, 'BÀI 21  ·  Ý kiến — と 思います / と 言います  (14 từ)', 73),
  (1061, 'BÀI 23  ·  とき & Điều kiện と  (14 từ)', 75),
  (1062, 'BÀI 21  ·  Ý kiến — と 思います / と 言います  (14 từ)', 73),
  (1063, 'BÀI 21  ·  Ý kiến — と 思います / と 言います  (14 từ)', 73),
  (1064, 'BÀI 21  ·  Ý kiến — と 思います / と 言います  (14 từ)', 73),
  (1065, 'BÀI 21  ·  Ý kiến — と 思います / と 言います  (14 từ)', 73),
  (1066, 'BÀI 21  ·  Ý kiến — と 思います / と 言います  (14 từ)', 73),
  (1067, 'BÀI 21  ·  Ý kiến — と 思います / と 言います  (14 từ)', 73),
  (1068, 'BÀI 21  ·  Ý kiến — と 思います / と 言います  (14 từ)', 73),
  (1069, 'BÀI 21  ·  Ý kiến — と 思います / と 言います  (14 từ)', 73),
  (1070, 'BÀI 21  ·  Ý kiến — と 思います / と 言います  (14 từ)', 73),
  (1071, 'BÀI 21  ·  Ý kiến — と 思います / と 言います  (14 từ)', 73),
  (1072, 'BÀI 21  ·  Ý kiến — と 思います / と 言います  (14 từ)', 73),
  (1073, 'BÀI 21  ·  Ý kiến — と 思います / と 言います  (14 từ)', 72),
  (1074, 'BÀI 21  ·  Ý kiến — と 思います / と 言います  (14 từ)', 73),
  (1075, 'BÀI 23  ·  とき & Điều kiện と  (14 từ)', 76),
  (1076, 'BÀI 23  ·  とき & Điều kiện と  (14 từ)', 76),
  (1077, 'BÀI 23  ·  とき & Điều kiện と  (14 từ)', 76),
  (1078, 'BÀI 23  ·  とき & Điều kiện と  (14 từ)', 76),
  (1079, 'BÀI 10  ·  Tồn tại — あります / います & Vị trí  (14 từ)', 44),
  (1080, 'BÀI 10  ·  Tồn tại — あります / います & Vị trí  (14 từ)', 44),
  (1081, 'BÀI 23  ·  とき & Điều kiện と  (14 từ)', 76),
  (1082, 'BÀI 23  ·  とき & Điều kiện と  (14 từ)', 76),
  (1083, 'BÀI 23  ·  とき & Điều kiện と  (14 từ)', 76),
  (1084, 'BÀI 23  ·  とき & Điều kiện と  (14 từ)', 76),
  (1085, 'BÀI 23  ·  とき & Điều kiện と  (14 từ)', 76),
  (1086, 'BÀI 23  ·  とき & Điều kiện と  (14 từ)', 76),
  (1087, 'BÀI 23  ·  とき & Điều kiện と  (14 từ)', 76),
  (1088, 'BÀI 23  ·  とき & Điều kiện と  (14 từ)', 76),
  (1089, 'BÀI 23  ·  とき & Điều kiện と  (14 từ)', 75),
  (1090, 'BÀI 23  ·  とき & Điều kiện と  (14 từ)', 76),
  (1091, 'BÀI 24  ·  Cho & Nhận nâng cao — てあげる / てもらう / てくれる  (14 từ)', 78),
  (1092, 'BÀI 24  ·  Cho & Nhận nâng cao — てあげる / てもらう / てくれる  (14 từ)', 78),
  (1093, 'BÀI 24  ·  Cho & Nhận nâng cao — てあげる / てもらう / てくれる  (14 từ)', 78),
  (1094, 'BÀI 24  ·  Cho & Nhận nâng cao — てあげる / てもらう / てくれる  (14 từ)', 78),
  (1095, 'BÀI 25  ·  Giả định — たら & ても  (14 từ)', 80),
  (1096, 'BÀI 25  ·  Giả định — たら & ても  (14 từ)', 80),
  (1097, 'BÀI 1  ·  Chào hỏi & Giới thiệu bản thân  (14 từ)', 14),
  (1098, 'BÀI 1  ·  Chào hỏi & Giới thiệu bản thân  (14 từ)', 14),
  (1099, 'BÀI 1  ·  Chào hỏi & Giới thiệu bản thân  (14 từ)', 14),
  (1100, 'BÀI 1  ·  Chào hỏi & Giới thiệu bản thân  (14 từ)', 14),
  (1101, 'BÀI 1  ·  Chào hỏi & Giới thiệu bản thân  (14 từ)', 14),
  (1102, 'BÀI 1  ·  Chào hỏi & Giới thiệu bản thân  (14 từ)', 14),
  (1103, 'BÀI 1  ·  Chào hỏi & Giới thiệu bản thân  (14 từ)', 15),
  (1104, 'BÀI 1  ·  Chào hỏi & Giới thiệu bản thân  (14 từ)', 15),
  (1105, 'BÀI 1  ·  Chào hỏi & Giới thiệu bản thân  (14 từ)', 15),
  (1106, 'BÀI 1  ·  Chào hỏi & Giới thiệu bản thân  (14 từ)', 16),
  (1107, 'BÀI 1  ·  Chào hỏi & Giới thiệu bản thân  (14 từ)', 15),
  (1108, 'BÀI 1  ·  Chào hỏi & Giới thiệu bản thân  (14 từ)', 15),
  (1109, 'BÀI 1  ·  Chào hỏi & Giới thiệu bản thân  (14 từ)', 15),
  (1110, 'BÀI 1  ·  Chào hỏi & Giới thiệu bản thân  (14 từ)', 15),
  (1111, 'BÀI 1  ·  Chào hỏi & Giới thiệu bản thân  (14 từ)', 15),
  (1112, 'BÀI 1  ·  Chào hỏi & Giới thiệu bản thân  (14 từ)', 15),
  (1113, 'BÀI 1  ·  Chào hỏi & Giới thiệu bản thân  (14 từ)', 16),
  (1114, 'BÀI 1  ·  Chào hỏi & Giới thiệu bản thân  (14 từ)', 15),
  (1115, 'BÀI 1  ·  Chào hỏi & Giới thiệu bản thân  (14 từ)', 16),
  (1116, 'BÀI 1  ·  Chào hỏi & Giới thiệu bản thân  (14 từ)', 15),
  (1117, 'BÀI 1  ·  Chào hỏi & Giới thiệu bản thân  (14 từ)', 16),
  (1118, 'BÀI 1  ·  Chào hỏi & Giới thiệu bản thân  (14 từ)', 15),
  (1119, 'BÀI 1  ·  Chào hỏi & Giới thiệu bản thân  (14 từ)', 16),
  (1120, 'BÀI 2  ·  これ・それ・あれ — Chỉ đồ vật  (14 từ)', 17),
  (1121, 'BÀI 2  ·  これ・それ・あれ — Chỉ đồ vật  (14 từ)', 17),
  (1122, 'BÀI 2  ·  これ・それ・あれ — Chỉ đồ vật  (14 từ)', 17),
  (1123, 'BÀI 2  ·  これ・それ・あれ — Chỉ đồ vật  (14 từ)', 17),
  (1124, 'BÀI 2  ·  これ・それ・あれ — Chỉ đồ vật  (14 từ)', 18),
  (1125, 'BÀI 2  ·  これ・それ・あれ — Chỉ đồ vật  (14 từ)', 18),
  (1126, 'BÀI 2  ·  これ・それ・あれ — Chỉ đồ vật  (14 từ)', 18),
  (1127, 'BÀI 2  ·  これ・それ・あれ — Chỉ đồ vật  (14 từ)', 18),
  (1128, 'BÀI 2  ·  これ・それ・あれ — Chỉ đồ vật  (14 từ)', 18),
  (1129, 'BÀI 3  ·  ここ・そこ・あそこ — Chỉ nơi chốn  (14 từ)', 19),
  (1130, 'BÀI 3  ·  ここ・そこ・あそこ — Chỉ nơi chốn  (14 từ)', 19),
  (1131, 'BÀI 3  ·  ここ・そこ・あそこ — Chỉ nơi chốn  (14 từ)', 19),
  (1132, 'BÀI 3  ·  ここ・そこ・あそこ — Chỉ nơi chốn  (14 từ)', 20),
  (1133, 'BÀI 3  ·  ここ・そこ・あそこ — Chỉ nơi chốn  (14 từ)', 20),
  (1134, 'BÀI 3  ·  ここ・そこ・あそこ — Chỉ nơi chốn  (14 từ)', 20),
  (1135, 'BÀI 3  ·  ここ・そこ・あそこ — Chỉ nơi chốn  (14 từ)', 21),
  (1136, 'BÀI 3  ·  ここ・そこ・あそこ — Chỉ nơi chốn  (14 từ)', 21),
  (1137, 'BÀI 3  ·  ここ・そこ・あそこ — Chỉ nơi chốn  (14 từ)', 21),
  (1138, 'BÀI 3  ·  ここ・そこ・あそこ — Chỉ nơi chốn  (14 từ)', 21),
  (1139, 'BÀI 4  ·  Giờ giấc & Thì của động từ  (14 từ)', 24),
  (1140, 'BÀI 4  ·  Giờ giấc & Thì của động từ  (14 từ)', 24),
  (1141, 'BÀI 4  ·  Giờ giấc & Thì của động từ  (14 từ)', 24),
  (1142, 'BÀI 4  ·  Giờ giấc & Thì của động từ  (14 từ)', 25),
  (1143, 'BÀI 4  ·  Giờ giấc & Thì của động từ  (14 từ)', 25),
  (1144, 'BÀI 4  ·  Giờ giấc & Thì của động từ  (14 từ)', 25),
  (1145, 'BÀI 5  ·  Đi lại — Phương tiện & Điểm đến  (14 từ)', 28),
  (1146, 'BÀI 5  ·  Đi lại — Phương tiện & Điểm đến  (14 từ)', 28),
  (1147, 'BÀI 5  ·  Đi lại — Phương tiện & Điểm đến  (14 từ)', 29),
  (1148, 'BÀI 5  ·  Đi lại — Phương tiện & Điểm đến  (14 từ)', 29),
  (1149, 'BÀI 5  ·  Đi lại — Phương tiện & Điểm đến  (14 từ)', 29),
  (1150, 'BÀI 5  ·  Đi lại — Phương tiện & Điểm đến  (14 từ)', 29),
  (1151, 'BÀI 5  ·  Đi lại — Phương tiện & Điểm đến  (14 từ)', 29),
  (1152, 'BÀI 6  ·  Tân ngữ を & Rủ rê  (14 từ)', 31),
  (1153, 'BÀI 6  ·  Tân ngữ を & Rủ rê  (14 từ)', 31),
  (1154, 'BÀI 6  ·  Tân ngữ を & Rủ rê  (14 từ)', 31),
  (1155, 'BÀI 6  ·  Tân ngữ を & Rủ rê  (14 từ)', 31),
  (1156, 'BÀI 6  ·  Tân ngữ を & Rủ rê  (14 từ)', 31),
  (1157, 'BÀI 6  ·  Tân ngữ を & Rủ rê  (14 từ)', 31),
  (1158, 'BÀI 6  ·  Tân ngữ を & Rủ rê  (14 từ)', 31),
  (1159, 'BÀI 6  ·  Tân ngữ を & Rủ rê  (14 từ)', 32),
  (1160, 'BÀI 6  ·  Tân ngữ を & Rủ rê  (14 từ)', 32),
  (1161, 'BÀI 6  ·  Tân ngữ を & Rủ rê  (14 từ)', 32),
  (1162, 'BÀI 7  ·  Cho & Nhận, Công cụ で  (14 từ)', 34),
  (1163, 'BÀI 7  ·  Cho & Nhận, Công cụ で  (14 từ)', 34),
  (1164, 'BÀI 7  ·  Cho & Nhận, Công cụ で  (14 từ)', 34),
  (1165, 'BÀI 7  ·  Cho & Nhận, Công cụ で  (14 từ)', 34),
  (1166, 'BÀI 7  ·  Cho & Nhận, Công cụ で  (14 từ)', 34),
  (1167, 'BÀI 7  ·  Cho & Nhận, Công cụ で  (14 từ)', 34),
  (1168, 'BÀI 7  ·  Cho & Nhận, Công cụ で  (14 từ)', 34),
  (1169, 'BÀI 7  ·  Cho & Nhận, Công cụ で  (14 từ)', 34),
  (1170, 'BÀI 7  ·  Cho & Nhận, Công cụ で  (14 từ)', 35),
  (1171, 'BÀI 7  ·  Cho & Nhận, Công cụ で  (14 từ)', 35),
  (1172, 'BÀI 7  ·  Cho & Nhận, Công cụ で  (14 từ)', 35),
  (1173, 'BÀI 7  ·  Cho & Nhận, Công cụ で  (14 từ)', 35),
  (1174, 'BÀI 7  ·  Cho & Nhận, Công cụ で  (14 từ)', 35),
  (1175, 'BÀI 8  ·  Tính từ  (14 từ)', 36),
  (1176, 'BÀI 8  ·  Tính từ  (14 từ)', 36),
  (1177, 'BÀI 8  ·  Tính từ  (14 từ)', 36),
  (1178, 'BÀI 8  ·  Tính từ  (14 từ)', 37),
  (1179, 'BÀI 8  ·  Tính từ  (14 từ)', 37),
  (1180, 'BÀI 8  ·  Tính từ  (14 từ)', 37),
  (1181, 'BÀI 8  ·  Tính từ  (14 từ)', 38),
  (1182, 'BÀI 8  ·  Tính từ  (14 từ)', 38),
  (1183, 'BÀI 8  ·  Tính từ  (14 từ)', 38),
  (1184, 'BÀI 8  ·  Tính từ  (14 từ)', 38),
  (1185, 'BÀI 9  ·  Thích / Giỏi / Có & Lý do から  (14 từ)', 39),
  (1186, 'BÀI 9  ·  Thích / Giỏi / Có & Lý do から  (14 từ)', 39),
  (1187, 'BÀI 9  ·  Thích / Giỏi / Có & Lý do から  (14 từ)', 39),
  (1188, 'BÀI 9  ·  Thích / Giỏi / Có & Lý do から  (14 từ)', 39),
  (1189, 'BÀI 9  ·  Thích / Giỏi / Có & Lý do から  (14 từ)', 39),
  (1190, 'BÀI 9  ·  Thích / Giỏi / Có & Lý do から  (14 từ)', 39),
  (1191, 'BÀI 9  ·  Thích / Giỏi / Có & Lý do から  (14 từ)', 39),
  (1192, 'BÀI 9  ·  Thích / Giỏi / Có & Lý do から  (14 từ)', 40),
  (1193, 'BÀI 9  ·  Thích / Giỏi / Có & Lý do から  (14 từ)', 40),
  (1194, 'BÀI 9  ·  Thích / Giỏi / Có & Lý do から  (14 từ)', 40),
  (1195, 'BÀI 9  ·  Thích / Giỏi / Có & Lý do から  (14 từ)', 40),
  (1196, 'BÀI 9  ·  Thích / Giỏi / Có & Lý do から  (14 từ)', 40),
  (1197, 'BÀI 9  ·  Thích / Giỏi / Có & Lý do から  (14 từ)', 41),
  (1198, 'BÀI 9  ·  Thích / Giỏi / Có & Lý do から  (14 từ)', 41),
  (1199, 'BÀI 10  ·  Tồn tại — あります / います & Vị trí  (14 từ)', 43),
  (1200, 'BÀI 10  ·  Tồn tại — あります / います & Vị trí  (14 từ)', 43),
  (1201, 'BÀI 10  ·  Tồn tại — あります / います & Vị trí  (14 từ)', 43),
  (1202, 'BÀI 10  ·  Tồn tại — あります / います & Vị trí  (14 từ)', 43),
  (1203, 'BÀI 10  ·  Tồn tại — あります / います & Vị trí  (14 từ)', 43),
  (1204, 'BÀI 10  ·  Tồn tại — あります / います & Vị trí  (14 từ)', 43),
  (1205, 'BÀI 10  ·  Tồn tại — あります / います & Vị trí  (14 từ)', 43),
  (1206, 'BÀI 10  ·  Tồn tại — あります / います & Vị trí  (14 từ)', 44),
  (1207, 'BÀI 10  ·  Tồn tại — あります / います & Vị trí  (14 từ)', 44),
  (1208, 'BÀI 11  ·  Số đếm & Lượng từ  (14 từ)', 46),
  (1209, 'BÀI 11  ·  Số đếm & Lượng từ  (14 từ)', 46),
  (1210, 'BÀI 11  ·  Số đếm & Lượng từ  (14 từ)', 47),
  (1211, 'BÀI 11  ·  Số đếm & Lượng từ  (14 từ)', 47),
  (1212, 'BÀI 11  ·  Số đếm & Lượng từ  (14 từ)', 47),
  (1213, 'BÀI 11  ·  Số đếm & Lượng từ  (14 từ)', 47),
  (1214, 'BÀI 11  ·  Số đếm & Lượng từ  (14 từ)', 47),
  (1215, 'BÀI 11  ·  Số đếm & Lượng từ  (14 từ)', 47),
  (1216, 'BÀI 11  ·  Số đếm & Lượng từ  (14 từ)', 47),
  (1217, 'BÀI 11  ·  Số đếm & Lượng từ  (14 từ)', 47),
  (1218, 'BÀI 11  ·  Số đếm & Lượng từ  (14 từ)', 47),
  (1219, 'BÀI 11  ·  Số đếm & Lượng từ  (14 từ)', 47),
  (1220, 'BÀI 11  ·  Số đếm & Lượng từ  (14 từ)', 47),
  (1221, 'BÀI 12  ·  Quá khứ của tính từ & So sánh  (14 từ)', 50),
  (1222, 'BÀI 12  ·  Quá khứ của tính từ & So sánh  (14 từ)', 50),
  (1223, 'BÀI 12  ·  Quá khứ của tính từ & So sánh  (14 từ)', 50),
  (1224, 'BÀI 12  ·  Quá khứ của tính từ & So sánh  (14 từ)', 50),
  (1225, 'BÀI 12  ·  Quá khứ của tính từ & So sánh  (14 từ)', 50),
  (1226, 'BÀI 12  ·  Quá khứ của tính từ & So sánh  (14 từ)', 50),
  (1227, 'BÀI 12  ·  Quá khứ của tính từ & So sánh  (14 từ)', 50),
  (1228, 'BÀI 12  ·  Quá khứ của tính từ & So sánh  (14 từ)', 50),
  (1229, 'BÀI 12  ·  Quá khứ của tính từ & So sánh  (14 từ)', 50),
  (1230, 'BÀI 12  ·  Quá khứ của tính từ & So sánh  (14 từ)', 50),
  (1231, 'BÀI 12  ·  Quá khứ của tính từ & So sánh  (14 từ)', 50),
  (1232, 'BÀI 12  ·  Quá khứ của tính từ & So sánh  (14 từ)', 50),
  (1233, 'BÀI 12  ·  Quá khứ của tính từ & So sánh  (14 từ)', 50),
  (1234, 'BÀI 13  ·  Mong muốn — たい & ほしい  (14 từ)', 53),
  (1235, 'BÀI 13  ·  Mong muốn — たい & ほしい  (14 từ)', 53),
  (1236, 'BÀI 13  ·  Mong muốn — たい & ほしい  (14 từ)', 53),
  (1237, 'BÀI 13  ·  Mong muốn — たい & ほしい  (14 từ)', 53),
  (1238, 'BÀI 13  ·  Mong muốn — たい & ほしい  (14 từ)', 53),
  (1239, 'BÀI 13  ·  Mong muốn — たい & ほしい  (14 từ)', 53),
  (1240, 'BÀI 13  ·  Mong muốn — たい & ほしい  (14 từ)', 53),
  (1241, 'BÀI 13  ·  Mong muốn — たい & ほしい  (14 từ)', 53),
  (1242, 'BÀI 13  ·  Mong muốn — たい & ほしい  (14 từ)', 53),
  (1243, 'BÀI 13  ·  Mong muốn — たい & ほしい  (14 từ)', 54),
  (1244, 'BÀI 13  ·  Mong muốn — たい & ほしい  (14 từ)', 54),
  (1245, 'BÀI 14  ·  Thể て & Yêu cầu  (14 từ)', 55),
  (1246, 'BÀI 14  ·  Thể て & Yêu cầu  (14 từ)', 56),
  (1247, 'BÀI 14  ·  Thể て & Yêu cầu  (14 từ)', 56),
  (1248, 'BÀI 14  ·  Thể て & Yêu cầu  (14 từ)', 56),
  (1249, 'BÀI 15  ·  Cho phép & Cấm đoán  (14 từ)', 57),
  (1250, 'BÀI 15  ·  Cho phép & Cấm đoán  (14 từ)', 57),
  (1251, 'BÀI 15  ·  Cho phép & Cấm đoán  (14 từ)', 57),
  (1252, 'BÀI 15  ·  Cho phép & Cấm đoán  (14 từ)', 57),
  (1253, 'BÀI 15  ·  Cho phép & Cấm đoán  (14 từ)', 57),
  (1254, 'BÀI 15  ·  Cho phép & Cấm đoán  (14 từ)', 57),
  (1255, 'BÀI 15  ·  Cho phép & Cấm đoán  (14 từ)', 57),
  (1256, 'BÀI 15  ·  Cho phép & Cấm đoán  (14 từ)', 57),
  (1257, 'BÀI 15  ·  Cho phép & Cấm đoán  (14 từ)', 58),
  (1258, 'BÀI 15  ·  Cho phép & Cấm đoán  (14 từ)', 58),
  (1259, 'BÀI 16  ·  Nối câu bằng thể て  (14 từ)', 59),
  (1260, 'BÀI 16  ·  Nối câu bằng thể て  (14 từ)', 59),
  (1261, 'BÀI 16  ·  Nối câu bằng thể て  (14 từ)', 60),
  (1262, 'BÀI 16  ·  Nối câu bằng thể て  (14 từ)', 60),
  (1263, 'BÀI 16  ·  Nối câu bằng thể て  (14 từ)', 61),
  (1264, 'BÀI 16  ·  Nối câu bằng thể て  (14 từ)', 60),
  (1265, 'BÀI 16  ·  Nối câu bằng thể て  (14 từ)', 60),
  (1266, 'BÀI 16  ·  Nối câu bằng thể て  (14 từ)', 60),
  (1267, 'BÀI 16  ·  Nối câu bằng thể て  (14 từ)', 60),
  (1268, 'BÀI 16  ·  Nối câu bằng thể て  (14 từ)', 60),
  (1269, 'BÀI 16  ·  Nối câu bằng thể て  (14 từ)', 60),
  (1270, 'BÀI 16  ·  Nối câu bằng thể て  (14 từ)', 61),
  (1271, 'BÀI 17  ·  Thể ない — Cấm, Bắt buộc, Không cần  (14 từ)', 63),
  (1272, 'BÀI 17  ·  Thể ない — Cấm, Bắt buộc, Không cần  (14 từ)', 63),
  (1273, 'BÀI 17  ·  Thể ない — Cấm, Bắt buộc, Không cần  (14 từ)', 64),
  (1274, 'BÀI 17  ·  Thể ない — Cấm, Bắt buộc, Không cần  (14 từ)', 64),
  (1275, 'BÀI 17  ·  Thể ない — Cấm, Bắt buộc, Không cần  (14 từ)', 64),
  (1276, 'BÀI 17  ·  Thể ない — Cấm, Bắt buộc, Không cần  (14 từ)', 64),
  (1277, 'BÀI 17  ·  Thể ない — Cấm, Bắt buộc, Không cần  (14 từ)', 64),
  (1278, 'BÀI 18  ·  Thể từ điển & Khả năng  (14 từ)', 65),
  (1279, 'BÀI 18  ·  Thể từ điển & Khả năng  (14 từ)', 65),
  (1280, 'BÀI 18  ·  Thể từ điển & Khả năng  (14 từ)', 66),
  (1281, 'BÀI 18  ·  Thể từ điển & Khả năng  (14 từ)', 66),
  (1282, 'BÀI 18  ·  Thể từ điển & Khả năng  (14 từ)', 66),
  (1283, 'BÀI 18  ·  Thể từ điển & Khả năng  (14 từ)', 66),
  (1284, 'BÀI 18  ·  Thể từ điển & Khả năng  (14 từ)', 66),
  (1285, 'BÀI 18  ·  Thể từ điển & Khả năng  (14 từ)', 66),
  (1286, 'BÀI 18  ·  Thể từ điển & Khả năng  (14 từ)', 66),
  (1287, 'BÀI 19  ·  Thể た — Kinh nghiệm & Liệt kê  (14 từ)', 67),
  (1288, 'BÀI 19  ·  Thể た — Kinh nghiệm & Liệt kê  (14 từ)', 67),
  (1289, 'BÀI 19  ·  Thể た — Kinh nghiệm & Liệt kê  (14 từ)', 67),
  (1290, 'BÀI 19  ·  Thể た — Kinh nghiệm & Liệt kê  (14 từ)', 68),
  (1291, 'BÀI 19  ·  Thể た — Kinh nghiệm & Liệt kê  (14 từ)', 68),
  (1292, 'BÀI 19  ·  Thể た — Kinh nghiệm & Liệt kê  (14 từ)', 68),
  (1293, 'BÀI 20  ·  Thể thông thường (普通形)  (14 từ)', 69),
  (1294, 'BÀI 20  ·  Thể thông thường (普通形)  (14 từ)', 69),
  (1295, 'BÀI 20  ·  Thể thông thường (普通形)  (14 từ)', 69),
  (1296, 'BÀI 20  ·  Thể thông thường (普通形)  (14 từ)', 70),
  (1297, 'BÀI 21  ·  Ý kiến — と 思います / と 言います  (14 từ)', 72),
  (1298, 'BÀI 21  ·  Ý kiến — と 思います / と 言います  (14 từ)', 72),
  (1299, 'BÀI 21  ·  Ý kiến — と 思います / と 言います  (14 từ)', 72),
  (1300, 'BÀI 21  ·  Ý kiến — と 思います / と 言います  (14 từ)', 72),
  (1301, 'BÀI 21  ·  Ý kiến — と 思います / と 言います  (14 từ)', 72),
  (1302, 'BÀI 21  ·  Ý kiến — と 思います / と 言います  (14 từ)', 72),
  (1303, 'BÀI 21  ·  Ý kiến — と 思います / と 言います  (14 từ)', 72),
  (1304, 'BÀI 21  ·  Ý kiến — と 思います / と 言います  (14 từ)', 72),
  (1305, 'BÀI 21  ·  Ý kiến — と 思います / と 言います  (14 từ)', 72),
  (1306, 'BÀI 21  ·  Ý kiến — と 思います / と 言います  (14 từ)', 72),
  (1307, 'BÀI 21  ·  Ý kiến — と 思います / と 言います  (14 từ)', 72),
  (1308, 'BÀI 21  ·  Ý kiến — と 思います / と 言います  (14 từ)', 72),
  (1309, 'BÀI 21  ·  Ý kiến — と 思います / と 言います  (14 từ)', 72),
  (1310, 'BÀI 21  ·  Ý kiến — と 思います / と 言います  (14 từ)', 73),
  (1311, 'BÀI 21  ·  Ý kiến — と 思います / と 言います  (14 từ)', 73),
  (1312, 'BÀI 21  ·  Ý kiến — と 思います / と 言います  (14 từ)', 73),
  (1313, 'BÀI 21  ·  Ý kiến — と 思います / と 言います  (14 từ)', 73),
  (1314, 'BÀI 21  ·  Ý kiến — と 思います / と 言います  (14 từ)', 73),
  (1315, 'BÀI 21  ·  Ý kiến — と 思います / と 言います  (14 từ)', 73),
  (1316, 'BÀI 22  ·  Mệnh đề bổ nghĩa danh từ  (14 từ)', 74),
  (1317, 'BÀI 22  ·  Mệnh đề bổ nghĩa danh từ  (14 từ)', 74),
  (1318, 'BÀI 22  ·  Mệnh đề bổ nghĩa danh từ  (14 từ)', 74),
  (1319, 'BÀI 22  ·  Mệnh đề bổ nghĩa danh từ  (14 từ)', 74),
  (1320, 'BÀI 22  ·  Mệnh đề bổ nghĩa danh từ  (14 từ)', 74),
  (1321, 'BÀI 22  ·  Mệnh đề bổ nghĩa danh từ  (14 từ)', 74),
  (1322, 'BÀI 22  ·  Mệnh đề bổ nghĩa danh từ  (14 từ)', 74),
  (1323, 'BÀI 22  ·  Mệnh đề bổ nghĩa danh từ  (14 từ)', 74),
  (1324, 'BÀI 23  ·  とき & Điều kiện と  (14 từ)', 75),
  (1325, 'BÀI 23  ·  とき & Điều kiện と  (14 từ)', 75),
  (1326, 'BÀI 24  ·  Cho & Nhận nâng cao — てあげる / てもらう / てくれる  (14 từ)', 77),
  (1327, 'BÀI 24  ·  Cho & Nhận nâng cao — てあげる / てもらう / てくれる  (14 từ)', 77),
  (1328, 'BÀI 24  ·  Cho & Nhận nâng cao — てあげる / てもらう / てくれる  (14 từ)', 78),
  (1329, 'BÀI 24  ·  Cho & Nhận nâng cao — てあげる / てもらう / てくれる  (14 từ)', 78),
  (1330, 'BÀI 25  ·  Giả định — たら & ても  (14 từ)', 79),
  (1331, 'BÀI 25  ·  Giả định — たら & ても  (14 từ)', 79),
  (1332, 'BÀI 25  ·  Giả định — たら & ても  (14 từ)', 79),
  (1333, 'BÀI 25  ·  Giả định — たら & ても  (14 từ)', 80)
) as v(id, lesson, day) where t.id = v.id and (t.lesson is distinct from v.lesson or t.day is distinct from v.day::int);

update public.kanji as t set day = v.day from (values
  (1, 16),
  (2, 24),
  (3, 16),
  (4, 14),
  (5, 14),
  (6, 18),
  (7, 15),
  (8, 29),
  (9, 28),
  (10, 16),
  (11, 16),
  (12, 59),
  (13, 21),
  (14, 28),
  (15, 17),
  (16, 15),
  (17, 14),
  (18, 21),
  (19, 25),
  (20, 23),
  (21, 24),
  (22, 16),
  (23, 14),
  (24, 28),
  (25, 26),
  (26, 39),
  (27, 76),
  (28, 28),
  (29, 23),
  (30, 17),
  (31, 25),
  (32, 29),
  (33, 21),
  (34, 55),
  (35, 17),
  (36, 14),
  (37, 36),
  (38, 20),
  (39, 35),
  (40, 59),
  (41, 44),
  (42, 69),
  (43, 29),
  (44, 28),
  (45, 20),
  (46, 15),
  (47, 15),
  (48, 36),
  (49, 28),
  (50, 37),
  (51, 18),
  (52, 49),
  (53, 37),
  (54, 27),
  (55, 76),
  (56, 24),
  (57, 20),
  (58, 17),
  (59, 14),
  (60, 16),
  (61, 53),
  (62, 20),
  (63, 75),
  (64, 25),
  (65, 23),
  (66, 43),
  (67, 76),
  (68, 15),
  (69, 21),
  (70, 40),
  (71, 27),
  (72, 18),
  (73, 47),
  (74, 18),
  (75, 25),
  (76, 17),
  (77, 19),
  (78, 17),
  (79, 15),
  (80, 76),
  (81, 60),
  (82, 18),
  (83, 31),
  (84, 25),
  (85, 37),
  (86, 36),
  (87, 49),
  (88, 30),
  (89, 26),
  (90, 34),
  (91, 25),
  (92, 32),
  (93, 44),
  (94, 30),
  (95, 27),
  (96, 44),
  (97, 23),
  (98, 34),
  (99, 27),
  (100, 49),
  (101, 30),
  (102, 30),
  (103, 60)
) as v(id, day) where t.id = v.id and t.day is distinct from v.day::int;

update public.journey_days as t set kanji_summary = v.kanji_summary, vocab_summary = v.vocab_summary, minutes = v.minutes from (values
  (1, '—', '—', 100),
  (2, '—', '—', 100),
  (3, '—', '—', 100),
  (4, '—', '7 từ', 101),
  (5, '—', '—', 75),
  (6, '—', '7 từ', 141),
  (7, '—', '5 từ', 131),
  (8, '—', '2 từ', 116),
  (9, '—', '7 từ', 101),
  (10, '—', '—', 75),
  (11, '—', '—', 50),
  (12, '—', '—', 50),
  (13, '—', '—', 50),
  (14, '人、先、生、学、会、社', '19 từ', 110),
  (15, '行、大、電、気、何、来', '19 từ', 110),
  (16, '名、前、国、中、日、本', '18 từ', 78),
  (17, '書、新、聞、手、時、車', '25 từ', 152),
  (18, '土、語、話、万、年', '27 từ', 112),
  (19, '食', '20 từ', 92),
  (20, '下、円、百、千', '15 từ', 94),
  (21, '見、入、口、出', '14 từ', 62),
  (22, '—', '—', 100),
  (23, '休、今、分、半', '15 từ', 94),
  (24, '午、後、一', '20 từ', 80),
  (25, '毎、月、火、水、木、金', '14 từ', 100),
  (26, '間、週', '22 từ', 70),
  (27, '校、駅、友、女', '20 từ', 104),
  (28, '二、三、四、五、六、七', '20 từ', 112),
  (29, '八、九、十', '26 từ', 92),
  (30, '飲、読、買、魚', '18 từ', 100),
  (31, '店', '23 từ', 98),
  (32, '花', '24 từ', 80),
  (33, '—', '—', 100),
  (34, '父、母', '32 từ', 130),
  (35, '子', '34 từ', 120),
  (36, '小、古、高', '23 từ', 106),
  (37, '安、白、山', '22 từ', 104),
  (38, '—', '29 từ', 86),
  (39, '上', '22 từ', 96),
  (40, '少', '22 từ', 96),
  (41, '—', '24 từ', 66),
  (42, '—', '—', 100),
  (43, '男', '21 từ', 94),
  (44, '右、左、外', '19 từ', 98),
  (45, '—', '25 từ', 68),
  (46, '—', '27 từ', 102),
  (47, '空', '25 từ', 102),
  (48, '—', '27 từ', 82),
  (49, '多、天、雨', '20 từ', 100),
  (50, '—', '27 từ', 92),
  (51, '—', '27 từ', 72),
  (52, '—', '—', 100),
  (53, '川', '21 từ', 104),
  (54, '—', '23 từ', 104),
  (55, '立', '26 từ', 134),
  (56, '—', '29 từ', 106),
  (57, '—', '16 từ', 80),
  (58, '—', '16 từ', 80),
  (59, '長、目', '19 từ', 94),
  (60, '耳、足', '19 từ', 94),
  (61, '—', '23 từ', 64),
  (62, '—', '—', 100),
  (63, '—', '21 từ', 120),
  (64, '—', '22 từ', 102),
  (65, '—', '18 từ', 94),
  (66, '—', '18 từ', 94),
  (67, '—', '17 từ', 102),
  (68, '—', '18 từ', 84),
  (69, '言', '17 từ', 106),
  (70, '—', '20 từ', 88),
  (71, '—', '—', 80),
  (72, '—', '29 từ', 116),
  (73, '—', '29 từ', 116),
  (74, '—', '27 từ', 132),
  (75, '道', '21 từ', 114),
  (76, '東、西、南、北', '15 từ', 64),
  (77, '—', '10 từ', 78),
  (78, '—', '11 từ', 70),
  (79, '—', '12 từ', 82),
  (80, '—', '12 từ', 72),
  (81, '—', '—', 100),
  (82, '—', '—', 85),
  (83, '—', '—', 120),
  (84, '—', '—', 100),
  (85, '—', '—', 120),
  (86, '—', '—', 40),
  (87, '—', '—', 155),
  (88, '—', '—', 40),
  (89, '—', '—', 100),
  (90, '—', '—', 60)
) as v(day, kanji_summary, vocab_summary, minutes) where t.day = v.day;

delete from public.day_tasks;
insert into public.day_tasks (day, order_no, label, body, minutes) values
  (1, 1, 'あ  Học chữ mới', 'Học 15 âm — trọn hàng あ・か・さ: あ (a)  い (i)  う (u)  え (e)  お (o)  か (ka)  き (ki)  く (ku)  け (ke)  こ (ko)  さ (sa)  し (shi)  す (su)  せ (se)  そ (so). し = shi — đọc khác quy luật hàng. Xem thứ tự nét trước khi viết.', 35),
  (1, 2, '✎  Viết tay', 'Viết mỗi âm 10 lần trên giấy kẻ ô, vừa viết vừa đọc to.', 35),
  (1, 3, '?  Tự kiểm tra', 'Che romaji, nhìn chữ đọc âm. Rồi che chữ, nghe âm viết chữ.', 20),
  (1, 4, '耳  Nghe', 'Nghe phát âm chuẩn các âm hôm nay 3 lượt, nhắc theo.', 10),
  (2, 1, 'あ  Học chữ mới', 'Học 15 âm — trọn hàng た・な・は: た (ta)  ち (chi)  つ (tsu)  て (te)  と (to)  な (na)  に (ni)  ぬ (nu)  ね (ne)  の (no)  は (ha)  ひ (hi)  ふ (fu)  へ (he)  ほ (ho). ち = chi, つ = tsu, ふ = fu — đọc khác quy luật hàng. Xem thứ tự nét trước khi viết.', 35),
  (2, 2, '✎  Viết tay', 'Viết mỗi âm 10 lần trên giấy kẻ ô, vừa viết vừa đọc to.', 35),
  (2, 3, '?  Tự kiểm tra', 'Che romaji, nhìn chữ đọc âm. Rồi che chữ, nghe âm viết chữ.', 20),
  (2, 4, '耳  Nghe', 'Nghe phát âm chuẩn các âm hôm nay 3 lượt, nhắc theo.', 10),
  (3, 1, 'あ  Học chữ mới', 'Học 16 âm — trọn hàng ま・や・ら・わ・ん: ま (ma)  み (mi)  む (mu)  め (me)  も (mo)  や (ya)  ゆ (yu)  よ (yo)  ら (ra)  り (ri)  る (ru)  れ (re)  ろ (ro)  わ (wa)  を (o)  ん (n). を đọc là o. ん là một nhịp riêng, không phải na. Xem thứ tự nét trước khi viết.', 35),
  (3, 2, '✎  Viết tay', 'Viết mỗi âm 10 lần trên giấy kẻ ô, vừa viết vừa đọc to.', 35),
  (3, 3, '?  Tự kiểm tra', 'Che romaji, nhìn chữ đọc âm. Rồi che chữ, nghe âm viết chữ.', 20),
  (3, 4, '耳  Nghe', 'Nghe phát âm chuẩn các âm hôm nay 3 lượt, nhắc theo.', 10),
  (4, 1, '゛  Âm đục', 'Học 25 âm đục & bán đục. Dấu ゛ (2 chấm): K→G, S→Z, T→D, H→B. Dấu ゜ (vòng tròn): H→P. Xem bảng so sánh âm gốc ↔ âm đục và mẹo nhớ trong thẻ học. Ví dụ: か→が, さ→ざ, た→だ, は→ば, は→ぱ.', 30),
  (4, 2, '✎  Viết tay', 'Viết mỗi âm 5 lần, đọc to khi viết.', 20),
  (4, 3, '語  Từ vựng', 'Học 7 từ mới: はい (vâng) ・ いいえ (không) ・ わかりました (tôi hiểu rồi) ・ おはようございます (chào buổi sáng) ・ こんにちは (xin chào) ・ こんばんは (chào buổi tối) ・ さようなら (tạm biệt)
(Từ viết bằng Hiragana — bạn đã đọc được hết các chữ trong từ.)', 41),
  (4, 4, '耳  Nghe', 'Luyện phân biệt âm trong và âm đục: か/が, た/だ, は/ば/ぱ.', 10),
  (5, 1, 'ゃ  Âm ghép', 'Học 33 âm ghép. Quy tắc: chữ hàng い + ゃ/ゅ/ょ viết nhỏ (き+ゃ = きゃ). Đọc liền thành một âm.', 25),
  (5, 2, '?  Kiểm tra', 'Viết lại các âm ghép hôm nay, không viết cả 104 âm. Bài viết cả bảng để một buổi riêng, không kèm chữ mới.', 15),
  (5, 3, '✎  Sửa sai', 'Mỗi âm ghép viết sai: viết lại 5 lần và đọc to thành tiếng.', 10),
  (5, 4, '語  Từ vựng', 'Ôn lại 7 từ đã học: はい (vâng) ・ いいえ (không) ・ わかりました (tôi hiểu rồi) ・ おはようございます (chào buổi sáng) ・ こんにちは (xin chào) ・ こんばんは (chào buổi tối) ・ さようなら (tạm biệt)', 15),
  (5, 5, '耳  Nghe', 'Nghe bảng chữ cái đọc chuẩn 1 lượt, đọc nhẩm theo.', 10),
  (6, 1, 'あ  Học chữ mới', 'Học 15 âm — trọn hàng あ・か・さ: ア (a)  イ (i)  ウ (u)  エ (e)  オ (o)  カ (ka)  キ (ki)  ク (ku)  ケ (ke)  コ (ko)  サ (sa)  シ (shi)  ス (su)  セ (se)  ソ (so). Phân biệt シ (2 chấm ngang, nét cuối hất lên) và ツ (2 chấm dọc, nét cuối rơi xuống). Xem thứ tự nét trước khi viết.', 35),
  (6, 2, '✎  Viết tay', 'Viết mỗi âm 10 lần trên giấy kẻ ô, vừa viết vừa đọc to.', 35),
  (6, 3, '?  Tự kiểm tra', 'Che romaji, nhìn chữ đọc âm. Rồi che chữ, nghe âm viết chữ.', 20),
  (6, 4, '語  Từ vựng', 'Học 7 từ mới: ありがとうございます (cảm ơn) ・ どういたしまして (không có gì) ・ すみません (xin lỗi) ・ ごめんなさい (xin lỗi người thân) ・ はじめまして (rất hân hạnh được gặp) ・ どうぞよろしく (mong được giúp đỡ) ・ ありがとう (cảm ơn (thân mật))', 41),
  (6, 5, '耳  Nghe', 'Nghe phát âm chuẩn các âm hôm nay 3 lượt, nhắc theo.', 10),
  (7, 1, 'あ  Học chữ mới', 'Học 15 âm — trọn hàng た・な・は: タ (ta)  チ (chi)  ツ (tsu)  テ (te)  ト (to)  ナ (na)  ニ (ni)  ヌ (nu)  ネ (ne)  ノ (no)  ハ (ha)  ヒ (hi)  フ (fu)  ヘ (he)  ホ (ho). Phân biệt シ (2 chấm ngang, nét cuối hất lên) và ツ (2 chấm dọc, nét cuối rơi xuống). Xem thứ tự nét trước khi viết.', 35),
  (7, 2, '✎  Viết tay', 'Viết mỗi âm 10 lần trên giấy kẻ ô, vừa viết vừa đọc to.', 35),
  (7, 3, '?  Tự kiểm tra', 'Che romaji, nhìn chữ đọc âm. Rồi che chữ, nghe âm viết chữ.', 20),
  (7, 4, '語  Từ vựng', 'Học 5 từ mới: コーヒー (cà phê) ・ タクシー (taxi) ・ ノート (vở) ・ ええ (vâng, ừ (thân mật)) ・ おはよう (chào buổi sáng (thân mật))', 31),
  (7, 5, '耳  Nghe', 'Nghe phát âm chuẩn các âm hôm nay 3 lượt, nhắc theo.', 10),
  (8, 1, 'あ  Học chữ mới', 'Học 16 âm — trọn hàng ま・や・ら・わ・ん: マ (ma)  ミ (mi)  ム (mu)  メ (me)  モ (mo)  ヤ (ya)  ユ (yu)  ヨ (yo)  ラ (ra)  リ (ri)  ル (ru)  レ (re)  ロ (ro)  ワ (wa)  ヲ (o)  ン (n). ヲ đọc là o, giống を. Phân biệt ン (nét nghiêng lên) và ソ (nét rơi xuống). Xem thứ tự nét trước khi viết.', 35),
  (8, 2, '✎  Viết tay', 'Viết mỗi âm 10 lần trên giấy kẻ ô, vừa viết vừa đọc to.', 35),
  (8, 3, '?  Tự kiểm tra', 'Che romaji, nhìn chữ đọc âm. Rồi che chữ, nghe âm viết chữ.', 20),
  (8, 4, '語  Từ vựng', 'Học 2 từ mới: カメラ (máy ảnh) ・ レストラン (nhà hàng)', 16),
  (8, 5, '耳  Nghe', 'Nghe phát âm chuẩn các âm hôm nay 3 lượt, nhắc theo.', 10),
  (9, 1, '゛  Âm đục', 'Học 25 âm đục & bán đục. Dấu ゛ (2 chấm): K→G, S→Z, T→D, H→B. Dấu ゜ (vòng tròn): H→P. Xem bảng so sánh âm gốc ↔ âm đục và mẹo nhớ trong thẻ học. Ví dụ: カ→ガ, サ→ザ, タ→ダ, ハ→バ, ハ→パ.', 30),
  (9, 2, '✎  Viết tay', 'Viết mỗi âm 5 lần, đọc to khi viết.', 20),
  (9, 3, '語  Từ vựng', 'Học 7 từ mới: テレビ (ti vi) ・ ラジオ (radio) ・ パン (bánh mì) ・ バス (xe buýt) ・ ペン (bút) ・ パソコン (máy tính) ・ コンビニ (cửa hàng tiện lợi)', 41),
  (9, 4, '耳  Nghe', 'Luyện phân biệt âm trong và âm đục: か/が, た/だ, は/ば/ぱ.', 10),
  (10, 1, 'ゃ  Âm ghép', 'Học 33 âm ghép Katakana. Quy tắc: chữ hàng イ + ャ/ュ/ョ viết nhỏ (キ+ャ = キャ). Đọc liền thành một âm.', 25),
  (10, 2, '?  Kiểm tra', 'Viết lại các âm ghép Katakana hôm nay. Không viết cả 104 âm trong ngày có chữ mới.', 15),
  (10, 3, '✎  Sửa sai', 'Mỗi âm ghép viết sai: viết lại 5 lần và đọc to thành tiếng.', 10),
  (10, 4, '語  Từ vựng', 'Ôn lại 28 từ đã học: はい (vâng) ・ いいえ (không) ・ わかりました (tôi hiểu rồi) ・ おはようございます (chào buổi sáng) ・ こんにちは (xin chào) ・ こんばんは (chào buổi tối) ・ さようなら (tạm biệt) ・ ありがとうございます (cảm ơn) ・ どういたしまして (không có gì) ・ すみません (xin lỗi) ・ ごめんなさい (xin lỗi người thân) ・ はじめまして (rất hân hạnh được gặp) ・ どうぞよろしく (mong được giúp đỡ) ・ ありがとう (cảm ơn (thân mật)) ・ コーヒー (cà phê) ・ タクシー (taxi) ・ ノート (vở) ・ ええ (vâng, ừ (thân mật)) ・ おはよう (chào buổi sáng (thân mật)) ・ カメラ (máy ảnh) ・ レストラン (nhà hàng) ・ テレビ (ti vi) ・ ラジオ (radio) ・ パン (bánh mì) ・ バス (xe buýt) ・ ペン (bút) ・ パソコン (máy tính) ・ コンビニ (cửa hàng tiện lợi)', 15),
  (10, 5, '耳  Nghe', 'Nghe bảng chữ cái đọc chuẩn 1 lượt, đọc nhẩm theo.', 10),
  (11, 1, '◐  Khởi động', 'Ôn hàng Katakana hôm qua.', 5),
  (11, 2, '部  Bộ thủ', 'Học 15 bộ thủ — nhớ mặt chữ, tên và nghĩa, tìm bộ trong Kanji. Không cần viết nhiều lần.
• 人 / 亻 (ひと / にんべん) = Người — có trong: 人・休・何・今
   Mẹo nhớ: 亻 đứng bên trái = dáng người đứng nghiêng
• 口 (くち) = Miệng, cái lỗ — có trong: 口・名・右・古
   Mẹo nhớ: Ô vuông nhỏ = cái miệng đang mở
• 日 (ひ / にちへん) = Mặt trời, ngày — có trong: 日・時・明・早
   Mẹo nhớ: Ô vuông có gạch giữa = mặt trời
• 月 (つき / にくづき) = Mặt trăng, tháng, thân thể — có trong: 月・前・服
   Mẹo nhớ: Trăng khuyết; khi chỉ cơ thể đọc là にくづき
• 木 (き / きへん) = Cây, gỗ — có trong: 木・本・校・東
   Mẹo nhớ: Thân cây có cành và rễ
• 水 / 氵 (みず / さんずい) = Nước, chất lỏng — có trong: 水・海・池・酒
   Mẹo nhớ: 氵 ba giọt nước bên trái
• 火 / 灬 (ひ / れんが) = Lửa, nhiệt — có trong: 火・点・無・焼
   Mẹo nhớ: 灬 bốn chấm dưới = ngọn lửa cháy
• 土 (つち / つちへん) = Đất, nơi chốn — có trong: 土・地・場・在
   Mẹo nhớ: Chữ thập trên nền đất
• 金 (かね / かねへん) = Kim loại, tiền — có trong: 金・銀・鉄・鏡
   Mẹo nhớ: Mái nhà che kho báu chôn dưới đất
• 女 (おんな / おんなへん) = Phụ nữ, nữ giới — có trong: 女・安・好・姉
   Mẹo nhớ: Dáng người phụ nữ đang quỳ
• 子 (こ / こへん) = Con, trẻ nhỏ — có trong: 子・学・字・孫
   Mẹo nhớ: Em bé quấn tã dang tay
• 心 / 忄 (こころ / りっしんべん) = Trái tim, cảm xúc — có trong: 心・思・急・忙
   Mẹo nhớ: 忄 là trái tim dựng đứng bên trái
• 手 / 扌 (て / てへん) = Tay, hành động bằng tay — có trong: 手・持・打・指
   Mẹo nhớ: 扌 bàn tay đưa ra bên trái
• 目 (め / めへん) = Mắt, nhìn — có trong: 目・見・直・眠
   Mẹo nhớ: Con mắt dựng đứng lên
• 耳 (みみ / みみへん) = Tai, nghe — có trong: 耳・聞・取・職
   Mẹo nhớ: Hình vành tai', 45),
  (12, 1, '◐  Khởi động', 'Ôn nhanh bộ thủ hôm qua: nhìn bộ nói nghĩa, không nhìn đáp án.', 5),
  (12, 2, '部  Bộ thủ', 'Học 15 bộ thủ — nhớ mặt chữ, tên và nghĩa, tìm bộ trong Kanji. Không cần viết nhiều lần.
• 足 / ⻊ (あし / あしへん) = Chân, bước đi — có trong: 足・路・速
   Mẹo nhớ: Đầu gối và bàn chân
• 言 / 訁 (ごんべん) = Lời nói, ngôn ngữ — có trong: 言・話・語・読
   Mẹo nhớ: Miệng phát ra sóng âm — chữ nào có 言 đều liên quan đến nói
• 車 (くるま / くるまへん) = Xe cộ — có trong: 車・転・軽・輪
   Mẹo nhớ: Nhìn từ trên xuống: trục và hai bánh xe
• 門 (もんがまえ) = Cổng, cửa — có trong: 門・間・開・閉
   Mẹo nhớ: Hai cánh cửa mở — bộ này bao quanh chữ
• 食 / 飠 (しょく / しょくへん) = Ăn uống, thức ăn — có trong: 食・飲・飯・館
   Mẹo nhớ: Mái che trên mâm cơm
• 魚 (うお / うおへん) = Cá, hải sản — có trong: 魚・鮮・鯨
   Mẹo nhớ: Đầu, thân, vảy và đuôi cá
• 雨 (あめかんむり) = Mưa, hiện tượng thời tiết — có trong: 雨・電・雪・雲
   Mẹo nhớ: Giọt nước rơi từ mây — bộ này nằm trên đầu
• 山 (やま / やまへん) = Núi — có trong: 山・岩・島
   Mẹo nhớ: Ba đỉnh núi nhô lên
• 川 / 巛 (かわ) = Sông, dòng chảy — có trong: 川・州・巡
   Mẹo nhớ: Ba dòng nước chảy song song
• 田 (た / たへん) = Ruộng đồng — có trong: 田・男・町・界
   Mẹo nhớ: Thửa ruộng chia bốn ô
• 力 (ちから) = Sức mạnh, nỗ lực — có trong: 力・男・動・助
   Mẹo nhớ: Cánh tay đang gồng cơ
• 大 (だい) = To, lớn — có trong: 大・天・太・犬
   Mẹo nhớ: Người dang rộng hai tay
• 小 (しょう) = Nhỏ, ít — có trong: 小・少
   Mẹo nhớ: Ba chấm bé xíu
• 宀 (うかんむり) = Mái nhà, nơi ở — có trong: 安・家・室・宿
   Mẹo nhớ: Nóc nhà úp lên trên chữ
• 艹 (くさかんむり) = Cỏ, thực vật — có trong: 花・茶・草・薬
   Mẹo nhớ: Hai chồi cỏ mọc trên đầu chữ', 45),
  (13, 1, '◐  Khởi động', 'Ôn nhanh bộ thủ hôm qua: nhìn bộ nói nghĩa, không nhìn đáp án.', 5),
  (13, 2, '部  Bộ thủ', 'Học 15 bộ thủ — nhớ mặt chữ, tên và nghĩa, tìm bộ trong Kanji. Không cần viết nhiều lần.
• 辶 (しんにょう) = Di chuyển, đường đi — có trong: 道・週・近・通
   Mẹo nhớ: Ngã tư và bàn chân bước — bao bên trái và dưới
• 彳 (ぎょうにんべん) = Bước đi, hành trình — có trong: 後・待・役
   Mẹo nhớ: Ngã ba đường thu nhỏ bên trái
• 广 (まだれ) = Mái hiên, công trình — có trong: 店・広・度・庭
   Mẹo nhớ: Mái nhà có tường một bên
• 儿 (にんにょう) = Đôi chân người — có trong: 先・見・元・光
   Mẹo nhớ: Hai chân đỡ phần trên của chữ
• 十 (じゅう) = Mười, đầy đủ — có trong: 十・千・南・午
   Mẹo nhớ: Dấu cộng = số mười
• 白 (しろ) = Trắng, sáng — có trong: 白・百・的
   Mẹo nhớ: Mặt trời có tia sáng nhô lên
• 立 (たつ / たつへん) = Đứng, dựng lên — có trong: 立・音・章・親
   Mẹo nhớ: Người đứng trên mặt đất
• 馬 (うま / うまへん) = Ngựa — có trong: 駅・験・駐
   Mẹo nhớ: Bờm, thân và bốn chân ngựa
• 貝 (かい / かいへん) = Vỏ sò, tiền bạc — có trong: 買・貝・財・買
   Mẹo nhớ: Ngày xưa vỏ sò dùng làm tiền
• 糸 (いと / いとへん) = Sợi chỉ, dệt — có trong: 糸・紙・細・組
   Mẹo nhớ: Bó tơ tằm xoắn lại
• 米 (こめ / こめへん) = Gạo — có trong: 米・料・粉
   Mẹo nhớ: Hạt lúa rơi ra bốn phía
• 生 (うまれる) = Sinh ra, sống — có trong: 生・産
   Mẹo nhớ: Mầm cây nhú lên khỏi mặt đất
• 一 (いち) = Một, ngang bằng — có trong: 一・三・上・下
   Mẹo nhớ: Một nét ngang duy nhất
• 亠 (なべぶた) = Nắp vung, phần che trên — có trong: 高・京・交
   Mẹo nhớ: Trông như cái nắp nồi
• 尸 (しかばね) = Mái, thân người nằm — có trong: 屋・局・屋
   Mẹo nhớ: Người nằm nghiêng / mái che', 45),
  (14, 1, '◐  Khởi động', 'Ôn nhanh 45 bộ thủ: nhìn bộ nói nghĩa, không nhìn đáp án.', 5),
  (14, 2, '語  Từ vựng', 'Từ mới Minna bài 1:
• わたし（私） = Tôi
• わたくし（私） = Tôi (trang trọng)
• わたしたち（私たち） = Chúng tôi, chúng ta
• あなた = Bạn, anh/chị
• あのひと（あの人） = Người kia, người ấy
• あのかた（あの方） = Vị kia (lịch sự của あの人)
• 〜さん = Hậu tố lịch sự sau tên người
• ～ちゃん = Bé…, (gọi thân mật trẻ em, bạn gái)
• 〜じん（〜人） = Người nước ~
• ～くん（～君） = Cậu… (gọi bạn nam, cấp dưới)
• せんせい（先生） = Giáo viên
• きょうし（教師） = Giáo viên (nói về nghề của mình)
• がくせい（学生） = Học sinh, sinh viên
• かいしゃいん（会社員） = Nhân viên công ty
• しゃいん（社員） = Nhân viên (của công ty ~)
• いしゃ（医者） = Bác sĩ
• けんきゅうしゃ（研究者） = Nhà nghiên cứu
• エンジニア = Kỹ sư
• びょういん（病院） = Bệnh viện', 41),
  (14, 3, '漢  Kanji', 'Học 6 chữ Kanji ngay trong từ của hôm nay — nhớ cách đọc trong từ trước, chưa cần thuộc mọi âm đọc.
• 人 [NHÂN] Người — On: ジン・ニン / Kun: ひと
   Trong từ hôm nay: あの人（あのひと）Người kia, người ấy ・ 〜人（〜じん）Người nước ~
   Mẹo: Hai nét như hai chân đang bước = dáng NGƯỜI đi. Đuôi 〜人 gắn tên nước = người nước đó.
• 先 [TIÊN] Trước, đi đầu — On: セン / Kun: さき
   Trong từ hôm nay: 先生（せんせい）Giáo viên
   Mẹo: 先生 = TIÊN SINH = người SINH RA TRƯỚC, đi trước ta → thầy cô. Nhớ theo âm Hán Việt là chắc nhất.
• 生 [SINH] Sinh, sống, tươi — On: セイ・ショウ / Kun: い(きる)・う(まれる)・なま
   Trong từ hôm nay: 先生（せんせい）Giáo viên ・ 学生（がくせい）Học sinh, sinh viên
   Mẹo: Mầm cây nhú lên khỏi vạch đất = SỰ SỐNG bắt đầu.
• 学 [HỌC] Học — On: ガク / Kun: まな(ぶ)
   Trong từ hôm nay: 学生（がくせい）Học sinh, sinh viên
   Mẹo: Phía trên là bàn tay che chắn, phía dưới là 子 (đứa trẻ) = người lớn dìu dắt trẻ HỌC.
• 会 [HỘI] Gặp gỡ, hội họp — On: カイ / Kun: あ(う)
   Trong từ hôm nay: 会社員（かいしゃいん）Nhân viên công ty
   Mẹo: Mái nhà 人 che bên trên, nhiều người tụ lại bên dưới = cuộc HỘI HỌP.
• 社 [XÃ] Công ty, đền thờ — On: シャ / Kun: やしろ
   Trong từ hôm nay: 会社員（かいしゃいん）Nhân viên công ty ・ 社員（しゃいん）Nhân viên (của công ty ~)
   Mẹo: Bộ 礻 (thần linh) + 土 (đất). Nơi thờ thần đất = cộng đồng tụ họp → XÃ hội, công ty.', 24),
  (14, 4, '文  Ngữ pháp', 'Minna bài 1 (1/3) — Chào hỏi & Giới thiệu bản thân
• N1 は N2 です  (N1 là N2. は đọc là ''wa'' khi làm trợ từ chủ đề.)
   Ví dụ: わたしは グエンです。  = Tôi là Nguyễn.
• N1 は N2 じゃ ありません  (N1 không phải là N2. Văn viết dùng では ありません.)
   Ví dụ: わたしは 学生じゃ ありません。  = Tôi không phải là học sinh.', 20),
  (14, 5, '耳  Nghe', 'Mở CD Minna no Nihongo bài đang học, phần 会話. Nghe 3 lượt: lượt 1 chỉ nghe, lượt 2 nhìn script, lượt 3 nghe và nhắc theo.', 20),
  (15, 1, '◐  Khởi động', 'Ôn nhanh nội dung hôm qua: đọc lại Kanji và mẫu ngữ pháp cũ, không nhìn đáp án.', 5),
  (15, 2, '語  Từ vựng', 'Từ mới Minna bài 1:
• ぎんこういん（銀行員） = Nhân viên ngân hàng
• だいがく（大学） = Đại học
• でんき（電気） = Điện; đèn điện
• だれ / どなた = Ai (どなた lịch sự hơn)
• ～さい（～歳） = … tuổi
• なんさい（何歳） = Mấy tuổi
• おいくつ = Bao nhiêu tuổi (lịch sự)
• しつれいですが（失礼ですが） = Xin lỗi, cho tôi hỏi…
• どうぞ よろしく = Mong được giúp đỡ
• こちらは〜さんです = Đây là anh/chị ~ (giới thiệu người khác)
• 〜からきました（〜から来ました） = Đến từ ~
• アメリカ = Nước Mỹ
• イギリス = Nước Anh
• インド = Ấn Độ
• インドネシア = Indonesia
• タイ = Thái Lan
• ドイツ = Nước Đức
• ブラジル = Brazil
• おねがいします（お願いします） = Làm ơn, nhờ bạn', 41),
  (15, 3, '漢  Kanji', 'Học 6 chữ Kanji ngay trong từ của hôm nay — nhớ cách đọc trong từ trước, chưa cần thuộc mọi âm đọc.
• 行 [HÀNH] Đi — On: コウ・ギョウ / Kun: い(く)・おこな(う)
   Trong từ hôm nay: 銀行員（ぎんこういん）Nhân viên ngân hàng
   Mẹo: Hình ngã tư đường. Đứng ở ngã tư thì phải chọn hướng ĐI.
• 大 [ĐẠI] To, lớn — On: ダイ・タイ / Kun: おお(きい)
   Trong từ hôm nay: 大学（だいがく）Đại học
   Mẹo: Người 人 dang rộng hai tay ra hết cỡ để khoe ''to bằng này!'' → TO LỚN.
• 電 [ĐIỆN] Điện — On: デン
   Trong từ hôm nay: 電気（でんき）Điện; đèn điện
   Mẹo: Bộ 雨 (mưa) + 田 + nét móc = tia sét ngoằn ngoèo trong cơn mưa → ĐIỆN.
• 気 [KHÍ] Khí, tinh thần, tâm trạng — On: キ・ケ
   Trong từ hôm nay: 電気（でんき）Điện; đèn điện
   Mẹo: Hơi nước bốc lên từ nồi cơm = KHÍ. Khí trong người = tinh thần, khí ngoài trời = thời tiết.
• 何 [HÀ] Cái gì — On: カ / Kun: なに・なん
   Trong từ hôm nay: 何歳（なんさい）Mấy tuổi
   Mẹo: 亻 (người) + 可 = người mở miệng hỏi ''CÁI GÌ?''. Trước か/た/だ đọc なん, còn lại đọc なに.
• 来 [LAI] Đến, tới — On: ライ / Kun: く(る)
   Trong từ hôm nay: 〜から来ました（〜からきました）Đến từ ~
   Mẹo: Hình cây lúa chín. Mùa gặt ĐẾN. Chú ý chia bất quy tắc: 来る→来ます (きます)→来ない (こない).', 24),
  (15, 4, '文  Ngữ pháp', 'Minna bài 1 (2/3) — Chào hỏi & Giới thiệu bản thân
• N1 は N2 ですか  (N1 có phải là N2 không? Thêm か cuối câu là thành câu hỏi.)
   Ví dụ: ミラーさんは アメリカ人ですか。  = Anh Miller là người Mỹ phải không?
• N も  (N cũng. Thay thế vị trí của は.)
   Ví dụ: わたしも ベトナム人です。  = Tôi cũng là người Việt Nam.', 20),
  (15, 5, '耳  Nghe', 'Shadowing 15 phút: bật lại 会話 hôm qua, nói đuổi theo băng, không nhìn script.', 20),
  (16, 1, '◐  Khởi động', 'Ôn nhanh nội dung hôm qua: đọc lại Kanji và mẫu ngữ pháp cũ, không nhìn đáp án.', 5),
  (16, 2, '語  Từ vựng', 'Từ mới Minna bài 1:
• おなまえは（お名前は） = Tên anh/chị là gì?
• かんこく（韓国） = Hàn Quốc
• ちゅうごく（中国） = Trung Quốc
• にほん（日本） = Nhật Bản
• なまえ（名前） = Tên
• みなさん（皆さん） = Mọi người (lịch sự)
• せいと（生徒） = Học sinh (phổ thông)
• だれか（誰か） = Ai đó
• ～さま（～様） = Ngài…, quý… (rất lịch sự)
• ああ = À, ồ
• しつれい（失礼） = Thất lễ, xin lỗi (làm phiền)
• あいさつ（挨拶） = Chào hỏi
• ～たち = Các …, những … (số nhiều)
• みな（皆） = Mọi người, tất cả
• せんぱい（先輩） = Đàn anh, đàn chị, tiền bối
• だいがくせい（大学生） = Sinh viên đại học
• こうむいん（公務員） = Công chức
• ベトナム = Việt Nam', 39),
  (16, 3, '漢  Kanji', 'Học 6 chữ Kanji ngay trong từ của hôm nay — nhớ cách đọc trong từ trước, chưa cần thuộc mọi âm đọc.
• 名 [DANH] Tên, nổi tiếng — On: メイ / Kun: な
   Trong từ hôm nay: お名前は（おなまえは）Tên anh/chị là gì? ・ 名前（なまえ）Tên
   Mẹo: 夕 (chiều tối) + 口 (miệng) = trời tối không nhìn rõ mặt, phải xưng TÊN bằng miệng.
• 前 [TIỀN] Trước, phía trước — On: ゼン / Kun: まえ
   Trong từ hôm nay: お名前は（おなまえは）Tên anh/chị là gì? ・ 名前（なまえ）Tên
   Mẹo: Có bộ 月 (thân thể) và 刀 (dao) — cắt móng chân cho gọn để bước TỚI TRƯỚC.
• 国 [QUỐC] Đất nước — On: コク / Kun: くに
   Trong từ hôm nay: 韓国（かんこく）Hàn Quốc ・ 中国（ちゅうごく）Trung Quốc
   Mẹo: Bộ 囗 (vòng vây, biên giới) bao lấy 玉 (ngọc quý) = lãnh thổ có biên giới bảo vệ báu vật → QUỐC GIA.
• 中 [TRUNG] Ở giữa, bên trong — On: チュウ / Kun: なか
   Trong từ hôm nay: 中国（ちゅうごく）Trung Quốc
   Mẹo: Một mũi tên xuyên đúng TÂM của ô vuông = ở GIỮA.
• 日 [NHẬT] Ngày, mặt trời — On: ニチ・ジツ / Kun: ひ・か
   Trong từ hôm nay: 日本（にほん）Nhật Bản
   Mẹo: Ô vuông có một gạch ở giữa = mặt trời có chấm đen. Mặt trời mọc một lần → một NGÀY.
• 本 [BẢN / BỔN] Sách, gốc, quyển — On: ホン / Kun: もと
   Trong từ hôm nay: 日本（にほん）Nhật Bản
   Mẹo: Chữ 木 (cây) thêm một gạch ở gốc rễ = GỐC của cây. Gốc → nguồn gốc → sách (nguồn tri thức).', 24),
  (16, 4, '文  Ngữ pháp', 'Minna bài 1 (3/3) — Chào hỏi & Giới thiệu bản thân
• N1 の N2  (N2 thuộc về / của N1.)
   Ví dụ: わたしは ABCの 社員です。  = Tôi là nhân viên của công ty ABC.', 10),
  (17, 1, '◐  Khởi động', 'Ôn nhanh nội dung hôm qua: đọc lại Kanji và mẫu ngữ pháp cũ, không nhìn đáp án.', 5),
  (17, 2, '語  Từ vựng', 'Từ mới Minna bài 2:
• これ = Cái này
• それ = Cái đó
• あれ = Cái kia
• この = ~ này
• その = ~ đó
• あの = ~ kia
• ほん（本） = Sách
• じしょ（辞書） = Từ điển
• ざっし（雑誌） = Tạp chí
• しんぶん（新聞） = Báo
• てちょう（手帳） = Sổ tay
• めいし（名刺） = Danh thiếp
• カード = Thẻ
• えんぴつ（鉛筆） = Bút chì
• ボールペン = Bút bi
• シャープペンシル = Bút chì kim
• かぎ（鍵） = Chìa khóa
• とけい（時計） = Đồng hồ
• かさ（傘） = Ô, dù
• かばん = Cặp, túi xách
• コンピューター = Máy vi tính
• くるま（車） = Xe ô tô
• つくえ（机） = Cái bàn (học, làm việc)
• いす = Cái ghế
• チョコレート = Sô-cô-la', 53),
  (17, 3, '漢  Kanji', 'Học 6 chữ Kanji ngay trong từ của hôm nay — nhớ cách đọc trong từ trước, chưa cần thuộc mọi âm đọc.
• 書 [THƯ] Viết — On: ショ / Kun: か(く)
   Trong từ hôm nay: 辞書（じしょ）Từ điển
   Mẹo: Phần trên là bàn tay cầm bút, phần dưới là 日 (tờ giấy) = tay cầm bút VIẾT lên giấy.
• 新 [TÂN] Mới — On: シン / Kun: あたら(しい)
   Trong từ hôm nay: 新聞（しんぶん）Báo
   Mẹo: 立 + 木 + 斤 (cái rìu) = dùng rìu đốn cây vừa đứng thẳng → gỗ MỚI chặt.
• 聞 [VĂN] Nghe, hỏi — On: ブン / Kun: き(く)
   Trong từ hôm nay: 新聞（しんぶん）Báo
   Mẹo: 門 (cánh cửa) có 耳 (cái tai) áp vào giữa = áp tai vào cửa để NGHE trộm.
• 手 [THỦ] Tay — On: シュ / Kun: て
   Trong từ hôm nay: 手帳（てちょう）Sổ tay
   Mẹo: Hình bàn tay xòe ra với các ngón. Mẹo vui: 手紙 = ''giấy của tay'' = LÁ THƯ.
• 時 [THỜI] Giờ, thời gian — On: ジ / Kun: とき
   Trong từ hôm nay: 時計（とけい）Đồng hồ
   Mẹo: 日 (mặt trời) + 寺 (ngôi chùa). Ngày xưa xem bóng mặt trời trên sân chùa để biết GIỜ.
• 車 [XA] Xe — On: シャ / Kun: くるま
   Trong từ hôm nay: 車（くるま）Xe ô tô
   Mẹo: Nhìn chiếc xe từ trên xuống: trục dọc ở giữa, hai bánh hai bên.', 24),
  (17, 4, '文  Ngữ pháp', 'Minna bài 2 (1/2) — これ・それ・あれ — Chỉ đồ vật
• これ / それ / あれ  (Cái này (gần tôi) / cái đó (gần bạn) / cái kia (xa cả hai). Đứng một mình như danh từ.)
   Ví dụ: これは 本です。  = Cái này là quyển sách.
• この N / その N / あの N  (N này / N đó / N kia. Bắt buộc phải có danh từ đi sau.)
   Ví dụ: この 本は わたしのです。  = Quyển sách này là của tôi.
• そうです / そうじゃ ありません  (Đúng vậy / Không phải vậy. Dùng trả lời câu hỏi có–không.)
   Ví dụ: はい、そうです。  = Vâng, đúng vậy.', 30),
  (17, 5, '読  Đọc', 'Làm phần 読み物 hoặc 練習C của bài đang học. Đọc to thành tiếng ít nhất 1 lượt.', 20),
  (17, 6, '耳  Nghe', 'Làm 聴解 (phần nghe) trong sách bài tập Minna 標準問題集 của bài đang học.', 20),
  (18, 1, '◐  Khởi động', 'Ôn nhanh nội dung hôm qua: đọc lại Kanji và mẫu ngữ pháp cũ, không nhìn đáp án.', 5),
  (18, 2, '語  Từ vựng', 'Từ mới Minna bài 2:
• おみやげ（お土産） = Quà lưu niệm
• えいご（英語） = Tiếng Anh
• にほんご（日本語） = Tiếng Nhật
• ～ご（～語） = Tiếng …
• なに（何） = Cái gì
• なん～（何～） = Mấy …, bao nhiêu …
• そう = Như vậy, đúng thế
• あのう = À… ờ… (ngập ngừng khi bắt chuyện)
• どうぞ = Xin mời
• そうですか = Thế à, vậy à
• ちがいます（違います） = Khác; sai
• これからおせわになります（これからお世話になります） = Từ nay mong được anh/chị giúp đỡ
• こちらこそよろしく = Chính tôi mới mong được giúp đỡ
• カレンダー = Lịch (treo tường)
• ボタン = Cái nút, cúc áo
• まんねんひつ（万年筆） = Bút máy
• どの = ~ nào
• どれ = Cái nào (trong nhiều cái)
• ポケット = Túi (áo, quần)
• さいふ（財布） = Cái ví
• てぶくろ（手袋） = Găng tay
• ゆびわ（指輪） = Nhẫn
• はいざら（灰皿） = Gạt tàn
• テキスト = Giáo trình, sách giáo khoa
• ファックス = Máy fax
• マッチ = Que diêm
• おくりもの（贈り物） = Quà biếu', 57),
  (18, 3, '漢  Kanji', 'Học 5 chữ Kanji ngay trong từ của hôm nay — nhớ cách đọc trong từ trước, chưa cần thuộc mọi âm đọc.
• 土 [THỔ] Đất — On: ド / Kun: つち
   Trong từ hôm nay: お土産（おみやげ）Quà lưu niệm
   Mẹo: Cây mầm cắm xuống mặt ĐẤT. Giống 士 nhưng vạch dưới dài hơn vạch trên.
• 語 [NGỮ] Ngôn ngữ, từ — On: ゴ / Kun: かた(る)
   Trong từ hôm nay: 英語（えいご）Tiếng Anh ・ 日本語（にほんご）Tiếng Nhật ・ ～語（～ご）Tiếng …
   Mẹo: 言 (nói) + 五 (năm) + 口 (miệng) = năm cái miệng cùng nói → NGÔN NGỮ.
• 話 [THOẠI] Nói chuyện, câu chuyện — On: ワ / Kun: はな(す)・はなし
   Trong từ hôm nay: これからお世話になります（これからおせわになります）Từ nay mong được anh/chị giúp đỡ
   Mẹo: 言 (lời nói) + 舌 (cái lưỡi) = dùng lưỡi để phát ra lời → NÓI CHUYỆN.
• 万 [VẠN] Vạn (10.000) — On: マン・バン
   Trong từ hôm nay: 万年筆（まんねんひつ）Bút máy
   Mẹo: Ba nét đơn giản. Nhớ: 10.000 yên = 一万円, tờ tiền lớn nhất của Nhật.
• 年 [NIÊN] Năm — On: ネン / Kun: とし
   Trong từ hôm nay: 万年筆（まんねんひつ）Bút máy
   Mẹo: Hình cây lúa trĩu hạt. Lúa chín một vụ = trôi qua một NĂM.', 20),
  (18, 4, '文  Ngữ pháp', 'Minna bài 2 (2/2) — これ・それ・あれ — Chỉ đồ vật
• N1 の N2 (chất liệu, chủ đề)  (N2 làm bằng / nói về N1.)
   Ví dụ: これは 日本語の 本です。  = Đây là sách tiếng Nhật.
• 〜は 〜ですか、〜ですか  (Câu hỏi lựa chọn: A hay B?)
   Ví dụ: これは ペンですか、えんぴつですか。  = Cái này là bút bi hay bút chì?
• そうですか  (thế à / vậy à. Đáp lại thông tin mới nhận được.)
   Ví dụ: 「山田さんは 来ません。」「そうですか。」  = "Anh Yamada không đến." "Vậy à."', 30),
  (19, 1, '◐  Khởi động', 'Ôn nhanh nội dung hôm qua: đọc lại Kanji và mẫu ngữ pháp cũ, không nhìn đáp án.', 5),
  (19, 2, '語  Từ vựng', 'Từ mới Minna bài 3:
• ここ = Chỗ này
• そこ = Chỗ đó
• あそこ = Chỗ kia
• どこ = Ở đâu
• こちら = Phía này, đằng này (lịch sự)
• そちら = Phía đó (lịch sự)
• あちら = Phía kia (lịch sự)
• きょうしつ（教室） = Phòng học
• しょくどう（食堂） = Nhà ăn, căng tin
• じむしょ（事務所） = Văn phòng
• かいぎしつ（会議室） = Phòng họp
• うけつけ（受付） = Quầy lễ tân
• ロビー = Sảnh (khách sạn, tòa nhà)
• へや（部屋） = Phòng
• トイレ / おてあらい（お手洗い） = Nhà vệ sinh
• トイレ = Nhà vệ sinh
• かいだん（階段） = Cầu thang
• エレベーター = Thang máy
• エスカレーター = Thang cuốn
• じどうはんばいき（自動販売機） = Máy bán hàng tự động', 43),
  (19, 3, '漢  Kanji', 'Học 1 chữ Kanji ngay trong từ của hôm nay — nhớ cách đọc trong từ trước, chưa cần thuộc mọi âm đọc.
• 食 [THỰC] Ăn — On: ショク / Kun: た(べる)
   Trong từ hôm nay: 食堂（しょくどう）Nhà ăn, căng tin
   Mẹo: Cái mái che 亼 úp trên mâm cơm đầy = bữa ĂN.', 4),
  (19, 4, '文  Ngữ pháp', 'Minna bài 3 (1/3) — ここ・そこ・あそこ — Chỉ nơi chốn
• ここ / そこ / あそこ  (Chỗ này / chỗ đó / chỗ kia.)
   Ví dụ: ここは 教室です。  = Đây là phòng học.
• こちら / そちら / あちら  (Phía này / phía đó / phía kia. Lịch sự hơn, cũng dùng chỉ người.)
   Ví dụ: こちらは 田中さんです。  = Đây là anh Tanaka.', 20),
  (19, 5, '読  Đọc', 'Đọc lại 5 câu đã học trong app. Gạch chân một từ còn mờ, chép câu đó vào sổ.', 20),
  (20, 1, '◐  Khởi động', 'Ôn nhanh nội dung hôm qua: đọc lại Kanji và mẫu ngữ pháp cũ, không nhìn đáp án.', 5),
  (20, 2, '語  Từ vựng', 'Từ mới Minna bài 3:
• でんわ（電話） = Điện thoại
• くに（国） = Đất nước
• かいしゃ（会社） = Công ty
• うち（家） = Nhà (của mình)
• くつ（靴） = Giày
• ネクタイ = Cà vạt
• ワイン = Rượu vang
• うりば（売り場） = Quầy bán hàng
• ちか（地下） = Tầng hầm, dưới mặt đất
• 〜がい / 〜かい（〜階） = Tầng ~
• なんがい（何階） = Tầng mấy
• えん（円） = Yên (tiền Nhật)
• いくら = Bao nhiêu tiền
• ひゃく（百） = Một trăm
• せん（千） = Một nghìn', 33),
  (20, 3, '漢  Kanji', 'Học 4 chữ Kanji ngay trong từ của hôm nay — nhớ cách đọc trong từ trước, chưa cần thuộc mọi âm đọc.
• 下 [HẠ] Dưới, xuống — On: カ・ゲ / Kun: した・さ(がる)・くだ(さい)
   Trong từ hôm nay: 地下（ちか）Tầng hầm, dưới mặt đất
   Mẹo: Một vạch mốc, có nét thò XUỐNG phía dưới. Lộn ngược của 上.
• 円 [VIÊN] Đồng yên, tròn — On: エン / Kun: まる(い)
   Trong từ hôm nay: 円（えん）Yên (tiền Nhật)
   Mẹo: Khung vuông có hai vạch = đồng xu TRÒN đặt trong khay. Tiền Nhật = ĐỒNG YÊN.
• 百 [BÁCH] Trăm — On: ヒャク
   Trong từ hôm nay: 百（ひゃく）Một trăm
   Mẹo: Số 一 (một) đặt trên 白 (trắng) = một trang giấy trắng ghi đủ 100 gạch.
• 千 [THIÊN] Nghìn — On: セン / Kun: ち
   Trong từ hôm nay: 千（せん）Một nghìn
   Mẹo: Chữ 十 (mười) có thêm một nét phẩy trên đầu = mười nhân lên nhiều lần → NGHÌN.', 16),
  (20, 4, '文  Ngữ pháp', 'Minna bài 3 (2/3) — ここ・そこ・あそこ — Chỉ nơi chốn
• N は 場所 です  (N ở chỗ nào đó.)
   Ví dụ: 電話は 2階です。  = Điện thoại ở tầng 2.
• N は どこですか  (N ở đâu?)
   Ví dụ: トイレは どこですか。  = Nhà vệ sinh ở đâu ạ?', 20),
  (20, 5, '耳  Nghe', 'Xem 15 phút Erin''s Challenge hoặc Nihongo no Mori N5, bật phụ đề tiếng Nhật.', 20),
  (21, 1, '◐  Khởi động', 'Ôn nhanh nội dung hôm qua: đọc lại Kanji và mẫu ngữ pháp cũ, không nhìn đáp án.', 5),
  (21, 2, '語  Từ vựng', 'Từ mới Minna bài 3:
• まん（万） = Mười nghìn
• みせてください（見せてください） = Cho tôi xem ~
• ください = Hãy cho tôi; xin hãy…
• イタリア = Nước Ý
• スイス = Thụy Sĩ
• フランス = Nước Pháp
• いりぐち（入口） = Lối vào
• でぐち（出口） = Lối ra
• げんかん（玄関） = Lối vào nhà (chỗ cởi giày)
• だいどころ（台所） = Nhà bếp
• ろうか（廊下） = Hành lang
• おつり = Tiền thừa, tiền thối lại
• レジ = Quầy thu ngân
• ばしょ（場所） = Địa điểm', 31),
  (21, 3, '漢  Kanji', 'Học 4 chữ Kanji ngay trong từ của hôm nay — nhớ cách đọc trong từ trước, chưa cần thuộc mọi âm đọc.
• 見 [KIẾN] Nhìn, xem — On: ケン / Kun: み(る)
   Trong từ hôm nay: 見せてください（みせてください）Cho tôi xem ~
   Mẹo: 目 (con mắt) đặt trên 儿 (đôi chân) = con mắt biết đi khắp nơi để NHÌN.
• 入 [NHẬP] Vào — On: ニュウ / Kun: はい(る)・い(れる)
   Trong từ hôm nay: 入口（いりぐち）Lối vào
   Mẹo: Giống 人 nhưng nét trái đè lên nét phải, như mũi tên chúc xuống chui VÀO. Đối lập với 出.
• 口 [KHẨU] Miệng, cửa — On: コウ / Kun: くち
   Trong từ hôm nay: 入口（いりぐち）Lối vào ・ 出口（でぐち）Lối ra
   Mẹo: Ô vuông = cái MIỆNG đang há. Từ nghĩa miệng → cái cửa (nơi ra vào).
• 出 [XUẤT] Ra, đi ra — On: シュツ / Kun: で(る)・だ(す)
   Trong từ hôm nay: 出口（でぐち）Lối ra
   Mẹo: Hai chữ 山 chồng lên nhau = mầm cây chui RA khỏi núi đất. Đối lập với 入 (vào).', 16),
  (21, 4, '文  Ngữ pháp', 'Minna bài 3 (3/3) — ここ・そこ・あそこ — Chỉ nơi chốn
• いくらですか  (Bao nhiêu tiền?)
   Ví dụ: この かばんは いくらですか。  = Cái túi này bao nhiêu tiền?', 10),
  (22, 1, '部  Bộ thủ', 'Ôn bộ thủ: nhìn bộ nói nghĩa, kể 1 Kanji chứa bộ đó.', 10),
  (22, 2, '漢  Kanji', 'Ôn 38 chữ Kanji của Minna bài 1–3 qua từ chứa nó: che nghĩa → đọc từ, che từ → nhớ chữ. Trong app, đánh dấu chữ còn mờ.
人 ・ 先 ・ 生 ・ 学 ・ 会 ・ 社 ・ 行 ・ 大 ・ 電 ・ 気 ・ 何 ・ 来 ・ 名 ・ 前 ・ 国 ・ 中 ・ 日 ・ 本 ・ 書 ・ 新 ・ 聞 ・ 手 ・ 時 ・ 車 ・ 土 ・ 語 ・ 話 ・ 万 ・ 年 ・ 食 ・ 下 ・ 円 ・ 百 ・ 千 ・ 見 ・ 入 ・ 口 ・ 出', 20),
  (22, 3, '文  Ngữ pháp', 'Làm phần 練習B và 練習C trong Minna bài 1–3. Sau đó tự đặt 5 câu mới.', 25),
  (22, 4, '語  Từ vựng', 'Ôn lại toàn bộ từ vựng Minna bài 1–3. Từ nào quên đánh dấu ''Đang học''.', 20),
  (22, 5, '耳読  Nghe + Đọc', 'Làm phần 問題 (nghe + đọc) cuối mỗi bài trong Minna bài 1–3. Ghi lỗi sai vào cột Ghi chú.', 25),
  (23, 1, '◐  Khởi động', 'Ôn nhanh nội dung hôm qua: đọc lại Kanji và mẫu ngữ pháp cũ, không nhìn đáp án.', 5),
  (23, 2, '語  Từ vựng', 'Từ mới Minna bài 4:
• おきます（起きます） = Thức dậy
• ねます（寝ます） = Đi ngủ
• はたらきます（働きます） = Làm việc
• やすみます（休みます） = Nghỉ ngơi
• べんきょうします（勉強します） = Học bài
• おわります（終わります） = Kết thúc
• デパート = Cửa hàng bách hoá
• ぎんこう（銀行） = Ngân hàng
• ゆうびんきょく（郵便局） = Bưu điện
• としょかん（図書館） = Thư viện
• びじゅつかん（美術館） = Bảo tàng mỹ thuật
• いま（今） = Bây giờ
• 〜じ（〜時） = ~ giờ
• 〜ふん / 〜ぷん（〜分） = ~ phút
• はん（半） = Rưỡi, một nửa', 33),
  (23, 3, '漢  Kanji', 'Học 4 chữ Kanji ngay trong từ của hôm nay — nhớ cách đọc trong từ trước, chưa cần thuộc mọi âm đọc.
• 休 [HƯU] Nghỉ ngơi — On: キュウ / Kun: やす(む)
   Trong từ hôm nay: 休みます（やすみます）Nghỉ ngơi
   Mẹo: 亻 (người) tựa vào 木 (gốc cây) = ngồi dựa gốc cây NGHỈ mát. Hình ảnh dễ nhớ nhất trong 103 chữ.
• 今 [KIM] Bây giờ — On: コン・キン / Kun: いま
   Trong từ hôm nay: 今（いま）Bây giờ
   Mẹo: Mái che 亼 chụp xuống một điểm = chộp đúng khoảnh khắc HIỆN TẠI.
• 分 [PHÂN] Phút, phần, hiểu — On: ブン・フン・プン / Kun: わ(かる)・わ(ける)
   Trong từ hôm nay: 〜分（〜ふん / 〜ぷん）~ phút
   Mẹo: 八 (chia ra) + 刀 (con dao) = lấy dao CHIA nhỏ. Chia giờ ra → PHÚT; chia vấn đề ra → HIỂU.
• 半 [BÁN] Một nửa, rưỡi — On: ハン / Kun: なか(ば)
   Trong từ hôm nay: 半（はん）Rưỡi, một nửa
   Mẹo: Chữ 八 (chia đôi) đè lên đầu = cắt vật ra làm hai → MỘT NỬA.', 16),
  (23, 4, '文  Ngữ pháp', 'Minna bài 4 (1/4) — Giờ giấc & Thì của động từ
• 今 〜時 〜分です  (Bây giờ là ~ giờ ~ phút.)
   Ví dụ: 今 4時5分です。  = Bây giờ là 4 giờ 5 phút.
• V ます / V ません  (Thể lịch sự hiện tại–tương lai, khẳng định và phủ định.)
   Ví dụ: わたしは 毎日 起きます。  = Tôi thức dậy mỗi ngày.', 20),
  (23, 5, '耳  Nghe', 'Shadowing 15 phút: bật lại 会話 hôm qua, nói đuổi theo băng, không nhìn script.', 20),
  (24, 1, '◐  Khởi động', 'Ôn nhanh nội dung hôm qua: đọc lại Kanji và mẫu ngữ pháp cũ, không nhìn đáp án.', 5),
  (24, 2, '語  Từ vựng', 'Từ mới Minna bài 4:
• なんじ（何時） = Mấy giờ
• なんぷん（何分） = Mấy phút
• ごぜん（午前） = Buổi sáng (trước 12 giờ)
• ごご（午後） = Buổi chiều (sau 12 giờ)
• あさ（朝） = Buổi sáng
• ひる（昼） = Buổi trưa
• ばん / よる（晩 / 夜） = Buổi tối / ban đêm
• おととい（一昨日） = Hôm kia
• きのう（昨日） = Hôm qua
• きょう（今日） = Hôm nay
• あした（明日） = Ngày mai
• あす（明日） = Ngày mai (trang trọng)
• あさって = Ngày kia
• けさ（今朝） = Sáng nay
• こんばん（今晩） = Tối nay
• やすみ（休み） = Ngày nghỉ, sự nghỉ ngơi
• ひるやすみ（昼休み） = Giờ nghỉ trưa
• しけん（試験） = Kỳ thi
• かいぎ（会議） = Cuộc họp
• えいが（映画） = Phim', 43),
  (24, 3, '漢  Kanji', 'Học 3 chữ Kanji ngay trong từ của hôm nay — nhớ cách đọc trong từ trước, chưa cần thuộc mọi âm đọc.
• 午 [NGỌ] Giữa trưa — On: ゴ
   Trong từ hôm nay: 午前（ごぜん）Buổi sáng (trước 12 giờ) ・ 午後（ごご）Buổi chiều (sau 12 giờ)
   Mẹo: Giống chữ 牛 (con bò) nhưng thiếu một nét. Giờ NGỌ trong 12 con giáp = 11–13h.
• 後 [HẬU] Sau, phía sau — On: ゴ・コウ / Kun: あと・うし(ろ)
   Trong từ hôm nay: 午後（ごご）Buổi chiều (sau 12 giờ)
   Mẹo: Bộ 彳 (bước đi) + phần dưới là sợi dây buộc chân = bước chậm nên bị tụt lại phía SAU.
• 一 [NHẤT] Một — On: イチ・イツ / Kun: ひと(つ)
   Trong từ hôm nay: 一昨日（おととい）Hôm kia
   Mẹo: Một nét ngang = số 1. Dễ nhất trong 103 chữ, nhưng chú ý 一人 đọc bất quy tắc là ひとり.', 12),
  (24, 4, '文  Ngữ pháp', 'Minna bài 4 (2/4) — Giờ giấc & Thì của động từ
• V ました / V ませんでした  (Thể lịch sự quá khứ, khẳng định và phủ định.)
   Ví dụ: きのう 勉強しませんでした。  = Hôm qua tôi đã không học bài.
• 時間 に V  (に đi với giờ, thứ, ngày tháng. Không thêm に sau 毎日, きのう, あした.)
   Ví dụ: 7時に 起きます。  = Tôi dậy lúc 7 giờ.', 20),
  (25, 1, '◐  Khởi động', 'Ôn nhanh nội dung hôm qua: đọc lại Kanji và mẫu ngữ pháp cũ, không nhìn đáp án.', 5),
  (25, 2, '語  Từ vựng', 'Từ mới Minna bài 4:
• まいあさ（毎朝） = Mỗi sáng
• まいばん（毎晩） = Mỗi tối
• まいにち（毎日） = Hằng ngày
• げつようび（月曜日） = Thứ Hai
• かようび（火曜日） = Thứ Ba
• すいようび（水曜日） = Thứ Tư
• もくようび（木曜日） = Thứ Năm
• きんようび（金曜日） = Thứ Sáu
• どようび（土曜日） = Thứ Bảy
• にちようび（日曜日） = Chủ Nhật
• なんようび（何曜日） = Thứ mấy
• たいへんですね（大変ですね） = Vất vả nhỉ
• ばんごう（番号） = Số (điện thoại, phòng…)
• なんばん（何番） = Số mấy', 31),
  (25, 3, '漢  Kanji', 'Học 6 chữ Kanji ngay trong từ của hôm nay — nhớ cách đọc trong từ trước, chưa cần thuộc mọi âm đọc.
• 毎 [MỖI] Mỗi, hằng — On: マイ
   Trong từ hôm nay: 毎朝（まいあさ）Mỗi sáng ・ 毎晩（まいばん）Mỗi tối ・ 毎日（まいにち）Hằng ngày
   Mẹo: Có bộ 母 (mẹ) bên trong = MỖI ngày mẹ đều lo cho ta.
• 月 [NGUYỆT] Tháng, mặt trăng — On: ゲツ・ガツ / Kun: つき
   Trong từ hôm nay: 月曜日（げつようび）Thứ Hai
   Mẹo: Hình mặt TRĂNG khuyết. Trăng tròn một chu kỳ = một THÁNG.
• 火 [HỎA] Lửa — On: カ / Kun: ひ
   Trong từ hôm nay: 火曜日（かようび）Thứ Ba
   Mẹo: Ngọn LỬA đang cháy với các tia bắn ra hai bên.
• 水 [THỦY] Nước — On: スイ / Kun: みず
   Trong từ hôm nay: 水曜日（すいようび）Thứ Tư
   Mẹo: Dòng nước chảy với các tia bắn ra hai bên.
• 木 [MỘC] Cây, gỗ — On: モク・ボク / Kun: き
   Trong từ hôm nay: 木曜日（もくようび）Thứ Năm
   Mẹo: Thân cây thẳng, có cành vươn ngang và rễ tỏa xuống.
• 金 [KIM] Vàng, tiền, kim loại — On: キン / Kun: かね
   Trong từ hôm nay: 金曜日（きんようび）Thứ Sáu
   Mẹo: Mái nhà che hai hạt vàng chôn dưới đất = kho báu KIM loại.', 24),
  (25, 4, '文  Ngữ pháp', 'Minna bài 4 (3/4) — Giờ giấc & Thì của động từ
• N1 から N2 まで  (Từ N1 đến N2 (thời gian hoặc nơi chốn).)
   Ví dụ: 9時から 5時まで 働きます。  = Tôi làm việc từ 9 giờ đến 5 giờ.
• N1 と N2  (N1 và N2. Chỉ nối danh từ, không nối câu.)
   Ví dụ: 月曜日と 火曜日  = Thứ Hai và thứ Ba.', 20),
  (25, 5, '読  Đọc', 'Làm phần 読み物 hoặc 練習C của bài đang học. Đọc to thành tiếng ít nhất 1 lượt.', 20),
  (26, 1, '◐  Khởi động', 'Ôn nhanh nội dung hôm qua: đọc lại Kanji và mẫu ngữ pháp cũ, không nhìn đáp án.', 5),
  (26, 2, '語  Từ vựng', 'Từ mới Minna bài 4:
• ゆうべ（昨夜） = Tối qua
• ゆうがた（夕方） = Chiều tối
• ゼロ = Số không
• れい（零） = Số không (Hán tự)
• はじまります（始まります） = Bắt đầu (tự bắt đầu)
• ひるま（昼間） = Ban ngày
• こんや（今夜） = Đêm nay
• しゅう（週） = Tuần
• さらいしゅう（再来週） = Tuần sau nữa
• ～じゅう（～中） = Suốt …, khắp …
• ～すぎ = Quá … (giờ)
• ～まえ（～前） = Trước …; kém (giờ)
• ～ころ = Khoảng (thời điểm)
• さき（先） = Trước; phía trước
• さいしょ（最初） = Đầu tiên, lúc đầu
• さいご（最後） = Cuối cùng
• さっき = Lúc nãy
• このあいだ（この間） = Hôm trước, mới đây
• このごろ（この頃） = Dạo này
• むかし（昔） = Ngày xưa
• こんど（今度） = Lần này; lần tới
• じだい（時代） = Thời đại, thời kỳ', 47),
  (26, 3, '漢  Kanji', 'Học 2 chữ Kanji ngay trong từ của hôm nay — nhớ cách đọc trong từ trước, chưa cần thuộc mọi âm đọc.
• 間 [GIAN] Khoảng, giữa — On: カン・ケン / Kun: あいだ・ま
   Trong từ hôm nay: 昼間（ひるま）Ban ngày ・ この間（このあいだ）Hôm trước, mới đây
   Mẹo: 門 (cánh cửa) có 日 (mặt trời) lọt vào giữa = ánh nắng lách qua KHE HỞ giữa hai cánh cửa.
• 週 [CHU] Tuần — On: シュウ
   Trong từ hôm nay: 週（しゅう）Tuần ・ 再来週（さらいしゅう）Tuần sau nữa
   Mẹo: Bộ 辶 (di chuyển) + 周 (vòng quanh) = đi hết một VÒNG bảy ngày → một TUẦN.', 8),
  (26, 4, '文  Ngữ pháp', 'Minna bài 4 (4/4) — Giờ giấc & Thì của động từ
• 〜ね  (… nhỉ / … nhé. Tìm sự đồng cảm hoặc xác nhận với người nghe.)
   Ví dụ: 日本語が 上手ですね。  = Bạn giỏi tiếng Nhật nhỉ.', 10),
  (27, 1, '◐  Khởi động', 'Ôn nhanh nội dung hôm qua: đọc lại Kanji và mẫu ngữ pháp cũ, không nhìn đáp án.', 5),
  (27, 2, '語  Từ vựng', 'Từ mới Minna bài 5:
• いきます（行きます） = Đi
• きます（来ます） = Đến
• かえります（帰ります） = Về
• がっこう（学校） = Trường học
• スーパー = Siêu thị
• えき（駅） = Nhà ga
• ひこうき（飛行機） = Máy bay
• ふね（舟） = Thuyền
• でんしゃ（電車） = Tàu điện
• ちかてつ（地下鉄） = Tàu điện ngầm
• しんかんせん（新幹線） = Tàu Shinkansen
• じてんしゃ（自転車） = Xe đạp
• あるいて（歩いて） = Đi bộ
• ひと（人） = Người
• ともだち（友だち） = Bạn bè
• かれ（彼） = Anh ấy; bạn trai
• かのじょ（彼女） = Cô ấy; bạn gái
• かぞく（家族） = Gia đình
• ひとりで（一人で） = Một mình
• せんしゅう（先週） = Tuần trước', 43),
  (27, 3, '漢  Kanji', 'Học 4 chữ Kanji ngay trong từ của hôm nay — nhớ cách đọc trong từ trước, chưa cần thuộc mọi âm đọc.
• 校 [HIỆU] Trường học — On: コウ
   Trong từ hôm nay: 学校（がっこう）Trường học
   Mẹo: 木 (gỗ) + 交 (giao nhau) = ngôi nhà gỗ nơi mọi người GIAO LƯU học tập → TRƯỜNG.
• 駅 [DỊCH] Nhà ga — On: エキ
   Trong từ hôm nay: 駅（えき）Nhà ga
   Mẹo: 馬 (con ngựa) + 尺 = trạm đổi ngựa ngày xưa, nay là NHÀ GA tàu.
• 友 [HỮU] Bạn bè — On: ユウ / Kun: とも
   Trong từ hôm nay: 友だち（ともだち）Bạn bè
   Mẹo: Hai bàn tay nắm lấy nhau = tình BẠN.
• 女 [NỮ] Nữ, phụ nữ — On: ジョ / Kun: おんな
   Trong từ hôm nay: 彼女（かのじょ）Cô ấy; bạn gái
   Mẹo: Dáng người phụ nữ đang quỳ, hai tay đặt trước gối.', 16),
  (27, 4, '文  Ngữ pháp', 'Minna bài 5 (1/3) — Đi lại — Phương tiện & Điểm đến
• 場所 へ 行きます / 来ます / 帰ります  (Đi / đến / về nơi nào đó. へ đọc là ''e''.)
   Ví dụ: あした 東京へ 行きます。  = Ngày mai tôi đi Tokyo.
• どこ[へ]も 行きません  (Không đi đâu cả. も thay chỗ trợ từ để phủ định toàn bộ.)
   Ví dụ: どこも 行きませんでした。  = Tôi đã chẳng đi đâu cả.', 20),
  (27, 5, '耳  Nghe', 'Làm 聴解 (phần nghe) trong sách bài tập Minna 標準問題集 của bài đang học.', 20),
  (28, 1, '◐  Khởi động', 'Ôn nhanh nội dung hôm qua: đọc lại Kanji và mẫu ngữ pháp cũ, không nhìn đáp án.', 5),
  (28, 2, '語  Từ vựng', 'Từ mới Minna bài 5:
• こんしゅう（今週） = Tuần này
• らいしゅう（来週） = Tuần sau
• せんげつ（先月） = Tháng trước
• こんげつ（今月） = Tháng này
• らいげつ（来月） = Tháng sau
• きょねん（去年） = Năm ngoái
• ことし（今年） = Năm nay
• らいねん（来年） = Năm sau
• とし（年） = Năm; tuổi
• なんねん（何年） = Năm nào; mấy năm
• ～がつ（～月） = Tháng … (tên tháng)
• なんがつ（何月） = Tháng mấy
• ついたち（一日） = Ngày mùng 1
• いちにち（一日） = Một ngày
• ふつか（二日） = Ngày mùng 2; hai ngày
• みっか（三日） = Ngày mùng 3; ba ngày
• よっか（四日） = Ngày mùng 4; bốn ngày
• いつか（五日） = Ngày mùng 5; năm ngày
• むいか（六日） = Ngày mùng 6; sáu ngày
• なのか（七日） = Ngày mùng 7; bảy ngày', 43),
  (28, 3, '漢  Kanji', 'Học 6 chữ Kanji ngay trong từ của hôm nay — nhớ cách đọc trong từ trước, chưa cần thuộc mọi âm đọc.
• 二 [NHỊ] Hai — On: ニ / Kun: ふた(つ)
   Trong từ hôm nay: 二日（ふつか）Ngày mùng 2; hai ngày
   Mẹo: Hai nét ngang = số 2. Nét trên ngắn, nét dưới dài — viết ngược là sai.
• 三 [TAM] Ba — On: サン / Kun: みっ(つ)
   Trong từ hôm nay: 三日（みっか）Ngày mùng 3; ba ngày
   Mẹo: Ba nét ngang = số 3. Nét giữa ngắn nhất.
• 四 [TỨ] Bốn — On: シ / Kun: よっ(つ)・よん
   Trong từ hôm nay: 四日（よっか）Ngày mùng 4; bốn ngày
   Mẹo: Ô vuông có hai chân bên trong. Lưu ý 四時 đọc là よじ, không phải しじ.
• 五 [NGŨ] Năm (5) — On: ゴ / Kun: いつ(つ)
   Trong từ hôm nay: 五日（いつか）Ngày mùng 5; năm ngày
   Mẹo: Hai vạch trời-đất kẹp một hình chữ Z ở giữa. Nhớ: NGŨ có hình như số 5 viết vội.
• 六 [LỤC] Sáu — On: ロク / Kun: むっ(つ)
   Trong từ hôm nay: 六日（むいか）Ngày mùng 6; sáu ngày
   Mẹo: Cái nắp 亠 trên hai chân = con số 6 đội mũ.
• 七 [THẤT] Bảy — On: シチ / Kun: なな(つ)
   Trong từ hôm nay: 七日（なのか）Ngày mùng 7; bảy ngày
   Mẹo: Giống số 7 viết ngược. Đọc là なな hoặc しち — trong đề thi hay hỏi 七時 (しちじ).', 24),
  (28, 4, '文  Ngữ pháp', 'Minna bài 5 (2/3) — Đi lại — Phương tiện & Điểm đến
• 乗り物 で 行きます  (Đi bằng phương tiện gì. Riêng ''đi bộ'' là 歩いて, không dùng で.)
   Ví dụ: 電車で 会社へ 行きます。  = Tôi đi làm bằng tàu điện.
• 人 と V  (Làm gì cùng với ai. Một mình thì nói 一人で.)
   Ví dụ: 友だちと 日本へ 来ました。  = Tôi đã đến Nhật cùng với bạn.', 20),
  (28, 5, '読  Đọc', 'Đọc lại 5 câu đã học trong app. Gạch chân một từ còn mờ, chép câu đó vào sổ.', 20),
  (29, 1, '◐  Khởi động', 'Ôn nhanh nội dung hôm qua: đọc lại Kanji và mẫu ngữ pháp cũ, không nhìn đáp án.', 5),
  (29, 2, '語  Từ vựng', 'Từ mới Minna bài 5:
• ようか（八日） = Ngày mùng 8; tám ngày
• ここのか（九日） = Ngày mùng 9; chín ngày
• とおか（十日） = Ngày mùng 10; mười ngày
• じゅうよっか（十四日） = Ngày 14
• はつか（二十日） = Ngày 20; hai mươi ngày
• にじゅうよっか（二十四日） = Ngày 24
• ～にち（～日） = Ngày …; … ngày
• なんにち（何日） = Ngày mấy; mấy ngày
• いつ = Khi nào
• たんじょうび（誕生日） = Sinh nhật
• 〜ばんせん（〜番線） = Đường ray / sân ga số ~
• つぎの（次の） = ~ tiếp theo
• ふつう（普通） = Thông thường
• きゅうこう（急行） = Tàu tốc hành
• とっきゅう（特急） = Tàu tốc hành đặc biệt
• まいしゅう（毎週） = Mỗi tuần
• まいつき（毎月） = Mỗi tháng
• まいとし（毎年） = Mỗi năm
• おととし（一昨年） = Năm kia
• さらいねん（再来年） = Năm sau nữa
• いっしょ（一緒） = Cùng nhau
• さらいげつ（再来月） = Tháng sau nữa
• よてい（予定） = Dự định, kế hoạch
• ひさしぶり（久しぶり） = Lâu rồi mới …
• オートバイ = Xe máy
• のりもの（乗り物） = Phương tiện đi lại', 55),
  (29, 3, '漢  Kanji', 'Học 3 chữ Kanji ngay trong từ của hôm nay — nhớ cách đọc trong từ trước, chưa cần thuộc mọi âm đọc.
• 八 [BÁT] Tám — On: ハチ / Kun: やっ(つ)
   Trong từ hôm nay: 八日（ようか）Ngày mùng 8; tám ngày
   Mẹo: Hai nét tách ra hai bên, giống số 8 bị bổ đôi.
• 九 [CỬU] Chín — On: キュウ・ク / Kun: ここの(つ)
   Trong từ hôm nay: 九日（ここのか）Ngày mùng 9; chín ngày
   Mẹo: Giống chữ 力 nhưng đuôi cong. Nhớ: số 9 uốn cong cái đuôi.
• 十 [THẬP] Mười — On: ジュウ / Kun: とお
   Trong từ hôm nay: 十日（とおか）Ngày mùng 10; mười ngày ・ 十四日（じゅうよっか）Ngày 14 ・ 二十日（はつか）Ngày 20; hai mươi ngày ・ 二十四日（にじゅうよっか）Ngày 24
   Mẹo: Dấu cộng = đủ mười ngón tay của hai bàn tay chắp ngang dọc.', 12),
  (29, 4, '文  Ngữ pháp', 'Minna bài 5 (3/3) — Đi lại — Phương tiện & Điểm đến
• いつ V ますか  (Khi nào thì làm gì? いつ không đi kèm trợ từ に.)
   Ví dụ: いつ 日本へ 来ましたか。  = Bạn đến Nhật khi nào?
• 〜よ  (… đấy / … đó. Báo cho người nghe thông tin họ chưa biết.)
   Ví dụ: 電車が 来ましたよ。  = Tàu đến rồi đấy.', 20),
  (30, 1, '◐  Khởi động', 'Ôn nhanh nội dung hôm qua: đọc lại Kanji và mẫu ngữ pháp cũ, không nhìn đáp án.', 5),
  (30, 2, '語  Từ vựng', 'Từ mới Minna bài 6:
• たべます（食べます） = Ăn
• のみます（飲みます） = Uống (nước; cả thuốc)
• すいます（吸います） = Hút (thuốc)
• みます（見ます） = Xem, nhìn
• ききます（聞きます） = Nghe, hỏi
• よみます（読みます） = Đọc
• かきます（書きます） = Viết, vẽ
• かいます（買います） = Mua
• とります（撮ります） = Chụp (ảnh)
• します = Làm
• あいます（会います） = Gặp
• ごはん（ご飯） = Cơm
• あさごはん（朝ごはん） = Bữa sáng
• ひるごはん（昼御飯） = Bữa trưa
• ばんごはん（晩御飯） = Bữa tối
• たまご（卵） = Trứng
• にく（肉） = Thịt
• さかな（魚） = Cá', 39),
  (30, 3, '漢  Kanji', 'Học 4 chữ Kanji ngay trong từ của hôm nay — nhớ cách đọc trong từ trước, chưa cần thuộc mọi âm đọc.
• 飲 [ẨM] Uống — On: イン / Kun: の(む)
   Trong từ hôm nay: 飲みます（のみます）Uống (nước; cả thuốc)
   Mẹo: 食 (ăn) + 欠 (há miệng) = há miệng ngửa cổ ra → UỐNG.
• 読 [ĐỘC] Đọc — On: ドク / Kun: よ(む)
   Trong từ hôm nay: 読みます（よみます）Đọc
   Mẹo: 言 (lời nói) + 売 (bán) = đọc to lời rao bán hàng → ĐỌC.
• 買 [MÃI] Mua — On: バイ / Kun: か(う)
   Trong từ hôm nay: 買います（かいます）Mua
   Mẹo: Cái lưới 罒 chụp lên 貝 (vỏ sò = tiền) = gom tiền lại để MUA.
• 魚 [NGƯ] Cá — On: ギョ / Kun: さかな
   Trong từ hôm nay: 魚（さかな）Cá
   Mẹo: Từ trên xuống: đầu cá, thân có vảy, bốn chấm dưới là cái đuôi xòe.', 16),
  (30, 4, '文  Ngữ pháp', 'Minna bài 6 (1/3) — Tân ngữ を & Rủ rê
• N を V  (を là trợ từ đánh dấu tân ngữ — vật chịu tác động của động từ. Đọc là o.)
   Ví dụ: ごはんを 食べます。  = Tôi ăn cơm.
• N を します  (Làm gì đó / chơi môn gì đó.)
   Ví dụ: サッカーを します。  = Tôi chơi bóng đá.', 20),
  (30, 5, '耳  Nghe', 'Xem 15 phút Erin''s Challenge hoặc Nihongo no Mori N5, bật phụ đề tiếng Nhật.', 20),
  (31, 1, '◐  Khởi động', 'Ôn nhanh nội dung hôm qua: đọc lại Kanji và mẫu ngữ pháp cũ, không nhìn đáp án.', 5),
  (31, 2, '語  Từ vựng', 'Từ mới Minna bài 6:
• やさい（野菜） = Rau
• くだもの（果物） = Hoa quả
• みず（水） = Nước
• おちゃ（お茶） = Trà
• こうちゃ（紅茶） = Trà đen
• ぎゅうにゅう（牛乳） = Sữa bò
• ミルク = Sữa
• ジュース = Nước hoa quả
• ビール = Bia
• おさけ（お酒） = Rượu (rượu sake)
• たばこ = Thuốc lá
• てがみ（手紙） = Lá thư
• レポート = Báo cáo
• しゃしん（写真） = Ảnh
• ビデオ = Video
• みせ（店） = Cửa hàng, quán
• にわ（庭） = Sân vườn
• しゅくだい（宿題） = Bài tập về nhà
• テニス = Quần vợt
• サッカー = Bóng đá
• ちょっと = Một chút; hơi
• いつも = Luôn luôn
• ときどき（時々） = Thỉnh thoảng', 49),
  (31, 3, '漢  Kanji', 'Học 1 chữ Kanji ngay trong từ của hôm nay — nhớ cách đọc trong từ trước, chưa cần thuộc mọi âm đọc.
• 店 [ĐIẾM] Cửa hàng — On: テン / Kun: みせ
   Trong từ hôm nay: 店（みせ）Cửa hàng, quán
   Mẹo: Bộ 广 (mái hiên) che 占 (chiếm chỗ) = dựng mái chiếm một chỗ ngoài phố để bán → CỬA HÀNG.', 4),
  (31, 4, '文  Ngữ pháp', 'Minna bài 6 (2/3) — Tân ngữ を & Rủ rê
• 場所 で V  (Làm gì TẠI nơi nào. で chỉ nơi diễn ra hành động.)
   Ví dụ: 図書館で 本を 読みます。  = Tôi đọc sách ở thư viện.
• いっしょに V ませんか  (Cùng làm ~ nhé? Lời mời lịch sự, dễ từ chối.)
   Ví dụ: いっしょに 昼ごはんを 食べませんか。  = Cùng ăn trưa nhé?', 20),
  (31, 5, '耳  Nghe', 'Mở CD Minna no Nihongo bài đang học, phần 会話. Nghe 3 lượt: lượt 1 chỉ nghe, lượt 2 nhìn script, lượt 3 nghe và nhắc theo.', 20),
  (32, 1, '◐  Khởi động', 'Ôn nhanh nội dung hôm qua: đọc lại Kanji và mẫu ngữ pháp cũ, không nhìn đáp án.', 5),
  (32, 2, '語  Từ vựng', 'Từ mới Minna bài 6:
• それから = Sau đó
• いいですね = Hay đấy, được đấy
• じゃ、また = Thế nhé, hẹn gặp lại
• メキシコ = Mexico
• ゆうはん（夕飯） = Bữa tối
• ケーキ = Bánh ngọt
• きゃく（客） = Khách
• やきます（焼きます） = Nướng
• こめ（米） = Gạo
• ジャム = Mứt
• サラダ = Sa lát
• ステーキ = Bít tết
• ハンバーグ = Thịt băm viên kiểu Nhật (hamburg)
• あめ（飴） = Kẹo
• ぶどう = Nho
• アルコール = Đồ uống có cồn, cồn
• みそ（味噌） = Tương miso
• あじ（味） = Vị
• うまい = Ngon; giỏi
• にがい（苦い） = Đắng
• いっぱい（一杯） = Đầy; (một) chén, ly
• ～はい（～杯） = … cốc, … bát, … ly
• ごちそう = Bữa ăn thịnh soạn, chiêu đãi
• はなみ（花見） = Ngắm hoa (anh đào)', 51),
  (32, 3, '漢  Kanji', 'Học 1 chữ Kanji ngay trong từ của hôm nay — nhớ cách đọc trong từ trước, chưa cần thuộc mọi âm đọc.
• 花 [HOA] Hoa — On: カ / Kun: はな
   Trong từ hôm nay: 花見（はなみ）Ngắm hoa (anh đào)
   Mẹo: Bộ 艹 (cỏ cây) + 化 (biến hóa) = cây cỏ biến hóa thành thứ đẹp đẽ → HOA.', 4),
  (32, 4, '文  Ngữ pháp', 'Minna bài 6 (3/3) — Tân ngữ を & Rủ rê
• V ましょう  (Nào cùng làm ~. Mạnh hơn ませんか, đã thống nhất rồi.)
   Ví dụ: ちょっと 休みましょう。  = Nghỉ một chút nào.
• 何を しますか (なに / なん)  (làm gì?. 何 đọc なん trước です, の, âm d/n/t và trợ từ đếm; còn lại đọc なに.)
   Ví dụ: 朝ご飯に 何を 食べますか。  = Bữa sáng bạn ăn gì?', 20),
  (33, 1, '部  Bộ thủ', 'Ôn bộ thủ: nhìn bộ nói nghĩa, kể 1 Kanji chứa bộ đó.', 10),
  (33, 2, '漢  Kanji', 'Ôn 34 chữ Kanji của Minna bài 4–6 qua từ chứa nó: che nghĩa → đọc từ, che từ → nhớ chữ. Trong app, đánh dấu chữ còn mờ.
休 ・ 今 ・ 分 ・ 半 ・ 午 ・ 後 ・ 一 ・ 毎 ・ 月 ・ 火 ・ 水 ・ 木 ・ 金 ・ 間 ・ 週 ・ 校 ・ 駅 ・ 友 ・ 女 ・ 二 ・ 三 ・ 四 ・ 五 ・ 六 ・ 七 ・ 八 ・ 九 ・ 十 ・ 飲 ・ 読 ・ 買 ・ 魚 ・ 店 ・ 花', 20),
  (33, 3, '文  Ngữ pháp', 'Làm phần 練習B và 練習C trong Minna bài 4–6. Sau đó tự đặt 5 câu mới.', 25),
  (33, 4, '語  Từ vựng', 'Ôn lại toàn bộ từ vựng Minna bài 4–6. Từ nào quên đánh dấu ''Đang học''.', 20),
  (33, 5, '耳読  Nghe + Đọc', 'Làm phần 問題 (nghe + đọc) cuối mỗi bài trong Minna bài 4–6. Ghi lỗi sai vào cột Ghi chú.', 25),
  (34, 1, '◐  Khởi động', 'Ôn nhanh nội dung hôm qua: đọc lại Kanji và mẫu ngữ pháp cũ, không nhìn đáp án.', 5),
  (34, 2, '語  Từ vựng', 'Từ mới Minna bài 7:
• きります（切ります） = Cắt
• おくります（送ります） = Gửi, tiễn
• あげます = Cho, tặng
• もらいます = Nhận được
• かします（貸します） = Cho mượn
• かります（借ります） = Mượn
• おしえます（教えます） = Dạy
• ならいます（習います） = Học (từ ai đó)
• かけます = Gọi (điện thoại)
• て（手） = Tay
• はし（箸） = Đũa
• スプーン = Thìa
• ナイフ = Con dao
• フォーク = Cái nĩa
• はさみ = Cái kéo
• ケータイ = Điện thoại di động
• メール = Thư điện tử, email
• ねんがじょう（年賀状） = Thiệp chúc Tết
• パンチ = Cái đục lỗ (giấy)
• ホッチキス = Cái dập ghim
• セロテープ = Băng dính trong
• けしゴム（消しゴム） = Cục tẩy
• かみ（紙） = Giấy
• はな（花） = Hoa
• シャツ = Áo sơ mi
• プレゼント = Quà tặng
• にもつ（荷物） = Hành lý
• おかね（お金） = Tiền
• きっぷ（切符） = Vé (tàu, xe)
• クリスマス = Giáng sinh
• ちち（父） = Bố (của mình)
• はは（母） = Mẹ (của mình)', 67),
  (34, 3, '漢  Kanji', 'Học 2 chữ Kanji ngay trong từ của hôm nay — nhớ cách đọc trong từ trước, chưa cần thuộc mọi âm đọc.
• 父 [PHỤ] Bố — On: フ / Kun: ちち・とう
   Trong từ hôm nay: 父（ちち）Bố (của mình)
   Mẹo: Hình hai cánh tay giơ cây roi — người BỐ nghiêm khắc ngày xưa.
• 母 [MẪU] Mẹ — On: ボ / Kun: はは・かあ
   Trong từ hôm nay: 母（はは）Mẹ (của mình)
   Mẹo: Hình người phụ nữ với hai chấm là bầu ngực nuôi con → MẸ.', 8),
  (34, 4, '文  Ngữ pháp', 'Minna bài 7 (1/2) — Cho & Nhận, Công cụ で
• 道具 で V  (Làm gì BẰNG công cụ / phương tiện gì.)
   Ví dụ: はしで 食べます。  = Tôi ăn bằng đũa.
• N を あげます  (Cho, tặng (từ tôi → người khác). Không dùng khi người nhận là cấp trên.)
   Ví dụ: 友だちに 花を あげました。  = Tôi đã tặng hoa cho bạn.
• N を もらいます  (Nhận được (từ ai đó → tôi).)
   Ví dụ: 山田さんに 本を もらいました。  = Tôi đã nhận sách từ anh Yamada.', 30),
  (34, 5, '読  Đọc', 'Làm phần 読み物 hoặc 練習C của bài đang học. Đọc to thành tiếng ít nhất 1 lượt.', 20),
  (35, 1, '◐  Khởi động', 'Ôn nhanh nội dung hôm qua: đọc lại Kanji và mẫu ngữ pháp cũ, không nhìn đáp án.', 5),
  (35, 2, '語  Từ vựng', 'Từ mới Minna bài 7:
• おとうさん（お父さん） = Bố (người khác, hoặc gọi bố mình)
• おかあさん（お母さん） = Mẹ (người khác, hoặc gọi mẹ mình)
• もう = Đã… rồi
• まだ = Vẫn còn; chưa
• これから = Từ bây giờ
• すてきですね = Đẹp quá nhỉ, tuyệt nhỉ
• いらっしゃい = Mời vào (chào khách đến nhà)
• しつれいします（失礼します） = Xin phép (khi vào / ra về)
• いかがですか = Anh/chị dùng ~ nhé? / ~ thế nào ạ?
• いただきます = Mời cả nhà (nói trước khi ăn)
• ごちそうさま = Cảm ơn vì bữa ăn (nói sau khi ăn)
• スペイン = Tây Ban Nha
• おさら（お皿） = Cái đĩa
• ちゃわん = Bát (ăn cơm)
• カップ = Cái cốc (có quai)
• コップ = Cái cốc, ly
• ハンカチ = Khăn tay
• テープ = Băng dính, băng ghi âm
• おじさん（叔父さん） = Chú, bác, cậu
• おや（親） = Cha mẹ
• むすこ（息子） = Con trai (của mình)
• むすめ（娘） = Con gái (của mình)
• おこさん（お子さん） = Con (của người khác)
• おじょうさん（お嬢さん） = Con gái (của người khác); cô gái
• こ（子） = Đứa trẻ, con
• あかちゃん（赤ちゃん） = Em bé
• あかんぼう（赤ん坊） = Đứa bé sơ sinh
• パパ = Bố (trẻ con gọi)
• きんじょ（近所） = Hàng xóm, vùng lân cận
• せわ（世話） = Chăm sóc, giúp đỡ
• はります（貼ります） = Dán
• しょうたい（招待） = Mời
• おいわい（お祝い） = Sự chúc mừng; quà mừng
• おれい（お礼） = Sự cảm ơn; quà cảm ơn', 71),
  (35, 3, '漢  Kanji', 'Học 1 chữ Kanji ngay trong từ của hôm nay — nhớ cách đọc trong từ trước, chưa cần thuộc mọi âm đọc.
• 子 [TỬ] Con, trẻ nhỏ — On: シ / Kun: こ
   Trong từ hôm nay: 息子（むすこ）Con trai (của mình) ・ お子さん（おこさん）Con (của người khác) ・ 子（こ）Đứa trẻ, con
   Mẹo: Hình em bé quấn tã, chỉ thò hai tay ra ngoài.', 4),
  (35, 4, '文  Ngữ pháp', 'Minna bài 7 (2/2) — Cho & Nhận, Công cụ で
• もう V ました  (Đã làm ~ rồi. Trả lời phủ định là まだです (chưa).)
   Ví dụ: もう 昼ごはんを 食べましたか。  = Bạn ăn trưa chưa?
• 〜語 で 何ですか  (Cái này tiếng ~ gọi là gì?)
   Ví dụ: これは 日本語で 何ですか。  = Cái này tiếng Nhật gọi là gì?', 20),
  (35, 5, '耳  Nghe', 'Làm 聴解 (phần nghe) trong sách bài tập Minna 標準問題集 của bài đang học.', 20),
  (36, 1, '◐  Khởi động', 'Ôn nhanh nội dung hôm qua: đọc lại Kanji và mẫu ngữ pháp cũ, không nhìn đáp án.', 5),
  (36, 2, '語  Từ vựng', 'Từ mới Minna bài 8:
• ハンサム = Đẹp trai
• きれい = Đẹp; sạch
• しずか（静か） = Yên tĩnh
• にぎやか（賑やか） = Náo nhiệt
• ゆうめい（有名） = Nổi tiếng
• しんせつ（親切） = Tốt bụng, tử tế
• げんき（元気） = Khoẻ mạnh
• ひま（暇） = Rảnh rỗi
• べんり（便利） = Tiện lợi
• すてき（素敵） = Đẹp, tuyệt
• おおきい（大きい） = To
• ちいさい（小さい） = Nhỏ
• あたらしい（新しい） = Mới
• ふるい（古い） = Cũ
• いい = Tốt
• わるい（悪い） = Xấu, tệ
• あつい（厚い） = Dày
• さむい（寒い） = Lạnh
• つめたい（冷たい） = Lạnh (khi chạm vào)
• むずかしい（難しい） = Khó
• やさしい（易しい） = Dễ
• やさしい（優しい） = Hiền, dịu dàng
• たかい（高い） = Đắt; cũng có nghĩa cao', 49),
  (36, 3, '漢  Kanji', 'Học 3 chữ Kanji ngay trong từ của hôm nay — nhớ cách đọc trong từ trước, chưa cần thuộc mọi âm đọc.
• 小 [TIỂU] Nhỏ — On: ショウ / Kun: ちい(さい)・こ
   Trong từ hôm nay: 小さい（ちいさい）Nhỏ
   Mẹo: Ba chấm bé xíu chụm lại. Ngược với 大.
• 古 [CỔ] Cũ — On: コ / Kun: ふる(い)
   Trong từ hôm nay: 古い（ふるい）Cũ
   Mẹo: 十 (mười) + 口 (miệng) = câu chuyện truyền qua mười cái miệng thì đã rất CŨ.
• 高 [CAO] Cao; đắt — On: コウ / Kun: たか(い)
   Trong từ hôm nay: 高い（たかい）Đắt; cũng có nghĩa cao
   Mẹo: Hình một tòa tháp nhiều tầng chồng lên nhau = CAO. Giá cao → ĐẮT.', 12),
  (36, 4, '文  Ngữ pháp', 'Minna bài 8 (1/3) — Tính từ
• い-adj + です  (Tính từ đuôi い. Phủ định: bỏ い thêm くないです.)
   Ví dụ: この かばんは 高いです。  = Cái túi này đắt.
• な-adj + です  (Tính từ đuôi な. Phủ định: じゃ ありません.)
   Ví dụ: この 町は 静かじゃ ありません。  = Thị trấn này không yên tĩnh.', 20),
  (36, 5, '読  Đọc', 'Đọc lại 5 câu đã học trong app. Gạch chân một từ còn mờ, chép câu đó vào sổ.', 20),
  (37, 1, '◐  Khởi động', 'Ôn nhanh nội dung hôm qua: đọc lại Kanji và mẫu ngữ pháp cũ, không nhìn đáp án.', 5),
  (37, 2, '語  Từ vựng', 'Từ mới Minna bài 8:
• やすい（安い） = Rẻ
• ひくい（低い） = Thấp
• おもしろい（面白い） = Thú vị
• おいしい = Ngon
• いそがしい（忙しい） = Bận rộn
• たのしい（楽しい） = Vui
• しろい（白い） = Trắng
• くろい（黒い） = Đen
• あかい（赤い） = Đỏ
• あおい（青い） = Xanh dương
• さくら（桜） = Hoa anh đào; cây anh đào
• やま（山） = Núi
• まち（町） = Thị trấn, phố
• たべもの（食べ物） = Đồ ăn
• ところ（所） = Nơi, chỗ
• りょう（寮） = Ký túc xá
• せいかつ（生活） = Cuộc sống, sinh hoạt
• しごと（仕事） = Công việc
• どう = Như thế nào
• どんな = Như thế nào, loại gì
• とても = Rất
• あまり = Không ~ lắm', 47),
  (37, 3, '漢  Kanji', 'Học 3 chữ Kanji ngay trong từ của hôm nay — nhớ cách đọc trong từ trước, chưa cần thuộc mọi âm đọc.
• 安 [AN] Rẻ, yên tâm — On: アン / Kun: やす(い)
   Trong từ hôm nay: 安い（やすい）Rẻ
   Mẹo: Bộ 宀 (mái nhà) che chở 女 (người phụ nữ) = ở trong nhà thì AN toàn, yên tâm. Yên tâm mua → giá RẺ.
• 白 [BẠCH] Trắng — On: ハク / Kun: しろ(い)
   Trong từ hôm nay: 面白い（おもしろい）Thú vị ・ 白い（しろい）Trắng
   Mẹo: Chữ 日 (mặt trời) có thêm một tia sáng nhô lên = ánh sáng chói → TRẮNG.
• 山 [SƠN] Núi — On: サン / Kun: やま
   Trong từ hôm nay: 山（やま）Núi
   Mẹo: Ba đỉnh NÚI nhô lên khỏi mặt đất, đỉnh giữa cao nhất.', 12),
  (37, 4, '文  Ngữ pháp', 'Minna bài 8 (2/3) — Tính từ
• Adj + N  (Tính từ bổ nghĩa danh từ. な-adj phải giữ な: 静かな 町.)
   Ví dụ: 新しい 車を 買いました。  = Tôi đã mua một chiếc xe mới.
• N は どうですか  (N thế nào? Hỏi cảm nhận.)
   Ví dụ: 日本の 生活は どうですか。  = Cuộc sống ở Nhật thế nào?', 20),
  (37, 5, '耳  Nghe', 'Xem 15 phút Erin''s Challenge hoặc Nihongo no Mori N5, bật phụ đề tiếng Nhật.', 20),
  (38, 1, '◐  Khởi động', 'Ôn nhanh nội dung hôm qua: đọc lại Kanji và mẫu ngữ pháp cũ, không nhìn đáp án.', 5),
  (38, 2, '語  Từ vựng', 'Từ mới Minna bài 8:
• そして = Và, rồi thì
• おげんきですか（お元気ですか） = Anh/chị có khỏe không?
• そうですね = Ừ nhỉ; để xem nào…
• けっこうです（結構です） = Đủ rồi, không cần ạ
• そろそろしつれいします（そろそろ失礼します） = Đã đến lúc tôi xin phép về
• しんせつ[な]（親切[な]） = Tốt bụng
• まずい = Dở, không ngon
• ふとい（太い） = To, mập, dày
• ほそい（細い） = Mảnh, gầy
• まるい（丸い） = Tròn
• うすい（薄い） = Mỏng; nhạt
• ぬるい（温い） = Hơi nguội, chưa đủ nóng
• きたない（汚い） = Bẩn
• うるさい（煩い） = Ồn ào
• つまらない = Chán, nhạt nhẽo
• かわいい = Dễ thương
• じょうぶ（丈夫） = Bền, chắc khoẻ
• りっぱ = Tuyệt vời, nguy nga
• けっこう（結構） = Đủ rồi; khá
• おおきな（大きな） = To lớn (đứng trước danh từ)
• ちいさな（小さな） = Nhỏ bé (đứng trước danh từ)
• こんな = Như thế này
• いかが = Thế nào (lịch sự)
• しろ（白） = Màu trắng
• うつくしい（美しい） = Đẹp (trang trọng)
• すばらしい（素晴らしい） = Tuyệt vời
• ひどい = Tệ, quá đáng
• おかしい = Buồn cười; kỳ lạ
• めずらしい（珍しい） = Hiếm, lạ', 61),
  (38, 3, '文  Ngữ pháp', 'Minna bài 8 (3/3) — Tính từ
• 〜が、〜  (Nhưng. Nối hai vế trái ngược.)
   Ví dụ: この 部屋は 狭いですが、きれいです。  = Phòng này chật nhưng sạch đẹp.
• N1 は どんな N2 ですか  (N1 là N2 như thế nào?. Hỏi tính chất, đặc điểm; trả lời bằng tính từ + N.)
   Ví dụ: 新しい 先生は どんな 先生ですか。  = Giáo viên mới là người như thế nào?', 20),
  (39, 1, '◐  Khởi động', 'Ôn nhanh nội dung hôm qua: đọc lại Kanji và mẫu ngữ pháp cũ, không nhìn đáp án.', 5),
  (39, 2, '語  Từ vựng', 'Từ mới Minna bài 9:
• わかります（分かります） = Hiểu
• あります = Có (đồ vật, sự kiện)
• すき（好き） = Thích
• きらい（嫌い） = Ghét, không thích
• じょうず（上手） = Giỏi
• へた（下手） = Kém
• のみもの（飲み物） = Đồ uống
• りょうり（料理） = Món ăn, nấu ăn
• スポーツ = Thể thao
• やきゅう（野球） = Bóng chày
• ダンス = Nhảy, khiêu vũ
• りょこう（旅行） = Du lịch
• おんがく（音楽） = Âm nhạc
• うた（歌） = Bài hát
• クラシック = Nhạc cổ điển
• ジャズ = Nhạc jazz
• コンサート = Buổi hòa nhạc
• カラオケ = Karaoke
• かぶき（歌舞伎） = Kabuki (kịch truyền thống Nhật)
• え（絵） = Bức tranh
• じ（字） = Chữ
• かんじ（漢字） = Chữ Hán', 47),
  (39, 3, '漢  Kanji', 'Học 1 chữ Kanji ngay trong từ của hôm nay — nhớ cách đọc trong từ trước, chưa cần thuộc mọi âm đọc.
• 上 [THƯỢNG] Trên, lên — On: ジョウ / Kun: うえ・あ(がる)・のぼ(る)
   Trong từ hôm nay: 上手（じょうず）Giỏi
   Mẹo: Một vạch mốc, có nét nhô LÊN phía trên. Ngược lại hoàn toàn với 下.', 4),
  (39, 4, '文  Ngữ pháp', 'Minna bài 9 (1/3) — Thích / Giỏi / Có & Lý do から
• N が 好き / 嫌い / 上手 / 下手 です  (Thích / ghét / giỏi / kém. Đối tượng đi với が, KHÔNG dùng を.)
   Ví dụ: わたしは 日本語が 好きです。  = Tôi thích tiếng Nhật.
• N が わかります  (Hiểu. ひらがなが わかります. Dùng が.)
   Ví dụ: ひらがなが わかります。  = Tôi hiểu chữ Hiragana.', 20),
  (39, 5, '耳  Nghe', 'Mở CD Minna no Nihongo bài đang học, phần 会話. Nghe 3 lượt: lượt 1 chỉ nghe, lượt 2 nhìn script, lượt 3 nghe và nhắc theo.', 20),
  (40, 1, '◐  Khởi động', 'Ôn nhanh nội dung hôm qua: đọc lại Kanji và mẫu ngữ pháp cũ, không nhìn đáp án.', 5),
  (40, 2, '語  Từ vựng', 'Từ mới Minna bài 9:
• ひらがな（平仮名） = Chữ hiragana
• かたかな（片仮名） = Chữ katakana
• ローマじ（ローマ字） = Chữ La-tinh (romaji)
• こまかいおかね（細かいお金） = Tiền lẻ
• チケット = Vé (xem phim, hòa nhạc…)
• 〜じかん（〜時間） = ~ tiếng đồng hồ
• じかん（時間） = Thời gian
• ようじ（用事） = Việc bận
• やくそく（約束） = Lời hứa, cuộc hẹn
• アルバイト = Làm thêm
• ごしゅじん（ご主人） = Chồng (của người khác)
• おっと（夫） = Chồng (của mình)
• しゅじん（主人） = Chồng (tôi)
• おくさん（奥さん） = Vợ (của người khác)
• つま（妻） = Vợ (của mình)
• かない（家内） = Vợ tôi (khiêm tốn)
• こども（子ども） = Trẻ con
• よく = Thường xuyên, giỏi
• だいたい（大体） = Đại khái, phần lớn
• たくさん = Nhiều
• すこし（少し） = Một chút
• ぜんぜん（全然） = Hoàn toàn không', 47),
  (40, 3, '漢  Kanji', 'Học 1 chữ Kanji ngay trong từ của hôm nay — nhớ cách đọc trong từ trước, chưa cần thuộc mọi âm đọc.
• 少 [THIỂU] Ít — On: ショウ / Kun: すく(ない)・すこ(し)
   Trong từ hôm nay: 少し（すこし）Một chút
   Mẹo: Chữ 小 (nhỏ) bị gạch mất một nét = nhỏ hơn cả nhỏ → ÍT.', 4),
  (40, 4, '文  Ngữ pháp', 'Minna bài 9 (2/3) — Thích / Giỏi / Có & Lý do から
• 〜から、〜  (Vì ~ nên ~. Vế lý do đứng TRƯỚC.)
   Ví dụ: 時間が ありませんから、行きません。  = Vì không có thời gian nên tôi không đi.
• どうして〜か  (Tại sao? Trả lời bằng 〜からです.)
   Ví dụ: どうして 来ませんでしたか。  = Tại sao bạn đã không đến?', 20),
  (40, 5, '耳  Nghe', 'Shadowing 15 phút: bật lại 会話 hôm qua, nói đuổi theo băng, không nhìn script.', 20),
  (41, 1, '◐  Khởi động', 'Ôn nhanh nội dung hôm qua: đọc lại Kanji và mẫu ngữ pháp cũ, không nhìn đáp án.', 5),
  (41, 2, '語  Từ vựng', 'Từ mới Minna bài 9:
• はやく（早く） = Sớm; nhanh (phó từ)
• どうして = Tại sao
• ざんねんです（残念です） = Tiếc quá
• すき[な]（好き[な]） = Thích
• きらい[な]（嫌い[な]） = Ghét
• じょうず[な]（上手[な]） = Giỏi
• へた[な]（下手[な]） = Kém
• いろ（色） = Màu sắc
• あお（青） = Màu xanh dương
• あか（赤） = Màu đỏ
• くろ（黒） = Màu đen
• きいろ（黄色） = Màu vàng
• きいろい（黄色い） = Vàng
• ちゃいろ（茶色） = Màu nâu
• だいすき（大好き） = Rất thích
• いや（嫌） = Khó chịu, không muốn
• ギター = Đàn ghi-ta
• いみ（意味） = Ý nghĩa
• なぜ = Tại sao
• ぶんぽう（文法） = Ngữ pháp
• はつおん（発音） = Phát âm
• かいわ（会話） = Hội thoại
• せんもん（専門） = Chuyên môn, chuyên ngành
• きょうみ（興味） = Hứng thú, quan tâm', 51),
  (41, 3, '文  Ngữ pháp', 'Minna bài 9 (3/3) — Thích / Giỏi / Có & Lý do から
• よく / だいたい / たくさん / 少し / あまり / 全然  (Trạng từ mức độ. あまり và 全然 luôn đi với phủ định.)
   Ví dụ: あまり わかりません。  = Tôi không hiểu lắm.', 10),
  (42, 1, '部  Bộ thủ', 'Ôn bộ thủ: nhìn bộ nói nghĩa, kể 1 Kanji chứa bộ đó.', 10),
  (42, 2, '漢  Kanji', 'Ôn 11 chữ Kanji của Minna bài 7–9 qua từ chứa nó: che nghĩa → đọc từ, che từ → nhớ chữ. Trong app, đánh dấu chữ còn mờ.
父 ・ 母 ・ 子 ・ 小 ・ 古 ・ 高 ・ 安 ・ 白 ・ 山 ・ 上 ・ 少', 20),
  (42, 3, '文  Ngữ pháp', 'Làm phần 練習B và 練習C trong Minna bài 7–9. Sau đó tự đặt 5 câu mới.', 25),
  (42, 4, '語  Từ vựng', 'Ôn lại toàn bộ từ vựng Minna bài 7–9. Từ nào quên đánh dấu ''Đang học''.', 20),
  (42, 5, '耳読  Nghe + Đọc', 'Làm phần 問題 (nghe + đọc) cuối mỗi bài trong Minna bài 7–9. Ghi lỗi sai vào cột Ghi chú.', 25),
  (43, 1, '◐  Khởi động', 'Ôn nhanh nội dung hôm qua: đọc lại Kanji và mẫu ngữ pháp cũ, không nhìn đáp án.', 5),
  (43, 2, '語  Từ vựng', 'Từ mới Minna bài 10:
• います = Có (người, động vật)
• いろいろ = Nhiều loại, đủ thứ
• おとこのひと（男の人） = Người đàn ông
• おんなのひと（女の人） = Người phụ nữ
• おとこのこ（男の子） = Bé trai
• おんなのこ（女の子） = Bé gái
• いぬ（犬） = Con chó
• ねこ（猫） = Con mèo
• パンダ = Gấu trúc
• ぞう（象） = Con voi
• き（木） = Cây; gỗ
• もの（物） = Đồ vật, thứ
• でんち（電池） = Pin
• はこ（箱） = Cái hộp
• スイッチ = Công tắc
• れいぞうこ（冷蔵庫） = Tủ lạnh
• テーブル = Cái bàn
• ベッド = Cái giường
• たな（棚） = Cái giá, kệ
• ドア = Cửa (kiểu Tây)
• まど（窓） = Cửa sổ', 45),
  (43, 3, '漢  Kanji', 'Học 1 chữ Kanji ngay trong từ của hôm nay — nhớ cách đọc trong từ trước, chưa cần thuộc mọi âm đọc.
• 男 [NAM] Nam giới — On: ダン・ナン / Kun: おとこ
   Trong từ hôm nay: 男の人（おとこのひと）Người đàn ông ・ 男の子（おとこのこ）Bé trai
   Mẹo: 田 (ruộng) + 力 (sức mạnh) = người dùng sức cày ruộng → ĐÀN ÔNG.', 4),
  (43, 4, '文  Ngữ pháp', 'Minna bài 10 (1/3) — Tồn tại — あります / います & Vị trí
• 場所 に N が あります / います  (Ở nơi nào đó CÓ cái gì. あります cho vật, います cho người và động vật.)
   Ví dụ: 部屋に 猫が います。  = Trong phòng có con mèo.
• N は 場所 に あります / います  (Cái gì đó Ở đâu. Đảo lại khi N là chủ đề đã biết.)
   Ví dụ: 田中さんは 事務所に います。  = Anh Tanaka đang ở văn phòng.', 20),
  (43, 5, '耳  Nghe', 'Làm 聴解 (phần nghe) trong sách bài tập Minna 標準問題集 của bài đang học.', 20),
  (44, 1, '◐  Khởi động', 'Ôn nhanh nội dung hôm qua: đọc lại Kanji và mẫu ngữ pháp cũ, không nhìn đáp án.', 5),
  (44, 2, '語  Từ vựng', 'Từ mới Minna bài 10:
• ポスト = Hòm thư
• ビル = Tòa nhà
• こうえん（公園） = Công viên
• きっさてん（喫茶店） = Quán cà phê
• ～や（～屋） = Cửa hàng …, tiệm …
• のりば（乗り場） = Bến, chỗ lên xe
• けん（県） = Tỉnh
• うえ（上） = Bên trên
• した（下） = Bên dưới
• まえ（前） = Phía trước
• うしろ（後ろ） = Phía sau
• みぎ（右） = Bên phải
• ひだり（左） = Bên trái
• なか（中） = Bên trong
• そと（外） = Bên ngoài
• となり（隣） = Bên cạnh (cùng loại)
• ちかく（近く） = Gần đây
• あいだ（間） = Ở giữa (hai vật)
• いちばん（一番） = Nhất', 41),
  (44, 3, '漢  Kanji', 'Học 3 chữ Kanji ngay trong từ của hôm nay — nhớ cách đọc trong từ trước, chưa cần thuộc mọi âm đọc.
• 右 [HỮU] Bên phải — On: ウ・ユウ / Kun: みぎ
   Trong từ hôm nay: 右（みぎ）Bên phải
   Mẹo: Bàn tay đưa lên che 口 (miệng) khi ăn = tay PHẢI (tay cầm đũa). Phân biệt với 左 bằng chữ 口 bên dưới.
• 左 [TẢ] Bên trái — On: サ / Kun: ひだり
   Trong từ hôm nay: 左（ひだり）Bên trái
   Mẹo: Bàn tay đưa lên cầm 工 (dụng cụ) = tay TRÁI giữ đồ. Nhớ: 左 có 工, 右 có 口.
• 外 [NGOẠI] Bên ngoài — On: ガイ / Kun: そと・はず(す)
   Trong từ hôm nay: 外（そと）Bên ngoài
   Mẹo: 夕 (buổi chiều tối) + 卜 (bói toán) = ngày xưa bói ngoài trời lúc chiều tà → NGOÀI.', 12),
  (44, 4, '文  Ngữ pháp', 'Minna bài 10 (2/3) — Tồn tại — あります / います & Vị trí
• N1 の N2 (vị trí)  (N2 chỉ vị trí: 上/下/前/後ろ/中/外/隣/近く/間.)
   Ví dụ: 机の 上に 本が あります。  = Trên bàn có quyển sách.
• N1 や N2 (など)  (N1, N2, vân vân. Liệt kê không đầy đủ, khác với と (đầy đủ).)
   Ví dụ: 机の 上に 本や ノートが あります。  = Trên bàn có sách, vở, v.v.', 20),
  (44, 5, '読  Đọc', 'Đọc lại 5 câu đã học trong app. Gạch chân một từ còn mờ, chép câu đó vào sổ.', 20),
  (45, 1, '◐  Khởi động', 'Ôn nhanh nội dung hôm qua: đọc lại Kanji và mẫu ngữ pháp cũ, không nhìn đáp án.', 5),
  (45, 2, '語  Từ vựng', 'Từ mới Minna bài 10:
• おとこ（男） = Đàn ông, nam
• おんな（女） = Phụ nữ, nữ
• だんせい（男性） = Nam giới
• じょせい（女性） = Nữ giới
• とり（鳥） = Con chim
• ペット = Thú cưng
• いけ（池） = Cái ao
• いえ / うち（家） = Nhà
• こうばん（交番） = Đồn cảnh sát nhỏ
• おまわりさん = Chú cảnh sát (thân mật)
• けいかん（警官） = Cảnh sát
• ほんだな（本棚） = Giá sách
• と（戸） = Cửa (kiểu Nhật)
• よこ（横） = Bên cạnh
• そば = Gần, bên cạnh
• むこう（向こう） = Phía bên kia
• へん（辺） = Vùng, quanh đây
• アパート = Căn hộ chung cư
• スリッパ = Dép đi trong nhà
• かびん（花瓶） = Lọ hoa
• おたく（お宅） = Nhà (của người khác, lịch sự)
• たたみ（畳） = Chiếu tatami
• ひきだし（引き出し） = Ngăn kéo
• カーテン = Rèm cửa
• るす（留守） = Vắng nhà', 53),
  (45, 3, '文  Ngữ pháp', 'Minna bài 10 (3/3) — Tồn tại — あります / います & Vị trí
• N が あります / います  (có N. Câu tồn tại cơ bản (có/không có).)
   Ví dụ: 明日 テストが あります。  = Mai có bài kiểm tra.', 10),
  (46, 1, '◐  Khởi động', 'Ôn nhanh nội dung hôm qua: đọc lại Kanji và mẫu ngữ pháp cũ, không nhìn đáp án.', 5),
  (46, 2, '語  Từ vựng', 'Từ mới Minna bài 11:
• かかります = Mất (thời gian, tiền)
• ひとつ（一つ） = Một cái
• ふたつ（二つ） = Hai cái
• みっつ（三つ） = Ba cái
• よっつ（四つ） = Bốn cái
• いつつ（五つ） = Năm cái
• むっつ（六つ） = Sáu cái
• ななつ（七つ） = Bảy cái
• やっつ（八つ） = Tám cái
• ここのつ（九つ） = Chín cái
• じゅう（十） = Mười
• いくつ = Bao nhiêu cái; mấy tuổi
• ひとり / ふたり（一人 / 二人） = Một người / hai người
• ～にん（～人） = … người
• 〜だい（〜台） = Chiếc (máy móc, xe)
• 〜まい（〜枚） = Tờ, tấm (vật mỏng)
• 〜かい（〜回） = Lần
• りんご = Quả táo
• みかん = Quả quýt
• サンドイッチ = Bánh sandwich
• カレー = Cà ri
• アイスクリーム = Kem
• きって（切手） = Tem thư
• はがき = Bưu thiếp
• ふうとう（封筒） = Phong bì
• りょうしん（両親） = Bố mẹ
• きょうだい（兄弟） = Anh chị em', 57),
  (46, 3, '文  Ngữ pháp', 'Minna bài 11 (1/3) — Số đếm & Lượng từ
• 〜つ (1〜10)  (Đếm vật chung: ひとつ, ふたつ, みっつ... Từ 11 trở đi dùng 〜個.)
   Ví dụ: みかんを 三つ 買いました。  = Tôi đã mua ba quả quýt.
• 〜人 / 〜台 / 〜枚 / 〜冊  (Đếm người / máy móc, xe / vật mỏng dẹt / sách vở.)
   Ví dụ: 教室に 学生が 五人 います。  = Trong lớp có 5 học sinh.', 20),
  (46, 4, '耳  Nghe', 'Xem 15 phút Erin''s Challenge hoặc Nihongo no Mori N5, bật phụ đề tiếng Nhật.', 20),
  (47, 1, '◐  Khởi động', 'Ôn nhanh nội dung hôm qua: đọc lại Kanji và mẫu ngữ pháp cũ, không nhìn đáp án.', 5),
  (47, 2, '語  Từ vựng', 'Từ mới Minna bài 11:
• あに（兄） = Anh trai (của mình)
• おにいさん（お兄さん） = Anh trai (người khác)
• あね（姉） = Chị gái (của mình)
• おねえさん（お姉さん） = Chị gái (người khác)
• おとうと（弟） = Em trai
• おとうとさん（弟さん） = Em trai (của người khác)
• いもうと（妹） = Em gái
• いもうとさん（妹さん） = Em gái (của người khác)
• がいこく（外国） = Nước ngoài
• りゅうがくせい（留学生） = Du học sinh
• クラス = Lớp học
• 〜しゅうかん（〜週間） = ~ tuần
• 〜かげつ（〜か月） = ~ tháng
• ぐらい / くらい = Khoảng chừng
• どのくらい = Khoảng bao lâu, bao nhiêu
• ぜんぶで（全部で） = Tất cả là, tổng cộng
• みんな = Mọi người
• ～だけ = Chỉ …
• かしこまりました = Vâng, tôi hiểu rồi (kính ngữ)
• いってらっしゃい = Anh/chị đi nhé
• いってきます（行ってきます） = Tôi đi đây
• ふなびん（船便） = Gửi đường biển
• こうくうびん（航空便） = Gửi đường hàng không
• エアメール = Thư máy bay
• オーストラリア = Nước Úc', 53),
  (47, 3, '漢  Kanji', 'Học 1 chữ Kanji ngay trong từ của hôm nay — nhớ cách đọc trong từ trước, chưa cần thuộc mọi âm đọc.
• 空 [KHÔNG] Bầu trời, trống — On: クウ / Kun: そら・あ(く)
   Trong từ hôm nay: 航空便（こうくうびん）Gửi đường hàng không
   Mẹo: Bộ 穴 (cái hang) + 工 = khoảng RỖNG bên trên. Rỗng → bầu trời.', 4),
  (47, 4, '文  Ngữ pháp', 'Minna bài 11 (2/3) — Số đếm & Lượng từ
• 〜回 / 〜時間 / 〜週間 / 〜か月 / 〜年  (Số lần và khoảng thời gian.)
   Ví dụ: 一週間に 二回 日本語を 勉強します。  = Mỗi tuần tôi học tiếng Nhật hai lần.
• 期間 に 回数  (Bao nhiêu lần trong một khoảng thời gian.)
   Ví dụ: 一か月に 三回 映画を 見ます。  = Mỗi tháng tôi xem phim ba lần.', 20),
  (47, 5, '耳  Nghe', 'Mở CD Minna no Nihongo bài đang học, phần 会話. Nghe 3 lượt: lượt 1 chỉ nghe, lượt 2 nhìn script, lượt 3 nghe và nhắc theo.', 20),
  (48, 1, '◐  Khởi động', 'Ôn nhanh nội dung hôm qua: đọc lại Kanji và mẫu ngữ pháp cũ, không nhìn đáp án.', 5),
  (48, 2, '語  Từ vựng', 'Từ mới Minna bài 11:
• がいこくじん（外国人） = Người nước ngoài
• ひとつ〜とお（一つ〜十） = Một cái đến mười cái
• 〜さつ（〜冊） = Quyển (sách vở)
• 〜ねん（〜年） = ~ năm
• はたち（二十歳） = Hai mươi tuổi
• おばさん（伯母さん） = Cô, dì, bác gái
• おとな（大人） = Người lớn
• キロ = Ki-lô (gam, mét)
• グラム = Gam
• ページ = Trang (sách)
• はんぶん（半分） = Một nửa
• おおぜい（大勢） = Đông người
• ひとつき（一月） = Một tháng (khoảng thời gian)
• いち（一） = Một
• に（二） = Hai
• さん（三） = Ba
• し（四） = Bốn (cách đọc し)
• ご（五） = Năm
• ろく（六） = Sáu
• しち（七） = Bảy (cách đọc しち)
• はち（八） = Tám
• きゅう（九） = Chín (cách đọc きゅう)
• ～ばん（～番） = Số …, thứ …
• ～ずつ = Mỗi … (chia đều)
• ～こ（～個） = … cái, … quả (vật nhỏ)
• ～ほん（～本） = … cây, … chai (vật dài)
• ～ひき（～匹） = … con (động vật nhỏ)', 57),
  (48, 3, '文  Ngữ pháp', 'Minna bài 11 (3/3) — Số đếm & Lượng từ
• Số lượng + だけ / しか〜ない  (Chỉ có ~. しか luôn đi với phủ định.)
   Ví dụ: 千円しか ありません。  = Tôi chỉ có 1000 yên.
• どのくらい / ぐらい  (bao lâu / khoảng. Hỏi khoảng thời gian, lượng; ぐらい = khoảng.)
   Ví dụ: 日本語を どのくらい 勉強しましたか。  = Bạn đã học tiếng Nhật bao lâu?', 20),
  (49, 1, '◐  Khởi động', 'Ôn nhanh nội dung hôm qua: đọc lại Kanji và mẫu ngữ pháp cũ, không nhìn đáp án.', 5),
  (49, 2, '語  Từ vựng', 'Từ mới Minna bài 12:
• かんたん（簡単） = Đơn giản, dễ
• ちかい（近い） = Gần
• とおい（遠い） = Xa
• はやい（早い） = Sớm
• はやい（速い） = Nhanh
• おそい（遅い） = Muộn; chậm
• おおい（多い） = Nhiều
• すくない（少ない） = Ít
• あたたかい（暖かい） = Ấm áp
• すずしい（涼しい） = Mát mẻ
• あまい（甘い） = Ngọt
• からい（辛い） = Cay
• おもい（重い） = Nặng
• かるい（軽い） = Nhẹ
• きせつ（季節） = Mùa
• はる / あき（春 / 秋） = Mùa xuân / mùa thu
• なつ / ふゆ（夏 / 冬） = Mùa hè / mùa đông
• てんき（天気） = Thời tiết
• あめ（雨） = Mưa
• ゆき（雪） = Tuyết', 43),
  (49, 3, '漢  Kanji', 'Học 3 chữ Kanji ngay trong từ của hôm nay — nhớ cách đọc trong từ trước, chưa cần thuộc mọi âm đọc.
• 多 [ĐA] Nhiều — On: タ / Kun: おお(い)
   Trong từ hôm nay: 多い（おおい）Nhiều
   Mẹo: Hai chữ 夕 (buổi tối) chồng lên nhau = hết tối này đến tối khác, NHIỀU lắm.
• 天 [THIÊN] Trời — On: テン
   Trong từ hôm nay: 天気（てんき）Thời tiết
   Mẹo: Chữ 大 (người dang tay) có một vạch trần bên trên = bầu TRỜI ở trên đầu người.
• 雨 [VŨ] Mưa — On: ウ / Kun: あめ
   Trong từ hôm nay: 雨（あめ）Mưa
   Mẹo: Đám mây bên trên, bốn giọt nước rơi xuống bên dưới → MƯA.', 12),
  (49, 4, '文  Ngữ pháp', 'Minna bài 12 (1/3) — Quá khứ của tính từ & So sánh
• Adj quá khứ  (い-adj: 〜かったです / 〜くなかったです. な-adj & N: 〜でした / 〜じゃ ありませんでした.)
   Ví dụ: きのうは 寒かったです。  = Hôm qua trời đã lạnh.
• N1 は N2 より Adj です  (N1 thì ~ hơn N2.)
   Ví dụ: この 車は あの 車より 高いです。  = Chiếc xe này đắt hơn chiếc xe kia.', 20),
  (49, 5, '耳  Nghe', 'Shadowing 15 phút: bật lại 会話 hôm qua, nói đuổi theo băng, không nhìn script.', 20),
  (50, 1, '◐  Khởi động', 'Ôn nhanh nội dung hôm qua: đọc lại Kanji và mẫu ngữ pháp cũ, không nhìn đáp án.', 5),
  (50, 2, '語  Từ vựng', 'Từ mới Minna bài 12:
• くもり（曇り） = Trời nhiều mây
• ホテル = Khách sạn
• くうこう（空港） = Sân bay
• うみ（海） = Biển
• せかい（世界） = Thế giới
• パーティー = Bữa tiệc
• おまつり（お祭り） = Lễ hội
• すきやき = Lẩu sukiyaki (thịt bò nấu ngọt)
• さしみ（刺身） = Sashimi (cá sống thái lát)
• すし = Sushi
• てんぷら = Tempura (đồ chiên tẩm bột)
• ぶたにく（豚肉） = Thịt lợn
• とりにく（鶏肉） = Thịt gà
• ぎゅうにく（牛肉） = Thịt bò
• レモン = Quả chanh vàng
• いけばな（生け花） = Nghệ thuật cắm hoa Nhật
• もみじ（紅葉） = Lá đỏ mùa thu
• どちらも = Cả hai
• ずっと = Hơn hẳn; suốt
• はじめて（初めて） = Lần đầu tiên
• ただいま = Tôi đã về (khi về nhà)
• おかえりなさい = Anh/chị đã về đấy à
• シンガポール = Singapore
• あつい（暑い / 熱い） = Nóng (trời) / nóng (vật)
• はれ（晴れ） = Trời nắng
• どちら = Cái nào (trong hai)
• おなじ（同じ） = Giống nhau', 57),
  (50, 3, '文  Ngữ pháp', 'Minna bài 12 (2/3) — Quá khứ của tính từ & So sánh
• N1 と N2 と どちらが Adj ですか  (Giữa N1 và N2, cái nào ~ hơn?)
   Ví dụ: 肉と 魚と どちらが 好きですか。  = Bạn thích thịt hay cá hơn?', 10),
  (50, 4, '読  Đọc', 'Làm phần 読み物 hoặc 練習C của bài đang học. Đọc to thành tiếng ít nhất 1 lượt.', 20),
  (51, 1, '◐  Khởi động', 'Ôn nhanh nội dung hôm qua: đọc lại Kanji và mẫu ngữ pháp cũ, không nhìn đáp án.', 5),
  (51, 2, '語  Từ vựng', 'Từ mới Minna bài 12:
• より = Hơn (dùng khi so sánh)
• もっと = Hơn nữa
• かぜ（風） = Gió
• はれます（晴れます） = Trời nắng, quang đãng
• くもります（曇ります） = Trời nhiều mây
• ふきます（吹きます） = Thổi
• さきます（咲きます） = Nở (hoa)
• なつやすみ（夏休み） = Kỳ nghỉ hè
• てんきよほう（天気予報） = Dự báo thời tiết
• たいふう（台風） = Bão
• じしん（地震） = Động đất
• やみます（止みます） = Tạnh, ngừng
• そら（空） = Bầu trời
• くも（雲） = Mây
• ほし（星） = Ngôi sao
• つき（月） = Mặt trăng
• ひ（日） = Mặt trời; ngày
• くうき（空気） = Không khí
• みずうみ（湖） = Hồ
• しま（島） = Hòn đảo
• かいがん（海岸） = Bờ biển
• もり（森） = Rừng
• はやし（林） = Rừng thưa, lùm cây
• ふくざつ（複雑） = Phức tạp
• じゅうぶん（十分） = Đủ
• りょうほう（両方） = Cả hai
• ほど（程） = Khoảng; mức độ', 57),
  (51, 3, '文  Ngữ pháp', 'Minna bài 12 (3/3) — Quá khứ của tính từ & So sánh
• N1 [の中] で 何/どこ/だれ が いちばん Adj ですか  (Trong nhóm N1, cái/nơi/ai nhất?)
   Ví dụ: 日本料理で 何が いちばん おいしいですか。  = Trong món Nhật, món nào ngon nhất?', 10),
  (52, 1, '部  Bộ thủ', 'Ôn bộ thủ: nhìn bộ nói nghĩa, kể 1 Kanji chứa bộ đó.', 10),
  (52, 2, '漢  Kanji', 'Ôn 8 chữ Kanji của Minna bài 10–12 qua từ chứa nó: che nghĩa → đọc từ, che từ → nhớ chữ. Trong app, đánh dấu chữ còn mờ.
男 ・ 右 ・ 左 ・ 外 ・ 空 ・ 多 ・ 天 ・ 雨', 20),
  (52, 3, '文  Ngữ pháp', 'Làm phần 練習B và 練習C trong Minna bài 10–12. Sau đó tự đặt 5 câu mới.', 25),
  (52, 4, '語  Từ vựng', 'Ôn lại toàn bộ từ vựng Minna bài 10–12. Từ nào quên đánh dấu ''Đang học''.', 20),
  (52, 5, '耳読  Nghe + Đọc', 'Làm phần 問題 (nghe + đọc) cuối mỗi bài trong Minna bài 10–12. Ghi lỗi sai vào cột Ghi chú.', 25),
  (53, 1, '◐  Khởi động', 'Ôn nhanh nội dung hôm qua: đọc lại Kanji và mẫu ngữ pháp cũ, không nhìn đáp án.', 5),
  (53, 2, '語  Từ vựng', 'Từ mới Minna bài 13:
• あそびます（遊びます） = Chơi
• およぎます（泳ぎます） = Bơi
• むかえます（迎えます） = Đón (ai đó)
• つかれます（疲れます） = Mệt
• けっこんします（結婚します） = Kết hôn
• たいへん（大変） = Vất vả, ghê gớm
• ほしい = Muốn có
• ひろい（広い） = Rộng
• せまい（狭い） = Chật, hẹp
• プール = Bể bơi
• かわ（川） = Sông
• びじゅつ（美術） = Mỹ thuật
• つり（釣り） = Câu cá
• スキー = Trượt tuyết
• しゅうまつ（週末） = Cuối tuần
• しょうがつ（正月） = Tết, năm mới
• どこか / なにか = Đâu đó / cái gì đó
• のどがかわきます = Khát nước
• おなかがすきます = Đói bụng
• そうしましょう = Làm thế đi, cứ vậy nhé
• ていしょく（定食） = Cơm suất (set ăn)', 45),
  (53, 3, '漢  Kanji', 'Học 1 chữ Kanji ngay trong từ của hôm nay — nhớ cách đọc trong từ trước, chưa cần thuộc mọi âm đọc.
• 川 [XUYÊN] Sông — On: セン / Kun: かわ
   Trong từ hôm nay: 川（かわ）Sông
   Mẹo: Ba đường nước chảy song song = dòng SÔNG nhìn từ trên cao.', 4),
  (53, 4, '文  Ngữ pháp', 'Minna bài 13 (1/2) — Mong muốn — たい & ほしい
• N が ほしいです  (Muốn có N (đồ vật). Chỉ dùng cho ngôi thứ nhất và câu hỏi ngôi thứ hai.)
   Ví dụ: 新しい 車が ほしいです。  = Tôi muốn có một chiếc xe mới.
• V ます-stem + たいです  (Muốn làm gì. Tân ngữ có thể dùng を hoặc が.)
   Ví dụ: 日本へ 行きたいです。  = Tôi muốn đi Nhật.
• 場所 へ V ます-stem に 行きます / 来ます / 帰ります  (Đi/đến/về nơi nào ĐỂ làm gì.)
   Ví dụ: デパートへ 買い物に 行きます。  = Tôi đến cửa hàng bách hoá để mua sắm.', 30),
  (53, 5, '読  Đọc', 'Đọc lại 5 câu đã học trong app. Gạch chân một từ còn mờ, chép câu đó vào sổ.', 20),
  (54, 1, '◐  Khởi động', 'Ôn nhanh nội dung hôm qua: đọc lại Kanji và mẫu ngữ pháp cũ, không nhìn đáp án.', 5),
  (54, 2, '語  Từ vựng', 'Từ mới Minna bài 13:
• ぎゅうどん（牛どん） = Cơm thịt bò
• べつべつに（別々に） = Riêng ra (trả tiền riêng)
• 〜たい = Muốn làm
• かいもの（買い物） = Việc mua sắm
• しょくじ（食事） = Bữa ăn
• さんぽ（散歩） = Đi dạo
• けっこん（結婚） = Kết hôn
• おんせん（温泉） = Suối nước nóng
• えいがかん（映画館） = Rạp chiếu phim
• むら（村） = Làng
• おかし（お菓子） = Bánh kẹo
• しょうゆ = Nước tương
• バター = Bơ
• てんいん（店員） = Nhân viên bán hàng
• しなもの（品物） = Hàng hóa
• ねだん（値段） = Giá cả
• えらびます（選びます） = Chọn
• つつみます（包みます） = Gói, bọc
• とりかえます（取り替えます） = Đổi, thay
• どうぶつえん（動物園） = Vườn thú
• たのしみ（楽しみ） = Niềm vui, mong chờ
• たのしみます（楽しみます） = Tận hưởng, vui chơi
• ～がる = (người khác) tỏ ra …', 49),
  (54, 3, '文  Ngữ pháp', 'Minna bài 13 (2/2) — Mong muốn — たい & ほしい
• N (danh động từ) に 行きます  (Đi để làm việc gì đó (với danh từ hành động).)
   Ví dụ: 日本へ 勉強に 来ました。  = Tôi đến Nhật để học.
• どこか / 何か  (đâu đó / cái gì đó. Từ nghi vấn + か = không xác định. Trợ từ へ, を có thể lược bỏ.)
   Ví dụ: 夏休みに どこか 行きたいです。  = Nghỉ hè tôi muốn đi đâu đó.
• 場所 を V (chuyển động)  (đi qua / rời khỏi (nơi). を chỉ nơi đi qua hoặc nơi rời khỏi.)
   Ví dụ: 道を 渡る とき、気を つけて ください。  = Khi băng qua đường hãy cẩn thận.', 30),
  (54, 4, '耳  Nghe', 'Xem 15 phút Erin''s Challenge hoặc Nihongo no Mori N5, bật phụ đề tiếng Nhật.', 20),
  (55, 1, '◐  Khởi động', 'Ôn nhanh nội dung hôm qua: đọc lại Kanji và mẫu ngữ pháp cũ, không nhìn đáp án.', 5),
  (55, 2, '語  Từ vựng', 'Từ mới Minna bài 14:
• つけます = Bật (điện, máy)
• けします（消します） = Tắt, xóa
• あけます（開けます） = Mở
• しめます（閉めます） = Đóng
• しめます（締めます） = Thắt (cà vạt, dây lưng)
• いそぎます（急ぎます） = Vội, gấp
• まちます（待ちます） = Đợi
• もちます（持ちます） = Cầm, mang
• てつだいます（手伝います） = Giúp đỡ
• よびます（呼びます） = Gọi (người)
• はなします（話します） = Nói chuyện
• つかいます（使います） = Dùng, sử dụng
• とめます（止めます） = Dừng, đỗ (xe)
• みせます（見せます） = Cho xem
• すわります（座ります） = Ngồi
• たちます（立ちます） = Đứng
• はいります（入ります） = Vào
• でます（出ます） = Ra, rời khỏi
• ふります（降ります） = Rơi (mưa, tuyết)
• コピーします = Sao chép, photo
• エアコン = Máy điều hòa
• パスポート = Hộ chiếu
• じゅうしょ（住所） = Địa chỉ
• ちず（地図） = Bản đồ
• しお（塩） = Muối
• さとう（砂糖） = Đường', 55),
  (55, 3, '漢  Kanji', 'Học 1 chữ Kanji ngay trong từ của hôm nay — nhớ cách đọc trong từ trước, chưa cần thuộc mọi âm đọc.
• 立 [LẬP] Đứng — On: リツ / Kun: た(つ)
   Trong từ hôm nay: 立ちます（たちます）Đứng
   Mẹo: Một người dang tay ĐỨNG trên vạch mặt đất.', 4),
  (55, 4, '文  Ngữ pháp', 'Minna bài 14 (1/2) — Thể て & Yêu cầu
• Cách chia thể て  (Nhóm I đổi đuôi: 書きます → 書いて, 飲みます → 飲んで. 行きます thành 行って. Nhóm II: bỏ ます, thêm て. Nhóm III: します thành して, 来ます thành 来て.)
   Ví dụ: 書きます → 書いて / 飲みます → 飲んで  = viết → viết rồi / uống → uống rồi
• V て ください  (Xin hãy làm ~. Lời nhờ vả hoặc chỉ dẫn.)
   Ví dụ: ちょっと 待って ください。  = Xin hãy đợi một chút.
• V て います  (Đang làm ~ (hành động đang diễn ra).)
   Ví dụ: 今 雨が 降って います。  = Bây giờ trời đang mưa.', 30),
  (55, 5, '耳  Nghe', 'Mở CD Minna no Nihongo bài đang học, phần 会話. Nghe 3 lượt: lượt 1 chỉ nghe, lượt 2 nhìn script, lượt 3 nghe và nhắc theo.', 20),
  (55, 6, '耳  Nghe', 'Shadowing 15 phút: bật lại 会話 hôm qua, nói đuổi theo băng, không nhìn script.', 20),
  (56, 1, '◐  Khởi động', 'Ôn nhanh nội dung hôm qua: đọc lại Kanji và mẫu ngữ pháp cũ, không nhìn đáp án.', 5),
  (56, 2, '語  Từ vựng', 'Từ mới Minna bài 14:
• もんだい（問題） = Vấn đề; câu hỏi (bài thi)
• こたえ（答え） = Câu trả lời, đáp án
• よみかた（読み方） = Cách đọc
• まっすぐ = Thẳng
• ゆっくり = Từ từ, thong thả
• すぐ = Ngay lập tức
• また = Lại; và
• あとで = Lát nữa, sau
• もうすこし（もう少し） = Thêm chút nữa
• さあ = Nào; ừm (khi lưỡng lự)
• まがります（曲がります） = Rẽ
• こたえます（答えます） = Trả lời
• たのみます（頼みます） = Nhờ, yêu cầu
• わたします（渡します） = Đưa, trao
• ならびます（並びます） = Xếp hàng
• ならべます（並べます） = Xếp, bày ra
• ゆっくりと = Chậm rãi
• すぐに = Ngay lập tức
• もういちど（もう一度） = Một lần nữa
• どうも = Cảm ơn; rất
• おくれます（遅れます） = Muộn, trễ
• まにあいます（間に合います） = Kịp
• とまります（止まります） = Dừng lại
• おきます（置きます） = Đặt, để
• あげます（上げます） = Nâng lên, giơ lên
• さがします（探します） = Tìm kiếm
• みつけます（見つけます） = Tìm thấy
• おとします（落とします） = Đánh rơi
• こわします（壊します） = Làm hỏng, phá', 61),
  (56, 3, '文  Ngữ pháp', 'Minna bài 14 (2/2) — Thể て & Yêu cầu
• V ましょうか  (Để tôi ~ nhé? Đề nghị giúp đỡ.)
   Ví dụ: 荷物を 持ちましょうか。  = Để tôi xách hành lý cho nhé?
• N が V (hiện tượng)  (N (đang) … (miêu tả). Miêu tả hiện tượng nhìn thấy, nghe thấy: 雨が降っています.)
   Ví dụ: 子どもが 泣いて います。  = Đứa trẻ đang khóc.', 20),
  (56, 4, '読  Đọc', 'Làm phần 読み物 hoặc 練習C của bài đang học. Đọc to thành tiếng ít nhất 1 lượt.', 20),
  (57, 1, '◐  Khởi động', 'Ôn nhanh nội dung hôm qua: đọc lại Kanji và mẫu ngữ pháp cũ, không nhìn đáp án.', 5),
  (57, 2, '語  Từ vựng', 'Từ mới Minna bài 15:
• つくります（作ります） = Làm, chế tạo
• うります（売ります） = Bán
• しります（知ります） = Biết
• すみます（住みます） = Sống, cư trú
• けんきゅうします（研究します） = Nghiên cứu
• しりょう（資料） = Tài liệu
• カタログ = Ca-ta-lô
• じこくひょう（時刻表） = Bảng giờ tàu xe
• ふく（服） = Quần áo
• せいひん（製品） = Sản phẩm
• ソフト = Phần mềm
• でんしじしょ（電子辞書） = Từ điển điện tử
• けいざい（経済） = Kinh tế
• しやくしょ（市役所） = Tòa thị chính, ủy ban thành phố
• こうこう（高校） = Trường cấp 3
• はいしゃ（歯医者） = Nha sĩ', 35),
  (57, 3, '文  Ngữ pháp', 'Minna bài 15 (1/2) — Cho phép & Cấm đoán
• V て も いいです  (Được phép làm ~.)
   Ví dụ: 写真を 撮っても いいですか。  = Tôi chụp ảnh có được không?
• V て は いけません  (Không được làm ~ (cấm đoán).)
   Ví dụ: ここで たばこを 吸っては いけません。  = Không được hút thuốc ở đây.', 20),
  (57, 4, '耳  Nghe', 'Làm 聴解 (phần nghe) trong sách bài tập Minna 標準問題集 của bài đang học.', 20),
  (58, 1, '◐  Khởi động', 'Ôn nhanh nội dung hôm qua: đọc lại Kanji và mẫu ngữ pháp cũ, không nhìn đáp án.', 5),
  (58, 2, '語  Từ vựng', 'Từ mới Minna bài 15:
• どくしん（独身） = Độc thân
• おもいだします（思い出します） = Nhớ lại
• いらっしゃいます = Có, ở (kính ngữ của います)
• こうこうせい（高校生） = Học sinh cấp ba
• しっています（知っています） = Biết
• しまります（閉まります） = Đóng (cửa tự đóng)
• あきます（開きます） = Mở (cửa tự mở)
• おります（降ります） = Xuống (xe)
• つとめます（勤めます） = Làm việc (cho công ty)
• かてい（家庭） = Gia đình, hộ gia đình
• でんわばんごう（電話番号） = Số điện thoại
• しつもん（質問） = Câu hỏi
• テスト = Bài kiểm tra
• じゅぎょう（授業） = Giờ học
• さくぶん（作文） = Bài văn
• ぶんしょう（文章） = Đoạn văn', 35),
  (58, 3, '文  Ngữ pháp', 'Minna bài 15 (2/2) — Cho phép & Cấm đoán
• V て います (trạng thái)  (Diễn tả trạng thái kéo dài, nghề nghiệp, thói quen.)
   Ví dụ: わたしは 銀行で 働いて います。  = Tôi làm việc tại ngân hàng.
• 〜を 知って います / 知りません  (Biết / không biết. Chú ý: phủ định KHÔNG phải 知って いません.)
   Ví dụ: 田中さんの 電話番号を 知って いますか。  = Bạn có biết số điện thoại của anh Tanaka không?', 20),
  (58, 4, '耳  Nghe', 'Xem 15 phút Erin''s Challenge hoặc Nihongo no Mori N5, bật phụ đề tiếng Nhật.', 20),
  (59, 1, '◐  Khởi động', 'Ôn nhanh nội dung hôm qua: đọc lại Kanji và mẫu ngữ pháp cũ, không nhìn đáp án.', 5),
  (59, 2, '語  Từ vựng', 'Từ mới Minna bài 16:
• のります（乗ります） = Lên (xe), đi (xe)
• のりかえます（乗り換えます） = Đổi tàu, chuyển xe
• あびます（浴びます） = Tắm (vòi sen)
• いれます（入れます） = Cho vào, bỏ vào
• だします（出します） = Lấy ra, nộp
• おろします（下ろします） = Rút (tiền); hạ xuống
• おします（押します） = Ấn, đẩy
• はじめます（始めます） = Bắt đầu (làm gì)
• けんがくします（見学します） = Tham quan học hỏi
• わかい（若い） = Trẻ
• ながい（長い） = Dài
• みじかい（短い） = Ngắn
• あかるい（明るい） = Sáng
• くらい（暗い） = Tối
• からだ（体） = Cơ thể
• あたま（頭） = Đầu
• かみ（髪） = Tóc
• かお（顔） = Mặt
• め（目） = Mắt', 41),
  (59, 3, '漢  Kanji', 'Học 2 chữ Kanji ngay trong từ của hôm nay — nhớ cách đọc trong từ trước, chưa cần thuộc mọi âm đọc.
• 長 [TRƯỜNG / TRƯỞNG] Dài, người đứng đầu — On: チョウ / Kun: なが(い)
   Trong từ hôm nay: 長い（ながい）Dài
   Mẹo: Hình một ông cụ tóc DÀI chống gậy. Tóc dài → sống lâu → bậc TRƯỞNG bối.
• 目 [MỤC] Mắt — On: モク / Kun: め
   Trong từ hôm nay: 目（め）Mắt
   Mẹo: Chữ 日 kéo dài thêm một vạch = con MẮT dựng đứng lên với hai mí và con ngươi.', 8),
  (59, 4, '文  Ngữ pháp', 'Minna bài 16 (1/3) — Nối câu bằng thể て
• V1 て、V2 て、V3  (Làm V1 rồi V2 rồi V3 — nối các hành động theo trình tự thời gian.)
   Ví dụ: 朝 起きて、シャワーを 浴びて、会社へ 行きます。  = Sáng dậy, tắm rồi đi làm.
• V1 て から、V2  (Sau khi làm V1 thì làm V2. Nhấn mạnh thứ tự.)
   Ví dụ: 宿題を してから、遊びます。  = Sau khi làm bài tập xong thì tôi chơi.', 20),
  (59, 5, '耳  Nghe', 'Mở CD Minna no Nihongo bài đang học, phần 会話. Nghe 3 lượt: lượt 1 chỉ nghe, lượt 2 nhìn script, lượt 3 nghe và nhắc theo.', 20),
  (60, 1, '◐  Khởi động', 'Ôn nhanh nội dung hôm qua: đọc lại Kanji và mẫu ngữ pháp cũ, không nhìn đáp án.', 5),
  (60, 2, '語  Từ vựng', 'Từ mới Minna bài 16:
• みみ（耳） = Tai
• はな（鼻） = Mũi
• くち（口） = Miệng
• は（歯） = Răng
• おなか = Bụng
• あし（足） = Chân
• せ（背） = Chiều cao (người)
• せい（背） = Chiều cao (người)
• サービス = Dịch vụ
• ジョギング = Chạy bộ
• シャワー = Vòi sen
• みどり（緑） = Màu xanh lá
• じんじゃ（神社） = Đền thờ Thần đạo
• どうやって = Làm thế nào, bằng cách nào
• まず = Trước hết
• つぎに（次に） = Tiếp theo
• キャッシュカード = Thẻ rút tiền (ATM)
• あんしょうばんごう（暗証番号） = Mã PIN
• きんがく（金額） = Số tiền', 41),
  (60, 3, '漢  Kanji', 'Học 2 chữ Kanji ngay trong từ của hôm nay — nhớ cách đọc trong từ trước, chưa cần thuộc mọi âm đọc.
• 耳 [NHĨ] Tai — On: ジ / Kun: みみ
   Trong từ hôm nay: 耳（みみ）Tai
   Mẹo: Hình vành TAI với các nếp gấp bên trong.
• 足 [TÚC] Chân, đủ — On: ソク / Kun: あし・た(りる)
   Trong từ hôm nay: 足（あし）Chân
   Mẹo: 口 (đầu gối) + 止 (bàn chân) = cả cái CHÂN. Có chân đi được → ĐỦ dùng.', 8),
  (60, 4, '文  Ngữ pháp', 'Minna bài 16 (2/3) — Nối câu bằng thể て
• N は N が Adj です  (Chủ đề N có đặc điểm gì đó. Câu hai tầng chủ ngữ.)
   Ví dụ: 東京は 人が 多いです。  = Tokyo thì đông người.
• Adj て / で (nối tính từ)  (い-adj: bỏ い thêm くて. な-adj và N: thêm で.)
   Ví dụ: この 部屋は 広くて、明るいです。  = Phòng này rộng và sáng.', 20),
  (60, 5, '耳  Nghe', 'Shadowing 15 phút: bật lại 会話 hôm qua, nói đuổi theo băng, không nhìn script.', 20),
  (61, 1, '◐  Khởi động', 'Ôn nhanh nội dung hôm qua: đọc lại Kanji và mẫu ngữ pháp cũ, không nhìn đáp án.', 5),
  (61, 2, '語  Từ vựng', 'Từ mới Minna bài 16:
• かくにん（確認） = Xác nhận, kiểm tra lại
• ひきます（引きます） = Kéo
• しんごう（信号） = Đèn giao thông
• こえ（声） = Giọng nói
• みがきます（磨きます） = Đánh (răng), lau bóng
• おふろ（お風呂） = Bồn tắm; việc tắm
• せっけん = Xà phòng
• そうして = Và rồi
• くび（首） = Cổ
• うで（腕） = Cánh tay
• ゆび（指） = Ngón tay
• せなか（背中） = Lưng
• け（毛） = Lông, tóc
• ひげ = Râu
• ち（血） = Máu
• きぶん（気分） = Tâm trạng, cảm giác trong người
• ねむります（眠ります） = Ngủ
• ふとります（太ります） = Béo lên
• やせます（痩せます） = Gầy đi
• うんどう（運動） = Vận động, thể dục
• うんてんしゅ（運転手） = Tài xế
• ガソリン = Xăng
• おてら（お寺） = Chùa', 49),
  (61, 3, '文  Ngữ pháp', 'Minna bài 16 (3/3) — Nối câu bằng thể て
• どうやって〜か  (Làm như thế nào? Hỏi cách thức, lộ trình.)
   Ví dụ: 駅まで どうやって 行きますか。  = Đi đến ga bằng cách nào?', 10),
  (62, 1, '部  Bộ thủ', 'Ôn bộ thủ: nhìn bộ nói nghĩa, kể 1 Kanji chứa bộ đó.', 10),
  (62, 2, '漢  Kanji', 'Ôn 6 chữ Kanji của Minna bài 13–16 qua từ chứa nó: che nghĩa → đọc từ, che từ → nhớ chữ. Trong app, đánh dấu chữ còn mờ.
川 ・ 立 ・ 長 ・ 目 ・ 耳 ・ 足', 20),
  (62, 3, '文  Ngữ pháp', 'Làm phần 練習B và 練習C trong Minna bài 13–16. Sau đó tự đặt 5 câu mới.', 25),
  (62, 4, '語  Từ vựng', 'Ôn lại toàn bộ từ vựng Minna bài 13–16. Từ nào quên đánh dấu ''Đang học''.', 20),
  (62, 5, '耳読  Nghe + Đọc', 'Làm phần 問題 (nghe + đọc) cuối mỗi bài trong Minna bài 13–16. Ghi lỗi sai vào cột Ghi chú.', 25),
  (63, 1, '◐  Khởi động', 'Ôn nhanh nội dung hôm qua: đọc lại Kanji và mẫu ngữ pháp cũ, không nhìn đáp án.', 5),
  (63, 2, '語  Từ vựng', 'Từ mới Minna bài 17:
• おぼえます（覚えます） = Nhớ, thuộc
• わすれます（忘れます） = Quên
• なくします（無くします） = Làm mất
• はらいます（払います） = Trả (tiền)
• かえします（返します） = Trả lại
• でかけます（出かけます） = Ra ngoài, đi chơi
• ぬぎます（脱ぎます） = Cởi (quần áo, giày)
• もっていきます（持って 行きます） = Mang đi
• もってきます（持って 来ます） = Mang đến
• しんぱいします（心配します） = Lo lắng
• ざんぎょうします（残業します） = Làm thêm giờ
• しゅっちょうします（出張します） = Đi công tác
• たいせつ（大切） = Quan trọng
• だいじょうぶ（大丈夫） = Không sao, ổn
• あぶない（危ない） = Nguy hiểm
• きんえん（禁煙） = Cấm hút thuốc
• ほけんしょう（保険証） = Thẻ bảo hiểm (y tế)
• ねつ（熱） = Sốt
• びょうき（病気） = Bệnh
• くすり（薬） = Thuốc
• うわぎ（上着） = Áo khoác', 45),
  (63, 3, '文  Ngữ pháp', 'Minna bài 17 (1/2) — Thể ない — Cấm, Bắt buộc, Không cần
• Cách chia thể ない  (Nhóm I: đổi hàng い sang hàng あ + ない (飲みます→飲まない). Nhóm II: bỏ ます thêm ない. Nhóm III: します→しない, 来ます→来ない (こない).)
   Ví dụ: 行きます → 行かない  = đi → không đi
• V ない で ください  (Xin đừng làm ~.)
   Ví dụ: ここに 車を 止めないで ください。  = Xin đừng đỗ xe ở đây.
• V なければ なりません  (Phải làm ~ (bắt buộc). Bỏ ない thêm ければ なりません.)
   Ví dụ: 毎日 薬を 飲まなければ なりません。  = Tôi phải uống thuốc mỗi ngày.', 30),
  (63, 4, '読  Đọc', 'Làm phần 読み物 hoặc 練習C của bài đang học. Đọc to thành tiếng ít nhất 1 lượt.', 20),
  (63, 5, '耳  Nghe', 'Làm 聴解 (phần nghe) trong sách bài tập Minna 標準問題集 của bài đang học.', 20),
  (64, 1, '◐  Khởi động', 'Ôn nhanh nội dung hôm qua: đọc lại Kanji và mẫu ngữ pháp cũ, không nhìn đáp án.', 5),
  (64, 2, '語  Từ vựng', 'Từ mới Minna bài 17:
• したぎ（下着） = Đồ lót
• 〜までに = Trước ~ (hạn chót)
• ですから = Vì vậy, do đó
• どうしましたか = Anh/chị bị làm sao vậy?
• のど = Cổ họng
• いたい（痛い） = Đau
• かぜ（風邪） = Cảm (bệnh)
• おだいじに（お大事に） = Chúc mau khỏe
• たいせつ[な]（大切[な]） = Quan trọng
• こまります（困ります） = Khó xử, gặp rắc rối
• つぎ（次） = Tiếp theo
• にゅういん（入院） = Nhập viện
• たいいん（退院） = Ra viện
• おみまい（お見舞い） = Thăm người ốm
• けが = Vết thương, bị thương
• ぐあい（具合） = Tình trạng (sức khỏe)
• なおります（治ります） = Khỏi (bệnh)
• あんぜん（安全） = An toàn
• きけん（危険） = Nguy hiểm
• ひつよう（必要） = Cần thiết
• だめ = Không được, hỏng
• ない = Không có', 47),
  (64, 3, '文  Ngữ pháp', 'Minna bài 17 (2/2) — Thể ない — Cấm, Bắt buộc, Không cần
• V なくても いいです  (Không cần phải làm ~.)
   Ví dụ: あした 来なくても いいです。  = Ngày mai bạn không cần đến cũng được.
• 時 まで に V  (Phải làm gì trước thời hạn nào.)
   Ví dụ: 5時までに 帰ります。  = Tôi sẽ về trước 5 giờ.
• N (tân ngữ) は  (còn N thì …. Đưa tân ngữ lên làm chủ đề, thay を bằng は để nhấn mạnh/đối chiếu.)
   Ví dụ: お酒は 飲みません。  = Rượu thì tôi không uống.', 30),
  (64, 4, '読  Đọc', 'Vào NHK News Web Easy đọc 1 bài. Gạch chân từ mới, chép 3 câu vào sổ.', 20),
  (65, 1, '◐  Khởi động', 'Ôn nhanh nội dung hôm qua: đọc lại Kanji và mẫu ngữ pháp cũ, không nhìn đáp án.', 5),
  (65, 2, '語  Từ vựng', 'Từ mới Minna bài 18:
• できます = Có thể, làm được
• あらいます（洗います） = Rửa
• ひきます（弾きます） = Chơi (nhạc cụ dây, phím)
• うたいます（歌います） = Hát
• あつめます（集めます） = Sưu tầm, tập hợp
• すてます（捨てます） = Vứt bỏ
• かえます（換えます） = Đổi (tiền, đồ)
• うんてんします（運転します） = Lái xe
• よやくします（予約します） = Đặt trước
• ピアノ = Đàn piano
• メートル = Mét
• げんきん（現金） = Tiền mặt
• しゅみ（趣味） = Sở thích
• にっき（日記） = Nhật ký
• かちょう（課長） = Trưởng ban, trưởng nhóm
• ぶちょう（部長） = Trưởng phòng
• しゃちょう（社長） = Giám đốc
• どうぶつ（動物） = Động vật', 39),
  (65, 3, '文  Ngữ pháp', 'Minna bài 18 (1/2) — Thể từ điển & Khả năng
• Thể từ điển (辞書形)  (Nhóm I: đổi ます-stem về hàng う (書きます→書く). Nhóm II: bỏ ます thêm る. Nhóm III: します→する, 来ます→来る (くる).)
   Ví dụ: 食べます → 食べる  = ăn (thể lịch sự) → ăn (thể từ điển)
• N が できます  (Có thể / biết làm N.)
   Ví dụ: わたしは 日本語が できます。  = Tôi biết tiếng Nhật.
• V る こと が できます  (Có thể làm ~.)
   Ví dụ: ピアノを 弾く ことが できます。  = Tôi có thể chơi piano.', 30),
  (65, 4, '耳  Nghe', 'Mở CD Minna no Nihongo bài đang học, phần 会話. Nghe 3 lượt: lượt 1 chỉ nghe, lượt 2 nhìn script, lượt 3 nghe và nhắc theo.', 20),
  (66, 1, '◐  Khởi động', 'Ôn nhanh nội dung hôm qua: đọc lại Kanji và mẫu ngữ pháp cũ, không nhìn đáp án.', 5),
  (66, 2, '語  Từ vựng', 'Từ mới Minna bài 18:
• うま（馬） = Con ngựa
• インターネット = Internet
• とくに（特に） = Đặc biệt là
• へえ = Ồ, thế à (ngạc nhiên)
• なかなか = Mãi mà (không)…; khá là
• ほんとうですか（本当ですか） = Thật không?
• ぜひ = Nhất định, rất muốn
• べんきょう（勉強） = Học tập
• そうじ（掃除） = Dọn dẹp
• せんたく（洗濯） = Giặt giũ
• はしります（走ります） = Chạy
• とびます（飛びます） = Bay
• なきます（鳴きます） = Kêu, hót (động vật)
• やります = Làm (thân mật)
• よしゅう（予習） = Chuẩn bị bài trước
• ふくしゅう（復習） = Ôn bài
• けいけん（経験） = Kinh nghiệm
• おいのり（お祈り） = Sự cầu nguyện', 39),
  (66, 3, '文  Ngữ pháp', 'Minna bài 18 (2/2) — Thể từ điển & Khả năng
• わたしの 趣味は V る ことです  (Sở thích của tôi là ~.)
   Ví dụ: わたしの 趣味は 本を 読む ことです。  = Sở thích của tôi là đọc sách.
• V る まえに / N の まえに / 期間 まえに  (Trước khi ~. Trước danh từ dùng の.)
   Ví dụ: 寝る まえに 歯を 磨きます。  = Trước khi ngủ tôi đánh răng.
• なかなか〜ない / ぜひ  (mãi mà không… / nhất định. なかなか: khó đạt được; ぜひ: mong muốn mạnh.)
   Ví dụ: なかなか 眠れません。  = Mãi mà không ngủ được.', 30),
  (66, 4, '耳  Nghe', 'Shadowing 15 phút: bật lại 会話 hôm qua, nói đuổi theo băng, không nhìn script.', 20),
  (67, 1, '◐  Khởi động', 'Ôn nhanh nội dung hôm qua: đọc lại Kanji và mẫu ngữ pháp cũ, không nhìn đáp án.', 5),
  (67, 2, '語  Từ vựng', 'Từ mới Minna bài 19:
• のぼります（登ります） = Leo, trèo
• とまります（泊まります） = Nghỉ lại qua đêm
• そうじします（掃除します） = Dọn dẹp
• せんたくします（洗濯します） = Giặt giũ
• なります = Trở nên
• ねむい（眠い） = Buồn ngủ
• つよい（強い） = Mạnh
• よわい（弱い） = Yếu
• れんしゅう（練習） = Luyện tập
• ゴルフ = Golf
• すもう（相撲） = Sumo (vật Nhật)
• ちょうし（調子） = Tình trạng, phong độ
• いちど（一度） = Một lần
• いちども（一度も） = Chưa (một) lần nào
• だんだん = Dần dần
• もうすぐ = Sắp, sắp sửa
• おかげさまで = Nhờ trời, nhờ anh/chị (mà tôi khỏe / ổn)', 37),
  (67, 3, '文  Ngữ pháp', 'Minna bài 19 (1/2) — Thể た — Kinh nghiệm & Liệt kê
• Thể た — nói với bạn bè về việc đã qua  (Chia giống thể て, chỉ đổi て→た, で→だ.)
   Ví dụ: 行って → 行った  = đã đi
• V た こと が あります  (Đã từng làm ~ (kinh nghiệm).)
   Ví dụ: 日本へ 行った ことが あります。  = Tôi đã từng đi Nhật.', 20),
  (67, 4, '読  Đọc', 'Làm phần 読み物 hoặc 練習C của bài đang học. Đọc to thành tiếng ít nhất 1 lượt.', 20),
  (67, 5, '耳  Nghe', 'Làm 聴解 (phần nghe) trong sách bài tập Minna 標準問題集 của bài đang học.', 20),
  (68, 1, '◐  Khởi động', 'Ôn nhanh nội dung hôm qua: đọc lại Kanji và mẫu ngữ pháp cũ, không nhìn đáp án.', 5),
  (68, 2, '語  Từ vựng', 'Từ mới Minna bài 19:
• でも = Nhưng
• かんぱい（乾杯） = Cạn chén, nâng ly
• ダイエット = Ăn kiêng
• むり（無理） = Quá sức, không thể
• からだにいい（体にいい） = Tốt cho sức khỏe
• れんしゅうします（練習します） = Luyện tập
• ちょうど = Vừa đúng
• ほか = Khác, ngoài ra
• ～ど（～度） = … lần; … độ
• そつぎょう（卒業） = Tốt nghiệp
• そうだん（相談） = Bàn bạc, trao đổi
• ようい（用意） = Chuẩn bị sẵn
• しっぱい（失敗） = Thất bại, làm hỏng
• りょかん（旅館） = Nhà trọ kiểu Nhật
• けんぶつ（見物） = Tham quan, ngắm cảnh
• けしき（景色） = Phong cảnh
• しゅっぱつ（出発） = Xuất phát
• スーツケース = Va li', 39),
  (68, 3, '文  Ngữ pháp', 'Minna bài 19 (2/2) — Thể た — Kinh nghiệm & Liệt kê
• V たり V たり します  (Khi thì làm ~, khi thì làm ~ (liệt kê không đầy đủ).)
   Ví dụ: 日曜日は 本を 読んだり、映画を 見たり します。  = Chủ Nhật tôi đọc sách, xem phim...
• Adj く なります / に なります  (Trở nên ~. い-adj: 〜く. な-adj và N: 〜に.)
   Ví dụ: 寒く なりました。  = Trời đã trở lạnh.', 20),
  (68, 4, '読  Đọc', 'Vào NHK News Web Easy đọc 1 bài. Gạch chân từ mới, chép 3 câu vào sổ.', 20),
  (69, 1, '◐  Khởi động', 'Ôn nhanh nội dung hôm qua: đọc lại Kanji và mẫu ngữ pháp cũ, không nhìn đáp án.', 5),
  (69, 2, '語  Từ vựng', 'Từ mới Minna bài 20:
• いります（要ります） = Cần
• しらべます（調べます） = Tra cứu, điều tra
• なおします（直します） = Sửa chữa
• しゅうりします（修理します） = Sửa chữa (máy móc)
• ぼく（僕） = Tớ, tôi (nam giới)
• きみ（君） = Cậu, bạn (thân mật)
• うん / ううん = Ừ / không
• ことば（言葉） = Từ ngữ, ngôn ngữ
• きもの（着物） = Kimono; trang phục
• ビザ = Thị thực, visa
• はじめ（初め） = Lúc đầu
• おわり（終わり） = Sự kết thúc, phần cuối
• こっち = Phía này (thân mật)
• そっち = Phía đó (thân mật)
• あっち = Phía kia (thân mật)
• どっち = Phía nào, cái nào (trong hai)
• みんなで = Mọi người cùng nhau', 37),
  (69, 3, '漢  Kanji', 'Học 1 chữ Kanji ngay trong từ của hôm nay — nhớ cách đọc trong từ trước, chưa cần thuộc mọi âm đọc.
• 言 [NGÔN] Nói, lời nói — On: ゲン・ゴン / Kun: い(う)・こと
   Trong từ hôm nay: 言葉（ことば）Từ ngữ, ngôn ngữ
   Mẹo: Cái miệng 口 bên dưới, các vạch bên trên là sóng âm phát ra = LỜI NÓI. Chữ nào có 言 đều liên quan đến nói.', 4),
  (69, 4, '文  Ngữ pháp', 'Minna bài 20 (1/2) — Thể thông thường (普通形)
• Thể thông thường của động từ  (です・ます → thể từ điển / ない / た / なかった. Dùng với bạn bè, người thân.)
   Ví dụ: あした 東京へ 行く。  = Mai tớ đi Tokyo.
• Thể thông thường của tính từ và danh từ  (い-adj: 高い / 高くない / 高かった. な-adj & N: 静かだ / 静かじゃない / 静かだった.)
   Ví dụ: この 店は 安い。  = Quán này rẻ.', 20),
  (69, 5, '耳  Nghe', 'Xem 15 phút Erin''s Challenge hoặc Nihongo no Mori N5, bật phụ đề tiếng Nhật.', 20),
  (69, 6, '耳  Nghe', 'Shadowing 15 phút: bật lại 会話 hôm qua, nói đuổi theo băng, không nhìn script.', 20),
  (70, 1, '◐  Khởi động', 'Ôn nhanh nội dung hôm qua: đọc lại Kanji và mẫu ngữ pháp cũ, không nhìn đáp án.', 5),
  (70, 2, '語  Từ vựng', 'Từ mới Minna bài 20:
• 〜けど = Nhưng
• おなかがいっぱい = No bụng
• こわれます（壊れます） = Bị hỏng
• だいがくいん（大学院） = Cao học
• こくさい〜（国際〜） = Quốc tế ~
• じゃあ = Vậy thì
• では = Vậy thì
• じゃ = Vậy thì (thân mật)
• しかし = Tuy nhiên
• それでは = Vậy thì (trang trọng)
• など = Vân vân
• ～ちゅう（～中） = Đang …, trong lúc …
• あと（後） = Sau, sau khi
• しょうらい（将来） = Tương lai
• とちゅう（途中） = Giữa đường, giữa chừng
• きゅう（急） = Gấp, đột ngột
• そろそろ = Sắp sửa, đã đến lúc
• だから = Vì vậy
• それに = Thêm vào đó
• たとえば（例えば） = Ví dụ', 43),
  (70, 3, '文  Ngữ pháp', 'Minna bài 20 (2/2) — Thể thông thường (普通形)
• Câu hỏi thân mật  (Bỏ か, lên giọng cuối câu. Với な-adj và N thì bỏ luôn だ.)
   Ví dụ: コーヒーを 飲む？  = Uống cà phê không?
• Lược bỏ trợ từ  (Trong hội thoại thân mật, は・が・を thường được lược bỏ.)
   Ví dụ: ごはん、食べた？  = Ăn cơm chưa?', 20),
  (70, 4, '読  Đọc', 'Làm phần 読み物 hoặc 練習C của bài đang học. Đọc to thành tiếng ít nhất 1 lượt.', 20),
  (71, 1, '部  Bộ thủ', 'Ôn bộ thủ: nhìn bộ nói nghĩa, kể 1 Kanji chứa bộ đó.', 10),
  (71, 2, '文  Ngữ pháp', 'Làm phần 練習B và 練習C trong Minna bài 17–20. Sau đó tự đặt 5 câu mới.', 25),
  (71, 3, '語  Từ vựng', 'Ôn lại toàn bộ từ vựng Minna bài 17–20. Từ nào quên đánh dấu ''Đang học''.', 20),
  (71, 4, '耳読  Nghe + Đọc', 'Làm phần 問題 (nghe + đọc) cuối mỗi bài trong Minna bài 17–20. Ghi lỗi sai vào cột Ghi chú.', 25),
  (72, 1, '◐  Khởi động', 'Ôn nhanh nội dung hôm qua: đọc lại Kanji và mẫu ngữ pháp cũ, không nhìn đáp án.', 5),
  (72, 2, '語  Từ vựng', 'Từ mới Minna bài 21:
• おもいます（思います） = Nghĩ
• いいます（言います） = Nói
• かちます（勝ちます） = Thắng
• まけます（負けます） = Thua
• やくにたちます（役に立ちます） = Có ích
• うごきます（動きます） = Chuyển động, chạy (máy)
• やめます = Bỏ, thôi (việc, thói quen)
• きをつけます（気をつけます） = Chú ý, cẩn thận
• りゅうがくします（留学します） = Du học
• むだ（無駄） = Lãng phí, vô ích
• ふべん（不便） = Bất tiện
• すごい = Tuyệt, ghê gớm
• ほんとう（本当） = Thật, sự thật
• うそ（嘘） = Lời nói dối
• じどうしゃ（自動車） = Ô tô
• こうつう（交通） = Giao thông
• ぶっか（物価） = Vật giá
• ほうそう（放送） = Phát sóng, truyền thanh
• ニュース = Tin tức
• アニメ = Phim hoạt hình
• マンガ = Truyện tranh
• デザイン = Thiết kế
• ゆめ（夢） = Giấc mơ, ước mơ
• てんさい（天才） = Thiên tài
• しあい（試合） = Trận đấu
• いけん（意見） = Ý kiến
• はなし（話） = Câu chuyện, bài nói
• ちきゅう（地球） = Trái đất
• さいきん（最近） = Gần đây', 61),
  (72, 3, '文  Ngữ pháp', 'Minna bài 21 (1/2) — Ý kiến — と 思います / と 言います
• 普通形 と 思います  (Tôi nghĩ rằng ~. Trước 思います luôn dùng thể thông thường.)
   Ví dụ: 田中さんは もう 帰ったと 思います。  = Tôi nghĩ anh Tanaka đã về rồi.
• 普通形 と 言います  (Nói rằng ~. Trích dẫn gián tiếp.)
   Ví dụ: 山田さんは あした 来ると 言いました。  = Anh Yamada nói rằng mai sẽ đến.
• 普通形 でしょう？  (~ đúng không? Xác nhận thông tin, lên giọng cuối câu.)
   Ví dụ: あした 雨が 降るでしょう。  = Chắc ngày mai trời sẽ mưa.', 30),
  (72, 4, '耳  Nghe', 'Làm 聴解 (phần nghe) trong sách bài tập Minna 標準問題集 của bài đang học.', 20),
  (73, 1, '◐  Khởi động', 'Ôn nhanh nội dung hôm qua: đọc lại Kanji và mẫu ngữ pháp cũ, không nhìn đáp án.', 5),
  (73, 2, '語  Từ vựng', 'Từ mới Minna bài 21:
• たぶん（多分） = Có lẽ
• きっと = Chắc chắn
• ほんとうに（本当に） = Thật sự
• そんなに = (không) đến mức đó
• 〜について = Về ~
• しかたがありません（仕方がありません） = Đành chịu, không còn cách nào
• しばらくですね = Lâu rồi không gặp nhỉ
• もちろん = Tất nhiên
• せいじ（政治） = Chính trị
• むだ[な] = Lãng phí, vô ích
• しにます（死にます） = Chết
• きえます（消えます） = Tắt; biến mất
• だいじ（大事） = Quan trọng
• ただしい（正しい） = Đúng, chính xác
• とくべつ（特別） = Đặc biệt
• うれしい（嬉しい） = Vui mừng
• かなしい（悲しい） = Buồn
• こわい（怖い） = Sợ, đáng sợ
• はずかしい（恥ずかしい） = Xấu hổ, ngại
• ざんねん（残念） = Đáng tiếc
• あんしん（安心） = Yên tâm
• よろこびます（喜びます） = Vui mừng
• おどろきます（驚きます） = Ngạc nhiên
• びっくり = Giật mình, bất ngờ
• おこります（怒ります） = Giận, nổi giận
• なきます（泣きます） = Khóc
• わらいます（笑います） = Cười
• こころ（心） = Trái tim, tấm lòng
• かならず（必ず） = Nhất định', 61),
  (73, 3, '文  Ngữ pháp', 'Minna bài 21 (2/2) — Ý kiến — と 思います / と 言います
• N / 場所 で  (で cũng chỉ phạm vi, hoàn cảnh diễn ra sự việc.)
   Ví dụ: 会議で 意見を 言います。  = Tôi phát biểu ý kiến trong cuộc họp.
• 場所 で イベント が あります  (ở … có (sự kiện). Sự kiện diễn ra dùng で (khác に cho vật tồn tại).)
   Ví dụ: ホテルで 結婚式が あります。  = Có đám cưới ở khách sạn.
• N でも V  (… chẳng hạn (gợi ý). でも đưa ra gợi ý nhẹ nhàng, không bắt buộc.)
   Ví dụ: 散歩でも しませんか。  = Đi dạo chút không?', 30),
  (73, 4, '読  Đọc', 'Vào NHK News Web Easy đọc 1 bài. Gạch chân từ mới, chép 3 câu vào sổ.', 20),
  (74, 1, '◐  Khởi động', 'Ôn nhanh nội dung hôm qua: đọc lại Kanji và mẫu ngữ pháp cũ, không nhìn đáp án.', 5),
  (74, 2, '語  Từ vựng', 'Từ mới Minna bài 22:
• きます（着ます） = Mặc (áo)
• はきます = Mang, đi (quần, giày)
• かぶります = Đội (mũ)
• かけます = Đeo (kính)
• うまれます（生まれます） = Được sinh ra
• コート = Áo khoác dài
• セーター = Áo len
• スーツ = Bộ com-lê
• ぼうし（帽子） = Mũ
• めがね = Kính mắt
• ロボット = Rô-bốt
• ユーモア = Sự hài hước
• つごう（都合） = Sự thuận tiện (thời gian)
• えーと = Ờ… để xem nào
• おめでとうございます = Chúc mừng
• やちん（家賃） = Tiền thuê nhà
• わしつ（和室） = Phòng kiểu Nhật
• おしいれ（押し入れ） = Tủ âm tường kiểu Nhật
• ふとん（布団） = Chăn đệm (futon)
• ようふく（洋服） = Quần áo (kiểu Tây)
• しゅっしん（出身） = Quê quán
• ワイシャツ = Áo sơ mi trắng (công sở)
• せびろ（背広） = Bộ com-lê
• スカート = Váy
• ズボン = Quần dài
• くつした（靴下） = Tất
• さします（差します） = Che (ô), giương', 57),
  (74, 3, '文  Ngữ pháp', 'Minna bài 22 (1/1) — Mệnh đề bổ nghĩa danh từ
• 普通形 + N  (Dùng cả một mệnh đề để bổ nghĩa cho danh từ. Đây là nền tảng của mọi câu dài.)
   Ví dụ: これは 田中さんが 作った ケーキです。  = Đây là chiếc bánh mà anh Tanaka đã làm.
• Trong mệnh đề bổ nghĩa, が thay cho は  (Chủ ngữ của mệnh đề phụ luôn dùng が.)
   Ví dụ: わたしが 住んで いる 町は 静かです。  = Thị trấn tôi đang sống rất yên tĩnh.
• V る 時間 / 約束 / 用事 が あります  (Có thời gian / lời hẹn / việc bận để làm gì.)
   Ví dụ: 本を 読む 時間が ありません。  = Tôi không có thời gian đọc sách.', 30),
  (74, 4, '耳  Nghe', 'Xem 15 phút Erin''s Challenge hoặc Nihongo no Mori N5, bật phụ đề tiếng Nhật.', 20),
  (74, 5, '耳  Nghe', 'Mở CD Minna no Nihongo bài đang học, phần 会話. Nghe 3 lượt: lượt 1 chỉ nghe, lượt 2 nhìn script, lượt 3 nghe và nhắc theo.', 20),
  (75, 1, '◐  Khởi động', 'Ôn nhanh nội dung hôm qua: đọc lại Kanji và mẫu ngữ pháp cũ, không nhìn đáp án.', 5),
  (75, 2, '語  Từ vựng', 'Từ mới Minna bài 23:
• まわします（回します） = Xoay, vặn
• かえます（変えます） = Thay đổi
• さわります（触ります） = Chạm vào
• あるきます（歩きます） = Đi bộ
• わたります（渡ります） = Băng qua
• さびしい（寂しい） = Cô đơn, buồn
• ゆ（湯） = Nước nóng
• サイズ = Cỡ, kích thước
• こしょう（故障） = Sự hỏng hóc
• みち（道） = Con đường
• こうさてん（交差点） = Ngã tư
• かど（角） = Góc phố
• はし（橋） = Cây cầu
• ちゅうしゃじょう（駐車場） = Bãi đỗ xe
• たてもの（建物） = Toà nhà
• なんかいも（何回も） = Nhiều lần
• ～め（～目） = Thứ …
• こしょうします（故障します） = Bị hỏng (máy móc)
• つまみ = Núm vặn
• ストーブ = Lò sưởi
• もん（門） = Cổng', 45),
  (75, 3, '漢  Kanji', 'Học 1 chữ Kanji ngay trong từ của hôm nay — nhớ cách đọc trong từ trước, chưa cần thuộc mọi âm đọc.
• 道 [ĐẠO] Đường, con đường — On: ドウ / Kun: みち
   Trong từ hôm nay: 道（みち）Con đường
   Mẹo: Bộ 辶 (di chuyển) + 首 (cái đầu) = ngẩng đầu bước đi trên con ĐƯỜNG.', 4),
  (75, 4, '文  Ngữ pháp', 'Minna bài 23 (1/2) — とき & Điều kiện と
• 普通形 + とき、〜  (Khi ~ thì ~. Thì của mệnh đề とき quyết định việc đó xảy ra trước hay sau.)
   Ví dụ: 日本へ 行く とき、カメラを 買いました。  = Khi (chuẩn bị) đi Nhật, tôi đã mua máy ảnh.
• N の とき / Adj な とき / Adj い とき  (Khi là ~. Danh từ thêm の, な-adj thêm な.)
   Ví dụ: 子どもの とき、よく 川で 泳ぎました。  = Hồi bé tôi hay bơi ở sông.', 20),
  (75, 5, '読  Đọc', 'Làm phần 読み物 hoặc 練習C của bài đang học. Đọc to thành tiếng ít nhất 1 lượt.', 20),
  (75, 6, '耳  Nghe', 'Làm 聴解 (phần nghe) trong sách bài tập Minna 標準問題集 của bài đang học.', 20),
  (76, 1, '◐  Khởi động', 'Ôn nhanh nội dung hôm qua: đọc lại Kanji và mẫu ngữ pháp cũ, không nhìn đáp án.', 5),
  (76, 2, '語  Từ vựng', 'Từ mới Minna bài 23:
• たて = Chiều dọc
• やおや（八百屋） = Cửa hàng rau quả
• ～とき（～時） = Khi …, lúc …
• とおり（通り） = Đường phố, phố
• とおります（通ります） = Đi qua, chạy qua
• とおく（遠く） = Nơi xa
• ～がわ（～側） = Phía …, bên …
• ひがし（東） = Phía đông
• にし（西） = Phía tây
• みなみ（南） = Phía nam
• きた（北） = Phía bắc
• かたち（形） = Hình dáng
• せん（線） = Đường kẻ, đường
• てん（点） = Điểm, chấm
• キロメートル = Ki-lô-mét (km)', 33),
  (76, 3, '漢  Kanji', 'Học 4 chữ Kanji ngay trong từ của hôm nay — nhớ cách đọc trong từ trước, chưa cần thuộc mọi âm đọc.
• 東 [ĐÔNG] Hướng đông — On: トウ / Kun: ひがし
   Trong từ hôm nay: 東（ひがし）Phía đông
   Mẹo: Chữ 日 (mặt trời) nằm sau chữ 木 (cây) = mặt trời mọc lên phía sau rặng cây → hướng ĐÔNG.
• 西 [TÂY] Hướng tây — On: セイ・サイ / Kun: にし
   Trong từ hôm nay: 西（にし）Phía tây
   Mẹo: Hình con chim đậu vào tổ khi mặt trời lặn phía TÂY.
• 南 [NAM] Hướng nam — On: ナン / Kun: みなみ
   Trong từ hôm nay: 南（みなみ）Phía nam
   Mẹo: Hình cái lều mở về hướng ấm áp phía NAM.
• 北 [BẮC] Hướng bắc — On: ホク / Kun: きた
   Trong từ hôm nay: 北（きた）Phía bắc
   Mẹo: Hai người quay lưng vào nhau vì trời BẮC quá lạnh, phải dựa lưng sưởi ấm.', 16),
  (76, 4, '文  Ngữ pháp', 'Minna bài 23 (2/2) — とき & Điều kiện と
• V る と、〜  (Cứ ~ thì ~. Dùng cho việc tự nhiên xảy ra. Vế sau không phải lời rủ hay lời nhờ.)
   Ví dụ: この ボタンを 押すと、切符が 出ます。  = Cứ ấn nút này thì vé sẽ ra.', 10),
  (77, 1, '◐  Khởi động', 'Ôn nhanh nội dung hôm qua: đọc lại Kanji và mẫu ngữ pháp cũ, không nhìn đáp án.', 5),
  (77, 2, '語  Từ vựng', 'Từ mới Minna bài 24:
• くれます = Cho tôi
• つれていきます（連れて 行きます） = Dẫn ai đi
• つれてきます（連れて 来ます） = Dẫn ai đến
• しょうかいします（紹介します） = Giới thiệu
• あんないします（案内します） = Hướng dẫn, dẫn đường
• せつめいします（説明します） = Giải thích
• おじいさん / おばあさん = Ông / bà
• じゅんび（準備） = Chuẩn bị
• ひっこし（引っ越し） = Việc chuyển nhà
• ホームステイ = Ở nhà người bản xứ (homestay)', 23),
  (77, 3, '文  Ngữ pháp', 'Minna bài 24 (1/2) — Cho & Nhận nâng cao — てあげる / てもらう / てくれる
• N を くれます  (Ai đó cho TÔI (hoặc người trong nhóm tôi). Chủ ngữ là người cho.)
   Ví dụ: 山田さんは わたしに 花を くれました。  = Anh Yamada đã tặng hoa cho tôi.
• V て あげます  (Làm gì đó GIÚP người khác. Cẩn thận: nghe có vẻ ban ơn, tránh dùng với cấp trên.)
   Ví dụ: 友だちに 本を 貸して あげました。  = Tôi đã cho bạn mượn sách.
• V て もらいます  (Được ai đó làm gì cho. Chủ ngữ là người nhận ơn.)
   Ví dụ: 田中さんに 日本語を 教えて もらいました。  = Tôi được anh Tanaka dạy tiếng Nhật.', 30),
  (77, 4, '読  Đọc', 'Vào NHK News Web Easy đọc 1 bài. Gạch chân từ mới, chép 3 câu vào sổ.', 20),
  (78, 1, '◐  Khởi động', 'Ôn nhanh nội dung hôm qua: đọc lại Kanji và mẫu ngữ pháp cũ, không nhìn đáp án.', 5),
  (78, 2, '語  Từ vựng', 'Từ mới Minna bài 24:
• ぜんぶ（全部） = Toàn bộ
• じぶんで（自分で） = Tự mình
• ほかに = Ngoài ra
• そぼ / そふ（祖母 / 祖父） = Bà tôi / ông tôi
• おべんとう（お弁当） = Cơm hộp
• じぶん（自分） = Bản thân
• レコード = Đĩa than
• いきます（生きます） = Sống
• そだてます（育てます） = Nuôi dạy, trồng
• にます（似ます） = Giống
• けんか = Cãi nhau, đánh nhau', 25),
  (78, 3, '文  Ngữ pháp', 'Minna bài 24 (2/2) — Cho & Nhận nâng cao — てあげる / てもらう / てくれる
• V て くれます  (Ai đó làm gì cho TÔI. Sắc thái biết ơn tự nhiên nhất.)
   Ví dụ: 母が セーターを 送って くれました。  = Mẹ đã gửi áo len cho tôi.
• Từ nghi vấn が V  (ai / cái gì … ?. Từ nghi vấn làm chủ ngữ luôn đi với が, không dùng は.)
   Ví dụ: どこが 痛いですか。  = Bạn đau ở đâu?', 20),
  (78, 4, '耳  Nghe', 'Xem 15 phút Erin''s Challenge hoặc Nihongo no Mori N5, bật phụ đề tiếng Nhật.', 20),
  (79, 1, '◐  Khởi động', 'Ôn nhanh nội dung hôm qua: đọc lại Kanji và mẫu ngữ pháp cũ, không nhìn đáp án.', 5),
  (79, 2, '語  Từ vựng', 'Từ mới Minna bài 25:
• かんがえます（考えます） = Suy nghĩ
• つきます（着きます） = Đến nơi
• とります（取ります） = Lấy, nhận
• たります（足ります） = Đủ
• いなか（田舎） = Quê, nông thôn
• たいしかん（大使館） = Đại sứ quán
• グループ = Nhóm
• チャンス = Cơ hội
• おく（億） = Trăm triệu
• もし = Giả sử, nếu như
• てんきん（転勤） = Chuyển công tác
• こと = Việc, chuyện', 27),
  (79, 3, '文  Ngữ pháp', 'Minna bài 25 (1/2) — Giả định — たら & ても
• 普通形 た + ら、〜  (Nếu ~ thì ~. Dùng được khi rủ, nhờ, hoặc nói việc mình sẽ làm.)
   Ví dụ: 雨が 降ったら、行きません。  = Nếu trời mưa thì tôi không đi.
• V て も、〜  (Dù ~ thì vẫn ~. Vế sau đi ngược lại mong đợi.)
   Ví dụ: 雨が 降っても、行きます。  = Dù trời mưa tôi vẫn đi.
• もし 〜 たら  (もし đứng đầu câu nhấn mạnh đây là giả định.)
   Ví dụ: もし 1億円 あったら、家を 買います。  = Nếu có 100 triệu yên, tôi sẽ mua nhà.', 30),
  (79, 4, '耳  Nghe', 'Mở CD Minna no Nihongo bài đang học, phần 会話. Nghe 3 lượt: lượt 1 chỉ nghe, lượt 2 nhìn script, lượt 3 nghe và nhắc theo.', 20),
  (80, 1, '◐  Khởi động', 'Ôn nhanh nội dung hôm qua: đọc lại Kanji và mẫu ngữ pháp cũ, không nhìn đáp án.', 5),
  (80, 2, '語  Từ vựng', 'Từ mới Minna bài 25:
• がんばります（頑張ります） = Cố gắng
• どうぞおげんきで（どうぞお元気で） = Chúc anh/chị mạnh khỏe (khi chia tay)
• ひっこしします（引っ越しします） = Chuyển nhà
• 〜たら = Nếu ~ thì
• 〜ても = Dù ~ thì
• いくら〜ても = Dù ~ bao nhiêu đi nữa
• しゅうかん（習慣） = Thói quen
• じんせい（人生） = Cuộc đời
• おせわに なりました（お世話に なりました） = Cảm ơn vì đã giúp đỡ
• かた（方） = Người (lịch sự); cách làm
• もしもし = A lô
• お～ = (tiền tố lịch sự)', 27),
  (80, 3, '文  Ngữ pháp', 'Minna bài 25 (2/2) — Giả định — たら & ても
• いくら 〜 ても  (Dù ~ đến mấy đi nữa cũng ~.)
   Ví dụ: いくら 考えても、わかりません。  = Dù nghĩ thế nào tôi cũng không hiểu.
• V たら (sau khi)  (sau khi … thì. Việc chắc chắn xảy ra; vế sau làm sau đó.)
   Ví dụ: 宿題が 終わったら、テレビを 見ても いいです。  = Làm xong bài tập thì được xem tivi.', 20),
  (80, 4, '耳  Nghe', 'Shadowing 15 phút: bật lại 会話 hôm qua, nói đuổi theo băng, không nhìn script.', 20),
  (81, 1, '部  Bộ thủ', 'Ôn bộ thủ: nhìn bộ nói nghĩa, kể 1 Kanji chứa bộ đó.', 10),
  (81, 2, '漢  Kanji', 'Ôn 5 chữ Kanji của Minna bài 21–25 qua từ chứa nó: che nghĩa → đọc từ, che từ → nhớ chữ. Trong app, đánh dấu chữ còn mờ.
道 ・ 東 ・ 西 ・ 南 ・ 北', 20),
  (81, 3, '文  Ngữ pháp', 'Làm phần 練習B và 練習C trong Minna bài 21–25. Sau đó tự đặt 5 câu mới.', 25),
  (81, 4, '語  Từ vựng', 'Ôn lại toàn bộ từ vựng Minna bài 21–25. Từ nào quên đánh dấu ''Đang học''.', 20),
  (81, 5, '耳読  Nghe + Đọc', 'Làm phần 問題 (nghe + đọc) cuối mỗi bài trong Minna bài 21–25. Ghi lỗi sai vào cột Ghi chú.', 25),
  (82, 1, '漢  Kanji', 'Hôm nay ôn 26 chữ Kanji. Che nghĩa rồi đọc, che chữ rồi viết. Ba lượt còn lại để các buổi ôn sau, không làm hết 103 chữ trong một ngày. Chữ nào còn mờ thì đánh dấu trong app.', 20),
  (82, 2, '部  Bộ thủ', 'Ôn 45 bộ thủ: nhìn bộ nói nghĩa, kể 1 Kanji chứa bộ đó. Bộ nào quên viết lại 5 lần.', 15),
  (82, 3, '語  Từ vựng', 'Trong app, ôn lại những từ còn mờ.', 25),
  (82, 4, '耳  Nghe', 'Nghe lại 会話 của Minna bài 1–8, chép chính tả 1 bài.', 25),
  (83, 1, '漢  Kanji', 'Viết lại các chữ ★ hôm qua, mỗi chữ 5 lần kèm 1 từ ghép.
Ôn nhóm Kanji số đếm, thời gian, phương hướng: 一〜十・百・千・万・時・分・半・東西南北・上下左右.', 20),
  (83, 2, '文  Ngữ pháp', 'Ôn toàn bộ trợ từ は・が・を・に・で・へ・と・も・や・から・まで. Tự đặt 1 câu cho mỗi trợ từ.
Ôn chia tính từ い/な ở 4 thể, và より・ほうが・いちばん・どちら.', 35),
  (83, 3, '語  Từ vựng', 'Ôn từ vựng Minna bài 1–10 (khoảng 140 từ).
Ôn tính từ theo cặp trái nghĩa: 大きい↔小さい, 安い↔高い, 広い↔狭い, 明るい↔暗い.', 25),
  (83, 4, '読  Đọc', 'Đọc 2 bài NHK Easy News, gạch chân từ chưa biết.', 20),
  (83, 5, '耳  Nghe', 'Xem 15 phút Erin''s Challenge, trả lời câu hỏi cuối video.', 20),
  (84, 1, '漢  Kanji', 'Ôn nhóm Kanji động từ: 行・見・聞・食・飲・買・読・書・話・来・入・出・立・休.', 20),
  (84, 2, '文  Ngữ pháp', 'Bảng chia tổng hợp: ます → て → ない → 辞書形 → た. Lấy 20 động từ tự chia đủ 5 thể.', 40),
  (84, 3, '語  Từ vựng', 'Ôn từ vựng Minna bài 11–18.', 20),
  (84, 4, '読  Đọc', 'Đọc 3 đoạn dokkai ngắn, bấm giờ 2 phút mỗi bài.', 20),
  (85, 1, '📝  Luyện đề', 'Mondai 1–2: nhìn Kanji chọn cách đọc đúng. 30 câu, bấm giờ 10 phút.
Mondai 3–4: chọn từ điền chỗ trống, chọn câu cùng nghĩa. 30 câu.
Luyện 文の組み立て (sắp xếp câu) 20 câu — dạng mất điểm nhiều nhất.', 30),
  (85, 2, '語  Từ vựng', 'Ôn cặp từ đồng nghĩa / trái nghĩa hay bị đánh lừa trong đề.
Ôn trạng từ tần suất: よく・ときどき・あまり・ぜんぜん・いつも・もう・まだ.', 20),
  (85, 3, '耳  Nghe', 'Nghe 1 đề Choukai phần 1 (課題理解) đầy đủ.', 20),
  (85, 4, '漢  Kanji', 'Vòng 2 các chữ ★. Chữ nào vẫn sai chép vào sổ tay riêng.', 20),
  (85, 5, '読  Đọc', '1 bài đọc dài + 1 bài 情報検索 (tìm thông tin trong tờ rơi, bảng giờ tàu).', 30),
  (86, 1, '📝  Luyện đề', 'Ôn chữ và từ đã học trong app, khoảng 25 phút.
Ôn mẫu câu và đoạn đọc đã học trong app.
Nghe lại các từ và câu đã có trong app.', 25),
  (86, 2, '✓  Chấm điểm', 'Trong app, ôn lại câu còn mờ. App không chứa đề giấy 120 phút.', 15),
  (87, 1, '漢  Kanji', 'Chép mọi Kanji làm sai vào sổ tay, viết mỗi chữ 10 lần.', 25),
  (87, 2, '文  Ngữ pháp', 'Với mỗi câu sai: viết ra LÝ DO vì sao sai, không chỉ khoanh đáp án đúng.', 30),
  (87, 3, '語  Từ vựng', 'Đánh dấu trong app những từ còn mờ sau buổi ôn.
Ôn toàn bộ từ vựng liên quan đến phần yếu.', 25),
  (87, 4, '耳  Nghe', 'Nghe lại các câu Choukai đã sai, vừa nghe vừa đọc transcript.
20 phút nghe thụ động (podcast N5) lúc nghỉ ngơi, không cần tập trung.', 25),
  (87, 5, '◎  Xác định', 'Nhìn bảng điểm đề 1, chọn ra phần điểm thấp nhất.', 5),
  (87, 6, '📝  Luyện đề', 'Làm 2 bộ bài tập cùng dạng với phần yếu đó.', 45),
  (88, 1, '📝  Luyện đề', 'Ôn lại chữ và từ còn mờ trong app.
Ôn lại mẫu câu còn mờ trong app.
Nghe lại câu còn mờ trong app.', 25),
  (88, 2, '✓  Chấm điểm', 'So với buổi ôn trước, xem câu nào đã chắc hơn. App không chấm đề giấy.', 15),
  (89, 1, '漢  Kanji', 'Đọc lại toàn bộ sổ tay Kanji ★ một lượt, không viết nữa.', 25),
  (89, 2, '文  Ngữ pháp', 'Đọc lại sổ tay ngữ pháp sai, chú ý mẫu sai lặp ở cả hai đề.', 30),
  (89, 3, '語  Từ vựng', 'Trong app, lướt các từ còn mờ, không dừng lâu ở từ nào.', 25),
  (89, 4, '耳  Nghe', 'Nghe 1 đề Choukai nhẹ nhàng, không chấm điểm, không áp lực.', 20),
  (90, 1, '漢  Kanji', 'Chỉ lướt nhẹ bảng Kanji 15 phút. TUYỆT ĐỐI không học chữ mới hôm nay.', 15),
  (90, 2, '文  Ngữ pháp', 'Lướt nhẹ bảng ngữ pháp 15 phút.', 15),
  (90, 3, '語  Từ vựng', 'Đọc lại danh sách từ ★ 15 phút.', 15),
  (90, 4, '🎒  Chuẩn bị', 'Soạn sẵn: thẻ dự thi, CCCD, bút chì 2B, tẩy, đồng hồ thường (không thông minh). Tra trước đường đến điểm thi. Ngủ trước 23h. がんばって！', 15);

update public.lessons as t set vocab_count = v.vocab_count from (values
  ('Bài 1', '59 từ'),
  ('Bài 2', '54 từ'),
  ('Bài 3', '49 từ'),
  ('Bài 4', '71 từ'),
  ('Bài 5', '66 từ'),
  ('Bài 6', '66 từ'),
  ('Bài 7', '66 từ'),
  ('Bài 8', '74 từ'),
  ('Bài 9', '68 từ'),
  ('Bài 10', '65 từ'),
  ('Bài 11', '79 từ'),
  ('Bài 12', '74 từ'),
  ('Bài 13', '44 từ'),
  ('Bài 14', '55 từ'),
  ('Bài 15', '32 từ'),
  ('Bài 16', '61 từ'),
  ('Bài 17', '43 từ'),
  ('Bài 18', '36 từ'),
  ('Bài 19', '35 từ'),
  ('Bài 20', '37 từ'),
  ('Bài 21', '58 từ'),
  ('Bài 22', '27 từ'),
  ('Bài 23', '36 từ'),
  ('Bài 24', '21 từ'),
  ('Bài 25', '24 từ')
) as v(id, vocab_count) where t.id = v.id;

commit;
