import { describe, expect, it } from 'vitest';
import { loadSeedContent } from '@/lib/data/seed-content';
import { isAutoAdvancePending } from '@/hooks/useAutoNext';
import { buildKnowledgeCatalog } from './knowledge-catalog';
import { shouldFocusAnswerInput } from './input-focus';
import { ALL_QUESTIONS, questionCountOptions, resolveQuestionCount } from './question-count';
import { buildDayPlan, dayStudyHref } from '@/features/roadmap/day-plan';
import { knowledgeOrigin, originLabel } from './knowledge-origin';

const catalog = buildKnowledgeCatalog(loadSeedContent());

describe('Học lại hôm nay', () => {
  const journey = (currentDay: number) => ({ currentDay, completedDays: Array.from({ length: currentDay - 1 }, (_, index) => index + 1) }) as unknown as Parameters<typeof buildDayPlan>[2];

  it('ngày có kiến thức mới → trang học của ĐÚNG ngày đó (không phải phiên tạo ngày mới)', () => {
    expect(dayStudyHref(buildDayPlan(catalog, 14, journey(14)))).toBe('/lo-trinh/ngay/14/hoc');
  });

  it('ngày ôn tuần → phiên ôn đúng kiến thức của tuần, quay về trang ngày; không chạm trạng thái hoàn thành', () => {
    const reviewDay = catalog.content.journeyDays.find((day) => day.minna.startsWith('Ôn'))!.day;
    const href = dayStudyHref(buildDayPlan(catalog, reviewDay, journey(reviewDay)))!;
    expect(href).toMatch(/^\/hoc\/focus\?k=/);
    expect(decodeURIComponent(href)).toContain(`back=/lo-trinh/ngay/${reviewDay}`);
    expect(href).not.toMatch(/complete|hoan-thanh/);
  });

  it('ngày tổng ôn / thi thử (không gắn kiến thức) → không có nút', () => {
    expect(dayStudyHref({ day: 90, hasNewKnowledge: false, reviewWindow: null })).toBeNull();
  });
});

describe('nhãn ngữ cảnh của câu ôn tập', () => {
  it('từ vựng ghi đúng bài + ngày; Kanji lấy bài theo ngày học; chữ cái không gắn bài', () => {
    const sensei = catalog.items.find((item) => item.type === 'vocabulary' && item.face === '先生')!;
    expect(originLabel(knowledgeOrigin(sensei, catalog))).toBe(`Từ vựng · Bài 1 · Ngày ${sensei.day}`);
    const kanji = catalog.items.find((item) => item.type === 'kanji' && item.face === '書')!;
    expect(knowledgeOrigin(kanji, catalog).lesson).toBe(2);
    const kana = catalog.items.find((item) => item.type === 'hiragana')!;
    expect(knowledgeOrigin(kana, catalog).lesson).toBeNull();
  });

  it('mọi kiến thức có bài khớp với nhãn bài của chính nó (không gán sai bài)', () => {
    for (const item of catalog.items) {
      if (item.type !== 'vocabulary' && item.type !== 'grammar') continue;
      const lesson = Number(/BÀI\s*(\d+)/i.exec(item.content.lesson ?? '')?.[1]);
      if (Number.isFinite(lesson)) expect(knowledgeOrigin(item, catalog).lesson).toBe(lesson);
    }
  });
});

describe('số câu luyện nghe / nghe – gõ', () => {
  it('lựa chọn dựa trên số câu khả dụng, luôn có "Tất cả (N)", không hứa nhiều hơn số có thật', () => {
    expect(questionCountOptions(0)).toEqual([]);
    expect(questionCountOptions(7).map((option) => option.label)).toEqual(['5 câu', 'Tất cả (7)']);
    expect(questionCountOptions(40).map((option) => option.value)).toEqual([5, 10, 15, 20, 30, ALL_QUESTIONS]);
  });

  it('chọn nhiều hơn số câu khả dụng → làm đúng số khả dụng (không lặp câu)', () => {
    expect(resolveQuestionCount(30, 12)).toBe(12);
    expect(resolveQuestionCount(ALL_QUESTIONS, 12)).toBe(12);
    expect(resolveQuestionCount(10, 12)).toBe(10);
    expect(resolveQuestionCount(10, 0)).toBe(0);
  });
});

describe('tự chuyển câu (cùng cơ chế trò chơi)', () => {
  const base = { answerKey: '3:a', isCorrect: true, isOn: true, isReady: true };
  it('bật + đúng + đã ghi nhận → tự chuyển', () => expect(isAutoAdvancePending(base)).toBe(true));
  it('tắt công tắc → người học tự bấm', () => expect(isAutoAdvancePending({ ...base, isOn: false })).toBe(false));
  it('trả lời sai → dừng để xem đáp án', () => expect(isAutoAdvancePending({ ...base, isCorrect: false })).toBe(false));
  it('đang lưu / lưu lỗi → không chuyển', () => expect(isAutoAdvancePending({ ...base, isReady: false })).toBe(false));
  it('chưa trả lời → không chuyển', () => expect(isAutoAdvancePending({ ...base, answerKey: null })).toBe(false));
});

describe('tự focus ô nhập', () => {
  const ready = { hasItems: true, isAnswered: false, isDone: false, hasInteracted: true, hasFinePointer: false };
  it('sang câu mới (đã thao tác) → focus ô của câu mới', () => expect(shouldFocusAnswerInput(ready)).toBe(true));
  it('đã chấm (ô chỉ đọc) / xong bài / không có câu → không focus', () => {
    expect(shouldFocusAnswerInput({ ...ready, isAnswered: true })).toBe(false);
    expect(shouldFocusAnswerInput({ ...ready, isDone: true })).toBe(false);
    expect(shouldFocusAnswerInput({ ...ready, hasItems: false })).toBe(false);
  });
  it('màn cảm ứng vừa mở trang → không tự bật bàn phím ảo; máy có chuột → focus ngay', () => {
    expect(shouldFocusAnswerInput({ ...ready, hasInteracted: false })).toBe(false);
    expect(shouldFocusAnswerInput({ ...ready, hasInteracted: false, hasFinePointer: true })).toBe(true);
  });
});
