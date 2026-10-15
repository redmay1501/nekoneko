import { buildStoragePath, checkImageUpload, cleanOriginalName } from './media-validation';

/**
 * Logic thư viện ảnh, tách khỏi Supabase để kiểm thử được (tải lên, lỗi, chặn xoá ảnh đang dùng).
 * media-admin.ts nối các hàm này với Supabase Storage + bảng media_assets / content_images.
 */
export interface MediaAssetRow {
  id: string;
  storage_path: string;
  mime_type: string;
  size_bytes: number;
  original_name: string;
  alt_text: string;
  created_at: string;
}

export interface MediaDeps {
  storageUpload(path: string, bytes: Uint8Array, mimeType: string): Promise<{ error: string | null }>;
  storageRemove(path: string): Promise<{ error: string | null }>;
  insertAsset(row: Omit<MediaAssetRow, 'id' | 'created_at'> & { created_by: string }): Promise<{ row: MediaAssetRow | null; error: string | null }>;
  findAsset(id: string): Promise<MediaAssetRow | null>;
  countUsage(assetId: string): Promise<number>;
  deleteAsset(id: string): Promise<{ error: string | null; inUse?: boolean }>;
  newId(): string;
}

export type UploadResult =
  | { ok: true; asset: MediaAssetRow }
  | { ok: false; status: 400 | 413 | 415 | 502; message: string };

export interface UploadFile {
  name: string;
  type: string;
  size: number;
  bytes: Uint8Array;
}

export async function uploadImage(deps: MediaDeps, actorId: string, file: UploadFile, altText: string): Promise<UploadResult> {
  const check = checkImageUpload(file, file.bytes.subarray(0, 16));
  if (!check.ok) return check;
  const path = buildStoragePath(check.extension, deps.newId());
  const stored = await deps.storageUpload(path, file.bytes, check.mimeType);
  if (stored.error) return { ok: false, status: 502, message: `Tải "${cleanOriginalName(file.name)}" lên kho ảnh không thành công. Bạn thử lại nhé.` };
  const inserted = await deps.insertAsset({
    storage_path: path, mime_type: check.mimeType, size_bytes: file.size, original_name: cleanOriginalName(file.name),
    alt_text: altText.trim().slice(0, 300), created_by: actorId,
  });
  if (inserted.error || !inserted.row) {
    // Không để file mồ côi trong Storage khi không ghi được vào database.
    await deps.storageRemove(path);
    return { ok: false, status: 502, message: `Đã tải "${cleanOriginalName(file.name)}" nhưng không lưu được vào thư viện. Bạn thử lại nhé.` };
  }
  return { ok: true, asset: inserted.row };
}

export type DeleteResult =
  | { ok: true; asset: MediaAssetRow }
  | { ok: false; status: 404 | 409 | 502; message: string };

/** Ảnh đang gắn vào nội dung thì không được xoá (kiểm tra ở đây + khoá ngoại on delete restrict ở database). */
export async function deleteImage(deps: MediaDeps, assetId: string): Promise<DeleteResult> {
  const asset = await deps.findAsset(assetId);
  if (!asset) return { ok: false, status: 404, message: 'Ảnh không còn trong thư viện.' };
  const usage = await deps.countUsage(assetId);
  if (usage > 0) return { ok: false, status: 409, message: `Ảnh đang được dùng ở ${usage} mục nội dung — gỡ ảnh khỏi các mục đó trước khi xoá.` };
  const removed = await deps.deleteAsset(assetId);
  if (removed.inUse) return { ok: false, status: 409, message: 'Ảnh vừa được gắn vào nội dung — không xoá.' };
  if (removed.error) return { ok: false, status: 502, message: 'Không xoá được ảnh. Bạn thử lại nhé.' };
  // Xoá dòng trước, file sau: lỡ xoá file lỗi thì chỉ còn file thừa trong Storage, không có dòng trỏ tới ảnh hỏng.
  await deps.storageRemove(asset.storage_path);
  return { ok: true, asset };
}
