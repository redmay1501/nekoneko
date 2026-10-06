import { requestJson } from '@/lib/api/api-client';
import type { LearnerSettings } from '@/lib/data/data-source';

export interface SettingsPatch {
  dailyMinutes?: number;
  autoplayAudio?: boolean;
  showFurigana?: boolean;
  gentleMode?: boolean;
  reminderEnabled?: boolean;
  welcomed?: true;
  greeted?: true;
  voiceGender?: 'female' | 'male';
}

export function updateSettings(patch: SettingsPatch): Promise<LearnerSettings> {
  return requestJson('/api/settings', { method: 'PATCH', body: JSON.stringify(patch) });
}
