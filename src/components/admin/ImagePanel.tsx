'use client';

import { useRouter } from 'next/navigation';
import { type DragEvent, useEffect, useRef, useState } from 'react';
import type { AdminEntity } from '@/features/admin/content-entities';
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES } from '@/features/admin/media-validation';
import { adminFetch, useAdminUi } from './AdminUi';

export interface PanelImage {
  assetId: string;
  url: string;
  alt: string;
  assetAlt: string;
}

interface LibraryAsset {
  id: string;
  url: string;
  original_name: string;
  alt_text: string;
  mime_type: string;
  size_bytes: number;
  usage: Array<{ entity: string; contentId: number; title: string }>;
}

type UploadResponse = { results: Array<{ name: string; ok: true; asset: LibraryAsset } | { name: string; ok: false; error: string }> };

/** Kiểm tra sơ bộ ở trình duyệt để báo lỗi sớm — server vẫn kiểm tra lại bằng chữ ký file. */
export function precheckImage(file: File): string | null {
  if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type)) return `"${file.name}" không phải JPEG, PNG hoặc WebP.`;
  if (file.size > MAX_IMAGE_BYTES) return `"${file.name}" nặng hơn 2 MB.`;
  return null;
}

export async function uploadFiles(files: File[], altText = ''): Promise<{ ok: true; data: UploadResponse } | { ok: false; error: string }> {
  const form = new FormData();
  for (const file of files) form.append('files', file);
  form.append('altText', altText);
  return adminFetch<UploadResponse>('/api/admin/media', { method: 'POST', body: form });
}

/** "Hình ảnh minh họa" trong form nội dung: tải lên / kéo thả / xem trước / thay / gỡ / mô tả / chọn từ thư viện. */
export function ImagePanel({ entity, id, image, canUseImages, isDemo, fallbackAlt }: {
  entity: AdminEntity; id: number; image: PanelImage | null; canUseImages: boolean; isDemo: boolean; fallbackAlt: string;
}) {
  const router = useRouter();
  const { toast, confirm } = useAdminUi();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOver, setIsOver] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [alt, setAlt] = useState(image?.alt ?? '');
  const [isPicking, setIsPicking] = useState(false);
  useEffect(() => setAlt(image?.alt ?? ''), [image?.assetId, image?.alt]);

  async function attach(assetId: string, altText: string, message: string) {
    const result = await adminFetch(`/api/admin/content/${entity}/${id}/image`, { method: 'PUT', body: JSON.stringify({ assetId, altText }) });
    if (!result.ok) { toast(result.error, 'error'); return false; }
    toast(message);
    router.refresh();
    return true;
  }

  async function handleFiles(list: FileList | File[] | null) {
    const file = list ? Array.from(list)[0] : undefined;
    if (!file) return;
    const problem = precheckImage(file);
    if (problem) { toast(problem, 'error'); return; }
    setIsBusy(true);
    const altText = alt.trim() || fallbackAlt;
    const uploaded = await uploadFiles([file], altText);
    if (!uploaded.ok) { setIsBusy(false); toast(uploaded.error, 'error'); return; }
    const first = uploaded.data.results[0];
    if (!first?.ok) { setIsBusy(false); toast(first?.error ?? 'Tải ảnh không thành công.', 'error'); return; }
    await attach(first.asset.id, altText, image ? 'Đã thay ảnh.' : 'Đã thêm ảnh.');
    setIsBusy(false);
  }

  async function removeImage() {
    const ok = await confirm({ title: 'Gỡ ảnh khỏi mục này?', body: 'Người học sẽ không thấy ảnh nữa. Ảnh vẫn còn trong thư viện Media.', confirmLabel: 'Gỡ ảnh', tone: 'danger' });
    if (!ok) return;
    setIsBusy(true);
    const result = await adminFetch(`/api/admin/content/${entity}/${id}/image`, { method: 'DELETE', body: '{}' });
    setIsBusy(false);
    if (!result.ok) { toast(result.error, 'error'); return; }
    toast('Đã gỡ ảnh.');
    router.refresh();
  }

  function onDrop(event: DragEvent) {
    event.preventDefault();
    setIsOver(false);
    if (!isBusy && !isDemo) void handleFiles(event.dataTransfer.files);
  }

  if (!canUseImages) {
    return <section className="adm-card"><h2>Hình ảnh minh họa</h2><p className="adm-sm adm-muted">{isDemo ? 'Cần Supabase để tải ảnh.' : 'Cần áp dụng migration admin (bảng media_assets, content_images) để dùng ảnh.'}</p></section>;
  }
  const disabled = isBusy || isDemo;
  return (
    <section className="adm-card" aria-busy={isBusy}>
      <h2>Hình ảnh minh họa</h2>
      {image ? (
        <div className="adm-image-preview">
          {/* eslint-disable-next-line @next/next/no-img-element -- ảnh xem trước từ Supabase Storage */}
          <img src={image.url} alt={image.alt || image.assetAlt || fallbackAlt} />
          <div style={{ flex: 1, minWidth: 180 }}>
            <label className="adm-field"><span>Mô tả ảnh (alt)</span>
              <input className="adm-input" value={alt} maxLength={300} placeholder={fallbackAlt || 'Mô tả ngắn cho trình đọc màn hình'} onChange={(event) => setAlt(event.target.value)} disabled={disabled} />
              <small>Trống = dùng nghĩa của mục.</small>
            </label>
            <div className="adm-actions" style={{ marginTop: 8 }}>
              <button type="button" className="adm-btn sm" disabled={disabled || alt === image.alt} onClick={() => attach(image.assetId, alt, 'Đã lưu mô tả ảnh.')}>Lưu mô tả</button>
              <button type="button" className="adm-btn ghost sm" disabled={disabled} onClick={() => inputRef.current?.click()}>Thay ảnh</button>
              <button type="button" className="adm-btn ghost sm" disabled={disabled} onClick={() => setIsPicking(true)}>Chọn từ thư viện</button>
              <button type="button" className="adm-btn danger sm" disabled={disabled} onClick={removeImage}>Gỡ ảnh</button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className={`adm-drop ${isOver ? 'is-over' : ''}`} role="button" tabIndex={0} aria-disabled={disabled}
            onClick={() => !disabled && inputRef.current?.click()}
            onKeyDown={(event) => { if ((event.key === 'Enter' || event.key === ' ') && !disabled) { event.preventDefault(); inputRef.current?.click(); } }}
            onDragOver={(event) => { event.preventDefault(); setIsOver(true); }} onDragLeave={() => setIsOver(false)} onDrop={onDrop}>
            <span style={{ fontSize: 26 }} aria-hidden="true">🖼️</span>
            <b>{isBusy ? 'Đang tải ảnh…' : 'Kéo thả ảnh vào đây hoặc bấm để chọn'}</b>
            <span className="adm-sm adm-muted">JPEG, PNG, WebP · tối đa 2 MB</span>
          </div>
          <label className="adm-field" style={{ marginTop: 10 }}><span>Mô tả ảnh (alt)</span>
            <input className="adm-input" value={alt} maxLength={300} placeholder={fallbackAlt || 'Mô tả ngắn'} onChange={(event) => setAlt(event.target.value)} disabled={disabled} />
          </label>
          <div className="adm-actions" style={{ marginTop: 8 }}>
            <button type="button" className="adm-btn ghost sm" disabled={disabled} onClick={() => setIsPicking(true)}>Chọn từ thư viện</button>
          </div>
        </>
      )}
      <input ref={inputRef} type="file" accept={ALLOWED_IMAGE_TYPES.join(',')} hidden onChange={(event) => { void handleFiles(event.target.files); event.target.value = ''; }} />
      {isPicking ? (
        <MediaPicker onClose={() => setIsPicking(false)} onPick={async (asset) => {
          setIsPicking(false);
          setIsBusy(true);
          await attach(asset.id, alt.trim() || asset.alt_text || fallbackAlt, image ? 'Đã thay ảnh.' : 'Đã gắn ảnh từ thư viện.');
          setIsBusy(false);
        }} />
      ) : null}
    </section>
  );
}

