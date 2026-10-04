import { getLearnerContext } from '@/features/learning/learner-context';
import { parseContentKey, toContentKey, type ContentKey } from '@/features/learning/knowledge-types';
import { buildSurpriseCard } from '@/features/memory/memory-overview';
import { handleApiRoute } from '@/lib/api/route-handler';

/** "Gặp thứ khác" — chọn một kiến thức khác cho thẻ Gặp lại kiến thức. */
export async function GET(request: Request) {
  return handleApiRoute('GET /api/memory/surprise', async () => {
    const url = new URL(request.url);
    const excludedKeys: ContentKey[] = (url.searchParams.get('exclude') ?? '')
      .split(',')
      .map(parseContentKey)
      .filter((parsed): parsed is NonNullable<typeof parsed> => parsed !== null)
      .map((parsed) => toContentKey(parsed.type, parsed.id));
    const context = await getLearnerContext();
    const seed = url.searchParams.get('seed') ?? String(excludedKeys.length);
    return { surprise: buildSurpriseCard(context.catalog, context.memoryViews, seed, excludedKeys) };
  });
}
