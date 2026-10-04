import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

/** Supabase chuyển về đây sau khi xác nhận email — đổi mã lấy phiên đăng nhập. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('tiep') ?? '/';
  const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/';

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(safeNext, url.origin));
    logger.error('Không đổi được mã xác nhận lấy phiên đăng nhập', error);
  }
  return NextResponse.redirect(new URL('/dang-nhap?loi=xac-nhan', url.origin));
}
