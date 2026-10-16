'use client';

import { useRouter } from 'next/navigation';
import { type ClipboardEvent, type DragEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { type AdminEntity, ENTITY_CONFIG, foldSearch } from '@/features/admin/content-entities';
import { duplicateTargets, type MatchSuggestion, suggestMatch } from '@/features/admin/image-matching';
import { canConfirm, processQueueItem, type QueueItem } from '@/features/admin/image-queue';
import { ALLOWED_IMAGE_TYPES } from '@/features/admin/media-validation';
import { AdminModal } from './AdminModal';
import { adminFetch, useAdminUi } from './AdminUi';
import { MediaPicker, precheckImage, uploadFiles } from './ImagePanel';

export interface BulkImageItem {
  id: number;
  title: string;
  subtitle: string;
  keys: string[];
  imageUrl: string | null;
  imageAlt: string;
}

type Filter = 'missing' | 'with' | 'all';
interface LocalQueueItem extends QueueItem {
  file: File;
  previewUrl: string;
  suggestion: MatchSuggestion;
}

/**
 * Quản lý ảnh hàng loạt cho một loại nội dung:
 *  - lọc thiếu ảnh / có ảnh, tìm kiếm, chọn nhiều dòng;
 *  - với các dòng đã chọn: tải một ảnh / chọn ảnh thư viện để gắn cho TẤT CẢ (xác nhận danh sách), hoặc gỡ ảnh;
 *  - kéo thả / dán (Ctrl+V, ⌘V) nhiều ảnh vào hàng đợi: xem trước, gợi ý ghép theo tên file, sửa ghép, bỏ file,
 *    báo trùng; xác nhận từng ảnh hoặc cả nhóm; lỗi một phần thì chỉ thử lại phần lỗi.
 * Mọi quyền và kiểm tra file nằm ở server (/api/admin/media, /api/admin/content/:loại/images).
 */
export function BulkImageManager({ entity, items, isDemo }: { entity: AdminEntity; items: BulkImageItem[]; isDemo: boolean }) {
  const config = ENTITY_CONFIG[entity];
  const router = useRouter();
  const { toast, confirm } = useAdminUi();
  const [filter, setFilter] = useState<Filter>('missing');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [queue, setQueue] = useState<LocalQueueItem[]>([]);
  const [isOver, setIsOver] = useState(false);
  const [isWorking, setIsWorking] = useState(false);
  const [isPicking, setIsPicking] = useState(false);
  const [pending, setPending] = useState<{ url: string; label: string; assetId: string | null; file: File | null } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedFileRef = useRef<HTMLInputElement>(null);
  const queueRef = useRef(queue);
  queueRef.current = queue;

  const byId = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);
  const visible = useMemo(() => {
    const folded = foldSearch(query);
    return items.filter((item) => (filter === 'all' || (filter === 'missing' ? !item.imageUrl : Boolean(item.imageUrl)))
      && (!folded || String(item.id) === folded || item.keys.some((key) => foldSearch(key).includes(folded))));
  }, [items, filter, query]);
  const missingCount = items.filter((item) => !item.imageUrl).length;
  const candidates = useMemo(() => items.map((item) => ({ id: item.id, keys: item.keys })), [items]);
  const duplicates = useMemo(() => duplicateTargets(queue.filter((item) => item.status !== 'done').map((item) => ({ key: item.key, targets: item.targets }))), [queue]);
  const duplicateKeys = useMemo(() => new Set([...duplicates.values()].flat()), [duplicates]);
  const selectedIds = [...selected];

  // Dọn ảnh xem trước khi rời trang.
  useEffect(() => () => { for (const item of queueRef.current) URL.revokeObjectURL(item.previewUrl); }, []);

  const addFiles = useCallback((files: File[], targetIds?: number[]) => {
    const images = files.filter((file) => file.type.startsWith('image/') || file.name);
    if (!images.length) return;
    setQueue((current) => [...current, ...images.map((file, index): LocalQueueItem => {
      const suggestion = targetIds ? { kind: 'none' as const } : suggestMatch(file.name, candidates);
      const suggested = suggestion.kind === 'id' || suggestion.kind === 'exact' ? [suggestion.id] : [];
      return {
        key: `${Date.now()}-${index}-${file.name}`, file, fileName: file.name || 'ảnh dán', previewUrl: URL.createObjectURL(file), suggestion,
        problem: precheckImage(file), targets: targetIds ?? suggested, status: 'ready', assetId: null, error: null,
      };
    })]);
  }, [candidates]);

  function onDrop(event: DragEvent) {
    event.preventDefault();
    setIsOver(false);
    addFiles([...event.dataTransfer.files]);
  }

  /** Dán ảnh: chỉ nhận dữ liệu ảnh thật trong clipboard; một dòng đang chọn → ghép sẵn cho dòng đó. */
  function onPaste(event: ClipboardEvent) {
    if ((event.target as HTMLElement).closest('input, textarea')) return; // dán chữ vào ô tìm kiếm như bình thường
    const files = [...event.clipboardData.items].filter((entry) => entry.kind === 'file' && entry.type.startsWith('image/'))
      .map((entry) => entry.getAsFile()).filter((file): file is File => Boolean(file))
      .map((file) => new File([file], file.name && file.name !== 'image.png' ? file.name : `anh-dan-${new Date().toISOString().slice(11, 19).replace(/:/g, '')}.${file.type.split('/')[1] ?? 'png'}`, { type: file.type }));
    if (!files.length) {
      toast('Clipboard không có ảnh. Hãy sao chép một ảnh (không phải đường dẫn) hoặc kéo thả / chọn file.', 'error');
      return;
    }
    event.preventDefault();
    if (selected.size === 1) {
      addFiles(files, selectedIds);
      toast(`Đã thêm ảnh dán vào hàng đợi, ghép sẵn cho “${byId.get(selectedIds[0])?.title}”. Xem trước rồi bấm Xác nhận.`, 'info');
    } else {
      addFiles(files, []);
      toast(selected.size > 1 ? `Đang chọn ${selected.size} mục — hãy chọn rõ mục cho ảnh dán trong hàng đợi (hoặc bấm “Gắn cho ${selected.size} mục đã chọn”).` : 'Đã thêm ảnh dán vào hàng đợi — chọn mục để gắn.', 'info');
    }
  }

  function updateItem(key: string, patch: Partial<LocalQueueItem>) {
    setQueue((current) => current.map((item) => (item.key === key ? { ...item, ...patch } : item)));
  }
  function removeItem(key: string) {
    setQueue((current) => {
      const target = current.find((item) => item.key === key);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return current.filter((item) => item.key !== key);
    });
  }

  async function runItem(item: LocalQueueItem): Promise<boolean> {
    const result = await processQueueItem(item, {
      upload: async () => {
        const uploaded = await uploadFiles([item.file], byId.get(item.targets[0])?.title ?? '');
        if (!uploaded.ok) return { error: uploaded.error };
        const first = uploaded.data.results[0];
        return first?.ok ? { assetId: first.asset.id } : { error: first?.error ?? 'Tải ảnh không thành công.' };
      },
      link: async (ids, assetId) => {
        const linked = await adminFetch(`/api/admin/content/${entity}/images`, { method: 'POST', body: JSON.stringify({ ids, assetId, altText: '' }) });
        return linked.ok ? { ok: true } : { error: linked.error };
      },
    }, (progress) => updateItem(item.key, progress));
    updateItem(item.key, result);
    return result.status === 'done';
  }

  async function confirmItems(keys: string[]) {
    const list = queue.filter((item) => keys.includes(item.key) && canConfirm(item, duplicateKeys));
    if (!list.length) return;
    const replacing = list.flatMap((item) => item.targets).filter((id) => byId.get(id)?.imageUrl);
    if (replacing.length && !(await confirm({
      title: 'Thay ảnh hiện có?', confirmLabel: 'Thay ảnh',
      body: <>{replacing.length} mục đã có ảnh sẽ được thay: {replacing.slice(0, 8).map((id) => byId.get(id)?.title).join(', ')}{replacing.length > 8 ? '…' : ''}. Ảnh cũ vẫn còn trong thư viện.</>,
    }))) return;
    setIsWorking(true);
    let done = 0;
    for (const item of list) if (await runItem(item)) done += 1;
    setIsWorking(false);
    const failed = list.length - done;
    toast(failed ? `Xong ${done}/${list.length} ảnh — ${failed} ảnh lỗi, bấm “Thử lại ảnh lỗi”.` : `Đã gắn ${done} ảnh.`, failed ? 'error' : 'success');
    router.refresh();
  }

  async function applyToSelected(assetId: string, label: string) {
    const ids = selectedIds;
    setIsWorking(true);
    const result = await adminFetch<{ updated: number }>(`/api/admin/content/${entity}/images`, { method: 'POST', body: JSON.stringify({ ids, assetId, altText: '' }) });
    setIsWorking(false);
    if (!result.ok) { toast(result.error, 'error'); return false; }
    toast(`Đã gắn ${label} cho ${result.data.updated} mục.`);
    router.refresh();
    return true;
  }

  async function confirmPending() {
    if (!pending) return;
    let assetId = pending.assetId;
    if (!assetId && pending.file) {
      setIsWorking(true);
      const uploaded = await uploadFiles([pending.file]);
      setIsWorking(false);
      const first = uploaded.ok ? uploaded.data.results[0] : null;
      if (!first?.ok) { toast(uploaded.ok ? first?.error ?? 'Tải ảnh không thành công.' : uploaded.error, 'error'); return; }
      assetId = first.asset.id;
      setPending((current) => (current ? { ...current, assetId } : current)); // thử lại không tải lên lại
    }
    if (assetId && await applyToSelected(assetId, pending.label)) {
      if (pending.file) URL.revokeObjectURL(pending.url);
      setPending(null);
    }
  }

  async function removeFromSelected() {
    const withImage = selectedIds.filter((id) => byId.get(id)?.imageUrl);
    if (!withImage.length) { toast('Các mục đã chọn chưa có ảnh nào để gỡ.', 'info'); return; }
    const ok = await confirm({
      title: `Gỡ ảnh khỏi ${withImage.length} mục?`, tone: 'danger', confirmLabel: 'Gỡ ảnh',
      body: <>Chỉ gỡ liên kết — ảnh vẫn trong thư viện Media. {withImage.slice(0, 10).map((id) => byId.get(id)?.title).join(', ')}{withImage.length > 10 ? '…' : ''}</>,
    });
    if (!ok) return;
    setIsWorking(true);
    const result = await adminFetch<{ updated: number }>(`/api/admin/content/${entity}/images`, { method: 'POST', body: JSON.stringify({ ids: withImage, assetId: null }) });
    setIsWorking(false);
    if (!result.ok) { toast(result.error, 'error'); return; }
    toast(`Đã gỡ ảnh khỏi ${result.data.updated} mục.`);
    router.refresh();
  }

  function toggle(id: number) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  const readyKeys = queue.filter((item) => canConfirm(item, duplicateKeys) && item.status === 'ready').map((item) => item.key);
  const failedKeys = queue.filter((item) => item.status === 'error' && canConfirm(item, duplicateKeys)).map((item) => item.key);
  const unmatched = queue.filter((item) => item.status !== 'done' && !item.targets.length).length;
  const selectedTitles = selectedIds.slice(0, 12).map((id) => byId.get(id)?.title ?? `#${id}`).join(', ') + (selectedIds.length > 12 ? '…' : '');

  return (
    <div className="adm-bulk" onPaste={onPaste} tabIndex={-1}>
      {isDemo ? <p className="adm-sm adm-muted" style={{ marginBottom: 8 }}>Demo: thử chọn, ghép, xem trước được; lưu sẽ bị server từ chối (cần Supabase).</p> : null}
      {/* Hàng đợi: kéo thả / dán / chọn nhiều file */}
      <section className="adm-card">
        <h2>Thêm ảnh hàng loạt</h2>
        <div className={`adm-drop ${isOver ? 'is-over' : ''}`} role="button" tabIndex={0}
          aria-label="Vùng nhận ảnh: kéo thả, dán Ctrl+V / ⌘V, hoặc bấm để chọn file"
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); fileInputRef.current?.click(); } }}
          onDragOver={(event) => { event.preventDefault(); setIsOver(true); }} onDragLeave={() => setIsOver(false)} onDrop={onDrop}>
          <span style={{ fontSize: 26 }} aria-hidden="true">🖼️</span>
          <b>Kéo thả nhiều ảnh vào đây · bấm để chọn file · hoặc bấm vào vùng này rồi dán (Ctrl+V / ⌘V)</b>
          <span className="adm-sm adm-muted">JPEG, PNG, WebP · tối đa 2 MB · đặt tên file theo chữ / cách đọc / nghĩa / mã (vd. <code>猫.png</code>, <code>ねこ.png</code>, <code>12.png</code>) để được gợi ý ghép</span>
        </div>
        <input ref={fileInputRef} type="file" multiple hidden accept={ALLOWED_IMAGE_TYPES.join(',')} onChange={(event) => { addFiles([...(event.target.files ?? [])]); event.target.value = ''; }} />

        {queue.length ? (
          <>
            <div className="adm-actions" style={{ margin: '12px 0' }}>
              <button type="button" className="adm-btn" disabled={isWorking || !readyKeys.length} onClick={() => confirmItems(readyKeys)}>Xác nhận {readyKeys.length} ảnh đã ghép</button>
              {failedKeys.length ? <button type="button" className="adm-btn ghost" disabled={isWorking} onClick={() => confirmItems(failedKeys)}>Thử lại {failedKeys.length} ảnh lỗi</button> : null}
              <button type="button" className="adm-btn ghost" disabled={isWorking} onClick={() => { for (const item of queue.filter((entry) => entry.status === 'done')) removeItem(item.key); }}>Dọn ảnh đã xong</button>
              {unmatched ? <span className="adm-badge review">{unmatched} ảnh chưa ghép</span> : null}
              {duplicates.size ? <span className="adm-badge red">{duplicates.size} mục bị ghép trùng</span> : null}
            </div>
            <datalist id="adm-bulk-options">
              {items.map((item) => <option key={item.id} value={`#${item.id} ${item.title}`}>{item.subtitle}</option>)}
            </datalist>
            <ul className="adm-queue">
              {queue.map((item) => (
                <QueueRow key={item.key} item={item} byId={byId} isDuplicate={duplicateKeys.has(item.key)} isWorking={isWorking} selectedCount={selected.size}
                  onTargets={(targets) => updateItem(item.key, { targets, status: item.status === 'done' ? 'done' : item.status, error: null })}
                  onUseSelected={() => updateItem(item.key, { targets: selectedIds })}
                  onConfirm={() => confirmItems([item.key])} onRemove={() => removeItem(item.key)} />
              ))}
            </ul>
          </>
        ) : null}
      </section>

      {/* Danh sách nội dung */}
      <section className="adm-card">
        <div className="adm-filters">
          <div className="adm-seg" role="group" aria-label="Lọc theo ảnh">
            {(['missing', 'with', 'all'] as Filter[]).map((value) => (
              <button key={value} type="button" className={filter === value ? 'on' : ''} aria-pressed={filter === value} onClick={() => setFilter(value)}>
                {value === 'missing' ? `Thiếu ảnh (${missingCount})` : value === 'with' ? `Đã có ảnh (${items.length - missingCount})` : `Tất cả (${items.length})`}
              </button>
            ))}
          </div>
          <label className="adm-field"><span>Tìm</span>
            <input className="adm-input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Chữ Nhật, kana, nghĩa, mã" /></label>
          <span className="adm-sm adm-muted">{visible.length} mục</span>
        </div>
        <div className="adm-actions adm-bulk-bar" aria-live="polite">
          <b className="adm-sm">Đã chọn {selected.size}</b>
          <button type="button" className="adm-btn ghost sm" onClick={() => setSelected(new Set([...selected, ...visible.map((item) => item.id)]))} disabled={!visible.length}>Chọn tất cả đang hiện</button>
          <button type="button" className="adm-btn ghost sm" onClick={() => setSelected(new Set())} disabled={!selected.size}>Bỏ chọn</button>
          <span className="adm-bulk-sep" />
          <button type="button" className="adm-btn sm" disabled={!selected.size || isWorking} onClick={() => selectedFileRef.current?.click()}>Tải 1 ảnh cho {selected.size || '…'} mục</button>
          <button type="button" className="adm-btn ghost sm" disabled={!selected.size || isWorking} onClick={() => setIsPicking(true)}>Chọn ảnh thư viện</button>
          <button type="button" className="adm-btn danger sm" disabled={!selected.size || isWorking} onClick={removeFromSelected}>Gỡ ảnh</button>
          <input ref={selectedFileRef} type="file" hidden accept={ALLOWED_IMAGE_TYPES.join(',')} onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = '';
            if (!file) return;
            const problem = precheckImage(file);
            if (problem) { toast(problem, 'error'); return; }
            setPending({ url: URL.createObjectURL(file), label: `“${file.name}”`, assetId: null, file });
          }} />
        </div>
        {visible.length ? (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead><tr><th><span className="sr-only">Chọn</span></th><th>Ảnh</th><th>{config.label}</th><th>Nghĩa / chi tiết</th><th>Trạng thái</th></tr></thead>
              <tbody>
                {visible.map((item) => (
                  <tr key={item.id} className={selected.has(item.id) ? 'is-selected' : ''} onClick={(event) => { if (!(event.target as HTMLElement).closest('a, button, input')) toggle(item.id); }}>
                    <td><input type="checkbox" checked={selected.has(item.id)} onChange={() => toggle(item.id)} aria-label={`Chọn ${item.title}`} /></td>
                    {/* eslint-disable-next-line @next/next/no-img-element -- ảnh thu nhỏ từ Supabase Storage */}
                    <td>{item.imageUrl ? <img className="adm-thumb" src={item.imageUrl} alt={item.imageAlt} loading="lazy" /> : <span className="adm-thumb adm-thumb-empty" aria-hidden="true" />}</td>
                    <td><a className="adm-row-link adm-face" href={`/admin/${config.slug}/${item.id}`}>{item.title}</a> <span className="adm-sm adm-muted">#{item.id}</span></td>
                    <td className="adm-sm" style={{ maxWidth: 360 }}>{item.subtitle}</td>
                    <td>{item.imageUrl ? <span className="adm-badge published">Có ảnh</span> : <span className="adm-badge review">Thiếu ảnh</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <div className="adm-empty"><b>Không có mục nào khớp</b></div>}
      </section>

      {isPicking ? (
        <MediaPicker onClose={() => setIsPicking(false)} onPick={(asset) => { setIsPicking(false); setPending({ url: asset.url, label: `ảnh “${asset.original_name || 'thư viện'}”`, assetId: asset.id, file: null }); }} />
      ) : null}
      {pending ? (
        <AdminModal title={`Gắn ảnh cho ${selected.size} mục?`} isBusy={isWorking} onClose={() => { if (pending.file) URL.revokeObjectURL(pending.url); setPending(null); }}
          footer={<>
            <button type="button" className="adm-btn ghost" disabled={isWorking} onClick={() => { if (pending.file) URL.revokeObjectURL(pending.url); setPending(null); }}>Huỷ</button>
            <button type="button" className="adm-btn" disabled={isWorking} aria-busy={isWorking} onClick={confirmPending} data-autofocus>{isWorking ? 'Đang gắn…' : `Gắn cho ${selected.size} mục`}</button>
          </>}>
          <div className="adm-image-preview">
            {/* eslint-disable-next-line @next/next/no-img-element -- xem trước ảnh sắp gắn */}
            <img src={pending.url} alt="Ảnh sắp gắn" />
            <div className="adm-sm">
              <p>Một ảnh dùng chung cho các mục: <b className="adm-jp">{selectedTitles}</b></p>
              {selectedIds.some((id) => byId.get(id)?.imageUrl) ? <p className="adm-muted" style={{ marginTop: 6 }}>Mục đã có ảnh sẽ được thay (ảnh cũ vẫn trong thư viện).</p> : null}
            </div>
          </div>
        </AdminModal>
      ) : null}
    </div>
  );
}

function describeSuggestion(suggestion: MatchSuggestion, byId: Map<number, BulkImageItem>): string {
  switch (suggestion.kind) {
    case 'id': return `Gợi ý theo mã: #${suggestion.id}`;
    case 'exact': return `Gợi ý theo tên: ${byId.get(suggestion.id)?.title}`;
    case 'ambiguous': return `Tên trùng ${suggestion.ids.length} mục — chọn một: ${suggestion.ids.map((id) => `#${id}`).join(', ')}`;
    default: return 'Chưa ghép được theo tên file — chọn mục';
  }
}

function QueueRow({ item, byId, isDuplicate, isWorking, selectedCount, onTargets, onUseSelected, onConfirm, onRemove }: {
  item: LocalQueueItem; byId: Map<number, BulkImageItem>; isDuplicate: boolean; isWorking: boolean; selectedCount: number;
  onTargets: (targets: number[]) => void; onUseSelected: () => void; onConfirm: () => void; onRemove: () => void;
}) {
  const [text, setText] = useState('');
  const isDone = item.status === 'done';
  const isBusy = item.status === 'uploading' || item.status === 'linking';
  const statusLabel = { ready: 'Chờ xác nhận', uploading: 'Đang tải lên…', linking: 'Đang gắn…', done: '✓ Đã gắn', error: 'Lỗi' }[item.status];
  function pick(value: string) {
    setText(value);
    const id = Number(/^#?(\d+)/.exec(value.trim())?.[1]);
    if (byId.has(id)) { onTargets([id]); setText(''); }
  }
  return (
    <li className={`adm-queue-item ${item.status} ${isDuplicate ? 'is-duplicate' : ''}`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- xem trước file trong máy, chưa tải lên */}
      <img src={item.previewUrl} alt={`Xem trước ${item.fileName}`} />
      <div className="adm-queue-main">
        <div className="adm-sm"><b style={{ wordBreak: 'break-all' }}>{item.fileName}</b> <span className={`adm-badge ${item.status === 'done' ? 'published' : item.status === 'error' ? 'red' : 'draft'}`}>{statusLabel}</span></div>
        {item.problem ? <p className="adm-sm adm-err">{item.problem}</p> : null}
        {item.error ? <p className="adm-sm adm-err">{item.error}</p> : null}
        <p className="adm-sm adm-muted">{item.suggestion.kind === 'none' && item.targets.length ? 'Đã chọn mục (dán khi đang chọn dòng / tự chọn)' : describeSuggestion(item.suggestion, byId)}</p>
        <div className="adm-sm">
          Gắn cho: {item.targets.length ? item.targets.map((id) => (
            <span key={id} className="adm-badge pink" style={{ marginRight: 4 }}>
              <span className="adm-jp">{byId.get(id)?.title}</span>&nbsp;#{id}{byId.get(id)?.imageUrl ? ' · thay ảnh' : ''}
              {!isDone && !isBusy ? <button type="button" aria-label={`Bỏ ${byId.get(id)?.title}`} onClick={() => onTargets(item.targets.filter((target) => target !== id))} style={{ marginLeft: 4 }}>×</button> : null}
            </span>
          )) : <b style={{ color: '#9A6408' }}>chưa chọn mục</b>}
          {isDuplicate ? <b className="adm-err"> · trùng với ảnh khác trong hàng đợi</b> : null}
        </div>
        {item.suggestion.kind === 'ambiguous' && !item.targets.length ? (
          <div className="adm-actions" style={{ marginTop: 4 }}>
            {item.suggestion.ids.map((id) => <button key={id} type="button" className="adm-btn ghost sm" onClick={() => onTargets([id])}>{byId.get(id)?.title} — {byId.get(id)?.subtitle.slice(0, 30)}</button>)}
          </div>
        ) : null}
        {!isDone && !isBusy ? (
          <div className="adm-actions" style={{ marginTop: 6 }}>
            <input className="adm-input" style={{ maxWidth: 260 }} list="adm-bulk-options" placeholder="Đổi mục: gõ chữ / mã rồi chọn" value={text}
              onChange={(event) => pick(event.target.value)} aria-label={`Chọn mục cho ${item.fileName}`} />
            {selectedCount ? <button type="button" className="adm-btn ghost sm" onClick={onUseSelected}>Gắn cho {selectedCount} mục đã chọn</button> : null}
          </div>
        ) : null}
      </div>
      <div className="adm-queue-actions">
        {!isDone ? <button type="button" className="adm-btn sm" disabled={isWorking || isBusy || Boolean(item.problem) || !item.targets.length || isDuplicate} onClick={onConfirm}>{item.status === 'error' ? 'Thử lại' : 'Xác nhận'}</button> : null}
        <button type="button" className="adm-btn ghost sm" disabled={isBusy} onClick={onRemove}>{isDone ? 'Ẩn' : 'Bỏ file'}</button>
      </div>
    </li>
  );
}