/** Hộp chọn ảnh có sẵn trong thư viện. */
export function MediaPicker({ onClose, onPick }: { onClose: () => void; onPick: (asset: LibraryAsset) => void }) {
  const [query, setQuery] = useState('');
  const [assets, setAssets] = useState<LibraryAsset[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<LibraryAsset | null>(null);

  useEffect(() => {
    let isCurrent = true;
    const timer = window.setTimeout(async () => {
      const result = await adminFetch<{ assets: LibraryAsset[] }>(`/api/admin/media?q=${encodeURIComponent(query)}`);
      if (!isCurrent) return;
      if (result.ok) { setAssets(result.data.assets); setError(null); } else setError(result.error);
    }, 250);
    return () => { isCurrent = false; window.clearTimeout(timer); };
  }, [query]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="adm-overlay" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="adm-dialog wide" role="dialog" aria-modal="true" aria-labelledby="adm-picker-title">
        <h2 id="adm-picker-title">Chọn ảnh từ thư viện</h2>
        <input className="adm-input" placeholder="Tìm theo tên file, mô tả, mục đang dùng…" value={query} onChange={(event) => setQuery(event.target.value)} autoFocus />
        <div style={{ marginTop: 12, maxHeight: '55vh', overflow: 'auto' }}>
          {error ? <div className="adm-notice error">{error}</div>
            : assets === null ? <div className="adm-media-grid">{Array.from({ length: 6 }, (_, index) => <div key={index} className="adm-skel" style={{ height: 160 }} />)}</div>
            : assets.length === 0 ? <div className="adm-empty"><b>Chưa có ảnh nào khớp</b><span>Tải ảnh lên ở trang Media hoặc kéo thả ngay trong form.</span></div>
            : (
              <div className="adm-media-grid">
                {assets.map((asset) => (
                  <button key={asset.id} type="button" className={`adm-media-item ${selected?.id === asset.id ? 'is-selected' : ''}`} onClick={() => setSelected(asset)} aria-pressed={selected?.id === asset.id}>
                    {/* eslint-disable-next-line @next/next/no-img-element -- ảnh thu nhỏ từ Supabase Storage */}
                    <img src={asset.url} alt={asset.alt_text} loading="lazy" />
                    <span className="adm-sm">{asset.original_name || 'ảnh'}</span>
                    <span className="adm-sm adm-muted">{asset.usage.length ? `Đang dùng: ${asset.usage.length}` : 'Chưa dùng'}</span>
                  </button>
                ))}
              </div>
            )}
        </div>
        <div className="adm-dialog-actions">
          <button type="button" className="adm-btn ghost" onClick={onClose}>Huỷ</button>
          <button type="button" className="adm-btn" disabled={!selected} onClick={() => selected && onPick(selected)}>Dùng ảnh này</button>
        </div>
      </div>
    </div>
  );
}
