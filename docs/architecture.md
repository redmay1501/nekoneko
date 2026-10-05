# Kiến trúc Neko Neko

> Đọc file này trước khi sửa bất cứ thứ gì. Nó trả lời: **dữ liệu đi đâu, quyết định nằm ở đâu, vì sao.**

## 1. Bức tranh tổng thể

```text
Trình duyệt (React Client Components)
   │  chỉ GỬI hành động: "tôi chọn đáp án X", "tôi nhớ", "cứu xong"
   ▼
Next.js Route Handlers  (src/app/api/**)            ← kiểm tra dữ liệu bằng Zod, xác thực người dùng
   ▼
Domain services        (src/features/**/…-service.ts)  ← điều phối
   ▼
Domain thuần           (memory-engine.ts, session-engine.ts …)  ← QUYẾT ĐỊNH, không đọc DB
   ▼
LearningDataSource     (src/lib/data/)              ← LƯU
   ├── SupabaseDataSource  → PostgreSQL + RLS (production)
   └── DemoDataSource      → bộ nhớ máy chủ (chạy ngay, không cần cấu hình)
```

Màn hình (Server Components trong `src/app/(app)/**`) **đọc** qua `getLearnerContext()` — một hàm gom
toàn bộ ngữ cảnh người học, được cache trong phạm vi một request.

## 2. Năm nguyên tắc không được phá

| # | Nguyên tắc | Ở đâu trong code |
|---|---|---|
| 1 | Memory Engine tất định, một chỗ duy nhất, không dùng AI | `src/features/memory/memory-engine.ts` + `memory-rules.ts` |
| 2 | Một Session Engine cho mọi kiểu học, khác nhau bằng cấu hình | `session-engine.ts` + `session-modes.ts` |
| 3 | Trình duyệt không bao giờ ghi điểm trí nhớ | RLS + `revoke` trong migration, ghi qua `apply_memory_update` (chỉ `service_role`) |
| 4 | Đáp án đúng không xuống trình duyệt | `toPublicStep()` cắt `correctAnswer`; bảng `session_items` bị `revoke select` |
| 5 | Nội dung học không nằm trong component | `content/seed/n5-content.json` → bảng nội dung; UI chỉ nhận dữ liệu |

## 3. Luồng một câu trả lời trong phiên học

```text
RecallStepView (bấm đáp án)
 → useLearningSession.submitAnswer()                     src/features/learning/hooks/
 → POST /api/session/answer {sessionId, stepIndex, answer}
 → answerSessionStep()                                    session-service.ts
     ├─ đọc bước đã lưu (có đáp án) từ data source
     ├─ evaluateStepAnswer()                              session-engine.ts   ← chấm
     └─ recordMemoryEvent()                               memory-service.ts
          ├─ calculateMemoryUpdate()                      memory-engine.ts    ← tính điểm, lịch
          └─ dataSource.applyMemoryUpdate()               ← lưu ATOMIC (memory_items + review_events + session_items)
 ← { isCorrect, correctAnswer, memory: {before, after, lần cuối, lần tới} }
```

Chống ghi trùng: khoá `requestId = "<sessionId>:<stepIndex>"` (trong phiên) hoặc UUID do trình duyệt
tạo (ngoài phiên). Bảng `review_events.request_id` là `unique`; hàm SQL trả `duplicate = true` nếu đã có.

## 3b. Lộ trình: "Ngày X/90" tính theo ngày học thật (đã chốt Q-05)

```text
Tài khoản mới ─────────► ngày 1
Ngày đang học xong khi:  người học bấm "Hoàn thành ngày X" rồi xác nhận lại   → DUY NHẤT một cách
Đã gặp HẾT kiến thức ───► chỉ MỜI hoàn thành (Trang chủ, Khoảnh khắc) — không tự chuyển ngày
Xác nhận ──────────────► mở ngày kế tiếp NGAY (không đợi sang hôm sau)
Nghỉ bao lâu ──────────► vẫn ở đúng ngày đang dở (không bị đẩy lên, không phải học bù)
```

