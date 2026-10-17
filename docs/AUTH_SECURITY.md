# Bảo mật đăng nhập / đăng ký — cấu hình cần làm ngoài source code

Form đăng nhập gọi **thẳng Supabase Auth** bằng khoá công khai (anon). Vì vậy mọi kiểm tra trong code
(`src/features/auth/credentials.ts`) chỉ giúp người học thấy lỗi sớm; **lớp chặn thật nằm ở cấu hình Supabase**.
Trạng thái đã kiểm tra ngày 18/10/2026 qua endpoint công khai `GET /auth/v1/settings`:

| Hạng mục | Hiện tại | Cần |
|---|---|---|
| Google provider | **TẮT** (`Unsupported provider: provider is not enabled`) | Bật (mục 1) |
| Xác minh email (Confirm email) | **TẮT** (`mailer_autoconfirm: true`) — ai cũng đăng ký được bằng email không có thật | Bật (mục 2) |
| Độ dài mật khẩu tối thiểu | mặc định Supabase (6) | 7 (mục 2) |
| CAPTCHA | **TẮT** | Bật Turnstile (mục 3) |
| Rate limit | mặc định Supabase | Kiểm tra lại (mục 4) |

## 1. Đăng nhập Google

1. Google Cloud Console → APIs & Services → Credentials → **Create OAuth client ID** (Web application).
   - *Authorized JavaScript origins*: `https://<domain-production>` và `http://localhost:3000`.
   - *Authorized redirect URIs*: `https://<project-ref>.supabase.co/auth/v1/callback` (lấy đúng URL ở bước 2).
   - OAuth consent screen: điền tên app, email hỗ trợ; scope `email`, `profile`, `openid`; chuyển sang **In production** khi mở cho mọi người.
2. Supabase Dashboard → Authentication → **Sign In / Providers → Google** → bật, dán Client ID + Client Secret. Callback URL hiện ngay ở đây.
3. Supabase → Authentication → **URL Configuration**:
   - Site URL: `https://<domain-production>`.
   - Redirect URLs: `https://<domain-production>/auth/callback`, `http://localhost:3000/auth/callback`
     (và domain preview của Vercel nếu muốn thử ở preview, ví dụ `https://*-neko-neko1.vercel.app/auth/callback`).
4. Kiểm tra: mở `/dang-nhap` — nút **Google** tự hiện (app đọc lại cấu hình sau tối đa 5 phút). Đăng nhập thử, huỷ thử
   (phải quay về `/dang-nhap` với câu "Bạn đã huỷ đăng nhập bằng Google").

Client Secret chỉ nằm trong Supabase — **không** đưa vào `.env` của app hay mã phía trình duyệt.

## 2. Bắt buộc xác minh email + mật khẩu tối thiểu 7 ký tự

Supabase → Authentication → **Sign In / Providers → Email**:
- Bật **Confirm email**. Khi bật, Supabase **không cấp phiên đăng nhập** cho tài khoản chưa bấm link xác nhận — người học
  không vào được trang học cho tới khi xác nhận. Tài khoản cũ (đã được tự xác nhận) không bị ảnh hưởng.
- **Minimum password length** = `7` (khớp `MIN_SIGN_UP_PASSWORD_LENGTH`) — đây mới là kiểm tra phía server.
- Nên bật **Secure email change**.

Supabase gửi mail bằng SMTP mặc định chỉ được vài thư/giờ cho cả dự án — đủ thử nghiệm, không đủ thật. Nên cấu hình
**Custom SMTP** (Authentication → Emails → SMTP Settings) bằng Resend / SendGrid / Postmark…

## 3. CAPTCHA — Cloudflare Turnstile

1. Cloudflare Dashboard → Turnstile → Add site (domain production + `localhost`) → lấy **Site key** và **Secret key**.
2. Supabase → Authentication → **Attack Protection** → Enable CAPTCHA protection → provider **Turnstile** → dán **Secret key**.
3. Vercel (và `.env.local`) → thêm `NEXT_PUBLIC_TURNSTILE_SITE_KEY=<site key>` → redeploy.

Bật hai bước 2 và 3 **cùng lúc**: khi Supabase bật CAPTCHA, mọi yêu cầu đăng nhập / đăng ký / quên mật khẩu đều phải có
token — thiếu biến môi trường thì form không gửi được token. Ngược lại có biến mà Supabase chưa bật thì ô xác minh hiện
nhưng không có tác dụng chặn.

## 4. Rate limit

Supabase → Authentication → **Rate Limits**: giữ hoặc hạ "Rate limit for sign ups and sign ins" (mặc định 30 / 5 phút / IP)
và "Rate limit for sending emails". Phía app đã thêm: nút gửi bị khoá khi đang gửi, chờ 60 giây giữa hai lần gửi email
(đăng ký, gửi lại xác nhận, quên mật khẩu), và câu báo "thao tác hơi nhanh" khi Supabase trả 429. Các lớp phía app chỉ chặn
người bấm liên tục — bot gọi thẳng API Supabase chỉ bị chặn bởi CAPTCHA + rate limit của Supabase.

## Đã làm trong code (đợt 18/10/2026)

- Kiểm tra từng ô (email đúng định dạng, bỏ khoảng trắng, chữ thường; mật khẩu đăng ký ≥ 7 ký tự, không dấu cách đầu/cuối,
  ≤ 72 byte; tên bắt buộc) — lỗi hiện ngay dưới ô, `aria-invalid`. Áp cả cho form đặt lại mật khẩu.
- Câu báo lỗi không tiết lộ email đã có tài khoản hay chưa.
- Nút Google chỉ hiện khi Google đã bật thật trong Supabase; có trạng thái đang chuyển; huỷ / lỗi OAuth / link hết hạn có câu riêng và giữ trang đích (`?tiep`).
- "Gửi lại email xác nhận" (khi đăng ký xong hoặc đăng nhập gặp "Email chưa xác nhận"), có thời gian chờ.
- Hỗ trợ Turnstile (bật bằng `NEXT_PUBLIC_TURNSTILE_SITE_KEY`).
