import { z } from 'zod';
import { adminRoute } from '@/features/admin/admin-route';
import { MAX_BULK_IMAGE_ITEMS, setEntityImagesBulk } from '@/features/admin/content-admin';
import { contentEntityOf } from '@/features/admin/route-params';

const schema = z.object({
  ids: z.array(z.number().int().positive()).min(1).max(MAX_BULK_IMAGE_ITEMS),
  assetId: z.string().uuid().nullable(),
  altText: z.string().max(300).default(''),
}).strict();

/** Gắn một ảnh (đã có trong thư viện) cho nhiều mục, hoặc gỡ ảnh khỏi nhiều mục (assetId = null). */
export async function POST(request: Request, { params }: { params: Promise<{ entity: string }> }) {
  return adminRoute('POST /api/admin/content/:entity/images', request, async (admin) => {
    const input = schema.parse(await request.json());
    return setEntityImagesBulk(admin, await contentEntityOf(params), input.ids, input.assetId, input.altText);
  });
}
