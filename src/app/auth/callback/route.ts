import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

/**
 * Supabase chuyển về đây sau khi xác nhận email hoặc đăng nhập Google — đổi mã lấy phiên đăng nhập.
 * Lỗi (người dùng huỷ ở Google, link hết hạn, cấu hình OAuth sai) quay về /dang-nhap với mã lỗi riêng và giữ ?tiep.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('tiep') ?? '/';
  const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/';
  const backToLogin = (reason: string) => {
    const target = new URL('/dang-nhap', url.origin);
    target.searchParams.set('loi', reason);
    if (safeNext !== '/') target.searchParams.set('tiep', safeNext);
    return NextResponse.redirect(target);
  };

  // Google / Supabase báo lỗi thẳng trên URL: access_denied = người dùng bấm Huỷ.
  const oauthError = url.searchParams.get('error');
  if (oauthError) {
    if (oauthError !== 'access_denied') logger.warn('Đăng nhập OAuth không thành công', { error: oauthError, code: url.searchParams.get('error_code') });
    return backToLogin(oauthError === 'access_denied' ? 'huy' : 'oauth');
  }

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(safeNext, url.origin));
    logger.error('Không đổi được mã xác nhận lấy phiên đăng nhập', error);
  }
  return backToLogin('xac-nhan');
}
