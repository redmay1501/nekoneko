import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { publicEnv } from '@/config/env';

/**
 * Supabase client ở SERVER, mang phiên đăng nhập của người dùng (qua cookie).
 * Mọi truy vấn vẫn đi qua RLS như khi gọi từ trình duyệt.
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) cookieStore.set(name, value, options);
        } catch {
          // Server Component không được ghi cookie. Middleware đã làm mới phiên, nên bỏ qua là đúng.
        }
      },
    },
  });
}

/** Client không gắn người dùng — chỉ để đọc NỘI DUNG công khai (được cache). */
export function createAnonymousSupabaseClient() {
  return createClient(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
