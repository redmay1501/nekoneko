import { z } from 'zod';
import { buildKnowledgeDetail } from '@/features/learning/knowledge-detail';
import { findKnowledgeItem } from '@/features/learning/knowledge-catalog';
import { getLearnerContext } from '@/features/learning/learner-context';
import { toMemoryView } from '@/features/memory/memory-engine';
import { handleApiRoute } from '@/lib/api/route-handler';

/** Mỗi lần tải sẵn tối đa chừng này thẻ (những chữ đang / sắp hiện trên màn hình). */
const MAX_BATCH = 60;
const keysSchema = z.string().max(MAX_BATCH * 20).transform((value) => [...new Set(value.split(',').filter(Boolean))].slice(0, MAX_BATCH));

/**
 * Chi tiết NHIỀU kiến thức trong một lần gọi — để trang tải sẵn những chữ đang hiện, bấm vào là mở ngay
 * (không phải chờ khay gọi /api/knowledge/[key] cho từng chữ). Khoá không có thật thì bỏ qua.
 */
export async function GET(request: Request) {
  return handleApiRoute('GET /api/knowledge', async () => {
    const keys = keysSchema.parse(new URL(request.url).searchParams.get('keys') ?? '');
    const context = await getLearnerContext();
    const details = Object.fromEntries(keys.flatMap((key) => {
      const item = findKnowledgeItem(context.catalog, key);
      if (!item) return [];
      const memory = context.memoryViews.get(item.key) ?? toMemoryView(item.key, item.type, null, context.now);
      return [[key, buildKnowledgeDetail(item, memory, context.catalog)]];
    }));
    return { details };
  });
}
