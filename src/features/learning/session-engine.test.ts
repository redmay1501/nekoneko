import { describe, expect, it } from 'vitest';
import { loadSeedContent } from '@/lib/data/seed-content';
import { generateDemoMemoryRecords } from '@/features/memory/demo-memory-seed';
import { createInitialMemoryRecord, toMemoryView } from '@/features/memory/memory-engine';
import type { MemoryView } from '@/features/memory/memory-types';
import { buildKnowledgeCatalog } from './knowledge-catalog';
import { type ContentKey, toContentKey } from './knowledge-types';
import { buildLearningSession, evaluateStepAnswer, summarizeSession, unmetKnowledgeOfDay } from './session-engine';
import { DAY_CHUNK_SIZE, SESSION_MODE_CONFIG, type SessionMode, totalSteps } from './session-modes';
import { gradeAnswer } from './session-types';

const NOW = new Date('2026-10-03T08:00:00.000Z');
const catalog = buildKnowledgeCatalog(loadSeedContent());

function memoryViewsAtDay(journeyDay: number): Map<ContentKey, MemoryView> {
  const records = generateDemoMemoryRecords(catalog.items, journeyDay, NOW);
  const recordByKey = new Map(records.map((record) => [toContentKey(record.contentType, record.contentId), record]));
  return new Map(catalog.items.map((item) => [item.key, toMemoryView(item.key, item.type, recordByKey.get(item.key) ?? null, NOW)]));
}

const viewsDay23 = memoryViewsAtDay(23);
const build = (mode: SessionMode, seed = 'test-seed', journeyDay = 23, views = viewsDay23) =>
  buildLearningSession({ mode, seed, catalog, memoryViews: views, journeyDay });

