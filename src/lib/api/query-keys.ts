/** Khoá TanStack Query — một chỗ, dễ đoán (Coding Standards §16). */
export const QUERY_KEYS = {
  learningSession: (mode: string, attempt: number) => ['learning-session', mode, attempt] as const,
  knowledgeDetail: (contentKey: string) => ['knowledge', contentKey] as const,
  knowledgeSearch: (query: string) => ['knowledge-search', query] as const,
};
