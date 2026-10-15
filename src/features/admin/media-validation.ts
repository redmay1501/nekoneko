/**
 * Kiểm tra ảnh tải lên — chạy Ở SERVER trên chính nội dung file (không tin tên file hay loại trình duyệt khai).
 * Chỉ JPEG / PNG / WebP, tối đa 2 MB (bằng giới hạn của bucket content-media).
 */
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export type AllowedImageType = (typeof ALLOWED_IMAGE_TYPES)[number];
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
export const IMAGE_EXTENSION: Record<AllowedImageType, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

/** Đọc "chữ ký" đầu file (magic bytes) để biết loại ảnh thật. */
export function sniffImageType(bytes: Uint8Array): AllowedImageType | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (bytes.length >= 8 && png.every((value, index) => bytes[index] === value)) return 'image/png';
  const ascii = (from: number, to: number) => String.fromCharCode(...bytes.slice(from, to));
  if (bytes.length >= 12 && ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'image/webp';
  return null;
}

export type ImageCheck =
  | { ok: true; mimeType: AllowedImageType; extension: string }
  | { ok: false; status: 413 | 415 | 400; message: string };

export function checkImageUpload(file: { size: number; type: string; name: string }, head: Uint8Array): ImageCheck {
  if (file.size <= 0) return { ok: false, status: 400, message: `"${file.name}" là file rỗng.` };
  if (file.size > MAX_IMAGE_BYTES) {
    return { ok: false, status: 413, message: `"${file.name}" nặng ${(file.size / 1024 / 1024).toFixed(1)} MB — tối đa 2 MB. Hãy nén hoặc thu nhỏ ảnh.` };
  }
  const sniffed = sniffImageType(head);
  if (!sniffed || !(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type) || sniffed !== file.type) {
    return { ok: false, status: 415, message: `"${file.name}" không phải ảnh JPEG, PNG hoặc WebP hợp lệ.` };
  }
  return { ok: true, mimeType: sniffed, extension: IMAGE_EXTENSION[sniffed] };
}

/** Tên file duy nhất, không dùng tên gốc (tránh trùng, ký tự lạ, lộ thông tin): 2026/10/<uuid>.webp */
export function buildStoragePath(extension: string, uuid: string, now: Date = new Date()): string {
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  return `${now.getUTCFullYear()}/${month}/${uuid}.${extension}`;
}

/** Tên gốc chỉ để admin nhận ra ảnh — bỏ đường dẫn và ký tự điều khiển, cắt ngắn. */
export function cleanOriginalName(name: string): string {
  return (name.split(/[\\/]/).pop() ?? '').replace(/[\u0000-\u001f\u007f]/g, '').slice(0, 120);
}
