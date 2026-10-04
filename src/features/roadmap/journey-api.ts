import { postJson } from '@/lib/api/api-client';
import type { JourneyAdvanceResult } from './journey-progress';

export function completeJourneyDay(day: number): Promise<JourneyAdvanceResult> {
  return postJson('/api/journey/complete-day', { day });
}
