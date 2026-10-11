import { describe, expect, it } from 'vitest';
import { loadSeedContent } from '@/lib/data/seed-content';
import { buildKnowledgeCatalog } from './knowledge-catalog';
import { buildListeningPractice } from './skill-practice';

const catalog = buildKnowledgeCatalog(loadSeedContent());

describe('Luyện nghe — chọn phạm vi, không cần học tới', () => {
  it('mặc định theo lộ trình: chỉ từ đã tới ngày', () => {
    const practice = buildListeningPractice(catalog, new Map(), 20);
    expect(practice.range).toBe('lo-trinh');
    const days = practice.questions.map((question) => catalog.byKey.get(question.contentKey)?.day ?? 99);
    expect(days.every((day) => day <= 20)).toBe(true);
  });

  it('ngày 1 vẫn nghe được cả bài 25 khi chọn bài đó', () => {
    const lesson25 = buildListeningPractice(catalog, new Map(), 1).ranges.find((range) => range.label === 'Bài 25')!;
    const practice = buildListeningPractice(catalog, new Map(), 1, lesson25.id);
    expect(practice.questions.length).toBeGreaterThan(0);
    for (const question of practice.questions) {
      expect(question.options).toContain(question.answer);
      expect(new Set(question.options).size).toBe(question.options.length);
    }
  });

  it('"Bài khác" đổi bộ câu', () => {
    const first = buildListeningPractice(catalog, new Map(), 30, 'tat-ca', 'listening:0').questions.map((q) => q.contentKey);
    const second = buildListeningPractice(catalog, new Map(), 30, 'tat-ca', 'listening:1').questions.map((q) => q.contentKey);
    expect(first).not.toEqual(second);
  });
});