- Quy tắc (thuần, có test): `src/features/roadmap/journey-progress.ts`
- Nơi duy nhất làm ngày tăng: `src/features/roadmap/journey-service.ts`
  - (đã bỏ cách tự động chuyển ngày khi gặp hết kiến thức — 2026-10-04: gặp một lần chưa phải là thuộc;
    bản ghi cũ `method = 'auto'` vẫn đọc được)
  - `POST /api/journey/complete-day` ← nút "Hoàn thành ngày X" ở Trang chủ, Khoảnh khắc tiến bộ và Một ngày học
- Lưu: `profiles.current_day`, `profiles.journey_completed_at`, nhật ký `journey_day_completions` (ghi rõ `auto`/`manual`);
  chuyển ngày bằng hàm SQL `advance_journey_day` — atomic, chỉ chuyển khi đúng là ngày đang học nên không bao giờ nhảy cóc.
- Ngày ôn tập (không có kiến thức mới) chỉ xong được bằng nút bấm.
- **Nhịp học**: 8 phút là mức tối thiểu (ôn + một chặng 5 kiến thức). Muốn xong ngày nhanh: phiên **Học hết ngày**
  (`/hoc/day`) đi hết phần còn lại, dừng hỏi sau mỗi chặng. Chi tiết: `docs/session-engine.md` mục "Nhịp học".
  Hệ quả: nếu chỉ học mức tối thiểu, một ngày lộ trình có thể kéo dài 3–4 ngày lịch — lộ trình đi theo nhịp người học.
- Trí nhớ vẫn phai theo **thời gian thật** (Memory Engine) — độc lập với tiến độ lộ trình.
- Khoảnh khắc tiến bộ báo "🎉 Bạn vừa xong ngày 23. Ngày 24 đã mở" (`learning_sessions.journey_day` lưu ngày lúc bắt đầu phiên).

## 4. Thư mục

```text
src/
├── app/
│   ├── (app)/          màn hình sau đăng nhập — layout dùng AppShell, render động
│   ├── (auth)/         đăng nhập / đăng ký
│   ├── api/            Route Handlers — nơi duy nhất thay đổi trạng thái học
│   └── auth/           callback xác nhận email, đăng xuất
├── components/         CHỈ hiển thị. Chia theo domain: common, layout, home, roadmap, learning, memory, garden
├── features/
│   ├── auth/           người học hiện tại
│   ├── learning/       danh mục kiến thức, quan hệ, Session Engine, các builder cho màn học
│   ├── memory/         Memory Engine, quy tắc, service, tổng quan, luồng cứu
│   ├── roadmap/        hành trình 90 ngày, bố cục bản đồ, "một ngày học"
│   └── progress/       tiến độ, thành tích, cài đặt
├── lib/
│   ├── supabase/       client (trình duyệt) · server (cookie) · admin (service role, server-only) · middleware
│   ├── data/           LearningDataSource + 2 hiện thực, seed loader, ánh xạ dòng ⇄ nội dung
│   ├── api/            xử lý lỗi Route Handler, gọi API từ trình duyệt, query keys
│   ├── utils/          ngày tháng, tất định, văn bản, logger
│   └── constants/      thông báo tiếng Việt
├── hooks/              hook trình duyệt dùng chung (useSpeech)
├── stores/             Zustand — chỉ khay trượt đang mở
├── types/              kiểu nội dung học
└── config/             biến môi trường, cấu hình demo
```

## 5. Quản lý trạng thái (Coding Standards §14)

| Loại | Công cụ | Ví dụ |
|---|---|---|
| Giao diện cục bộ | `useState` | thẻ đang chọn ở màn Kana, bước của luồng cứu |
| Dữ liệu server ở trình duyệt | TanStack Query | phiên học, trả lời, chi tiết kiến thức, tìm kiếm |
| Dùng chung toàn app | Zustand | `sheet-store.ts` — khay nào đang mở |
| Lâu dài | Supabase | trí nhớ, phiên học, cài đặt |

