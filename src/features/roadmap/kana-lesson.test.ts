import { describe, expect, it } from 'vitest';
import { loadSeedContent } from '@/lib/data/seed-content';
import { buildKnowledgeCatalog } from '@/features/learning/knowledge-catalog';
import { buildKanaLesson } from './kana-lesson';

const catalog = buildKnowledgeCatalog(loadSeedContent());
const kana = catalog.items.filter((item) => item.type === 'hiragana' || item.type === 'katakana');
const ofDay = (day: number) => kana.filter((item) => item.day === day);
const lesson = (day: number) => buildKanaLesson(ofDay(day), kana)!;

describe('buildKanaLesson', () => {
  it('ngày 2: hai hàng さ và た, đủ 5 chữ mỗi hàng (し, ち, つ không bị tách hàng)', () => {
    const result = lesson(2);
    expect(result.kind).toBe('rows');
    expect(result.rows.map((row) => row.cells.map((cell) => cell.item.face).join(''))).toEqual(['さしすせそ', 'たちつてと']);
  });

  it('ngày 5: hàng ら, hàng わ (わ を) và ん đứng riêng', () => {
    expect(lesson(5).rows.map((row) => row.cells.map((cell) => cell.item.face).join(''))).toEqual(['らりるれろ', 'わを', 'ん']);
  });

  it('ngày 6: bảng âm gốc → âm đục theo hàng, ぢ づ thuộc hàng た; có mẹo nhớ và ngoại lệ', () => {
    const result = lesson(6);
    expect(result.kind).toBe('dakuten');
    expect(result.rows.map((row) => row.label)).toEqual(['K → G', 'S → Z', 'T → D', 'H → B', 'H → P']);
    const tRow = result.rows[2].cells.map((cell) => `${cell.base}${cell.item.face}`);
    expect(tRow).toEqual(['ただ', 'ちぢ', 'つづ', 'てで', 'とど']);
    expect(result.rows[4].cells[2]).toMatchObject({ base: 'ふ', baseReading: 'fu' });
    expect(result.rows.every((row) => row.rule)).toBe(true);
    if (result.kind === 'dakuten') expect(result.exceptions.join(' ')).toContain('じ');
  });

  it('ngày 13 (Katakana): cùng bảng, ngoại lệ viết bằng Katakana', () => {
    const result = lesson(13);
    expect(result.rows[0].cells[0]).toMatchObject({ base: 'カ' });
    if (result.kind === 'dakuten') expect(result.exceptions.join(' ')).toContain('ジ');
  });

  it('ngày 7: âm ghép nhóm theo chữ đầu', () => {
    const result = lesson(7);
    expect(result.kind).toBe('youon');
    expect(result.rows[0].cells.map((cell) => cell.item.face)).toEqual(['きゃ', 'きゅ', 'きょ']);
    expect(result.rows).toHaveLength(11);
  });
});
