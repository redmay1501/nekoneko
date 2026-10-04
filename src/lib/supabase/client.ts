'use client';

import { createBrowserClient } from '@supabase/ssr';
import { publicEnv } from '@/config/env';

/**
 * Supabase client cho TRÌNH DUYỆT — chỉ dùng anon key, mọi truy cập bị RLS chặn.
 * Dùng cho đăng nhập / đăng xuất. Không dùng để ghi trí nhớ.
 */
export function createBrowserSupabaseClient() {
  return createBrowserClient(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey);
}
