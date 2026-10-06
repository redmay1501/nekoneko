import { describe, expect, it } from 'vitest';
import { loadSeedContent } from './seed-content';

const { grammar } = loadSeedContent();

describe('ghi chú ngữ pháp', () => {
  it('cả 112 mẫu đều có cách đọc, khi nào dùng, lỗi thường gặp và ví dụ thứ hai (kèm cách đọc + nghĩa)', () => {
    expect(grammar).toHaveLength(112);
    const missing = grammar.filter((pattern) => ![pattern.exampleReading, pattern.whenToUse, pattern.commonMistake,
      pattern.example2Jp, pattern.example2Reading, pattern.example2Vi].every(Boolean));
    expect(missing.map((pattern) => pattern.id)).toEqual([]);
  });

  it('cách đọc chỉ có kana (không còn chữ Hán) và ví dụ thứ hai khác ví dụ gốc', () => {
    for (const pattern of grammar) {
      expect(/[一-鿿]/.test(pattern.exampleReading), `${pattern.id}: ${pattern.exampleReading}`).toBe(false);
      expect(/[一-鿿]/.test(pattern.example2Reading), `${pattern.id}: ${pattern.example2Reading}`).toBe(false);
      expect(pattern.example2Jp).not.toBe(pattern.exampleJp);
    }
  });

  it('đã sửa: デパート là cửa hàng bách hoá (không phải siêu thị); でしょう giải thích đúng nghĩa phỏng đoán', () => {
    expect(grammar.find((pattern) => pattern.id === 62)?.exampleVi).toContain('bách hoá');
    expect(grammar.find((pattern) => pattern.id === 97)?.usage).toContain('phỏng đoán');
  });
});
