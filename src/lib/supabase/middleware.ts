import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';
import { publicEnv } from '@/config/env';

/** Các đường dẫn ai cũng vào được, không cần đăng nhập. */
const PUBLIC_PATH_PREFIXES = ['/dang-nhap', '/auth'];

/**
 * Làm mới phiên Supabase ở mỗi request và chuyển người chưa đăng nhập về /dang-nhap.
 * API route tự trả 401, không bị chuyển hướng.
 */
export async function refreshSupabaseSession(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
      },
    },
  });

  // getClaims xác minh chữ ký JWT ngay tại server bằng khoá công khai (ES256, JWKS được cache) — không tốn một
  // lượt gọi mạng tới Supabase Auth ở MỖI request như getUser. Token hết hạn thì tự làm mới qua cookie như trước.
  const { data } = await supabase.auth.getClaims();
  const path = request.nextUrl.pathname;
  const isPublicPath = PUBLIC_PATH_PREFIXES.some((prefix) => path.startsWith(prefix));
  const isApiPath = path.startsWith('/api');

  if (!data?.claims && !isPublicPath && !isApiPath) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/dang-nhap';
    loginUrl.searchParams.set('tiep', path);
    return NextResponse.redirect(loginUrl);
  }
  return response;
}
