'use client';

import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/api/query-keys';
import { fetchKnowledgeDetail, searchKnowledgeItems } from '../knowledge-api';

export function useKnowledgeDetail(contentKey: string | null) {
  return useQuery({
    queryKey: QUERY_KEYS.knowledgeDetail(contentKey ?? ''),
    queryFn: () => fetchKnowledgeDetail(contentKey ?? ''),
    enabled: Boolean(contentKey),
  });
}

export function useKnowledgeSearch(query: string) {
  const trimmed = query.trim();
  return useQuery({
    queryKey: QUERY_KEYS.knowledgeSearch(trimmed),
    queryFn: () => searchKnowledgeItems(trimmed),
    enabled: trimmed.length > 0,
  });
}
