import type { KnowledgeCatalog } from './knowledge-catalog';
import type { KnowledgeItem } from './knowledge-types';

const MAX_SEARCH_RESULTS = 30;

/** Tìm theo chữ Nhật, cách đọc hoặc nghĩa tiếng Việt — 日本, にほん và "Nhật Bản" đều ra cùng một mục. */
export function searchKnowledge(catalog: KnowledgeCatalog, query: string): KnowledgeItem[] {
  const term = query.trim();
  if (!term) return [];
  const lowered = term.toLowerCase();
  return catalog.items
    .filter((item) => item.face.includes(term) || item.reading.includes(term) || item.meaning.toLowerCase().includes(lowered))
    .slice(0, MAX_SEARCH_RESULTS);
}
