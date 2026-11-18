-- ═══════════════════════════════════════════════════════════════════
--  Kiểm duyệt câu ví dụ — content/source/example-sentence-review.json (lý do từng câu)
--  Bỏ 26 câu Tatoeba không phù hợp, sửa bản dịch / câu sai, thêm câu NekoNeko thay thế.
--  Sinh tự động bằng scripts/apply_example_review.py — đừng sửa tay.
-- ═══════════════════════════════════════════════════════════════════
begin;
delete from public.example_sentences where id in (4765, 125923, 145462, 150162, 150169, 174747, 182697, 183287, 211830, 228260, 234611, 414248, 472753, 772794, 823590, 1215216, 1889539, 2692844, 2733322, 2825431, 3147338, 3496821, 3886922, 4632707, 8075110, 10561332);
insert into public.example_sentences (id, text_jp, text_vi, vi_id, owner, vi_owner) values
  (5257, '時間はたっぷりあった。', 'Đã có rất nhiều thời gian.', null, 'bunbuku', 'NekoNeko'),
  (229410, 'いいカメラを買った。', 'Tôi đã mua một chiếc máy ảnh tốt.', null, 'bunbuku', 'NekoNeko'),
  (2250471, '気づいてた？', 'Bạn có để ý không?', null, 'wool', 'NekoNeko'),
  (9769393, 'これはライムの木です。', 'Đây là cây chanh xanh (lime).', null, 'dotheduyet1999', 'NekoNeko'),
  (4913, '何かお飲みになりますか？', 'Anh/chị có muốn uống gì không ạ?', null, 'bunbuku', 'NekoNeko'),
  (224847, 'コーヒー飲みますか。', 'Anh có uống cà phê không?', null, 'mookeee', 'NekoNeko'),
  (8886614, '行こう！', 'Đi thôi!', null, 'moxy', 'NekoNeko'),
  (10042871, 'お店のオープンはいつだったの？', 'Quán khai trương khi nào vậy?', null, 'small_snow', 'NekoNeko'),
  (122329, '日本語が話せますか。', 'Bạn nói được tiếng Nhật không?', null, 'autuno', 'NekoNeko'),
  (900817, '宿題を しました。そして、寝ました。', 'Tôi làm bài tập. Rồi đi ngủ.', null, 'NekoNeko', 'NekoNeko'),
  (900822, 'きょうは きのうほど 寒くないです。', 'Hôm nay không lạnh bằng hôm qua.', null, 'NekoNeko', 'NekoNeko'),
  (900814, 'どうぞ ここに 座って ください。', 'Mời bạn ngồi đây.', null, 'NekoNeko', 'NekoNeko'),
  (900829, '先生、質問が あります。', 'Thưa thầy, em có câu hỏi.', null, 'NekoNeko', 'NekoNeko'),
  (900830, '毎日 ここへ 来ますか。', 'Ngày nào bạn cũng đến đây à?', null, 'NekoNeko', 'NekoNeko'),
  (900831, 'いつも 電車で 本を 読みます。', 'Tôi luôn đọc sách trên tàu.', null, 'NekoNeko', 'NekoNeko'),
  (900832, '少し 休みましょう。', 'Mình nghỉ một chút nhé.', null, 'NekoNeko', 'NekoNeko'),
  (900833, 'パスポートを なくしました。', 'Tôi làm mất hộ chiếu rồi.', null, 'NekoNeko', 'NekoNeko'),
  (900834, '耳が 痛いです。', 'Tôi bị đau tai.', null, 'NekoNeko', 'NekoNeko'),
  (900835, '目が 痛いです。', 'Tôi bị đau mắt.', null, 'NekoNeko', 'NekoNeko'),
  (900836, '夜は 車に 気を つけて ください。', 'Buổi tối hãy cẩn thận xe cộ.', null, 'NekoNeko', 'NekoNeko'),
  (900837, 'ここに 来て ください。', 'Hãy lại đây.', null, 'NekoNeko', 'NekoNeko'),
  (900838, 'この 花は 何と 言いますか。', 'Hoa này gọi là gì?', null, 'NekoNeko', 'NekoNeko'),
  (900839, '会社は 駅の 近くに あります。', 'Công ty ở gần nhà ga.', null, 'NekoNeko', 'NekoNeko')
on conflict (id) do update set text_jp = excluded.text_jp, text_vi = excluded.text_vi, vi_id = excluded.vi_id,
  owner = excluded.owner, vi_owner = excluded.vi_owner;
commit;
