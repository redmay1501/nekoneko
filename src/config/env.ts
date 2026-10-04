/**
 * Biến môi trường dùng được ở cả server và trình duyệt.
 * Biến bí mật (service role, AI key) KHÔNG nằm ở đây — xem lib/supabase/admin.ts.
 *
 * Phải viết process.env.NEXT_PUBLIC_... đầy đủ để Next.js thay giá trị lúc build.
 */
export const publicEnv = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
  appEnvironment: process.env.NEXT_PUBLIC_APP_ENV ?? 'development',
} as const;

/**
 * Không cấu hình Supabase → chạy CHẾ ĐỘ DEMO: một người học mẫu, trí nhớ lưu
 * tạm trong bộ nhớ máy chủ (mất khi tắt `npm run dev`). Dùng để xem và thử app ngay.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(publicEnv.supabaseUrl && publicEnv.supabaseAnonKey);
}

export function isDemoMode(): boolean {
  return !isSupabaseConfigured();
}
