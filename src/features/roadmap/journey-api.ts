import { postJson } from '@/lib/api/api-client';
import type { JourneyAdvanceResult } from './journey-progress';

export function completeJourneyDay(day: number): Promise<JourneyAdvanceResult> {
  return postJson('/api/journey/complete-day', { day });
}

export function setJourneyStartingPoint(completedThroughDay: number): Promise<JourneyAdvanceResult> {
  return postJson('/api/journey/set-starting-point', { completedThroughDay });
}
