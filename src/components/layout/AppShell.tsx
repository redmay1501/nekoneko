import type { ReactNode } from 'react';
import { SpeechPreferenceSync } from '@/components/common/SpeechPreferenceSync';
import { publicEnv } from '@/config/env';
import type { VoiceGender } from '@/lib/speech/japanese-voices';
import { BottomNavigation } from './BottomNavigation';
import { SakuraFall } from './SakuraFall';
import { KnowledgePrefetcher } from './KnowledgePrefetcher';
import { ScrollScenes } from './ScrollScenes';
import { SheetHost } from './SheetHost';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { AdminFlagProvider } from './AdminFlag';

interface AppShellProps {
  displayName: string;
  level: number;
  recallDays: number;
  dailyMinutes: number;
  isGentleMode: boolean;
  shouldAutoplayAudio: boolean;
  voiceGender: VoiceGender;
  isDemo: boolean;
  /** Có vai trò admin (server đã kiểm tra) → menu tài khoản có mục "Quản trị nội dung". */
  isAdmin?: boolean;
  children: ReactNode;
}

const PRODUCTION_ENVIRONMENT = 'production';

/** Khung ứng dụng: thanh bên (desktop) · thanh trên · nội dung · thanh dưới (mobile) · khay trượt. */
export function AppShell({ displayName, level, recallDays, dailyMinutes, isGentleMode, shouldAutoplayAudio, voiceGender, isDemo, isAdmin = false, children }: AppShellProps) {
  const environmentLabel = isDemo
    ? 'Chế độ demo'
    : publicEnv.appEnvironment !== PRODUCTION_ENVIRONMENT ? publicEnv.appEnvironment : null;
  return (
    <AdminFlagProvider isAdmin={isAdmin}>
    <div className="app-root">
      <SpeechPreferenceSync voiceGender={voiceGender} autoplayAudio={shouldAutoplayAudio} />
      <SakuraFall />
      <ScrollScenes />
      <KnowledgePrefetcher />
      <Sidebar />
      <div className="main">
        <TopBar displayName={displayName} level={level} recallDays={recallDays} isGentleMode={isGentleMode} isDemo={isDemo} isAdmin={isAdmin} />
        <main className="view" id="noi-dung" tabIndex={-1}>{children}</main>
      </div>
      <BottomNavigation />
      <SheetHost dailyMinutes={dailyMinutes} />
      {environmentLabel ? <span className="env-badge" title="Nhãn môi trường — không hiện ở production">{environmentLabel}</span> : null}
    </div>
    </AdminFlagProvider>
  );
}
