# Image Quality Audit

Audit date: 2026-10-06. Audited every vocabulary manifest record marked approved against its Japanese word, Vietnamese meaning, actual local image, upstream asset path, and recorded license/credit.

## Summary

| Result | Count | Manifest status after audit |
| --- | ---: | --- |
| good | 95 | approved |
| ambiguous | 29 | needs_review |
| wrong | 10 | needs_review |
| **Total audited** | **134** |  |

All 134 mapped image files exist locally; they use 115 distinct files. All records link to Microsoft Fluent Emoji paths and list Microsoft Corporation, MIT and the MIT license URL. The official upstream repository identifies the collection and publishes its [MIT LICENSE](https://github.com/microsoft/fluentui-emoji/blob/main/LICENSE). Local license notice: [public/icons/LICENSES.md](../public/icons/LICENSES.md).

No images were downloaded, replaced, or sourced externally. The manifest now stores imageQuality for this audit. Good entries remain approved. Ambiguous and wrong entries are needs_review and therefore stay out of production under the existing status guard.

## Ambiguous

Image has an association with the word but may teach a narrower or neighboring meaning. Recommendations are for review only; current images are unchanged.

| ID | Vocabulary | Meaning | Source asset | License | Why ambiguous | Suggested replacement/context |
| ---: | --- | --- | --- | --- | --- | --- |
| 8 | 大学 | Đại học | School/3D/school_3d.png | MIT | Trường học chung không cho biết bậc đại học. | Cảnh khuôn viên hoặc giảng đường đại học. |
| 16 | 辞書 | Từ điển | Closed book/3D/closed_book_3d.png | MIT | Sách đóng không phân biệt từ điển với sách thường. | Từ điển có trang tra từ hoặc ký hiệu 辞書. |
| 17 | 雑誌 | Tạp chí | Open book/3D/open_book_3d.png | MIT | Sách mở giống sách học/sách thường hơn tạp chí. | Tạp chí có bìa và bố cục bài viết/ảnh. |
| 24 | かばん | Cặp, túi xách | Briefcase/3D/briefcase_3d.png | MIT | Cặp công sở hẹp hơn nghĩa túi/cặp nói chung. | Một chiếc cặp/túi trung tính theo ngữ cảnh N5. |
| 96 | 花 | Hoa | Cherry blossom/3D/cherry_blossom_3d.png | MIT | Hoa anh đào là một loài hoa, còn 花 nghĩa là hoa nói chung. | Một bông hoa phổ thông; nếu không phù hợp thì không cần ảnh. |
| 121 | 映画 | Phim | Film projector/3D/film_projector_3d.png | MIT | Máy chiếu phim là thiết bị, không phải bộ phim. | Neko xem phim hoặc khung phim trong ngữ cảnh. |
| 208 | 写真 | Ảnh | Framed picture/3D/framed_picture_3d.png | MIT | Khung tranh phong cảnh giống 絵 hơn ảnh chụp 写真. | Ảnh chụp rõ chất ảnh hoặc khoảnh khắc vừa chụp. |
| 304 | 帽子 | Mũ | Billed cap/3D/billed_cap_3d.png | MIT | Mũ lưỡi trai là một loại 帽子 cụ thể. | Mũ phổ thông; hoặc giữ asset chỉ khi nghĩa được thu hẹp. |
| 371 | レストラン | Nhà hàng | Fork and knife with plate/3D/fork_and_knife_with_plate_3d.png | MIT | Bộ dao nĩa và đĩa gợi món ăn/bữa ăn, không phải nhà hàng. | Cảnh Neko trong nhà hàng hoặc mặt tiền nhà hàng. |
| 416 | 台所 | Nhà bếp | Cooking/3D/cooking_3d.png | MIT | Chảo và món ăn gợi nấu ăn, không phải không gian bếp. | Góc bếp có tủ, bồn rửa và bếp nấu. |
| 418 | 大使館 | Đại sứ quán | Classical building/3D/classical_building_3d.png | MIT | Tòa nhà cột cổ điển không xác định chức năng đại sứ quán. | Tòa đại sứ quán có biển hiệu ngoại giao. |
| 420 | お金 | Tiền | Money bag/3D/money_bag_3d.png | MIT | Túi tiền có ký hiệu đô la dễ gợi USD thay vì tiền nói chung. | Tiền giấy/đồng xu trung tính hoặc yên Nhật. |
| 435 | 月曜日 | Thứ Hai | Calendar/3D/calendar_3d.png | MIT | Lịch chung không truyền đạt riêng thứ Hai. | Lịch tuần kiểu Nhật tô nổi cột 月曜日; nếu không thì bỏ ảnh. |
| 482 | 紅茶 | Trà đen | Teacup without handle/3D/teacup_without_handle_3d.png | MIT | Tách trà không phân biệt 紅茶 với お茶 nói chung. | Tách nước trà đen/ấm trà lá trà đen. |
| 485 | 果物 | Hoa quả | Grapes/3D/grapes_3d.png | MIT | Nho chỉ là một loại quả, không bao quát 果物. | Giỏ nhiều loại trái cây. |
| 486 | 野菜 | Rau | Leafy green/3D/leafy_green_3d.png | MIT | Rau lá chỉ đại diện một loại rau, không bao quát 野菜. | Rổ vài loại rau khác nhau. |
| 487 | 牛肉 | Thịt bò | Cut of meat/3D/cut_of_meat_3d.png | MIT | Miếng thịt không cho biết đây là thịt bò; dùng chung hình 肉. | Miếng thịt bò đặc trưng hoặc nhãn 牛肉. |
| 493 | 喫茶店 | Quán cà phê | Hot beverage/3D/hot_beverage_3d.png | MIT | Cốc cà phê biểu đạt đồ uống, không phải 喫茶店. | Cảnh quán kissaten với Neko ngồi trong quán. |
| 498 | ちゃわん | Bát (ăn cơm) | Bowl with spoon/3D/bowl_with_spoon_3d.png | MIT | Bát có thìa gợi bát súp, không phải chén cơm ちゃわん. | Chén cơm Nhật có cơm, không kèm thìa. |
| 500 | コップ | Cái cốc, ly | Cup with straw/3D/cup_with_straw_3d.png | MIT | Cốc có ống hút là một loại cốc riêng, không phải コップ phổ thông. | Ly/cốc thủy tinh trơn, không ống hút. |
| 568 | 歌 | Bài hát | Musical note/3D/musical_note_3d.png | MIT | Nốt nhạc gợi ký hiệu/âm nhạc, không phải bài hát hay việc hát. | Neko đang hát; nếu không có cảnh rõ nghĩa thì không cần ảnh. |
| 581 | 動物 | Động vật | Paw prints/3D/paw_prints_3d.png | MIT | Dấu chân chỉ gợi nhóm động vật, ít giúp nhớ nghĩa từ. | Cảnh có vài con vật; nếu không thì bỏ ảnh danh từ nhóm. |
| 582 | ペット | Thú cưng | Dog face/3D/dog_face_3d.png | MIT | Hình chó có thể khiến người học hiểu ペット là chó. | Cảnh có nhiều thú cưng, ví dụ mèo và chó. |
| 583 | 池 | Cái ao | Water wave/3D/water_wave_3d.png | MIT | Sóng giống icon 海, không gợi ao 池. | Ao nhỏ có cá/koi hoặc hoa súng. |
| 640 | 風 | Gió | Wind face/3D/wind_face_3d.png | MIT | Khuôn mặt thổi gió là biểu tượng trừu tượng, dễ hiểu sai hành động. | Neko/cây/khăn bay trong gió. |
| 652 | 映画館 | Rạp chiếu phim | Cinema/3D/cinema_3d.png | MIT | Biểu tượng màn hình phim có thể bị hiểu là video/camera hơn rạp chiếu. | Neko xem màn hình trong rạp hoặc mặt tiền rạp. |
| 746 | ズボン | Quần dài | Jeans/3D/jeans_3d.png | MIT | Jeans là một loại ズボン, không phải quần dài nói chung. | Quần dài trung tính, không chi tiết denim. |
| 747 | 靴 | Giày | Running shoe/3D/running_shoe_3d.png | MIT | Giày chạy bộ là một loại 靴 cụ thể. | Đôi giày phổ thông; giữ giày chạy nếu nghĩa được thu hẹp. |
| 757 | 電気 | Điện; đèn điện | Light bulb/3D/light_bulb_3d.png | MIT | Bóng đèn biểu đạt đèn/ánh sáng hơn khái niệm 電気. | Thiết bị dùng điện trong ngữ cảnh; nếu dạy “điện”, bỏ ảnh standalone. |

## Wrong

The asset points to another object or concept. These mappings are needs_review and should not ship as learning cues.

| ID | Vocabulary | Meaning | Source asset | License | Mismatch | Suggested replacement |
| ---: | --- | --- | --- | --- | --- | --- |
| 151 | 切手 | Tem thư | Postbox/3D/postbox_3d.png | MIT | Hòm thư không phải 切手 (tem thư), dù hai vật thường đi cùng nhau. | Một con tem thư rõ ràng. |
| 488 | 豚肉 | Thịt lợn | Pig face/3D/pig_face_3d.png | MIT | Đầu lợn dạy 豚 (lợn), không phải 豚肉 (thịt lợn). | Miếng thịt lợn đã sơ chế, không phải con vật. |
| 586 | 交番 | Đồn cảnh sát nhỏ | Police car light/3D/police_car_light_3d.png | MIT | Đèn/còi xe cảnh sát không phải 交番 (đồn cảnh sát nhỏ). | Nhà kōban có biển 交番, có thể kèm cảnh sát. |
| 589 | 図書館 | Thư viện | Books/3D/books_3d.png | MIT | Chồng sách không biểu đạt 図書館 (thư viện). | Không gian thư viện với kệ và bàn đọc. |
| 590 | 本棚 | Giá sách | Books/3D/books_3d.png | MIT | Chồng sách không biểu đạt 本棚 (giá sách). | Giá sách có ngăn và sách đặt trên giá. |
| 603 | アパート | Căn hộ chung cư | Office building/3D/office_building_3d.png | MIT | Tòa văn phòng khiến アパート bị hiểu sang tòa công sở. | Chung cư dân cư có ban công/cửa sổ căn hộ. |
| 745 | スカート | Váy | Dress/3D/dress_3d.png | MIT | Váy liền thân/đầm không phải スカート (chân váy rời). | Chân váy rời, không có phần thân áo. |
| 756 | ストーブ | Lò sưởi | Fire/3D/fire_3d.png | MIT | Ngọn lửa biểu đạt lửa/nhiệt, không phải ストーブ (thiết bị sưởi). | Lò sưởi hoặc máy sưởi nhìn rõ. |
| 758 | 門 | Cổng | Shinto shrine/3D/shinto_shrine_3d.png | MIT | Torii là cổng đền Thần đạo, không phải 門 nói chung. | Cổng thông thường; chỉ dùng torii nếu từ là 鳥居. |
| 762 | 八百屋 | Cửa hàng rau quả | Carrot/3D/carrot_3d.png | MIT | Củ cà rốt là rau, không phải 八百屋 (cửa hàng rau quả). | Mặt tiền/quầy cửa hàng rau quả, có biển 八百屋. |

## Good — keep unchanged

These images have a clear direct match or conventional cue for the vocabulary meaning. They remain approved.

| ID | Vocabulary | Meaning | Source asset | License | Credit | Quality | Status |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 3 | 先生 | Giáo viên | Teacher/Default/3D/teacher_3d_default.png | MIT | Microsoft Corporation | good | approved |
| 4 | 学生 | Học sinh, sinh viên | Student/Default/3D/student_3d_default.png | MIT | Microsoft Corporation | good | approved |
| 6 | 医者 | Bác sĩ | Health worker/Default/3D/health_worker_3d_default.png | MIT | Microsoft Corporation | good | approved |
| 15 | 本 | Sách | Books/3D/books_3d.png | MIT | Microsoft Corporation | good | approved |
| 18 | 新聞 | Báo | Newspaper/3D/newspaper_3d.png | MIT | Microsoft Corporation | good | approved |
| 21 | 鍵 | Chìa khóa | Key/3D/key_3d.png | MIT | Microsoft Corporation | good | approved |
| 22 | 時計 | Đồng hồ | Watch/3D/watch_3d.png | MIT | Microsoft Corporation | good | approved |
| 23 | 傘 | Ô, dù | Umbrella/3D/umbrella_3d.png | MIT | Microsoft Corporation | good | approved |
| 25 | テレビ | Ti vi | Television/3D/television_3d.png | MIT | Microsoft Corporation | good | approved |
| 26 | ラジオ | Radio | Radio/3D/radio_3d.png | MIT | Microsoft Corporation | good | approved |
| 27 | 鉛筆 | Bút chì | Pencil/3D/pencil_3d.png | MIT | Microsoft Corporation | good | approved |
| 39 | 家 | Nhà (của mình) | House/3D/house_3d.png | MIT | Microsoft Corporation | good | approved |
| 55 | 銀行 | Ngân hàng | Bank/3D/bank_3d.png | MIT | Microsoft Corporation | good | approved |
| 56 | 郵便局 | Bưu điện | Post office/3D/post_office_3d.png | MIT | Microsoft Corporation | good | approved |
| 60 | 電車 | Tàu điện | Train/3D/train_3d.png | MIT | Microsoft Corporation | good | approved |
| 61 | 地下鉄 | Tàu điện ngầm | Metro/3D/metro_3d.png | MIT | Microsoft Corporation | good | approved |
| 62 | 新幹線 | Tàu Shinkansen | High-speed train/3D/high-speed_train_3d.png | MIT | Microsoft Corporation | good | approved |
| 63 | 飛行機 | Máy bay | Airplane/3D/airplane_3d.png | MIT | Microsoft Corporation | good | approved |
| 64 | 自転車 | Xe đạp | Bicycle/3D/bicycle_3d.png | MIT | Microsoft Corporation | good | approved |
| 70 | 誕生日 | Sinh nhật | Birthday cake/3D/birthday_cake_3d.png | MIT | Microsoft Corporation | good | approved |
| 81 | ご飯 | Cơm | Cooked rice/3D/cooked_rice_3d.png | MIT | Microsoft Corporation | good | approved |
| 82 | 卵 | Trứng | Egg/3D/egg_3d.png | MIT | Microsoft Corporation | good | approved |
| 83 | 肉 | Thịt | Cut of meat/3D/cut_of_meat_3d.png | MIT | Microsoft Corporation | good | approved |
| 84 | 魚 | Cá | Fish/3D/fish_3d.png | MIT | Microsoft Corporation | good | approved |
| 92 | 手 | Tay | Raised hand/Default/3D/raised_hand_3d_default.png | MIT | Microsoft Corporation | good | approved |
| 98 | 荷物 | Hành lý | Luggage/3D/luggage_3d.png | MIT | Microsoft Corporation | good | approved |
| 137 | 家 | Nhà | House/3D/house_3d.png | MIT | Microsoft Corporation | good | approved |
| 153 | りんご | Quả táo | Red apple/3D/red_apple_3d.png | MIT | Microsoft Corporation | good | approved |
| 160 | 雨 | Mưa | Cloud with rain/3D/cloud_with_rain_3d.png | MIT | Microsoft Corporation | good | approved |
| 161 | 雪 | Tuyết | Snowflake/3D/snowflake_3d.png | MIT | Microsoft Corporation | good | approved |
| 205 | 病院 | Bệnh viện | Hospital/3D/hospital_3d.png | MIT | Microsoft Corporation | good | approved |
| 265 | お茶 | Trà | Teacup without handle/3D/teacup_without_handle_3d.png | MIT | Microsoft Corporation | good | approved |
| 305 | めがね | Kính mắt | Glasses/3D/glasses_3d.png | MIT | Microsoft Corporation | good | approved |
| 306 | ケーキ | Bánh ngọt | Shortcake/3D/shortcake_3d.png | MIT | Microsoft Corporation | good | approved |
| 322 | 子ども | Trẻ con | Child/Default/3D/child_3d_default.png | MIT | Microsoft Corporation | good | approved |
| 356 | パン | Bánh mì | Bread/3D/bread_3d.png | MIT | Microsoft Corporation | good | approved |
| 357 | コーヒー | Cà phê | Hot beverage/3D/hot_beverage_3d.png | MIT | Microsoft Corporation | good | approved |
| 360 | タクシー | Taxi | Taxi/3D/taxi_3d.png | MIT | Microsoft Corporation | good | approved |
| 361 | バス | Xe buýt | Bus/3D/bus_3d.png | MIT | Microsoft Corporation | good | approved |
| 364 | ノート | Vở | Notebook/3D/notebook_3d.png | MIT | Microsoft Corporation | good | approved |
| 365 | ペン | Bút | Pen/3D/pen_3d.png | MIT | Microsoft Corporation | good | approved |
| 368 | カメラ | Máy ảnh | Camera/3D/camera_3d.png | MIT | Microsoft Corporation | good | approved |
| 369 | パソコン | Máy tính | Laptop/3D/laptop_3d.png | MIT | Microsoft Corporation | good | approved |
| 372 | コンビニ | Cửa hàng tiện lợi | Convenience store/3D/convenience_store_3d.png | MIT | Microsoft Corporation | good | approved |
| 388 | いす | Cái ghế | Chair/3D/chair_3d.png | MIT | Microsoft Corporation | good | approved |
| 390 | カレンダー | Lịch (treo tường) | Calendar/3D/calendar_3d.png | MIT | Microsoft Corporation | good | approved |
| 391 | 手紙 | Lá thư | Envelope/3D/envelope_3d.png | MIT | Microsoft Corporation | good | approved |
| 392 | 封筒 | Phong bì | Envelope/3D/envelope_3d.png | MIT | Microsoft Corporation | good | approved |
| 394 | 箱 | Cái hộp | Package/3D/package_3d.png | MIT | Microsoft Corporation | good | approved |
| 395 | 万年筆 | Bút máy | Fountain pen/3D/fountain_pen_3d.png | MIT | Microsoft Corporation | good | approved |
| 411 | デパート | Cửa hàng bách hoá | Department store/3D/department_store_3d.png | MIT | Microsoft Corporation | good | approved |
| 412 | 建物 | Toà nhà | Office building/3D/office_building_3d.png | MIT | Microsoft Corporation | good | approved |
| 421 | 学校 | Trường học | School/3D/school_3d.png | MIT | Microsoft Corporation | good | approved |
| 445 | 電話 | Điện thoại | Telephone/3D/telephone_3d.png | MIT | Microsoft Corporation | good | approved |
| 449 | 自動車 | Ô tô | Automobile/3D/automobile_3d.png | MIT | Microsoft Corporation | good | approved |
| 450 | 切符 | Vé (tàu, xe) | Ticket/3D/ticket_3d.png | MIT | Microsoft Corporation | good | approved |
| 483 | 牛乳 | Sữa bò | Glass of milk/3D/glass_of_milk_3d.png | MIT | Microsoft Corporation | good | approved |
| 484 | お酒 | Rượu (rượu sake) | Sake/3D/sake_3d.png | MIT | Microsoft Corporation | good | approved |
| 489 | 鶏肉 | Thịt gà | Poultry leg/3D/poultry_leg_3d.png | MIT | Microsoft Corporation | good | approved |
| 490 | カレー | Cà ri | Curry rice/3D/curry_rice_3d.png | MIT | Microsoft Corporation | good | approved |
| 495 | ナイフ | Con dao | Kitchen knife/3D/kitchen_knife_3d.png | MIT | Microsoft Corporation | good | approved |
| 496 | フォーク | Cái nĩa | Fork and knife/3D/fork_and_knife_3d.png | MIT | Microsoft Corporation | good | approved |
| 497 | お皿 | Cái đĩa | Fork and knife with plate/3D/fork_and_knife_with_plate_3d.png | MIT | Microsoft Corporation | good | approved |
| 499 | カップ | Cái cốc (có quai) | Hot beverage/3D/hot_beverage_3d.png | MIT | Microsoft Corporation | good | approved |
| 569 | 絵 | Bức tranh | Framed picture/3D/framed_picture_3d.png | MIT | Microsoft Corporation | good | approved |
| 570 | ギター | Đàn ghi-ta | Guitar/3D/guitar_3d.png | MIT | Microsoft Corporation | good | approved |
| 578 | 犬 | Con chó | Dog face/3D/dog_face_3d.png | MIT | Microsoft Corporation | good | approved |
| 579 | 猫 | Con mèo | Cat face/3D/cat_face_3d.png | MIT | Microsoft Corporation | good | approved |
| 580 | 鳥 | Con chim | Bird/3D/bird_3d.png | MIT | Microsoft Corporation | good | approved |
| 584 | 海 | Biển | Water wave/3D/water_wave_3d.png | MIT | Microsoft Corporation | good | approved |
| 585 | 公園 | Công viên | National park/3D/national_park_3d.png | MIT | Microsoft Corporation | good | approved |
| 587 | おまわりさん | Chú cảnh sát (thân mật) | Police officer/Default/3D/police_officer_3d_default.png | MIT | Microsoft Corporation | good | approved |
| 588 | 警官 | Cảnh sát | Police officer/Default/3D/police_officer_3d_default.png | MIT | Microsoft Corporation | good | approved |
| 592 | ベッド | Cái giường | Bed/3D/bed_3d.png | MIT | Microsoft Corporation | good | approved |
| 594 | ドア | Cửa (kiểu Tây) | Door/3D/door_3d.png | MIT | Microsoft Corporation | good | approved |
| 596 | 窓 | Cửa sổ | Window/3D/window_3d.png | MIT | Microsoft Corporation | good | approved |
| 597 | ポスト | Hòm thư | Postbox/3D/postbox_3d.png | MIT | Microsoft Corporation | good | approved |
| 647 | 旅行 | Du lịch | Luggage/3D/luggage_3d.png | MIT | Microsoft Corporation | good | approved |
| 648 | パーティー | Bữa tiệc | Party popper/3D/party_popper_3d.png | MIT | Microsoft Corporation | good | approved |
| 654 | ホテル | Khách sạn | Hotel/3D/hotel_3d.png | MIT | Microsoft Corporation | good | approved |
| 657 | お菓子 | Bánh kẹo | Candy/3D/candy_3d.png | MIT | Microsoft Corporation | good | approved |
| 659 | 塩 | Muối | Salt/3D/salt_3d.png | MIT | Microsoft Corporation | good | approved |
| 661 | バター | Bơ | Butter/3D/butter_3d.png | MIT | Microsoft Corporation | good | approved |
| 692 | 体 | Cơ thể | Person standing/Default/3D/person_standing_3d_default.png | MIT | Microsoft Corporation | good | approved |
| 694 | 歯 | Răng | Tooth/3D/tooth_3d.png | MIT | Microsoft Corporation | good | approved |
| 698 | お風呂 | Bồn tắm; việc tắm | Bathtub/3D/bathtub_3d.png | MIT | Microsoft Corporation | good | approved |
| 699 | シャワー | Vòi sen | Shower/3D/shower_3d.png | MIT | Microsoft Corporation | good | approved |
| 700 | せっけん | Xà phòng | Soap/3D/soap_3d.png | MIT | Microsoft Corporation | good | approved |
| 739 | 上着 | Áo khoác | Coat/3D/coat_3d.png | MIT | Microsoft Corporation | good | approved |
| 740 | コート | Áo khoác dài | Coat/3D/coat_3d.png | MIT | Microsoft Corporation | good | approved |
| 742 | シャツ | Áo sơ mi | T-shirt/3D/t-shirt_3d.png | MIT | Microsoft Corporation | good | approved |
| 748 | 靴下 | Tất | Socks/3D/socks_3d.png | MIT | Microsoft Corporation | good | approved |
| 749 | スリッパ | Dép đi trong nhà | Flat shoe/3D/flat_shoe_3d.png | MIT | Microsoft Corporation | good | approved |
| 750 | ネクタイ | Cà vạt | Necktie/3D/necktie_3d.png | MIT | Microsoft Corporation | good | approved |
| 755 | 財布 | Cái ví | Purse/3D/purse_3d.png | MIT | Microsoft Corporation | good | approved |

## Images with little standalone learning value

If reviewed, consider removing the image rather than forcing a replacement for these broad/abstract meanings:

- **月曜日** (ID 435): generic calendar does not teach Monday. Only use a Japanese weekday calendar with 月 highlighted; otherwise no image.
- **歌** (ID 568): a music note is not a song. Prefer a Neko singing scene, otherwise no standalone image.
- **動物** (ID 581): paw prints do little to teach this category. Prefer a multi-animal scene, otherwise no standalone image.
- **電気** (ID 757): a bulb over-specifies electricity as light. Prefer a device-in-use context, otherwise no standalone image.

No entry was changed to none; these records remain needs_review to preserve source/license metadata while awaiting a decision.
