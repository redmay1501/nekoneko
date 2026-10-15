import { describe, expect, it } from 'vitest';
import { loadSeedContent } from '@/lib/data/seed-content';
import { ALL_LISTENING_VIDEOS, type ListeningVideo } from '@/features/listening/video-library';
import type { N5Content } from '@/types/content';
import { runQualityChecks } from './quality-checks';
import { auditRoadmap } from './roadmap-audit';

const seed = loadSeedContent();

function tiny(overrides: Partial<N5Content> = {}): N5Content {
  return {
    ...seed, journeyDays: [], dayTasks: [], vocabulary: [], kanji: [], radicals: [], grammar: [], readingPassages: [], ...overrides,
  };
}

describe('runQualityChecks', () => {
  it('nội dung thật trong repo: không có lỗi nghiêm trọng ở bài đọc và video đã xuất bản', () => {
    const issues = runQualityChecks(seed, ALL_LISTENING_VIDEOS);
    expect(issues.filter((issue) => issue.severity === 'error' && (issue.area === 'Bài đọc' || issue.area === 'Video'))).toEqual([]);
  });
  it('phát hiện từ thiếu nghĩa, ngày ngoài 1–90 và từ trùng', () => {
    const issues = runQualityChecks(tiny({
      vocabulary: [
        { id: 1, kana: 'ねこ', kanji: '猫', meaning: '', tip: '', lesson: '', day: 95 },
        { id: 2, kana: 'ねこ', kanji: '猫', meaning: 'mèo', tip: '', lesson: '', day: 3 },
        { id: 3, kana: 'ねこ', kanji: '猫', meaning: 'Mèo', tip: '', lesson: '', day: 4 },
        { id: 4, kana: 'かけます', kanji: '', meaning: 'gọi điện', tip: '', lesson: '', day: 5 },
        { id: 5, kana: 'かけます', kanji: '', meaning: 'đeo (kính)', tip: '', lesson: '', day: 6 },
      ],
    }), []);
    expect(issues.some((issue) => issue.message.includes('thiếu nghĩa') && issue.href === '/admin/tu-vung/1')).toBe(true);
    expect(issues.some((issue) => issue.message.includes('ngoài 1–90'))).toBe(true);
    const duplicates = issues.filter((issue) => issue.area === 'Trùng lặp');
    expect(duplicates).toHaveLength(1); // ねこ/猫/mèo ×2; かけます khác nghĩa không tính là trùng
    expect(duplicates[0].message).toContain('#2 (ngày 3), #3 (ngày 4)');
  });
  it('video xuất bản thiếu song ngữ → lỗi; video chờ duyệt → bỏ qua', () => {
    const base = ALL_LISTENING_VIDEOS[0];
    const video = (patch: Partial<ListeningVideo>): ListeningVideo => ({ ...base, ...patch });
    const issues = runQualityChecks(tiny(), [video({ status: 'published', bilingual: undefined }), video({ status: 'review', bilingual: undefined })]);
    expect(issues.filter((issue) => issue.area === 'Video')).toHaveLength(1);
  });
  it('câu hỏi đọc hiểu có đáp án ngoài danh sách → lỗi', () => {
    const issues = runQualityChecks(tiny({
      readingPassages: [{ id: 1, day: 1, lesson: '', title: 'A', textJp: 'あ', textVi: 'a', questions: [{ question: '?', options: ['a', 'b'], correctIndex: 2 }] }],
    }), []);
    expect(issues.some((issue) => issue.message.includes('đáp án đúng trỏ ra ngoài'))).toBe(true);
  });
});

describe('auditRoadmap', () => {
  it('đủ 90 ngày, đếm đúng số mục theo ngày', () => {
    const audit = auditRoadmap(seed);
    expect(audit.days).toHaveLength(90);
    const day1Vocab = seed.vocabulary.filter((word) => word.day === 1).length;
    expect(audit.days[0].counts.vocabulary).toBe(day1Vocab);
  });
  it('tóm tắt có từ vựng mà không gắn mục nào → báo thiếu', () => {
    const audit = auditRoadmap(tiny({
      journeyDays: [{ day: 1, week: 1, stage: '', minna: '', title: 'Ngày 1', kanjiSummary: '', radicalSummary: '', grammarSummary: '', vocabSummary: 'Chào hỏi', skill: '', minutes: 30 }],
    }));
    expect(audit.days[0].missing.some((message) => message.includes('từ vựng'))).toBe(true);
    expect(audit.days[1].missing[0]).toContain('journey_days');
  });
});
