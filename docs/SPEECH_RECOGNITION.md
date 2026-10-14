# Đọc theo mẫu — nhận diện câu nói tiếng Nhật bằng trình duyệt (miễn phí)

> Ngày: 2026-10-15. Liên quan: `docs/PRONUNCIATION_ASSESSMENT_AUDIT.md` (audit chấm phát âm).
> Tính năng này **không chấm phát âm**. Nó chỉ cho biết trình duyệt "nghe ra" chữ gì và so chữ đó với câu mẫu.

## Người học thấy gì

`/luyen-tap/noi` → thẻ **🎙️ Đọc theo mẫu** (`?che-do=doc-theo-mau`; thẻ cũ **🗣️ Nói từ nghĩa** giữ nguyên).
Mỗi câu (câu ví dụ ngữ pháp thật trong catalog N5, theo phạm vi bài đang chọn) có: câu mẫu, cách đọc kana, nghĩa, **Nghe mẫu**,
**🎙️ Bắt đầu nói / ⏹ Dừng / Đọc lại**. Kết quả:

| Trạng thái | Khi nào | Hiển thị |
|---|---|---|
| `matched` | Chữ nhận diện khớp câu mẫu (dạng có Kanji **hoặc** cách đọc kana) sau chuẩn hoá | "Trình duyệt nhận ra đúng câu mẫu" + chữ nhận ra + nhắc "chưa phải chấm phát âm" |
| `different` | Có chữ nhưng khác | Chữ nhận ra + so với câu mẫu: **gạch chân đỏ** = có trong mẫu nhưng không nghe thấy, **nền vàng** = nghe thấy thêm; gợi ý "có thể chỉ khác cách viết" khi một đoạn thiếu và một đoạn thừa cạnh nhau, một bên Kanji một bên kana (私 ↔ わたし) |
| `not_recognized` | `no-speech`, kết thúc mà không có chữ, hoặc **hết 12 giây** | Lý do cụ thể, mời đọc lại |
| `unsupported` | Không có `SpeechRecognition` / `webkitSpeechRecognition`, hoặc `language-not-supported` | Hướng dẫn dùng trình duyệt khác; vẫn nghe mẫu và đọc theo được |
| `permission_denied` | `not-allowed`, `service-not-allowed` | Cách bật quyền micro (Safari: cần bật Siri) |
| `error` | `audio-capture` (không có micro), `network`, `aborted`, `start()` lỗi | Lý do cụ thể |

Không có điểm số, không có "độ tự tin", không có câu "phát âm chuẩn". Không ghi trí nhớ, độ thành thạo, ôn tập giãn cách hay tiến độ ngày.

## Cách hoạt động

```
ReadAloudPrompt (client)
  └─ useSpeechRecognition (hook) ─ startRecognitionSession (features/speech/recognition-session.ts)
        new (window.SpeechRecognition || window.webkitSpeechRecognition)()
        lang = 'ja-JP', continuous = false, interimResults = true, maxAlternatives = 1, hẹn giờ 12 s
        → kết quả cuối: transcript | thất bại: status + reason  (báo đúng MỘT lần; huỷ khi rời câu)
  └─ toReadAloudResult (features/speech/read-aloud-status.ts)
        compareTranscript(transcript, [câu có Kanji, cách đọc kana])  (features/speech/transcript-compare.ts)
          chuẩn hoá = normalizeJapanese(…, foldKatakana): NFKC (chữ / số toàn – nửa chiều rộng), bỏ khoảng trắng và dấu câu,
          Katakana → Hiragana, giữ "ー"; khớp = bằng nhau với một dạng; khác → diff LCS theo ký tự (thiếu / thừa).
```

- Mỗi trang chỉ một lượt nghe: bắt đầu ở câu khác thì lượt cũ bị huỷ (trình duyệt chỉ cho một phiên micro).
- Không có backend mới, không có bảng mới, không có API trả phí.

## Âm thanh đi đâu (đã kiểm tra tài liệu, 2026-10-15)

- **NekoNeko không ghi âm, không lưu và không gửi âm thanh lên máy chủ của mình.** Mã chỉ dùng `SpeechRecognition` của trình duyệt;
  không dùng `getUserMedia` / `MediaRecorder`; không có route API nào nhận âm thanh.
