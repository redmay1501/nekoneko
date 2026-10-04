import { buildKnowledgeDetail } from '@/features/learning/knowledge-detail';
import { findKnowledgeItem } from '@/features/learning/knowledge-catalog';
import { getLearnerContext } from '@/features/learning/learner-context';
import { toMemoryView } from '@/features/memory/memory-engine';
import { NotFoundError } from '@/lib/api/errors';
import { handleApiRoute } from '@/lib/api/route-handler';

/** Chi tiết một kiến thức cho khay "Chi tiết" — gồm mạng liên kết và trạng thái trí nhớ. */
export async function GET(_request: Request, { params }: { params: Promise<{ contentKey: string }> }) {
  return handleApiRoute('GET /api/knowledge/[contentKey]', async () => {
    const { contentKey } = await params;
    const context = await getLearnerContext();
    const item = findKnowledgeItem(context.catalog, contentKey);
    if (!item) throw new NotFoundError(contentKey);
    const memory = context.memoryViews.get(item.key) ?? toMemoryView(item.key, item.type, null, context.now);
    return buildKnowledgeDetail(item, memory, context.catalog);
  });
}
