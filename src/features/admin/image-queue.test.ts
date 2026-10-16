import { describe, expect, it, vi } from 'vitest';
import { canConfirm, processQueueItem, type QueueItem } from './image-queue';

const item = (patch: Partial<QueueItem> = {}): QueueItem => ({ key: 'a', fileName: 'meo.png', problem: null, targets: [12], status: 'ready', assetId: null, error: null, ...patch });

describe('processQueueItem', () => {
  it('tải lên rồi gắn → done', async () => {
    const upload = vi.fn(async () => ({ assetId: 'x1' }));
    const link = vi.fn(async () => ({ ok: true as const }));
    const result = await processQueueItem(item(), { upload, link });
    expect(result).toMatchObject({ status: 'done', assetId: 'x1' });
    expect(link).toHaveBeenCalledWith([12], 'x1');
  });
  it('tải lên lỗi → error, thử lại thì tải lên lại', async () => {
    const upload = vi.fn().mockResolvedValueOnce({ error: 'mạng' }).mockResolvedValueOnce({ assetId: 'x2' });
    const link = vi.fn(async () => ({ ok: true as const }));
    const failed = await processQueueItem(item(), { upload, link });
    expect(failed).toMatchObject({ status: 'error', assetId: null });
    expect(link).not.toHaveBeenCalled();
    const retried = await processQueueItem(failed, { upload, link });
    expect(retried.status).toBe('done');
    expect(upload).toHaveBeenCalledTimes(2);
  });
  it('tải lên xong nhưng gắn lỗi → giữ assetId; thử lại CHỈ gắn, không tải lên lại', async () => {
    const upload = vi.fn(async () => ({ assetId: 'x3' }));
    const link = vi.fn().mockResolvedValueOnce({ error: 'db' }).mockResolvedValueOnce({ ok: true });
    const failed = await processQueueItem(item(), { upload, link });
    expect(failed).toMatchObject({ status: 'error', assetId: 'x3' });
    const retried = await processQueueItem(failed, { upload, link });
    expect(retried.status).toBe('done');
    expect(upload).toHaveBeenCalledTimes(1);
    expect(link).toHaveBeenCalledTimes(2);
  });
  it('báo tiến trình uploading → linking', async () => {
    const seen: string[] = [];
    await processQueueItem(item(), { upload: async () => ({ assetId: 'x' }), link: async () => ({ ok: true }) }, (progress) => seen.push(progress.status));
    expect(seen).toEqual(['uploading', 'linking']);
  });
});

describe('canConfirm', () => {
  it('chỉ xác nhận khi đã ghép, không lỗi định dạng, không trùng, chưa xong', () => {
    expect(canConfirm(item(), new Set())).toBe(true);
    expect(canConfirm(item({ targets: [] }), new Set())).toBe(false);
    expect(canConfirm(item({ problem: 'quá lớn' }), new Set())).toBe(false);
    expect(canConfirm(item(), new Set(['a']))).toBe(false);
    expect(canConfirm(item({ status: 'done' }), new Set())).toBe(false);
    expect(canConfirm(item({ status: 'error' }), new Set())).toBe(true);
  });
});