- **Trình duyệt tự xử lý âm thanh, và có thể gửi lên dịch vụ trực tuyến của hãng:**
  - Chrome: *"On some browsers, like Chrome, using Speech Recognition on a web page involves a server-based recognition engine. Your
    audio is sent to a web service for recognition processing, so it won't work offline."* — [MDN SpeechRecognition](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition).
    MDN cũng mô tả API nhận diện trên máy (`processLocally`, `available()`, `install()`) nhưng không phải trình duyệt nào cũng có —
    **NekoNeko không bật / không giả định chế độ offline**.
  - Safari (macOS 14.1+, iOS / iPadOS 14.5+, tiền tố `webkit`): dùng bộ nhận diện của Siri, cần bật Siri, không có trong
    SafariViewController và web app thêm vào Màn hình chính — [WebKit: Safari 14.1](https://webkit.org/blog/11648/new-webkit-features-in-safari-14-1).
    Tài liệu không nói rõ âm thanh xử lý trên máy hay trên máy chủ Apple → **chưa xác minh**.
  - Edge: có `webkitSpeechRecognition`; nơi xử lý **chưa xác minh** trong tài liệu đã đọc.
  - Firefox: không có `SpeechRecognition` (mặc định) → trạng thái `unsupported`.
- Thông báo này cũng hiện ngay dưới thẻ chế độ trên trang.

## Chi phí

Không tích hợp API trả phí (không Azure, OpenAI, Speechace, SpeechSuper…), không tự động chuyển sang dịch vụ trả phí.
Web Speech API miễn phí với NekoNeko, nhưng **có thể dùng dịch vụ nhận diện trực tuyến của hãng trình duyệt** (như trên).

## Giới hạn độ chính xác (vì sao không phải chấm phát âm)

1. Trình duyệt nhận diện để **đoán câu**, có mô hình ngôn ngữ: phát âm chưa chuẩn vẫn có thể ra đúng chữ ("matched" ≠ phát âm đúng);
   ngược lại phát âm đúng vẫn có thể ra chữ khác (tên riêng, câu ngắn, ồn).
2. **Cách viết**: trình duyệt tự chọn Kanji / kana / số (私 hay わたし, 4時 hay 四時). App chấp nhận câu có Kanji hoặc cách đọc kana của
   câu mẫu, nhưng **không chuyển Kanji ↔ kana** ở trình duyệt → câu viết lẫn kiểu khác sẽ ra "different" (có gợi ý "có thể chỉ khác cách viết").
3. Trường âm / âm ngắt / ん chỉ hiện ra **gián tiếp** khi trình duyệt ra một từ khác (おばさん / おばあさん); không phát hiện được khi
   trình duyệt "sửa" giúp. Pitch accent: không đánh giá.
4. Chất lượng khác nhau giữa trình duyệt / thiết bị / mạng; không có số đo độ chính xác.

## Kiểm thử

| Loại | Đã làm |
|---|---|
| Unit test (vitest) | `transcript-compare.test.ts` (chuẩn hoá, khớp, thiếu / thừa, giữ "ー", gợi ý cách viết, rỗng), `recognition-session.test.ts` với **SpeechRecognition giả** (khớp, kết quả tạm, no-speech, rỗng, **hết giờ**, **từ chối quyền**, không micro, mất mạng, không hỗ trợ tiếng Nhật, **không có API**, start() lỗi, huỷ, dừng tay), `read-aloud-status.test.ts`, `ReadAloudPrompt.test.tsx` (render ở server) |
| Trình duyệt thật | **Chromium headless (Playwright / patchright)**: có `SpeechRecognition` thật nhưng không có micro → sau 12 s giao diện báo đúng "Hết thời gian chờ" (đường timeout chạy với API thật). |
| Trình duyệt + giả lập | Cùng Chromium, gắn `SpeechRecognition` **giả** vào trang: matched, different, no-speech, not-allowed, network, language-not-supported, dừng tay, xoá API → unsupported; không tràn ngang ở 390 px; đổi phạm vi giữ chế độ. |
| **Micro thật / giọng nói thật** | **Chưa kiểm tra** trên Chrome, Edge, Safari macOS / iOS hay Android. Cần thử tay trước khi coi là ổn định. |

## Nâng cấp thành chấm phát âm thực sự

Xem `docs/PRONUNCIATION_ASSESSMENT_AUDIT.md`: cần dịch vụ chấm có câu mẫu (Azure Pronunciation Assessment `ja-JP` hoặc SpeechSuper),
ghi âm WAV 16 kHz phía client + API route giữ khoá ở server, cổng "chưa đủ dữ liệu", đợt pilot có người chấm để đặt ngưỡng; pitch accent và
lỗi theo âm vị vẫn chưa có căn cứ.