describe('buildLearningSession — dùng chung cho mọi chế độ', () => {
  const fixedSizeModes = (Object.keys(SESSION_MODE_CONFIG) as SessionMode[])
    .filter((mode) => SESSION_MODE_CONFIG[mode].newKnowledgeScope === 'next-chunk');
  it.each(fixedSizeModes)('chế độ %s tạo đúng số bước cấu hình', (mode) => {
    const plan = build(mode);
    expect(plan.steps.length).toBe(totalSteps(SESSION_MODE_CONFIG[mode].composition));
  });

  it('phiên hôm nay mở đầu bằng một lần Gặp lại bất ngờ', () => {
    expect(build('daily').steps[0].type).toBe('surprise');
  });

  it('không có kiến thức nào lặp lại trong cùng một phiên — trừ câu luyện ngay thứ vừa giới thiệu', () => {
    const keys = build('flow').steps.filter((step) => !(step.type === 'recall' && step.isPractice)).map((step) => step.contentKey);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('giới thiệu trước rồi mới luyện: mỗi câu luyện ngay là thứ đã được giới thiệu ở bước trước đó', () => {
    const plan = build('daily');
    plan.steps.forEach((step, index) => {
      if (step.type !== 'recall' || !step.isPractice) return;
      const introducedBefore = plan.steps.slice(0, index).some((earlier) => earlier.type === 'discover' && earlier.contentKey === step.contentKey);
      expect(introducedBefore).toBe(true);
    });
    const discoverCount = plan.steps.filter((step) => step.type === 'discover').length;
    expect(plan.steps.filter((step) => step.type === 'recall' && step.isPractice)).toHaveLength(discoverCount);
  });

  it('Học hết ngày: mỗi chặng giới thiệu xong mới luyện, rồi mới sang chặng sau', () => {
    const types = build('day').steps.filter((step) => step.type !== 'use')
      .map((step) => (step.type === 'discover' ? 'D' : 'P')).join('');
    expect(types).toMatch(/^(D{1,5}P{1,5})+$/);
  });

  it('chỉ số bước liên tục từ 0', () => {
    const plan = build('daily');
    expect(plan.steps.map((step) => step.stepIndex)).toEqual(plan.steps.map((_, index) => index));
  });

  it('cùng seed cho cùng một phiên (tất định)', () => {
    expect(build('random', 'abc')).toEqual(build('random', 'abc'));
  });

  it('Học thêm không mở đầu bằng gặp lại bất ngờ và có kiến thức mới', () => {
    const plan = build('more');
    expect(plan.steps.some((step) => step.type === 'surprise')).toBe(false);
    expect(plan.steps.some((step) => step.type === 'discover')).toBe(true);
  });

  it('Ôn lại sau khi nghỉ chỉ lấy kiến thức đang mờ, không đưa kiến thức mới', () => {
    const plan = build('rescue');
    expect(plan.steps.every((step) => step.type === 'recall')).toBe(true);
    for (const step of plan.steps) {
      expect(['fading', 'weak']).toContain(viewsDay23.get(step.contentKey)?.status);
    }
  });

  it('kiến thức mới lấy đúng từ ngày đang học trên lộ trình', () => {
    const discoverSteps = build('discover').steps;
    for (const step of discoverSteps) {
      expect(catalog.byKey.get(step.contentKey)?.day).toBe(23);
    }
  });

  it('ngày 1 của người mới (chưa nhớ gì): chỉ giới thiệu Hiragana rồi luyện ngay — không hỏi thứ chưa học', () => {
    const emptyViews = new Map(catalog.items.map((item) => [item.key, toMemoryView(item.key, item.type, null, NOW)]));
    const plan = build('daily', 'new-user', 1, emptyViews);
    expect(plan.steps.length).toBeGreaterThan(0);
    expect(plan.steps.every((step) => step.type === 'discover' || (step.type === 'recall' && step.isPractice))).toBe(true);
    expect(plan.steps.every((step) => step.contentKey.startsWith('hiragana'))).toBe(true);
  });

  it('kiến thức lộ trình đã gieo nhưng CHƯA GẶP không bị hỏi ở bước gặp lại / bất ngờ', () => {
    // Đúng tình huống tài khoản mới: tới ngày 1 là có bản ghi (điểm khởi đầu) nhưng chưa gặp lần nào.
    const seededViews = new Map(catalog.items.map((item) => [item.key, toMemoryView(item.key, item.type,
      item.day === 1 ? createInitialMemoryRecord(item.type, item.id, NOW) : null, NOW)]));
    const plan = build('daily', 'new-user', 1, seededViews);
    expect(plan.steps.some((step) => step.type === 'surprise' || (step.type === 'recall' && !step.isPractice))).toBe(false);
  });

  it('bước trắc nghiệm có 4 lựa chọn khác nhau và chứa đáp án đúng', () => {
    for (const step of build('flow').steps) {
      if (step.type === 'recall' || step.type === 'use') {
        expect(new Set(step.options).size).toBe(step.options.length);
        expect(step.options).toContain(step.correctAnswer);
      }
    }
  });

  it('trình duyệt và server chấm cùng một kết quả cho mọi lựa chọn', () => {
    for (const step of build('flow').steps) {
      const answers = step.type === 'recall' || step.type === 'use' ? step.options : ['remembered', 'forgot', 'acknowledged'];
      for (const answer of answers) expect(gradeAnswer(step, answer)).toBe(evaluateStepAnswer(step, answer));
    }
  });
});

describe('kiến thức mới đi theo chặng của ngày đang học', () => {
  const unmetDay23 = unmetKnowledgeOfDay(catalog, viewsDay23, 23);

  it('ngày đang học (23) bắt đầu với 13 kiến thức chưa gặp, theo thứ tự bộ thủ → kanji → từ → ngữ pháp', () => {
    expect(unmetDay23).toHaveLength(13);
    const order = ['radical', 'kanji', 'vocabulary', 'grammar'];
    const typeRanks = unmetDay23.map((item) => order.indexOf(item.type));
    expect(typeRanks).toEqual([...typeRanks].sort((left, right) => left - right));
  });

  it('Học hôm nay đi đúng MỘT chặng 5 kiến thức đầu tiên chưa gặp', () => {
    const discovered = build('daily').steps.filter((step) => step.type === 'discover').map((step) => step.contentKey);
    expect(discovered).toEqual(unmetDay23.slice(0, DAY_CHUNK_SIZE).map((item) => item.key));
  });

  it('dừng giữa chừng thì lần sau học tiếp đúng chỗ dở (không lặp, không nhảy lung tung)', () => {
    const firstChunk = unmetDay23.slice(0, DAY_CHUNK_SIZE).map((item) => item.key);
    const afterFirstChunk = new Map(viewsDay23);
    for (const key of firstChunk) {
      const view = afterFirstChunk.get(key);
      if (view) afterFirstChunk.set(key, { ...view, encounterCount: 1 });
    }
    const discovered = build('daily', 'later', 23, afterFirstChunk).steps.filter((step) => step.type === 'discover').map((step) => step.contentKey);
    expect(discovered).toEqual(unmetDay23.slice(DAY_CHUNK_SIZE, DAY_CHUNK_SIZE * 2).map((item) => item.key));
  });

  it('Học hết ngày gồm TẤT CẢ kiến thức còn lại của ngày, rồi luyện mẫu câu của chính ngày đó', () => {
    const plan = build('day');
    const discovered = plan.steps.filter((step) => step.type === 'discover').map((step) => step.contentKey);
    expect(discovered).toEqual(unmetDay23.map((item) => item.key));
    const firstUse = plan.steps.find((step) => step.type === 'use');
    expect(firstUse && catalog.byKey.get(firstUse.contentKey)?.day).toBe(23);
  });

  it('không lấn sang kiến thức của ngày sau khi ngày đang học đã gặp hết', () => {
    const allMet = new Map([...viewsDay23].map(([key, view]) => [key, { ...view, encounterCount: Math.max(1, view.encounterCount) }]));
    expect(build('day', 'x', 23, allMet).steps.some((step) => step.type === 'discover')).toBe(false);
  });
});

describe('evaluateStepAnswer', () => {
  const plan = build('daily');
  it('Gặp lại bất ngờ: "Tôi nhớ" là đúng, "Chưa nhớ" là sai', () => {
    const surprise = plan.steps[0];
    expect(evaluateStepAnswer(surprise, 'remembered')).toBe(true);
    expect(evaluateStepAnswer(surprise, 'forgot')).toBe(false);
  });
  it('Khám phá không có đúng/sai', () => {
    const discover = plan.steps.find((step) => step.type === 'discover');
    expect(discover && evaluateStepAnswer(discover, 'acknowledged')).toBeNull();
  });
  it('Trắc nghiệm chấm theo đáp án lưu ở server', () => {
    const recall = plan.steps.find((step) => step.type === 'recall');
    if (!recall || recall.correctAnswer === null) throw new Error('Thiếu bước nhớ lại');
    expect(evaluateStepAnswer(recall, recall.correctAnswer)).toBe(true);
    expect(evaluateStepAnswer(recall, 'đáp án sai')).toBe(false);
  });
});

describe('summarizeSession — Khoảnh khắc tiến bộ', () => {
  it('đếm đúng ba con số và chọn mục nhớ lại sau lâu nhất làm điểm nhấn', () => {
    const summary = summarizeSession([
      { stepType: 'surprise', contentKey: 'vocabulary-30', face: '日本', isCorrect: true, daysSinceSeenBefore: 6 },
      { stepType: 'recall', contentKey: 'vocabulary-5', face: '先生', isCorrect: true, daysSinceSeenBefore: 3 },
      { stepType: 'recall', contentKey: 'vocabulary-90', face: '病院', isCorrect: false, daysSinceSeenBefore: 9 },
      { stepType: 'discover', contentKey: 'kanji-40', face: '時', isCorrect: null, daysSinceSeenBefore: null },
      { stepType: 'use', contentKey: 'grammar-1', face: 'N は N です', isCorrect: true, daysSinceSeenBefore: 2 },
    ]);
    expect(summary).toEqual({
      recalled: 2, learnedNew: 1, usedInContext: 1, missed: 1, highlight: { contentKey: 'vocabulary-30', face: '日本', daysSinceSeen: 6 },
    });
  });

  it('phiên chưa trả lời gì vẫn tổng kết được', () => {
    expect(summarizeSession([])).toEqual({ recalled: 0, learnedNew: 0, usedInContext: 0, missed: 0, highlight: null });
  });
});
