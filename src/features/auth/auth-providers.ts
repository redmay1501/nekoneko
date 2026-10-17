import 'server-only';
import { isSupabaseConfigured, publicEnv } from '@/config/env';
import { logger } from '@/lib/utils/logger';

/** Đọc lại cấu hình Auth công khai của Supabase sau chừng này giây (bật Google trong dashboard là nút hiện ra, không cần deploy). */
const SETTINGS_REVALIDATE_SECONDS = 300;

export interface AuthProviders {
  google: boolean;
  /** Supabase tự xác nhận email (Confirm email TẮT) — chỉ để cảnh báo trong log, không đổi giao diện. */
  isEmailAutoConfirmed: boolean;
}

/**
 * Provider nào đang BẬT thật trong Supabase Auth — đọc từ endpoint công khai /auth/v1/settings (chỉ cần khoá anon).
 * Nút "Đăng nhập với Google" chỉ hiện khi Google đã bật: trước đây nút luôn hiện, bấm vào ra trang lỗi
 * "Unsupported provider: provider is not enabled" của Supabase.
 */
export async function getAuthProviders(): Promise<AuthProviders> {
  if (!isSupabaseConfigured()) return { google: false, isEmailAutoConfirmed: false };
  try {
    const response = await fetch(`${publicEnv.supabaseUrl}/auth/v1/settings`, {
      headers: { apikey: publicEnv.supabaseAnonKey },
      next: { revalidate: SETTINGS_REVALIDATE_SECONDS },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const settings = (await response.json()) as { external?: Record<string, boolean>; mailer_autoconfirm?: boolean };
    return { google: settings.external?.google === true, isEmailAutoConfirmed: settings.mailer_autoconfirm === true };
  } catch (error) {
    logger.error('Không đọc được cấu hình Supabase Auth', error);
    return { google: false, isEmailAutoConfirmed: false };
  }
}
