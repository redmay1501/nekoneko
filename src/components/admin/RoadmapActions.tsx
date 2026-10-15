'use client';

import { useRouter } from 'next/navigation';
import { type FormEvent, useState } from 'react';
import { type AdminEntity, ENTITY_CONFIG } from '@/features/admin/content-entities';
import { adminFetch, useAdminUi } from './AdminUi';

/** Gỡ một mục khỏi ngày (day → null). Hỏi lại trước khi gỡ. */
export function DayItemActions({ entity, id, title, day, disabled }: { entity: AdminEntity; id: number; title: string; day: number; disabled: boolean }) {
  const router = useRouter();
  const { toast, confirm } = useAdminUi();
  async function unlink() {
    const ok = await confirm({ title: `Gỡ “${title}” khỏi ngày ${day}?`, body: 'Mục vẫn còn trong kho nội dung (chưa gắn ngày). Tiến độ và thẻ nhớ của người học không đổi.', confirmLabel: 'Gỡ khỏi ngày', tone: 'danger' });
    if (!ok) return;
    const result = await adminFetch(`/api/admin/content/${entity}/${id}/day`, { method: 'PUT', body: JSON.stringify({ day: null }) });
    if (!result.ok) { toast(result.error, 'error'); return; }
    toast(`Đã gỡ “${title}” khỏi ngày ${day}.`);
    router.refresh();
  }
  return <button type="button" className="adm-btn ghost sm" onClick={unlink} disabled={disabled}>Gỡ</button>;
}

/** Gắn một mục có sẵn (theo id) vào ngày đang xem. */
export function LinkItemForm({ entity, day, disabled }: { entity: AdminEntity; day: number; disabled: boolean }) {
  const router = useRouter();
  const { toast, confirm } = useAdminUi();
  const [value, setValue] = useState('');
  async function submit(event: FormEvent) {
    event.preventDefault();
    const id = Number(value);
    if (!Number.isInteger(id) || id < 1) { toast('Nhập id của mục (số ở cột ID trong danh sách).', 'error'); return; }
    const current = await adminFetch<{ row: Record<string, unknown> & { day: number | null } }>(`/api/admin/content/${entity}/${id}`);
    if (!current.ok) { toast(current.error, 'error'); return; }
    const title = ENTITY_CONFIG[entity].title(current.data.row as never);
    if (current.data.row.day === day) { toast(`“${title}” đã ở ngày ${day}.`, 'info'); return; }
    if (current.data.row.day !== null) {
      const ok = await confirm({ title: `Chuyển “${title}” sang ngày ${day}?`, body: `Mục đang ở ngày ${current.data.row.day}. Mỗi mục chỉ thuộc một ngày.`, confirmLabel: 'Chuyển' });
      if (!ok) return;
    }
    const result = await adminFetch(`/api/admin/content/${entity}/${id}/day`, { method: 'PUT', body: JSON.stringify({ day }) });
    if (!result.ok) { toast(result.error, 'error'); return; }
    toast(`Đã gắn “${title}” vào ngày ${day}.`);
    setValue('');
    router.refresh();
  }
  return (
    <form onSubmit={submit} className="adm-actions">
      <input className="adm-input" style={{ width: 110 }} inputMode="numeric" placeholder="id" aria-label={`Gắn ${ENTITY_CONFIG[entity].singular} theo id`} value={value} onChange={(event) => setValue(event.target.value)} disabled={disabled} />
      <button type="submit" className="adm-btn ghost sm" disabled={disabled || !value}>Gắn vào ngày</button>
    </form>
  );
}
