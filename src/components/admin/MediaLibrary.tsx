'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type DragEvent, useMemo, useRef, useState } from 'react';
import { ENTITY_CONFIG, foldSearch, isAdminEntity } from '@/features/admin/content-entities';
import { ALLOWED_IMAGE_TYPES } from '@/features/admin/media-validation';
import { adminFetch, useAdminUi } from './AdminUi';
import { precheckImage, uploadFiles } from './ImagePanel';

interface Asset {
  id: string;
  url: string;
  storage_path: string;
  original_name: string;
  alt_text: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
  usage: Array<{ entity: string; contentId: number; title: string; altText: string }>;
}

const TYPE_LABEL: Record<string, string> = { 'image/jpeg': 'JPEG', 'image/png': 'PNG', 'image/webp': 'WebP' };
const kb = (bytes: number) => `${Math.max(1, Math.round(bytes / 1024))} KB`;

export function MediaLibrary({ initialAssets }: { initialAssets: Asset[] }) {
  const router = useRouter();
  const { toast, confirm } = useAdminUi();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [type, setType] = useState('all');
  const [used, setUsed] = useState('all');
  const [isOver, setIsOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const assets = useMemo(() => initialAssets
    .filter((asset) => !query || foldSearch(`${asset.original_name} ${asset.alt_text} ${asset.usage.map((use) => use.title).join(' ')}`).includes(foldSearch(query)))
    .filter((asset) => type === 'all' || asset.mime_type === type)
    .filter((asset) => used === 'all' || (used === 'used' ? asset.usage.length > 0 : asset.usage.length === 0)), [initialAssets, query, type, used]);
  const open = initialAssets.find((asset) => asset.id === openId) ?? null;

  async function upload(list: FileList | null) {
    const files = list ? Array.from(list) : [];
    if (!files.length) return;
    const rejected = files.map(precheckImage).filter(Boolean) as string[];
    const valid = files.filter((file) => !precheckImage(file));
    rejected.forEach((message) => toast(message, 'error'));
    if (!valid.length) return;
    setIsUploading(true);
    const result = await uploadFiles(valid.slice(0, 10));
    setIsUploading(false);
    if (!result.ok) { toast(result.error, 'error'); return; }
    const okCount = result.data.results.filter((item) => item.ok).length;
    result.data.results.forEach((item) => { if (!item.ok) toast(item.error, 'error'); });
    if (okCount) toast(`Đã tải lên ${okCount} ảnh.`);
    if (valid.length > 10) toast('Mỗi lần tối đa 10 ảnh — các ảnh sau chưa được tải.', 'error');
    router.refresh();
  }

  function onDrop(event: DragEvent) {
    event.preventDefault();
    setIsOver(false);
    if (!isUploading) void upload(event.dataTransfer.files);
  }

  return (
    <>
      <div className={`adm-drop ${isOver ? 'is-over' : ''}`} role="button" tabIndex={0} aria-busy={isUploading}
        onClick={() => !isUploading && inputRef.current?.click()}
        onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); inputRef.current?.click(); } }}
        onDragOver={(event) => { event.preventDefault(); setIsOver(true); }} onDragLeave={() => setIsOver(false)} onDrop={onDrop}>
        <span style={{ fontSize: 26 }} aria-hidden="true">⬆️</span>
        <b>{isUploading ? 'Đang tải ảnh lên…' : 'Kéo thả nhiều ảnh vào đây hoặc bấm để chọn'}</b>
        <span className="adm-sm adm-muted">JPEG, PNG, WebP · mỗi ảnh tối đa 2 MB · tối đa 10 ảnh mỗi lần · tên file được đặt lại tự động</span>
      </div>
      <input ref={inputRef} type="file" multiple accept={ALLOWED_IMAGE_TYPES.join(',')} hidden onChange={(event) => { void upload(event.target.files); event.target.value = ''; }} />

      <div className="adm-filters" style={{ marginTop: 14 }} role="search">
        <label className="adm-field"><span>Tìm</span><input className="adm-input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tên file, mô tả, mục đang dùng" /></label>
        <label className="adm-field"><span>Định dạng</span>
          <select className="adm-select" value={type} onChange={(event) => setType(event.target.value)}>
            <option value="all">Tất cả</option>{ALLOWED_IMAGE_TYPES.map((mime) => <option key={mime} value={mime}>{TYPE_LABEL[mime]}</option>)}
          </select></label>
        <label className="adm-field"><span>Sử dụng</span>
          <select className="adm-select" value={used} onChange={(event) => setUsed(event.target.value)}>
            <option value="all">Tất cả</option><option value="used">Đang dùng</option><option value="unused">Chưa dùng</option>
          </select></label>
        <span className="adm-sm adm-muted">{assets.length} ảnh</span>
      </div>

      {assets.length ? (
        <div className="adm-media-grid">
          {assets.map((asset) => (
            <button key={asset.id} type="button" className="adm-media-item" onClick={() => setOpenId(asset.id)}>
              {/* eslint-disable-next-line @next/next/no-img-element -- ảnh thu nhỏ từ Supabase Storage */}
              <img src={asset.url} alt={asset.alt_text} loading="lazy" />
              <span className="adm-sm"><b>{asset.original_name || 'ảnh'}</b></span>
              <span className="adm-sm adm-muted">{TYPE_LABEL[asset.mime_type]} · {kb(asset.size_bytes)} · {asset.usage.length ? `dùng ở ${asset.usage.length}` : 'chưa dùng'}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="adm-empty"><b>{initialAssets.length ? 'Không có ảnh khớp bộ lọc' : 'Thư viện chưa có ảnh'}</b><span>Kéo thả ảnh vào khung phía trên để bắt đầu.</span></div>
      )}
      {open ? <AssetDialog asset={open} onClose={() => setOpenId(null)} onChanged={() => router.refresh()} toast={toast} confirm={confirm} /> : null}
    </>
  );
}

function AssetDialog({ asset, onClose, onChanged, toast, confirm }: {
  asset: Asset; onClose: () => void; onChanged: () => void;
  toast: ReturnType<typeof useAdminUi>['toast']; confirm: ReturnType<typeof useAdminUi>['confirm'];
}) {
  const [alt, setAlt] = useState(asset.alt_text);
  const [isBusy, setIsBusy] = useState(false);

  async function saveAlt() {
    setIsBusy(true);
    const result = await adminFetch(`/api/admin/media/${asset.id}`, { method: 'PATCH', body: JSON.stringify({ altText: alt }) });
    setIsBusy(false);
    if (!result.ok) { toast(result.error, 'error'); return; }
    toast('Đã lưu mô tả ảnh.');
    onChanged();
  }

  async function copyUrl() {
    try { await navigator.clipboard.writeText(asset.url); toast('Đã sao chép URL.'); } catch { toast('Trình duyệt chặn sao chép — chọn và sao chép thủ công.', 'error'); }
  }

  async function remove() {
    const ok = await confirm({ title: 'Xoá ảnh này?', body: 'Xoá khỏi thư viện và Storage, không hoàn tác được.', confirmLabel: 'Xoá ảnh', tone: 'danger' });
    if (!ok) return;
    setIsBusy(true);
    const result = await adminFetch(`/api/admin/media/${asset.id}`, { method: 'DELETE', body: '{}' });
    setIsBusy(false);
    if (!result.ok) { toast(result.error, 'error'); return; }
    toast('Đã xoá ảnh.');
    onClose();
    onChanged();
  }

  return (
    <div className="adm-overlay" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="adm-dialog wide" role="dialog" aria-modal="true" aria-labelledby="adm-asset-title">
        <div className="adm-two">
          {/* eslint-disable-next-line @next/next/no-img-element -- ảnh gốc từ Supabase Storage */}
          <img src={asset.url} alt={asset.alt_text} style={{ width: '100%', maxHeight: '60vh', objectFit: 'contain', borderRadius: 16, background: 'var(--adm-pink-2)' }} />
          <div>
            <h2 id="adm-asset-title" style={{ wordBreak: 'break-all' }}>{asset.original_name || 'Ảnh'}</h2>
            <p className="adm-sm adm-muted">{TYPE_LABEL[asset.mime_type]} · {kb(asset.size_bytes)} · {new Date(asset.created_at).toLocaleString('vi-VN')}</p>
            <label className="adm-field" style={{ marginTop: 10 }}><span>Mô tả ảnh (alt)</span>
              <input className="adm-input" value={alt} maxLength={300} onChange={(event) => setAlt(event.target.value)} /></label>
            <div className="adm-actions" style={{ marginTop: 8 }}>
              <button type="button" className="adm-btn sm" disabled={isBusy || alt === asset.alt_text} onClick={saveAlt}>Lưu mô tả</button>
              <button type="button" className="adm-btn ghost sm" onClick={copyUrl}>Sao chép URL</button>
            </div>
            <h2 style={{ marginTop: 14, fontSize: 15 }}>Đang dùng ở ({asset.usage.length})</h2>
            {asset.usage.length ? (
              <ul className="adm-list">{asset.usage.map((use) => (
                <li key={`${use.entity}-${use.contentId}`} className="adm-sm">
                  {isAdminEntity(use.entity)
                    ? <Link href={`/admin/${ENTITY_CONFIG[use.entity].slug}/${use.contentId}`} style={{ textDecoration: 'underline' }}>{ENTITY_CONFIG[use.entity].label}: <span className="adm-jp">{use.title}</span></Link>
                    : `${use.entity} #${use.contentId}`}
                </li>
              ))}</ul>
            ) : <p className="adm-sm adm-muted">Chưa gắn vào mục nào.</p>}
            <div className="adm-actions" style={{ marginTop: 14 }}>
              <button type="button" className="adm-btn danger sm" disabled={isBusy || asset.usage.length > 0} onClick={remove}
                title={asset.usage.length ? 'Gỡ ảnh khỏi các mục đang dùng trước khi xoá' : undefined}>Xoá ảnh</button>
              {asset.usage.length ? <span className="adm-sm adm-muted">Ảnh đang được dùng — không xoá được.</span> : null}
            </div>
          </div>
        </div>
        <div className="adm-dialog-actions"><button type="button" className="adm-btn ghost" onClick={onClose}>Đóng</button></div>
      </div>
    </div>
  );
}
