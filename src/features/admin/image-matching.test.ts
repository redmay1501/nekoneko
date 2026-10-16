import { describe, expect, it } from 'vitest';
import { duplicateTargets, normalizeFileStem, suggestMatch } from './image-matching';

const candidates = [
  { id: 3, keys: ['先生', 'せんせい', 'Giáo viên'] },
  { id: 12, keys: ['猫', 'ねこ', 'Con mèo'] },
  { id: 91, keys: ['', 'かけます', 'Gọi (điện thoại)'] },
  { id: 298, keys: ['', 'かけます', 'Đeo (kính)'] },
];

describe('suggestMatch — ghép theo tên file', () => {
  it('tên là mã nội dung', () => {
    expect(suggestMatch('12.png', candidates)).toEqual({ kind: 'id', id: 12 });
    expect(suggestMatch('vocab_3.webp', candidates)).toEqual({ kind: 'id', id: 3 });
    expect(suggestMatch('tu-vung-298.jpg', candidates)).toEqual({ kind: 'id', id: 298 });
  });
  it('mã không tồn tại → không ghép', () => {
    expect(suggestMatch('9999.png', candidates)).toEqual({ kind: 'none' });
  });
  it('trùng đúng chữ / cách đọc / nghĩa (bỏ dấu, không phân biệt hoa thường)', () => {
    expect(suggestMatch('先生.png', candidates)).toMatchObject({ kind: 'exact', id: 3 });
    expect(suggestMatch('ねこ.JPG', candidates)).toMatchObject({ kind: 'exact', id: 12 });
    expect(suggestMatch('con_meo.webp', candidates)).toMatchObject({ kind: 'exact', id: 12 });
  });
  it('đồng âm → nhiều khả năng, không tự chọn', () => {
    expect(suggestMatch('かけます.png', candidates)).toEqual({ kind: 'ambiguous', ids: [91, 298] });
  });
  it('tên chung chung (IMG_1234, screenshot) không bị ghép theo thứ tự', () => {
    expect(suggestMatch('IMG_0001.png', candidates)).toEqual({ kind: 'none' });
    expect(suggestMatch('Screenshot 2026-10-16 at 10.00.00.png', candidates)).toEqual({ kind: 'none' });
    expect(suggestMatch('image.png', candidates)).toEqual({ kind: 'none' });
  });
  it('chuẩn hoá tên file', () => {
    expect(normalizeFileStem('Con_Mèo-2.PNG')).toBe('con meo 2');
  });
});

describe('duplicateTargets', () => {
  it('hai file nhắm cùng một mục → báo trùng', () => {
    const duplicates = duplicateTargets([{ key: 'a', targets: [3] }, { key: 'b', targets: [3, 12] }, { key: 'c', targets: [91] }]);
    expect([...duplicates.keys()]).toEqual([3]);
    expect(duplicates.get(3)).toEqual(['a', 'b']);
  });
});
