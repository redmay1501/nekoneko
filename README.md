# Neko Neko 🐱🌸 ネコネコ

> **Learn. Recall. Remember. — Học hôm nay. Ở lại mãi.**
>
> Ứng dụng học tiếng Nhật JLPT N5 cho người Việt, xoay quanh **trí nhớ dài hạn**: Neko Neko theo dõi từng kiến thức
> và đưa nó quay lại đúng lúc bạn sắp quên.

Next.js 15 (App Router) · TypeScript · Tailwind CSS · Supabase · TanStack Query · Zustand · Vitest

---

## 1. Chạy thử ngay — 2 lệnh, không cần cấu hình

Yêu cầu: **Node.js 20 trở lên** (`node -v`).

```bash
npm install
npm run dev
```

Mở <http://localhost:3000>. App chạy ở **chế độ demo**: một người học mẫu đang ở ngày 23/90, đủ mọi màn hình,
trả lời được thật, Memory Engine cập nhật thật. Dữ liệu demo lưu trong bộ nhớ máy chủ — tắt `npm run dev` là mất.

Góc dưới màn hình có nhãn **"Chế độ demo"** để bạn luôn biết mình đang ở đâu.

## 2. Chạy với Supabase (tài khoản thật, dữ liệu lưu lâu dài)

### Bước 1 — Tạo project
Vào <https://supabase.com> → **New project**. Đợi project khởi tạo xong.

### Bước 2 — Tạo bảng
**SQL Editor → New query** → dán và **Run** lần lượt từng file trong `supabase/migrations/`, theo thứ tự tên:
1. `20261003000001_initial_schema.sql`
2. `20261004000001_journey_progress.sql`
3. `20261004000002_welcome.sql`
4. `20261004000003_voice_gender.sql`
5. `20261004000004_session_mode_day.sql`
6. `20261005000001_memory_optimistic_lock.sql`
7. `20261005000002_session_mode_backlog.sql`
8. `20261005000003_example_sentences.sql`
9. `20261005000004_recall_dates.sql`
(Nếu dùng Supabase CLI: `supabase link` rồi `supabase db push`.)

### Bước 3 — Điền biến môi trường
```bash
cp .env.example .env.local
```
Lấy giá trị ở **Project Settings → API** (hoặc **API Keys**):

| Biến | Lấy ở đâu | Bí mật? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL | Không |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `anon` / publishable key | Không |
| `SUPABASE_SERVICE_ROLE_KEY` | `service_role` / secret key | **Có — chỉ ở server, không bao giờ commit** |

### Bước 4 — Đưa nội dung N5 vào database
```bash
npm run seed:content
```
Ghi 90 ngày, 486 đầu việc, 104 kana, 45 bộ thủ, 103 kanji, 350 từ vựng, 112 mẫu ngữ pháp… Chạy lại bao nhiêu lần cũng được.

### Bước 5 — Cấu hình đăng nhập
**Authentication → URL Configuration**
- Site URL: `http://localhost:3000`
- Redirect URLs: thêm `http://localhost:3000/auth/callback`

Khi phát triển, có thể tắt **Confirm email** (Authentication → Providers → Email) để đăng ký xong vào học luôn.
Đăng nhập Google là tuỳ chọn: bật provider Google và điền Client ID/Secret.

### Bước 6 — Chạy
```bash
npm run dev
```
Mở <http://localhost:3000> → được chuyển tới **/dang-nhap** → tạo tài khoản. Tài khoản mới bắt đầu ở **ngày 1**,
vườn trống — đúng trải nghiệm người học thật.

**Lộ trình tính theo ngày học thật:** người học chỉ sang ngày 2 khi **tự xác nhận xong ngày 1** — bấm
**"✓ Hoàn thành ngày 1"** rồi xác nhận lại. App không bao giờ tự chuyển ngày; học hết kiến thức của ngày thì Trang chủ
và màn Khoảnh khắc tiến bộ MỜI hoàn thành. Xác nhận xong là mở ngày sau ngay; nghỉ vài hôm cũng không bị trôi lộ trình.

**Nhịp học:** "Học hôm nay" (~8 phút) là mức tối thiểu — ôn trí nhớ + một chặng 5 kiến thức mới. Muốn xong ngày
trong một lần: **📘 Học hết ngày X** — đi hết kiến thức còn lại, sau mỗi chặng chọn "Học tiếp" hoặc "Dừng ở đây".

**Muốn kiểm thử mọi màn hình với dữ liệu "giữa lộ trình"?** (chỉ dành cho dev/QA)
```bash
npm run seed:demo-memory -- --email email-cua-ban@vidu.com --day 23
```

## 3. Các lệnh

