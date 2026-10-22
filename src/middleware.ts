import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/config/env';
import { refreshSupabaseSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  // Chế độ demo không có đăng nhập.
  if (!isSupabaseConfigured()) return NextResponse.next();
  return refreshSupabaseSession(request);
}

export const config = {
  // Node.js runtime (ổn định từ Next.js 15.5): thư viện Supabase dùng API của Node, không chạy sạch trên Edge Runtime.
  runtime: 'nodejs',
  // Bỏ qua file tĩnh — cả đuôi chữ HOA (ảnh xuất từ máy thường là .PNG/.JPEG): nếu không, file ảnh bị middleware
  // coi là trang cần đăng nhập → trả 307 thay vì ảnh, next/image báo "isn't a valid image" (400).
  // Font, giấy phép (*.woff2, *.txt) và dữ liệu thứ tự nét (/strokes/*.json) cũng vậy: bị chuyển về trang đăng nhập thì trang đăng nhập không có font.
  // /onboarding-3d/ là trang hướng dẫn 3D tĩnh (HTML, JS, mô hình .glb, ~55 file) chạy trong iframe — không cần phiên đăng nhập.
  // Không loại trừ thì mỗi file đều chạy làm mới phiên, và ở `npm run dev` khi chưa đăng nhập file .glb bị đổi thành trang đăng nhập.
  // Mô hình 3D (*.glb — Vườn tri thức, vài MB mỗi file) cũng là file tĩnh: không cần làm mới phiên cho từng file.
  matcher: ['/((?!_next/static|_next/image|_next/webpack-hmr|favicon.ico|onboarding-3d/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?|txt|json|glb|SVG|PNG|JPG|JPEG|GIF|WEBP|GLB)$).*)'],
};
