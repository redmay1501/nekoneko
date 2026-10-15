import { describe, expect, it } from 'vitest';
import { buildStoragePath, checkImageUpload, cleanOriginalName, MAX_IMAGE_BYTES, sniffImageType } from './media-validation';

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]);
const WEBP = new Uint8Array([...'RIFF'].map((c) => c.charCodeAt(0)).concat([0, 0, 0, 0], [...'WEBP'].map((c) => c.charCodeAt(0))));
const GIF = new Uint8Array([...'GIF89a'].map((c) => c.charCodeAt(0)).concat([0, 0, 0, 0, 0, 0]));
const SVG = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"></svg>');

describe('sniffImageType', () => {
  it('nhận đúng PNG / JPEG / WebP theo chữ ký file', () => {
    expect(sniffImageType(PNG)).toBe('image/png');
    expect(sniffImageType(JPEG)).toBe('image/jpeg');
    expect(sniffImageType(WEBP)).toBe('image/webp');
  });
  it('GIF, SVG → không nhận', () => {
    expect(sniffImageType(GIF)).toBeNull();
    expect(sniffImageType(SVG)).toBeNull();
  });
});

describe('checkImageUpload', () => {
  it('tải ảnh hợp lệ → ok', () => {
    expect(checkImageUpload({ size: 1000, type: 'image/png', name: 'meo.png' }, PNG)).toEqual({ ok: true, mimeType: 'image/png', extension: 'png' });
    expect(checkImageUpload({ size: 1000, type: 'image/webp', name: 'a.webp' }, WEBP)).toMatchObject({ ok: true, extension: 'webp' });
  });
  it('sai định dạng → 415', () => {
    expect(checkImageUpload({ size: 1000, type: 'image/gif', name: 'a.gif' }, GIF)).toMatchObject({ ok: false, status: 415 });
    expect(checkImageUpload({ size: 1000, type: 'image/svg+xml', name: 'a.svg' }, SVG)).toMatchObject({ ok: false, status: 415 });
  });
  it('đổi đuôi / khai sai loại (GIF đội lốt PNG, PNG khai là JPEG) → 415', () => {
    expect(checkImageUpload({ size: 1000, type: 'image/png', name: 'a.png' }, GIF)).toMatchObject({ ok: false, status: 415 });
    expect(checkImageUpload({ size: 1000, type: 'image/jpeg', name: 'a.jpg' }, PNG)).toMatchObject({ ok: false, status: 415 });
  });
  it('quá lớn → 413', () => {
    expect(checkImageUpload({ size: MAX_IMAGE_BYTES + 1, type: 'image/png', name: 'big.png' }, PNG)).toMatchObject({ ok: false, status: 413 });
  });
  it('file rỗng → 400', () => {
    expect(checkImageUpload({ size: 0, type: 'image/png', name: 'x.png' }, new Uint8Array())).toMatchObject({ ok: false, status: 400 });
  });
});

describe('đặt tên file', () => {
  it('tên duy nhất theo uuid, không dùng tên gốc', () => {
    expect(buildStoragePath('webp', 'abc-123', new Date('2026-10-16T00:00:00Z'))).toBe('2026/10/abc-123.webp');
  });
  it('làm sạch tên gốc', () => {
    expect(cleanOriginalName('C:\\Users\\x\\mèo\u0007.png')).toBe('mèo.png');
  });
});
