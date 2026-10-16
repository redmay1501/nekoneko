/**
 * Hàng đợi ảnh trong "Quản lý ảnh": mỗi file → (1) tải lên thư viện → (2) gắn vào mục đã ghép.
 * Lỗi giữa chừng KHÔNG làm lại từ đầu: đã có assetId (tải lên xong) thì lần thử lại chỉ gắn, không tải lên lại.
 * Ảnh đã tải mà chưa gắn được vẫn nằm trong thư viện (lọc "Chưa dùng" ở trang Media) — không mất, không mồ côi trong Storage.
 */
export type QueueStatus = 'ready' | 'uploading' | 'linking' | 'done' | 'error';

export interface QueueItem {
  key: string;
  fileName: string;
  /** Lỗi kiểm tra sơ bộ (sai định dạng, quá lớn) — không được gửi lên. */
  problem: string | null;
  targets: number[];
  status: QueueStatus;
  assetId: string | null;
  error: string | null;
}

export interface QueueDeps {
  upload: () => Promise<{ assetId: string } | { error: string }>;
  link: (ids: number[], assetId: string) => Promise<{ ok: true } | { error: string }>;
}

export function canConfirm(item: QueueItem, duplicateKeys: ReadonlySet<string>): boolean {
  return !item.problem && item.targets.length > 0 && !duplicateKeys.has(item.key) && (item.status === 'ready' || item.status === 'error');
}

/** Chạy một file tới khi xong hoặc lỗi. `onProgress` báo trạng thái trung gian cho giao diện. */
export async function processQueueItem(item: QueueItem, deps: QueueDeps, onProgress: (item: QueueItem) => void = () => undefined): Promise<QueueItem> {
  let current: QueueItem = { ...item, error: null };
  if (!current.assetId) {
    current = { ...current, status: 'uploading' };
    onProgress(current);
    const uploaded = await deps.upload();
    if ('error' in uploaded) return { ...current, status: 'error', error: uploaded.error };
    current = { ...current, assetId: uploaded.assetId };
  }
  current = { ...current, status: 'linking' };
  onProgress(current);
  const linked = await deps.link(current.targets, current.assetId!);
  if ('error' in linked) return { ...current, status: 'error', error: `Đã tải ảnh lên thư viện nhưng chưa gắn được: ${linked.error}` };
  return { ...current, status: 'done' };
}
