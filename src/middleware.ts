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
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
