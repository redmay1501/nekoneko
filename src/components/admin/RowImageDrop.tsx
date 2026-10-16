'use client';

import { useRouter } from 'next/navigation';
import { createContext, type DragEvent, type ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { AdminEntity } from '@/features/admin/content-entities';
import { processQueueItem, type QueueItem } from '@/features/admin/image-queue';
import { ALLOWED_IMAGE_TYPES } from '@/features/admin/media-validation';
import { adminFetch, useAdminUi } from './AdminUi';
import { precheckImage, uploadFiles } from './ImagePanel';

/**
 * Kéo thả ảnh thẳng vào TỪNG DÒNG của danh sách (không mở form):
 *  - bọc bảng bằng <RowImageDropProvider>; mỗi <tr> có data-drop-row="<id>" data-drop-title="<tên>";
 *  - thả ảnh lên dòng nào → tải lên thư viện → gắn cho dòng đó (thay ảnh cũ nếu có, ảnh cũ vẫn trong thư viện);
 *  - cột ảnh dùng <RowImageCell>: thumbnail / ô trống, bấm để chọn file, hiện tiến trình và nút thử lại.
 * Lỗi giữa chừng: đã tải lên thì lần thử lại chỉ gắn (processQueueItem), không tải lên lại.
 */
type RowState = { status: QueueItem['status']; error: string | null; previewUrl: string | null };
interface DropContext {
  rows: Record<number, RowState>;
  attach: (id: number, title: string, file: File) => void;
  retry: (id: number) => void;
}
const RowImageContext = createContext<DropContext | null>(null);

export function RowImageDropProvider({ entity, children }: { entity: AdminEntity; children: ReactNode }) {
  const router = useRouter();
  const { toast } = useAdminUi();
  const [rows, setRows] = useState<Record<number, RowState>>({});
  const jobs = useRef(new Map<number, { item: QueueItem; file: File; title: string }>());
  const hoverRef = useRef<HTMLElement | null>(null);

  const run = useCallback(async (id: number) => {
    const job = jobs.current.get(id);
    if (!job) return;
    const update = (item: QueueItem) => {
      job.item = item;
      setRows((current) => ({ ...current, [id]: { ...current[id], status: item.status, error: item.error } }));
    };
    const result = await processQueueItem(job.item, {
      upload: async () => {
        const uploaded = await uploadFiles([job.file], job.title);
        if (!uploaded.ok) return { error: uploaded.error };
        const first = uploaded.data.results[0];
        return first?.ok ? { assetId: first.asset.id } : { error: first?.error ?? 'Tải ảnh không thành công.' };
      },
      link: async (ids, assetId) => {
        const linked = await adminFetch(`/api/admin/content/${entity}/images`, { method: 'POST', body: JSON.stringify({ ids, assetId, altText: '' }) });
        return linked.ok ? { ok: true } : { error: linked.error };
      },
    }, update);
    update(result);
    if (result.status === 'done') {
      toast(`Đã gắn ảnh cho “${job.title}”.`);
      jobs.current.delete(id);
      router.refresh();
    } else {
      toast(`“${job.title}”: ${result.error}`, 'error');
    }
  }, [entity, router, toast]);

  const attach = useCallback((id: number, title: string, file: File) => {
    const problem = precheckImage(file);
    if (problem) { toast(problem, 'error'); return; }
    if (rows[id]?.status === 'uploading' || rows[id]?.status === 'linking') return;
    const previous = rows[id]?.previewUrl;
    if (previous) URL.revokeObjectURL(previous);
    jobs.current.set(id, { file, title, item: { key: String(id), fileName: file.name, problem: null, targets: [id], status: 'ready', assetId: null, error: null } });
    setRows((current) => ({ ...current, [id]: { status: 'ready', error: null, previewUrl: URL.createObjectURL(file) } }));
    void run(id);
  }, [rows, run, toast]);

  const retry = useCallback((id: number) => { void run(id); }, [run]);

  // Thả ảnh lệch ra ngoài dòng không làm trình duyệt mở ảnh sang trang khác.
  useEffect(() => {
    const block = (event: globalThis.DragEvent) => { if (event.dataTransfer?.types.includes('Files')) event.preventDefault(); };
    window.addEventListener('dragover', block);
    window.addEventListener('drop', block);
    return () => { window.removeEventListener('dragover', block); window.removeEventListener('drop', block); };
  }, []);

  function rowOf(event: DragEvent): HTMLElement | null {
    return (event.target as HTMLElement).closest<HTMLElement>('[data-drop-row]');
  }
  function highlight(row: HTMLElement | null) {
    if (hoverRef.current === row) return;
    hoverRef.current?.classList.remove('is-drop-target');
    row?.classList.add('is-drop-target');
    hoverRef.current = row;
  }

  return (
    <RowImageContext.Provider value={{ rows, attach, retry }}>
      <div
        onDragOver={(event) => {
          if (!event.dataTransfer.types.includes('Files')) return;
          const row = rowOf(event);
          if (row) { event.preventDefault(); event.dataTransfer.dropEffect = 'copy'; }
          highlight(row);
        }}
        onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) highlight(null); }}
        onDrop={(event) => {
          const row = rowOf(event);
          highlight(null);
          if (!row) return;
          event.preventDefault();
          const files = [...event.dataTransfer.files];
          if (!files.length) return;
          if (files.length > 1) toast(`Mỗi dòng một ảnh — đã lấy “${files[0].name}”. Thả nhiều ảnh một lúc ở trang Quản lý ảnh.`, 'info');
          attach(Number(row.dataset.dropRow), row.dataset.dropTitle ?? `#${row.dataset.dropRow}`, files[0]);
        }}>
        {children}
      </div>
    </RowImageContext.Provider>
  );
}