Server Components đọc trực tiếp (không qua TanStack Query) vì chúng chạy ở server.

## 6. Quyết định kiến trúc & khác biệt so với đặc tả

Coding Standards §35 yêu cầu giải thích các quyết định lớn. Đây là danh sách đầy đủ.

1. **Memory Engine chạy trong Next.js Route Handler, không phải Supabase Edge Function.**
   Sheet 4 của hồ sơ ghi "Edge Function"; Coding Standards §11 cho phép "API / Edge Function".
   Chọn Route Handler vì: (a) dùng chung đúng một file TypeScript với unit test, không phải sao chép sang Deno;
   (b) không cần Docker/Supabase CLI để chạy local; (c) an toàn tương đương — service role chỉ tồn tại ở server,
   hàm ghi `apply_memory_update` chỉ `service_role` gọi được. Muốn chuyển sang Edge Function: chuyển thân các
   file `src/app/api/**/route.ts` sang `supabase/functions/*`, giữ nguyên `memory-engine.ts`.
2. **Ghi atomic bằng một hàm PostgreSQL** (`apply_memory_update`) thay vì nhiều lệnh supabase-js riêng lẻ,
   vì supabase-js không có transaction. Hàm chỉ LƯU — mọi con số do Memory Engine tính trước.
3. **Chế độ demo** (không có trong đặc tả): khi chưa điền Supabase, app chạy với một người học mẫu, dữ liệu
   trong bộ nhớ máy chủ. Dùng chung 100% domain logic; chỉ khác nơi lưu. Mục đích: mở VS Code là chạy được.
4. **Gieo kiến thức theo lộ trình**: khi người học tới ngày của một kiến thức (theo `current_day`), Memory Engine tạo bản ghi với điểm
   khởi đầu `INITIAL_MEMORY_SCORE = 35` (trạng thái "Chưa vững"). Đặc tả chưa ghi con số này — đây là giả định,
   nằm ở `memory-rules.ts`. Bản ghi gieo sẵn nhưng chưa gặp lần nào (`encounter_count = 0`) KHÔNG tính là đã học — chưa được giới thiệu
   thì không bị hỏi (xem docs/session-engine.md, "Hai nguyên tắc sư phạm").
5. **Phần trôi tính từ `last_seen_at`** (đặc tả gợi ý `last_recalled_at`) để tránh trừ hai lần sau một câu sai.
   Có test: `chốt phần trôi vào điểm trước khi cộng`.
6. **Hiragana và Katakana là hai loại kiến thức riêng** (`content_type` = `hiragana` | `katakana`), giống prototype
   (h1/k1), thay vì một loại `kana`. Bảng `kana` chỉ có một cột ngày (ngày học Hiragana 1–6); Katakana xếp sau đúng
   7 ngày (8–13) theo file lộ trình — `KATAKANA_DAY_OFFSET` trong `knowledge-catalog.ts`.
7. **Thành phần phiên học** theo sheet 6, có một thay đổi đã thống nhất với chủ sản phẩm: "Học hôm nay" = 1 bất ngờ
   + 3 gặp lại + **5 mới (một chặng)** + 1 ngữ cảnh; thêm chế độ **Học hết ngày**. Lý do: mục "Nhịp học" ở trên.
8. **Chi tiết kiến thức mở bằng khay trượt** như prototype; các đường dẫn `/hoc-tap/kanji/[id]`… của sheet 1
   cũng có và dùng chung một component.
9. **Font tải bằng thẻ `<link>`**, không dùng `next/font`, để `npm run build` không cần mạng tới Google.
10. **Thành tích tính từ dữ liệu**, chưa có bảng `achievements` — tên và mô tả giữ nguyên prototype.
11. **SC-01 Màn chào + SC-03 Thiết lập ban đầu gộp thành một hộp thoại 3 bước ở Trang chủ** (`WelcomeDialog`), thay vì hai
    trang `/chao`, `/bat-dau`: Noko giới thiệu → cách Neko Neko hoạt động → chọn mục tiêu mỗi ngày. Hiện khi
    `user_settings.welcomed_at` còn trống; lưu ở database nên đổi máy không chào lại. Chưa hỏi ngày thi (`exam_date`).
    Người chưa nhớ được gì thấy thêm thẻ "Bắt đầu từ đây" (`FirstStepsCard`).
