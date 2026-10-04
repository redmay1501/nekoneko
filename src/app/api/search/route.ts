import { CONTENT_TYPE_LABELS } from '@/features/learning/knowledge-types';
import { getLearnerContext } from '@/features/learning/learner-context';
import { searchKnowledge } from '@/features/learning/knowledge-search';
import { STATUS_PRESENTATION } from '@/features/memory/memory-rules';
import { handleApiRoute } from '@/lib/api/route-handler';

const MAX_QUERY_LENGTH = 40;

export async function GET(request: Request) {
  return handleApiRoute('GET /api/search', async () => {
    const query = (new URL(request.url).searchParams.get('q') ?? '').slice(0, MAX_QUERY_LENGTH);
    const context = await getLearnerContext();
    return {
      results: searchKnowledge(context.catalog, query).map((item) => ({
        contentKey: item.key,
        face: item.face,
        reading: item.reading,
        meaning: item.meaning,
        typeLabel: CONTENT_TYPE_LABELS[item.type],
        statusEmoji: STATUS_PRESENTATION[context.memoryViews.get(item.key)?.status ?? 'new'].emoji,
      })),
    };
  });
}
