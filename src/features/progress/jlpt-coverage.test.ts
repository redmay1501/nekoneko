import { describe, expect, it } from 'vitest';
import { loadSeedContent } from '@/lib/data/seed-content';
import { createInitialMemoryRecord, toMemoryView } from '@/features/memory/memory-engine';
import type { MemoryView } from '@/features/memory/memory-types';
import { buildKnowledgeCatalog } from '@/features/learning/knowledge-catalog';
import type { ContentKey } from '@/features/learning/knowledge-types';
import { jlptGrammarCoverage, jlptPatternForms } from './jlpt-coverage';

const NOW = new Date('2026-10-05T08:00:00.000Z');
const catalog = buildKnowledgeCatalog(loadSeedContent());

function grammarLearnedUntil(day: number): Map<ContentKey, MemoryView> {
  return new Map(catalog.items.filter((item) => item.type === 'grammar').map((item) => {
    const learned = item.day !== null && item.day <= day;
    const record = learned ? { ...createInitialMemoryRecord(item.type, item.id, NOW), encounterCount: 2, memoryScore: 60 } : null;
    return [item.key, toMemoryView(item.key, item.type, record, NOW)];
  }));
}

describe('jlptPatternForms', () => {
  it('bỏ chú thích, tách cách viết, "〜A〜B" cần đủ hai phần', () => {
    expect(jlptPatternForms('が (nhưng)')).toEqual([['が']]);
    expect(jlptPatternForms('好きだ / すきだ')).toEqual([['好きだ'], ['好き'], ['すきだ'], ['すき']]);
    expect(jlptPatternForms('〜のほうが〜より')).toEqual([['のほうが', 'より']]);
    expect(jlptPatternForms('〜ている')).toContainEqual(['ています']);
    expect(jlptPatternForms('Mệnh đề quan hệ')).toEqual([]);
  });
});

describe('jlptGrammarCoverage', () => {
  it('chưa học ngữ pháp nào → 0; tăng dần theo lộ trình; không vượt phần giáo trình phủ được', () => {
    const none = jlptGrammarCoverage(catalog, grammarLearnedUntil(0));
    const mid = jlptGrammarCoverage(catalog, grammarLearnedUntil(30));
    const all = jlptGrammarCoverage(catalog, grammarLearnedUntil(90));
    expect(none.met).toBe(0);
    expect(mid.met).toBeGreaterThan(0);
    expect(all.met).toBeGreaterThan(mid.met);
    expect(all.met).toBe(all.coveredByCourse);
    expect(all.coveredByCourse).toBeLessThan(all.total); // vài mẫu chỉ có tên tiếng Việt / ngoài Minna
    expect(all.total).toBe(catalog.content.jlptGrammar.length);
  });
});
