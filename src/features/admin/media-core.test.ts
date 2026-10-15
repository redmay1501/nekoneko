import { describe, expect, it, vi } from 'vitest';
import { deleteImage, type MediaAssetRow, type MediaDeps, uploadImage } from './media-core';
import { MAX_IMAGE_BYTES } from './media-validation';

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3, 4]);
const asset: MediaAssetRow = {
  id: 'a1', storage_path: '2026/10/u1.png', mime_type: 'image/png', size_bytes: 12, original_name: 'meo.png', alt_text: 'Mèo', created_at: '2026-10-16',
};

function deps(overrides: Partial<MediaDeps> = {}): MediaDeps {
  return {
    storageUpload: vi.fn(async () => ({ error: null })),
    storageRemove: vi.fn(async () => ({ error: null })),
    insertAsset: vi.fn(async (row) => ({ row: { ...asset, ...row, id: 'a1', created_at: 'now' }, error: null })),
    findAsset: vi.fn(async () => asset),
    countUsage: vi.fn(async () => 0),
    deleteAsset: vi.fn(async () => ({ error: null })),
    newId: () => 'u1',
    ...overrides,
  };
}

describe('uploadImage', () => {
  it('tải ảnh thành công → lưu đường dẫn (không base64), tên file duy nhất', async () => {
    const d = deps();
    const result = await uploadImage(d, 'admin', { name: 'mèo.png', type: 'image/png', size: PNG.length, bytes: PNG }, ' Con mèo ');
    expect(result).toMatchObject({ ok: true, asset: { mime_type: 'image/png', alt_text: 'Con mèo', original_name: 'mèo.png' } });
    const path = (d.storageUpload as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(path).toMatch(/^\d{4}\/\d{2}\/u1\.png$/);
    const inserted = (d.insertAsset as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(inserted.storage_path).toBe(path);
    expect(JSON.stringify(inserted)).not.toMatch(/base64|data:/);
  });
  it('sai định dạng → 415, không gọi Storage', async () => {
    const d = deps();
    const gif = new Uint8Array([...'GIF89a'].map((c) => c.charCodeAt(0)).concat([0, 0, 0, 0, 0, 0]));
    const result = await uploadImage(d, 'admin', { name: 'a.gif', type: 'image/gif', size: 12, bytes: gif }, '');
    expect(result).toMatchObject({ ok: false, status: 415 });
    expect(d.storageUpload).not.toHaveBeenCalled();
  });
  it('quá lớn → 413, không gọi Storage', async () => {
    const d = deps();
    const result = await uploadImage(d, 'admin', { name: 'big.png', type: 'image/png', size: MAX_IMAGE_BYTES + 1, bytes: PNG }, '');
    expect(result).toMatchObject({ ok: false, status: 413 });
    expect(d.storageUpload).not.toHaveBeenCalled();
  });
  it('Storage lỗi → báo lỗi, không ghi database', async () => {
    const d = deps({ storageUpload: vi.fn(async () => ({ error: 'network' })) });
    const result = await uploadImage(d, 'admin', { name: 'a.png', type: 'image/png', size: 12, bytes: PNG }, '');
    expect(result).toMatchObject({ ok: false, status: 502 });
    expect(d.insertAsset).not.toHaveBeenCalled();
  });
  it('ghi database lỗi → xoá file vừa tải (không để file mồ côi)', async () => {
    const d = deps({ insertAsset: vi.fn(async () => ({ row: null, error: 'db' })) });
    const result = await uploadImage(d, 'admin', { name: 'a.png', type: 'image/png', size: 12, bytes: PNG }, '');
    expect(result).toMatchObject({ ok: false, status: 502 });
    expect(d.storageRemove).toHaveBeenCalledOnce();
  });
});

describe('deleteImage', () => {
  it('ảnh đang dùng → chặn xoá (409), không đụng Storage', async () => {
    const d = deps({ countUsage: vi.fn(async () => 2) });
    const result = await deleteImage(d, 'a1');
    expect(result).toMatchObject({ ok: false, status: 409 });
    expect(d.deleteAsset).not.toHaveBeenCalled();
    expect(d.storageRemove).not.toHaveBeenCalled();
  });
  it('khoá ngoại database chặn (vừa có người gắn) → 409', async () => {
    const d = deps({ deleteAsset: vi.fn(async () => ({ error: 'fk', inUse: true })) });
    expect(await deleteImage(d, 'a1')).toMatchObject({ ok: false, status: 409 });
    expect(d.storageRemove).not.toHaveBeenCalled();
  });
  it('ảnh không dùng → xoá dòng rồi xoá file', async () => {
    const d = deps();
    expect(await deleteImage(d, 'a1')).toMatchObject({ ok: true });
    expect(d.storageRemove).toHaveBeenCalledWith('2026/10/u1.png');
  });
  it('không tìm thấy → 404', async () => {
    expect(await deleteImage(deps({ findAsset: vi.fn(async () => null) }), 'x')).toMatchObject({ ok: false, status: 404 });
  });
});
