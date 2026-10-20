import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Onboarding3DWelcome } from '@/components/onboarding/Onboarding3DWelcome';
import { getCurrentLearner } from '@/features/auth/current-learner';
import { isCurrentUserAdmin } from '@/features/auth/current-roles';
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
  const [context, isAdmin] = await Promise.all([getLearnerContext(), isCurrentUserAdmin()]);
  // Người học mới = welcomed_at còn trống trong cài đặt (gắn với tài khoản, không dựa vào localStorage).
  // Kiểm tra ở layout → hướng dẫn hiện ở BẤT KỲ trang nào người học vào đầu tiên (kể cả ?tiep=… sau đăng ký / Google).
  const isWelcomed = context.settings.welcomedAt !== null;
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
      isAdmin={isAdmin}
      isWelcomed={isWelcomed}
      journeyDay={context.journeyDay}
      dailyGoalMinutes={context.settings.dailyMinutes}
    >
      {children}
      {isWelcomed ? null : (
        <Onboarding3DWelcome displayName={context.profile.displayName} journeyDay={context.journeyDay} initialDailyMinutes={context.settings.dailyMinutes} />
      )}
    </AppShell>
  );
}