| Lệnh | Việc |
|---|---|
| `npm run dev` | Chạy môi trường phát triển |
| `npm run build` / `npm start` | Build và chạy bản production |
| `npm run lint` | ESLint (không cho phép cảnh báo) |
| `npm run typecheck` | Kiểm tra kiểu TypeScript |
| `npm test` | Unit test (Memory Engine, Session Engine, lộ trình, nội dung) |
| `npm run test:db` | Chạy migration trên PostgreSQL nhúng và kiểm tra RLS — không cần Docker |
| `npm run verify` | lint + typecheck + test + build — **chạy trước khi coi một việc là xong** |
| `npm run seed:content` | Đưa nội dung N5 vào Supabase |
| `npm run seed:demo-memory -- --email … --day 23` | Đưa một tài khoản QA tới ngày 23, kèm trí nhớ mẫu |
| `npx tsx scripts/import-brand-assets.ts` | Xử lý logo + bộ icon mèo từ `design/icons-moi/recraft-assets/` (cắt viền, thu nhỏ, WebP) → `public/brand/`, `public/icons/neko/`, favicon |
| `npm run icons:fetch` | Tải icon 3D (Microsoft Fluent Emoji, MIT) và emoji động (Google Noto, CC BY 4.0) vào `public/icons/` — chỉ khi thêm icon mới vào `src/components/common/emoji-icons.ts` |
| `npx tsx scripts/fetch-examples.ts` | Lấy lại câu ví dụ Nhật–Việt từ [Tatoeba](https://tatoeba.org) (CC BY 2.0 FR) → `content/seed/examples.json`, rồi `npm run seed:content` |
| `python3 scripts/convert-roadmap.py` | Chuyển lại file Excel lộ trình → JSON (chỉ khi Excel thay đổi) |

## 4. Đọc code từ đâu?

1. `docs/architecture.md` — bức tranh tổng thể, luồng dữ liệu, **các quyết định và khác biệt so với đặc tả**.
2. `src/features/memory/memory-engine.ts` — trái tim sản phẩm (đọc kèm `docs/memory-engine.md`).
3. `src/features/learning/session-engine.ts` + `session-modes.ts` — một engine cho mọi kiểu học.
4. `src/app/(app)/page.tsx` — Trang chủ: xem một màn hình lấy dữ liệu và ghép component thế nào.
5. `src/app/api/session/answer/route.ts` — đường đi của một câu trả lời tới database.

Quy ước code: `docs/coding-standards.md`. Database: `docs/database.md`.

## 5. Màn hình

| Khu vực | Đường dẫn |
|---|---|
| Trang chủ — Học hôm nay (kèm kế hoạch Gặp lại · Học bù · Mới · Dùng thử), Gặp lại kiến thức, Lộ trình 90 ngày, Vườn | `/` |
| Lộ trình 90 ngày · Một ngày học | `/lo-trinh` · `/lo-trinh/ngay/[n]` |
| Học tập | `/hoc-tap`, `/hoc-tap/{hiragana, katakana, bo-thu, kanji, tu-vung, ngu-phap}`, `/hoc-tap/{bo-thu, kanji, tu-vung, ngu-phap}/[id]` |
| Luyện tập · kỹ năng | `/luyen-tap`, `/luyen-tap/{nghe, noi, doc, viet}` |
| Phiên học | `/hoc/[mode]` (`daily`, `day`, `quick5`, `random`, `more`, `rescue`, `flow`, `recall`, `discover`, `use`, `backlog`); `/gap-lai`, `/kham-pha`, `/thuc-hanh` là đường dẫn cũ, tự chuyển sang `/hoc/…` |
| Sau phiên | `/khoanh-khac`, `/nghi` |
| Trí nhớ | `/tri-nho`, `/tri-nho/sap-quen`, `/tri-nho/chua-vung`, `/tri-nho/cuu/[contentKey]` |
| Vườn tri thức | `/vuon` |
| Cá nhân | `/tien-do`, `/thanh-tich`, `/ho-so`, `/cai-dat` |
| Đăng nhập | `/dang-nhap` |
| Khay trượt | ＋ Học ngay, ☰ Điều hướng, Chi tiết kiến thức, Tìm kiếm |

## 6. Triển khai lên Vercel

1. Đẩy repo lên GitHub → **Import** vào Vercel.
2. Thêm 3 biến môi trường ở mục 2 (+ `NEXT_PUBLIC_APP_ENV=production`).
3. Ở Supabase, thêm domain Vercel vào Site URL / Redirect URLs (`https://ten-mien/auth/callback`).

## 7. Còn mở / chưa làm

Xem chi tiết ở `docs/architecture.md` mục 7–8. Tóm tắt:
- **Q-05** đã chốt: "Ngày X/90" tính theo ngày học thật (xem `docs/architecture.md` mục 3b).
- **Q-02** Bản quyền Minna: repo không chứa nội dung chép từ sách; đoạn đọc hiểu do Neko Neko tự soạn.
- Chưa làm: màn chào `/chao`, thiết lập ban đầu `/bat-dau`, chi tiết lịch sử trí nhớ một mục, hiển thị furigana,
  thông báo nhắc học, AI Engine, âm thanh thu sẵn, kiểm thử E2E.
