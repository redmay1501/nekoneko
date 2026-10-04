import { createRequestId, postJson, requestJson } from '@/lib/api/api-client';
import type { SelfReportAnswer } from '@/features/learning/session-types';
import type { SurpriseCardData } from './memory-overview';
import type { MemoryView } from './memory-types';

/** Gọi API trí nhớ từ trình duyệt. Trình duyệt chỉ GỬI hành động — server tính trí nhớ. */

export function answerMemorySurprise(contentKey: string, selfReport: SelfReportAnswer): Promise<{ memory: MemoryView }> {
  return postJson('/api/memory/answer', { contentKey, selfReport, requestId: createRequestId() });
}

export function rescueKnowledge(contentKey: string, requestId: string): Promise<{ memory: MemoryView }> {
  return postJson('/api/memory/rescue', { contentKey, requestId });
}

export function fetchAnotherSurprise(excludedKeys: readonly string[], seed: number): Promise<{ surprise: SurpriseCardData | null }> {
  const params = new URLSearchParams({ exclude: excludedKeys.join(','), seed: String(seed) });
  return requestJson(`/api/memory/surprise?${params.toString()}`);
}
