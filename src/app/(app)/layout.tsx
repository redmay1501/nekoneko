import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { getCurrentLearner } from '@/features/auth/current-learner';
import { getLearnerContext } from '@/features/learning/learner-context';
import { SESSION_MODE_CONFIG } from '@/features/learning/session-modes';
import { displayedDailyMinutes } from '@/features/progress/settings-options';

/**
 * Mọi màn hình ở đây phụ thuộc trạng thái trí nhớ của TỪNG người học và thay đổi sau mỗi lần học,
 * nên không bao giờ được dựng sẵn lúc build (kể cả ở chế độ demo, khi không đọc cookie).
 */
export const dynamic = 'force-dynamic';

/** Mọi màn hình sau đăng nhập dùng chung khung này. */
export default async function AuthenticatedLayout({ children }: { children: ReactNode }) {
  if (!(await getCurrentLearner())) redirect('/dang-nhap');
  const context = await getLearnerContext();
  return (
    <AppShell
      displayName={context.profile.displayName}
      level={context.profile.level}
      recallDays={context.recallDays}
      dailyMinutes={displayedDailyMinutes(context.settings.dailyMinutes, SESSION_MODE_CONFIG.daily.targetMinutes)}
      isGentleMode={context.settings.gentleMode}
      shouldAutoplayAudio={context.settings.autoplayAudio}
      voiceGender={context.settings.voiceGender}
      isDemo={context.learner.isDemo}
    >
      {children}
    </AppShell>
  );
}
