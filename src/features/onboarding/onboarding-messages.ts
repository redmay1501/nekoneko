import { DAILY_GOAL_OPTIONS } from '@/features/progress/settings-options';

/** Trang 3D tĩnh nằm ở public/onboarding-3d/ — app nhúng nó bằng iframe. */
export const ONBOARDING_3D_PATH = '/onboarding-3d/index.html';

/** Hết thời gian này mà trang 3D chưa báo "ready" (kể cả bản 2D của nó) → dùng lời chào cũ WelcomeDialog. */
export const ONBOARDING_READY_TIMEOUT_MS = 25_000;

export type OnboardingDoneAction = 'learn' | 'home' | 'skip';

export type OnboardingMessage =
  | { type: 'ready'; mode: '3d' | '2d' }
  | { type: 'done'; action: OnboardingDoneAction; dailyMinutes: number | null }
  | { type: 'close' };

const ALLOWED_MINUTES: ReadonlySet<number> = new Set(DAILY_GOAL_OPTIONS.map((option) => option.minutes));

/** Địa chỉ iframe: ?embed=1 bật chế độ nhúng; phut = mục tiêu hiện tại; mode=replay khi xem lại từ Cài đặt. */
export function buildOnboardingSrc({ dailyMinutes, replay = false }: { dailyMinutes: number; replay?: boolean }): string {
  const params = new URLSearchParams({ embed: '1', phut: String(ALLOWED_MINUTES.has(dailyMinutes) ? dailyMinutes : 8) });
  if (replay) params.set('mode', 'replay');
  return `${ONBOARDING_3D_PATH}?${params.toString()}`;
}

/**
 * Đọc tin nhắn trang 3D gửi lên. Trả về null với mọi thứ không đúng dạng — tin nhắn từ nơi khác (extension, iframe khác)
 * cũng đi qua window "message", nên phải kiểm tra kỹ chứ không tin dữ liệu.
 */
export function parseOnboardingMessage(data: unknown): OnboardingMessage | null {
  if (typeof data !== 'object' || data === null) return null;
  const message = data as Record<string, unknown>;
  if (message.source !== 'nekoneko-onboarding') return null;
  if (message.type === 'ready') return { type: 'ready', mode: message.mode === '2d' ? '2d' : '3d' };
  if (message.type === 'close') return { type: 'close' };
  if (message.type === 'done') {
    const action = message.action;
    if (action !== 'learn' && action !== 'home' && action !== 'skip') return null;
    const minutes = message.dailyMinutes;
    const dailyMinutes = action !== 'skip' && typeof minutes === 'number' && ALLOWED_MINUTES.has(minutes) ? minutes : null;
    return { type: 'done', action, dailyMinutes };
  }
  return null;
}
