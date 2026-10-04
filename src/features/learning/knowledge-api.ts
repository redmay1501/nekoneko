import { requestJson } from '@/lib/api/api-client';
import type { KnowledgeDetailView } from './knowledge-detail';

export interface KnowledgeSearchResult {
  contentKey: string;
  face: string;
  reading: string;
  meaning: string;
  typeLabel: string;
  statusEmoji: string;
}

export function fetchKnowledgeDetail(contentKey: string): Promise<KnowledgeDetailView> {
  return requestJson(`/api/knowledge/${encodeURIComponent(contentKey)}`);
}

export function searchKnowledgeItems(query: string): Promise<{ results: KnowledgeSearchResult[] }> {
  return requestJson(`/api/search?q=${encodeURIComponent(query)}`);
}
