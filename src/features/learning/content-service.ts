import 'server-only';
import type { N5Content } from '@/types/content';
import { buildKnowledgeCatalog, type KnowledgeCatalog } from './knowledge-catalog';

/**
 * Dựng danh mục kiến thức từ nội dung. Nội dung đổi rất hiếm (chỉ khi seed lại),
 * nên nhớ kết quả theo đúng object nội dung để không dựng lại mỗi request.
 */
const catalogByContent = new WeakMap<N5Content, KnowledgeCatalog>();

export function getKnowledgeCatalog(content: N5Content): KnowledgeCatalog {
  let catalog = catalogByContent.get(content);
  if (!catalog) {
    catalog = buildKnowledgeCatalog(content);
    catalogByContent.set(content, catalog);
  }
  return catalog;
}
