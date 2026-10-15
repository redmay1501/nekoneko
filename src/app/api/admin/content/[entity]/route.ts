import { adminRoute } from '@/features/admin/admin-route';
import { createEntity, loadEntityRecords } from '@/features/admin/content-admin';
import { CONTENT_STATUSES, filterRows } from '@/features/admin/content-entities';
import { contentEntityOf as entityOf } from '@/features/admin/route-params';

type Params = { params: Promise<{ entity: string }> };

/** Danh sách có tìm kiếm / lọc / phân trang. */
export async function GET(request: Request, { params }: Params) {
  return adminRoute('GET /api/admin/content', request, async () => {
    const entity = await entityOf(params);
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const day = url.searchParams.get('day');
    const result = filterRows(entity, await loadEntityRecords(entity), {
      q: url.searchParams.get('q') ?? '',
      day: day === 'none' ? null : day ? Number(day) : undefined,
      lesson: url.searchParams.get('lesson') ?? '',
      status: (CONTENT_STATUSES as readonly string[]).includes(status ?? '') ? (status as never) : 'all',
      page: Number(url.searchParams.get('page') ?? 1),
      pageSize: Number(url.searchParams.get('pageSize') ?? 25),
    });
    return { ...result, items: result.items.map(({ row, status: itemStatus, hasImage }) => ({ row, status: itemStatus, hasImage })) };
  });
}

export async function POST(request: Request, { params }: Params) {
  return adminRoute('POST /api/admin/content', request, async (admin) => createEntity(admin, await entityOf(params), await request.json()));
}
