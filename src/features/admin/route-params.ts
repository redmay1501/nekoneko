import { NotFoundError } from '@/lib/api/errors';
import { type AdminEntity, isAdminEntity } from './content-entities';

/** Tham số đường dẫn /api/admin/content/[entity]/[id] — sai loại hoặc id → 404. */
export async function contentTargetOf(params: Promise<{ entity: string; id: string }>): Promise<{ entity: AdminEntity; id: number }> {
  const { entity, id } = await params;
  const numericId = Number(id);
  if (!isAdminEntity(entity) || !Number.isInteger(numericId) || numericId < 1) throw new NotFoundError(`${entity}/${id}`);
  return { entity, id: numericId };
}

export async function contentEntityOf(params: Promise<{ entity: string }>): Promise<AdminEntity> {
  const { entity } = await params;
  if (!isAdminEntity(entity)) throw new NotFoundError(entity);
  return entity;
}
