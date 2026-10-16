'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type FormEvent, useEffect, useRef, useState } from 'react';
import {
  type AdminEntity, type ContentStatus, ENTITY_CONFIG, type FieldErrors, formValuesToInput, rowToFormValues, validateEntityInput,
} from '@/features/admin/content-entities';
import { AdminModal } from './AdminModal';
import { adminFetch, useAdminUi } from './AdminUi';
import { EntityFields } from './EntityFields';

interface EntityDetail {
  row: Record<string, string | number | null> & { id: number };
  status: ContentStatus;
  image: { assetId: string } | null;
  learnerMemoryCount: number;
}

/**
 * Popup Thêm / Sửa. Lưu xong: đóng popup, làm mới danh sách tại chỗ (bộ lọc, tìm kiếm, trang nằm trên URL nên giữ nguyên).
 * Lưu lỗi: giữ nguyên dữ liệu đang nhập, báo lỗi ngay trong popup. Đang lưu: khoá nút, không đóng được.
 */
export function EntityFormModal({ entity, id, onClose, isDemo }: { entity: AdminEntity; id: number | null; onClose: () => void; isDemo: boolean }) {
  const config = ENTITY_CONFIG[entity];
  const router = useRouter();
  const { toast } = useAdminUi();
  const [values, setValues] = useState<Record<string, string> | null>(id === null ? rowToFormValues(entity, null) : null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const savingRef = useRef(false);

  useEffect(() => {
    if (id === null) return;
    let isCurrent = true;
    adminFetch<EntityDetail>(`/api/admin/content/${entity}/${id}`).then((result) => {
      if (!isCurrent) return;
      if (result.ok) setValues(rowToFormValues(entity, result.data.row));
      else setLoadError(result.error);
    });
    return () => { isCurrent = false; };
  }, [entity, id]);

  // Sửa: dữ liệu tải xong mới có ô nhập → đưa focus vào ô đầu tiên.
  const hasValues = values !== null;
  useEffect(() => {
    if (hasValues && id !== null) document.getElementById(`m-${config.fields[0].name}`)?.focus({ preventScroll: true });
  }, [hasValues, id, config]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!values || savingRef.current) return; // chống bấm / Enter nhiều lần
    const input = formValuesToInput(entity, values);
    const checked = validateEntityInput(entity, input);
    if (!checked.ok) { setErrors(checked.errors); setSaveError('Còn ô chưa hợp lệ — xem chữ đỏ dưới từng ô.'); return; }
    setErrors({});
    setSaveError(null);
    savingRef.current = true;
    setIsSaving(true);
    const result = id === null
      ? await adminFetch<{ id: number; status: ContentStatus }>(`/api/admin/content/${entity}`, { method: 'POST', body: JSON.stringify(input) })
      : await adminFetch(`/api/admin/content/${entity}/${id}`, { method: 'PATCH', body: JSON.stringify(input) });
    savingRef.current = false;
    setIsSaving(false);
    if (!result.ok) { setSaveError(result.error); return; } // giữ nguyên dữ liệu đang nhập
    const created = id === null ? (result.data as { id: number; status: ContentStatus }) : null;
    toast(created ? `Đã thêm #${created.id}${created.status === 'draft' ? ' (Nháp — người học chưa thấy)' : ''}.` : 'Đã lưu.');
    onClose();
    router.refresh();
  }

  return (
    <AdminModal title={id === null ? `Thêm ${config.singular} mới` : `Sửa ${config.singular} #${id}`} onClose={onClose} isBusy={isSaving} wide>
      {loadError ? <div className="adm-notice error" role="alert">{loadError}</div>
        : !values ? <div className="adm-skel" style={{ height: 260 }} aria-label="Đang tải" />
        : (
          <form onSubmit={submit} noValidate>
            {isDemo ? <p className="adm-sm adm-muted" style={{ marginBottom: 10 }}>Demo: lưu sẽ bị server từ chối (cần Supabase).</p> : null}
            <EntityFields entity={entity} values={values} errors={errors} disabled={isSaving} idPrefix="m"
              onChange={(name, value) => setValues((current) => (current ? { ...current, [name]: value } : current))} />
            {saveError ? <div className="adm-notice error" role="alert" style={{ marginTop: 12 }}>{saveError}</div> : null}
            <div className="adm-dialog-actions">
              {id !== null ? <Link className="adm-btn ghost" href={`/admin/${config.slug}/${id}`} style={{ marginRight: 'auto' }}>Trang chi tiết (ảnh, trạng thái, xem trước)</Link> : null}
              <button type="button" className="adm-btn ghost" onClick={onClose} disabled={isSaving}>Huỷ</button>
              <button type="submit" className="adm-btn" disabled={isSaving} aria-busy={isSaving}>{isSaving ? 'Đang lưu…' : id === null ? 'Thêm' : 'Lưu'}</button>
            </div>
          </form>
        )}
    </AdminModal>
  );
}

