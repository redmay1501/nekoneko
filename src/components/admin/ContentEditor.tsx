'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type FormEvent, type ReactNode, useState } from 'react';
import {
  type AdminEntity, CONTENT_STATUSES, type ContentStatus, ENTITY_CONFIG, type FieldErrors, formValuesToInput,
  HIDDEN_FROM_LEARNERS, STATUS_LABELS, validateEntityInput,
} from '@/features/admin/content-entities';
import { adminFetch, useAdminUi } from './AdminUi';
import { EntityFields } from './EntityFields';
import { ImagePanel, type PanelImage } from './ImagePanel';

interface ContentEditorProps {
  entity: AdminEntity;
  id: number | null;
  initialValues: Record<string, string>;
  status: ContentStatus;
  statusNote: string;
  learnerMemoryCount: number;
  image: PanelImage | null;
  canUseStatus: boolean;
  canUseImages: boolean;
  isDemo: boolean;
  preview?: ReactNode;
}

/** Form sửa một mục nội dung + trạng thái + ảnh minh hoạ + xoá. Server kiểm tra lại mọi thứ — form chỉ giúp báo lỗi sớm. */
export function ContentEditor(props: ContentEditorProps) {
  const { entity, id, isDemo } = props;
  const config = ENTITY_CONFIG[entity];
  const router = useRouter();
  const { toast, confirm } = useAdminUi();
  const [values, setValues] = useState(props.initialValues);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  async function save(event: FormEvent) {
    event.preventDefault();
    const input = formValuesToInput(entity, values);
    const checked = validateEntityInput(entity, input);
    if (!checked.ok) { setErrors(checked.errors); toast('Còn ô chưa hợp lệ — xem chữ đỏ dưới từng ô.', 'error'); return; }
    setErrors({});
    setIsSaving(true);
    const result = id === null
      ? await adminFetch<{ id: number; status: ContentStatus }>(`/api/admin/content/${entity}`, { method: 'POST', body: JSON.stringify(input) })
      : await adminFetch<{ ok: true }>(`/api/admin/content/${entity}/${id}`, { method: 'PATCH', body: JSON.stringify(input) });
    setIsSaving(false);
    if (!result.ok) { toast(result.error, 'error'); return; }
    setIsDirty(false);
    if (id === null) {
      const created = result.data as { id: number; status: ContentStatus };
      toast(created.status === 'draft' ? `Đã thêm (#${created.id}) ở trạng thái Nháp — người học chưa thấy.` : `Đã thêm (#${created.id}).`);
      router.push(`/admin/${config.slug}/${created.id}`);
      return;
    }
    toast('Đã lưu. App học cập nhật ngay.');
    router.refresh();
  }

  async function remove() {
    if (id === null) return;
    const ok = await confirm({
      title: `Xoá ${config.singular} #${id}?`, tone: 'danger', confirmLabel: 'Xoá hẳn',
      body: <>Xoá khỏi database, không hoàn tác được. Ảnh vẫn còn trong thư viện.{entity === 'kanji' ? ' Liên kết kanji – bộ thủ của chữ này cũng bị xoá.' : ''} Server sẽ từ chối nếu đã có người học có thẻ nhớ của mục này.</>,
    });
    if (!ok) return;
    const result = await adminFetch(`/api/admin/content/${entity}/${id}`, { method: 'DELETE', body: '{}' });
    if (!result.ok) { toast(result.error, 'error'); return; }
    toast('Đã xoá.');
    router.push(`/admin/${config.slug}`);
    router.refresh();
  }

  return (
    <div className="adm-two">
      <div>
        <form className="adm-card" onSubmit={save} noValidate>
          <EntityFields entity={entity} values={values} errors={errors} disabled={isDemo}
            onChange={(name, value) => { setValues((current) => ({ ...current, [name]: value })); setIsDirty(true); }} />
          <div className="adm-actions" style={{ marginTop: 16 }}>
            <button type="submit" className="adm-btn" disabled={isSaving || isDemo} aria-busy={isSaving}>{isSaving ? 'Đang lưu…' : id === null ? 'Thêm mới' : 'Lưu thay đổi'}</button>
            <Link className="adm-btn ghost" href={`/admin/${config.slug}`}>Về danh sách</Link>
            {isDirty ? <span className="adm-sm adm-muted">Có thay đổi chưa lưu</span> : null}
          </div>
        </form>
        {props.preview ? (
          <section className="adm-card">
            <h2>Xem như người học</h2>
            <p className="adm-sm adm-muted" style={{ marginBottom: 10 }}>Khay chi tiết đúng như trong app học, theo dữ liệu <b>đã lưu</b> (lưu xong trang tự cập nhật).</p>
            <div className="adm-preview-phone">{props.preview}</div>
          </section>
        ) : null}
      </div>
      {id !== null ? (
        <div>
          <StatusCard {...props} id={id} />
          <ImagePanel entity={entity} id={id} image={props.image} canUseImages={props.canUseImages} isDemo={isDemo} fallbackAlt={values.meaning ?? values.usage ?? ''} />
          <section className="adm-card">
            <h2>Xoá</h2>
            <p className="adm-sm adm-muted" style={{ marginBottom: 10 }}>
              {props.learnerMemoryCount > 0
                ? `${props.learnerMemoryCount} thẻ nhớ của người học đang dùng mục này → không xoá / ẩn được, chỉ sửa.`
                : 'Chưa người học nào có thẻ nhớ của mục này.'}
            </p>
            <button type="button" className="adm-btn danger" onClick={remove} disabled={isDemo || props.learnerMemoryCount > 0}>Xoá {config.singular} này</button>
          </section>
        </div>
      ) : (
        <div className="adm-card adm-sm adm-muted">
          Mục mới {props.canUseStatus ? <>bắt đầu ở trạng thái <b>Nháp</b> (người học chưa thấy) — xuất bản sau khi kiểm tra.</> : 'hiện ngay cho người học (chưa có bảng trạng thái).'} Ảnh minh hoạ thêm được sau khi lưu.
        </div>
      )}
    </div>
  );
}

