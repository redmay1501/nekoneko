import { adminRoute } from '@/features/admin/admin-route';
import { countLearnerMemory, deleteEntity, loadEntityRecord, updateEntity } from '@/features/admin/content-admin';
import { contentTargetOf as targetOf } from '@/features/admin/route-params';

type Params = { params: Promise<{ entity: string; id: string }> };

export async function GET(request: Request, { params }: Params) {
  return adminRoute('GET /api/admin/content/:id', request, async () => {
    const { entity, id } = await targetOf(params);
    return { ...(await loadEntityRecord(entity, id)), learnerMemoryCount: await countLearnerMemory(entity, id) };
  });
}

export async function PATCH(request: Request, { params }: Params) {
  return adminRoute('PATCH /api/admin/content/:id', request, async (admin) => {
    const { entity, id } = await targetOf(params);
    await updateEntity(admin, entity, id, await request.json());
    return { ok: true };
  });
}

/** Xoá hẳn — chỉ khi chưa người học nào có thẻ nhớ của mục này (server kiểm tra lại, không tin form). */
export async function DELETE(request: Request, { params }: Params) {
  return adminRoute('DELETE /api/admin/content/:id', request, async (admin) => {
    const { entity, id } = await targetOf(params);
    await deleteEntity(admin, entity, id);
    return { ok: true };
  });
}
