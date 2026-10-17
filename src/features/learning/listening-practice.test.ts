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

describe('Luyện nói / viết / đọc — không khoá theo ngày', () => {
  it('nói: trước ngày có mẫu câu vẫn có câu (Bài 1); chọn một bài = mọi mẫu của bài', async () => {
    const { buildSpeakingPractice } = await import('./skill-practice');
    expect(buildSpeakingPractice(catalog, 1).range).toBe('bai-1');
    expect(buildSpeakingPractice(catalog, 1).sentences.length).toBeGreaterThan(0);
    const lesson12 = buildSpeakingPractice(catalog, 1, 'bai-12');
    expect(lesson12.sentences.length).toBe(catalog.content.grammar.filter((pattern) => /\b12\b/.test(pattern.lesson)).length);
  });

  it('viết: ngày 1 vẫn luyện được Kanji đầu tiên; nhóm 10 chữ', async () => {
    const { buildWritingPractice } = await import('./skill-practice');
    const practice = buildWritingPractice(catalog, 1);
    // Kanji đầu tiên của lộ trình là chữ của bài 1 (ngày 18 — học cùng từ 先生, 会社…).
    const firstDay = Math.min(...catalog.content.kanji.map((kanji) => kanji.day ?? Infinity));
    expect(firstDay).toBe(18);
    expect(catalog.content.kanji.find((kanji) => kanji.character === practice.focus.character)?.day).toBe(firstDay);
    expect(practice.others).toHaveLength(10);
    expect(practice.groups.filter((group) => group.isCurrent)).toHaveLength(1);
  });

  it('đọc: mọi đoạn đều hiện, không lọc theo ngày', async () => {
    const { buildReadingPractice } = await import('./skill-practice');
    expect(buildReadingPractice(catalog)).toHaveLength(catalog.content.readingPassages.length);
  });
});