function StatusCard({ entity, id, status, statusNote, learnerMemoryCount, canUseStatus, isDemo }: ContentEditorProps & { id: number }) {
  const router = useRouter();
  const { toast } = useAdminUi();
  const [next, setNext] = useState<ContentStatus>(status);
  const [note, setNote] = useState(statusNote);
  const [isSaving, setIsSaving] = useState(false);
  const isBlocked = HIDDEN_FROM_LEARNERS.includes(next) && learnerMemoryCount > 0;

  async function save() {
    setIsSaving(true);
    const result = await adminFetch(`/api/admin/content/${entity}/${id}/status`, { method: 'PUT', body: JSON.stringify({ status: next, note }) });
    setIsSaving(false);
    if (!result.ok) { toast(result.error, 'error'); return; }
    toast(`Đã chuyển sang "${STATUS_LABELS[next]}".`);
    router.refresh();
  }

  return (
    <section className="adm-card">
      <h2>Trạng thái</h2>
      {!canUseStatus ? <p className="adm-sm adm-muted">Cần áp dụng migration admin để dùng trạng thái. Hiện mọi mục đều đang hiện cho người học.</p> : (
        <>
          <div className="adm-actions">
            <select className="adm-select" style={{ width: 'auto' }} value={next} onChange={(event) => setNext(event.target.value as ContentStatus)} disabled={isDemo} aria-label="Trạng thái">
              {CONTENT_STATUSES.map((value) => <option key={value} value={value}>{STATUS_LABELS[value]}</option>)}
            </select>
            <button type="button" className="adm-btn sm" onClick={save} disabled={isSaving || isDemo || next === status && note === statusNote || isBlocked}>Lưu trạng thái</button>
          </div>
          <input className="adm-input" style={{ marginTop: 8 }} placeholder="Ghi chú (tuỳ chọn)" value={note} maxLength={500} onChange={(event) => setNote(event.target.value)} disabled={isDemo} />
          <p className="adm-sm adm-muted" style={{ marginTop: 8 }}>
            Nháp / Chờ duyệt / Lưu trữ: người học <b>không thấy</b>. Đã xuất bản: hiện trong app học.
            {isBlocked ? <><br /><b style={{ color: '#B0213A' }}>Không thể ẩn: {learnerMemoryCount} thẻ nhớ của người học đang dùng mục này.</b></> : null}
          </p>
        </>
      )}
    </section>
  );
}