/** Ô ảnh của một dòng: thumbnail / ô trống "thả ảnh"; bấm để chọn file; tiến trình + thử lại. */
export function RowImageCell({ id, title, imageUrl, imageAlt }: { id: number; title: string; imageUrl: string | null; imageAlt: string }) {
  const context = useContext(RowImageContext);
  const inputRef = useRef<HTMLInputElement>(null);
  if (!context) return null;
  const state = context.rows[id];
  const isBusy = state?.status === 'uploading' || state?.status === 'linking';
  const showPreview = state && state.status !== 'done' && state.previewUrl;
  const src = showPreview ? state.previewUrl : imageUrl;
  return (
    <div className="adm-row-image">
      <button type="button" className={`adm-row-image-box ${src ? '' : 'is-empty'} ${isBusy ? 'is-busy' : ''} ${state?.status === 'error' ? 'is-error' : ''}`}
        onClick={(event) => { event.stopPropagation(); inputRef.current?.click(); }} disabled={isBusy}
        title={src ? 'Thả ảnh mới vào dòng này, hoặc bấm để chọn file — thay ảnh hiện tại' : 'Thả ảnh vào dòng này, hoặc bấm để chọn file'}
        aria-label={`${src ? 'Thay' : 'Thêm'} ảnh cho ${title}`}>
        {/* eslint-disable-next-line @next/next/no-img-element -- thumbnail từ Supabase Storage / ảnh xem trước trong máy */}
        {src ? <img src={src} alt={showPreview ? `Ảnh đang tải cho ${title}` : imageAlt} loading="lazy" /> : <span aria-hidden="true">＋</span>}
        {isBusy ? <span className="adm-row-image-spin" aria-hidden="true" /> : null}
      </button>
      <span className="adm-row-image-status" role="status">
        {state?.status === 'uploading' ? 'Đang tải…' : state?.status === 'linking' ? 'Đang gắn…' : null}
        {state?.status === 'error' ? <button type="button" className="adm-btn danger sm" onClick={(event) => { event.stopPropagation(); context.retry(id); }} title={state.error ?? ''}>Thử lại</button> : null}
      </span>
      <input ref={inputRef} type="file" hidden accept={ALLOWED_IMAGE_TYPES.join(',')} onClick={(event) => event.stopPropagation()}
        onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ''; if (file) context.attach(id, title, file); }} />
    </div>
  );
}
