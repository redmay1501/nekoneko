import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { publicEnv } from '@/config/env';

/**
 * Supabase client với SERVICE ROLE — bỏ qua RLS.
 *
 * CHỈ dùng ở server, CHỈ cho các thao tác nghiệp vụ quan trọng đã được Memory Engine
 * tính toán (ghi trí nhớ, tạo phiên học). Mọi truy vấn bằng client này PHẢI tự lọc
 * theo user_id đã xác thực.
 *
 * Gói 'server-only' khiến build báo lỗi nếu file này lỡ bị import vào code trình duyệt.
 */
export function createAdminSupabaseClient(): SupabaseClient {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error(
      'Thiếu SUPABASE_SERVICE_ROLE_KEY. Ghi trí nhớ cần khoá này ở server — xem README, mục "Cấu hình Supabase".',
    );
  }
  return createClient(publicEnv.supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