13. **Ghi trí nhớ dùng khoá lạc quan.** Memory Engine tính bản ghi mới từ bản ghi server đọc lúc đầu request; hai
    request cùng kiến thức (hai tab, gửi lại) từng ghi đè nhau. Nay `apply_memory_update` nhận `p_expected_encounter_count`
    (số lần gặp lúc đọc) và chỉ ghi khi bản ghi chưa đổi; đổi rồi → lỗi `stale_memory_record` (SQLSTATE **P0001** —
    KHÔNG dùng 40001: PostgREST tự thử lại cả giao dịch với mã đó, xung đột lặp tới khi hết giờ). `recordMemoryEvent`
    đọc lại, tính lại, thử lại tối đa 3 lần. Kiểm chứng: `npm run test:db` (kịch bản 2 request) + `memory-service.test.ts`.
12. **Tốc độ — database ở xa nên đếm số lượt chờ.** Mỗi lượt gọi Supabase ~100ms, nên:
    (a) xác thực bằng `auth.getClaims()` (kiểm chữ ký JWT ES256 tại server, không gọi mạng) thay vì `getUser()`,
    ở cả middleware lẫn `getCurrentLearner`; (b) `getLearnerContext` đọc hồ sơ, cài đặt, nội dung, trí nhớ, ngày nhớ lại
    **song song**; (c) trả lời một bước đọc phiên học song song với ngữ cảnh; (d) thẻ Khám phá đi tiếp ngay, việc ghi
    "đã gặp" chạy ngầm, nối tiếp nhau (`useLearningSession`). Đánh đổi của (a): phiên bị thu hồi ở nơi khác vẫn dùng được
    tới khi access token hết hạn (mặc định 1 giờ).

## 7. Chưa làm (có trong đặc tả nhưng ngoài phạm vi lần này)

| Mục | Ghi chú |
|---|---|
| SC-32 Chi tiết trí nhớ một mục `/tri-nho/muc/[id]` | Dữ liệu đã có trong `review_events`. |
| Furigana | Có công tắc trong Cài đặt (lưu được) nhưng prototype chưa có cách hiển thị. |
| Nhắc học (thông báo đẩy) | Có công tắc, chưa gửi thông báo. |
| AI Engine (sheet 15) | Tuỳ chọn; lõi học chạy đủ khi không có AI. |
| Âm thanh thu sẵn | Dùng giọng tiếng Nhật có sẵn trên máy (Web Speech API), người học chọn nam/nữ trong Cài đặt (`user_settings.voice_gender`). App luôn chỉ định rõ giọng tiếng Nhật (`lib/speech/japanese-voices.ts`), ưu tiên Microsoft Natural / Apple Enhanced / Google; máy thiếu giọng thì hướng dẫn cách thêm. Chữ được đọc lấy từ `speechTextFor` — luôn là chữ Nhật, không phải romaji. Muốn giọng đồng nhất mọi máy: tạo sẵn file âm thanh bằng Azure/Google TTS. |
| Bảng `achievements`, `notifications`, `audio_assets` | Xem mục 6.10. |
| Kiểm thử E2E (Playwright) | Có unit test + `test:db`; E2E là bước tiếp theo. |

## 8. Câu hỏi còn mở (sheet 13)

- **Q-02 — Bản quyền Minna no Nihongo.** Repo chỉ chứa nội dung từ file lộ trình của bạn và nội dung Neko Neko tự soạn
  (`content/seed/supplement.json`). Không có hội thoại hay bài đọc chép từ sách.
- **Q-05 — ĐÃ CHỐT:** tính theo ngày học thật — xem mục 3b. (`profiles.start_date` nay chỉ để hiển thị "Bắt đầu từ đây".)