export function CreateEntityButton({ entity, isDemo }: { entity: AdminEntity; isDemo: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <button type="button" className="adm-btn" onClick={() => setIsOpen(true)}>+ Thêm {ENTITY_CONFIG[entity].singular}</button>
      {isOpen ? <EntityFormModal entity={entity} id={null} isDemo={isDemo} onClose={() => setIsOpen(false)} /> : null}
    </>
  );
}

/** Mô tả nơi mục đang được dùng — hiện trong hộp xác nhận xoá. Thuần, để kiểm thử. */
export function deletionImpact(entity: AdminEntity, detail: Pick<EntityDetail, 'row' | 'image' | 'learnerMemoryCount'>): { canDelete: boolean; notes: string[] } {
  if (detail.learnerMemoryCount > 0) {
    return { canDelete: false, notes: [`${detail.learnerMemoryCount} thẻ nhớ của người học đang dùng mục này — xoá sẽ làm mất tiến độ. Hãy sửa nội dung thay vì xoá.`] };
  }
  const notes: string[] = [];
  if (detail.row.day !== null && detail.row.day !== undefined) notes.push(`Đang gắn vào ngày ${detail.row.day} của lộ trình — sẽ biến khỏi ngày đó.`);
  if (detail.image) notes.push('Có ảnh minh hoạ — chỉ gỡ liên kết, ảnh vẫn còn trong thư viện.');
  if (entity === 'kanji') notes.push('Liên kết Kanji – bộ thủ của chữ này cũng bị xoá.');
  notes.push('Chưa người học nào có thẻ nhớ của mục này.');
  return { canDelete: true, notes };
}

export function RowActions({ entity, id, title, isDemo }: { entity: AdminEntity; id: number; title: string; isDemo: boolean }) {
  const router = useRouter();
  const { toast, confirm } = useAdminUi();
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function remove() {
    setIsDeleting(true);
    const detail = await adminFetch<EntityDetail>(`/api/admin/content/${entity}/${id}`);
    if (!detail.ok) { setIsDeleting(false); toast(detail.error, 'error'); return; }
    const impact = deletionImpact(entity, detail.data);
    const body = <ul className="adm-list">{impact.notes.map((note) => <li key={note}>• {note}</li>)}</ul>;
    if (!impact.canDelete) {
      await confirm({ title: `Không thể xoá “${title}”`, body, alertOnly: true });
      setIsDeleting(false);
      return;
    }
    const ok = await confirm({ title: `Xoá “${title}” (#${id})?`, body, confirmLabel: 'Xoá hẳn', tone: 'danger' });
    if (!ok) { setIsDeleting(false); return; }
    const result = await adminFetch(`/api/admin/content/${entity}/${id}`, { method: 'DELETE', body: '{}' });
    setIsDeleting(false);
    if (!result.ok) { toast(result.error, 'error'); return; }
    toast(`Đã xoá “${title}”.`);
    router.refresh();
  }

  return (
    <span className="adm-actions" style={{ flexWrap: 'nowrap', gap: 4 }}>
      <button type="button" className="adm-btn ghost sm" onClick={() => setIsEditing(true)}>Sửa</button>
      <button type="button" className="adm-btn danger sm" onClick={remove} disabled={isDeleting} aria-busy={isDeleting}>Xoá</button>
      {isEditing ? <EntityFormModal entity={entity} id={id} isDemo={isDemo} onClose={() => setIsEditing(false)} /> : null}
    </span>
  );
}
