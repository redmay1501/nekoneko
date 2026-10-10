import { describe, expect, it } from 'vitest';
import { loadSeedContent } from '@/lib/data/seed-content';
import { generateDemoMemoryRecords } from '@/features/memory/demo-memory-seed';
import { createInitialMemoryRecord, toMemoryView } from '@/features/memory/memory-engine';
import type { MemoryView } from '@/features/memory/memory-types';
import { buildKnowledgeCatalog } from './knowledge-catalog';
import { type ContentKey, toContentKey } from './knowledge-types';
import { backlogKnowledge, buildLearningSession, previewSessionPlan, evaluateStepAnswer, summarizeSession, unmetKnowledgeOfDay } from './session-engine';
import { BACKLOG_PER_DAILY_SESSION, DAY_CHUNK_SIZE, SESSION_MODE_CONFIG, type SessionMode, totalSteps } from './session-modes';
import { SESSION_PHASES, gradeAnswer, phaseOfStep } from './session-types';

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

  it('ngày đang học (23) bắt đầu với 26 kiến thức chưa gặp (gồm từ N5 bổ sung), theo thứ tự bộ thủ → kanji → từ → ngữ pháp', () => {
    expect(unmetDay23).toHaveLength(26);
    const order = ['radical', 'kanji', 'vocabulary', 'grammar'];
    const typeRanks = unmetDay23.map((item) => order.indexOf(item.type));
    expect(typeRanks).toEqual([...typeRanks].sort((left, right) => left - right));
  });

  it('Học hôm nay gồm TẤT CẢ kiến thức chưa gặp của ngày, theo thứ tự, từng chặng 5 thứ', () => {
    const discovered = build('daily').steps.filter((step) => step.type === 'discover').map((step) => step.contentKey);
    expect(discovered).toEqual(unmetDay23.map((item) => item.key));
    expect(SESSION_MODE_CONFIG.daily.checkpointEvery).toBe(DAY_CHUNK_SIZE); // hết mỗi chặng hỏi "Học tiếp hay nghỉ?"
  });

  it('dừng giữa chừng thì lần sau học tiếp đúng chỗ dở (không lặp, không nhảy lung tung)', () => {
    const firstChunk = unmetDay23.slice(0, DAY_CHUNK_SIZE).map((item) => item.key);
    const afterFirstChunk = new Map(viewsDay23);
    for (const key of firstChunk) {
      const view = afterFirstChunk.get(key);
      if (view) afterFirstChunk.set(key, { ...view, encounterCount: 1 });
    }
    const discovered = build('daily', 'later', 23, afterFirstChunk).steps.filter((step) => step.type === 'discover').map((step) => step.contentKey);
    expect(discovered).toEqual(unmetDay23.slice(DAY_CHUNK_SIZE).map((item) => item.key));
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

describe('Học bù (BACKLOG) — kiến thức ngày cũ bị bỏ sót không bao giờ mất', () => {
  // Người học đang ở ngày 3: ngày 1 mới học 7/10 chữ rồi bấm "Hoàn thành", ngày 2 bỏ qua hẳn.
  const dayOne = catalog.items.filter((item) => item.day === 1);
  const metOnDayOne = new Set(dayOne.slice(0, 7).map((item) => item.key));
  const views = new Map(catalog.items.map((item) => {
    const record = item.day !== null && item.day <= 3
      ? { ...createInitialMemoryRecord(item.type, item.id, NOW), encounterCount: metOnDayOne.has(item.key) ? 1 : 0, lastSeenAt: NOW.toISOString() }
      : null;
    return [item.key, toMemoryView(item.key, item.type, record, NOW)];
  }));

  it('chữ còn sót của ngày 1 và cả ngày 2 đều nằm trong Học bù, ngày cũ nhất trước', () => {
    const backlog = backlogKnowledge(catalog, views, 3);
    const dayTwo = catalog.items.filter((item) => item.day === 2);
    expect(backlog).toHaveLength(3 + dayTwo.length);
    expect(backlog.slice(0, 3).every((item) => item.day === 1)).toBe(true);
    expect(backlog.some((item) => item.day === 3)).toBe(false);
  });

  it('phiên Học hôm nay học bù tối đa vài thứ TRƯỚC, rồi mới tới chặng mới của hôm nay', () => {
    const discovered = build('daily', 'backlog-user', 3, views).steps.filter((step) => step.type === 'discover').map((step) => step.contentKey);
    const backlogKeys = new Set(backlogKnowledge(catalog, views, 3).map((item) => item.key));
    expect(discovered.slice(0, BACKLOG_PER_DAILY_SESSION).every((key) => backlogKeys.has(key))).toBe(true);
    expect(discovered.slice(BACKLOG_PER_DAILY_SESSION).every((key) => catalog.byKey.get(key)?.day === 3)).toBe(true);
    expect(discovered).toHaveLength(BACKLOG_PER_DAILY_SESSION + unmetKnowledgeOfDay(catalog, views, 3).length);
  });

  it('mỗi nhóm (học bù / hôm nay) giới thiệu xong mới luyện — không trộn lẫn', () => {
    const types = build('daily', 'backlog-user', 3, views).steps.filter((step) => step.type === 'discover' || (step.type === 'recall' && step.isPractice))
      .map((step) => (step.type === 'discover' ? 'D' : 'P')).join('');
    const today = unmetKnowledgeOfDay(catalog, views, 3).length;
    const chunks = Array.from({ length: Math.ceil(today / DAY_CHUNK_SIZE) }, (_, index) => Math.min(DAY_CHUNK_SIZE, today - index * DAY_CHUNK_SIZE));
    expect(types).toBe('D'.repeat(BACKLOG_PER_DAILY_SESSION) + 'P'.repeat(BACKLOG_PER_DAILY_SESSION)
      + chunks.map((size) => 'D'.repeat(size) + 'P'.repeat(size)).join(''));
  });

  it('chế độ Học bù chỉ lấy kiến thức ngày cũ (5 thứ cũ nhất), không lấy của hôm nay', () => {
    const plan = build('backlog', 'backlog-user', 3, views);
    const discovered = plan.steps.filter((step) => step.type === 'discover').map((step) => step.contentKey);
    expect(discovered).toEqual(backlogKnowledge(catalog, views, 3).slice(0, DAY_CHUNK_SIZE).map((item) => item.key));
    // Thẻ học bù ghi rõ "Học bù · từ ngày X".
    expect(plan.steps.filter((step) => step.type === 'discover').every((step) => step.type === 'discover' && step.fromDay === catalog.byKey.get(step.contentKey)?.day)).toBe(true);
  });

  it('học xong thì rời Học bù; không còn gì thì Học bù trống', () => {
    expect(backlogKnowledge(catalog, viewsDay23, 23)).toEqual([]);
  });
});

describe('Chặng của một ngày học: Gặp lại → Học bù → Mới → Dùng thử', () => {
  const order = (phase: string) => SESSION_PHASES.indexOf(phase as (typeof SESSION_PHASES)[number]);

  it('mọi bước đều có chặng, và chặng chỉ đi tới — không quay lại', () => {
    for (const mode of ['daily', 'flow', 'random', 'more'] as const) {
      const phases = build(mode).steps.map((step) => step.phase);
      expect(phases.every(Boolean)).toBe(true);
      expect(phases.map((phase) => order(phase!))).toEqual([...phases.map((phase) => order(phase!))].sort((a, b) => a - b));
    }
  });

  it('Học hôm nay của người học giữa lộ trình có đủ chặng ôn, mới và dùng thử', () => {
    const phases = new Set(build('daily').steps.map((step) => step.phase));
    expect([...phases]).toEqual(['review', 'new', 'use']);
  });

  it('kiến thức học bù được gắn chặng "backlog", kể cả câu luyện ngay của nó', () => {
    const dayOne = catalog.items.filter((item) => item.day === 1);
    const views = new Map(catalog.items.map((item) => [item.key, toMemoryView(item.key, item.type,
      item.day !== null && item.day <= 2 ? { ...createInitialMemoryRecord(item.type, item.id, NOW), encounterCount: dayOne.indexOf(item) >= 0 && dayOne.indexOf(item) < 5 ? 1 : 0 } : null, NOW)]));
    const steps = build('daily', 'p', 2, views).steps;
    const backlogKeys = new Set(steps.filter((step) => step.phase === 'backlog').map((step) => step.contentKey));
    expect(backlogKeys.size).toBeGreaterThan(0);
    expect([...backlogKeys].every((key) => catalog.byKey.get(key)?.day === 1)).toBe(true);
    expect(steps.filter((step) => step.phase === 'new').every((step) => catalog.byKey.get(step.contentKey)?.day === 2)).toBe(true);
  });
});

describe('Tổng kết nói đúng sự thật', () => {
  type Answered = Parameters<typeof summarizeSession>[0][number];
  const step = (overrides: Partial<Answered>): Answered => ({
    stepType: 'recall', contentKey: 'hiragana-1', face: 'あ', isCorrect: true, daysSinceSeenBefore: 3, ...overrides,
  });

  it('câu luyện ngay của thứ vừa học không tính là "nhớ lại"', () => {
    const summary = summarizeSession([step({}), step({ contentKey: 'hiragana-2' as Answered['contentKey'], isPractice: true, daysSinceSeenBefore: 0 })]);
    expect(summary.recalled).toBe(1);
  });

  it('không có câu "nhớ lại sau 0 ngày" — chỉ nổi bật khi đã cách ít nhất một ngày', () => {
    expect(summarizeSession([step({ daysSinceSeenBefore: 0 })]).highlight).toBeNull();
    expect(summarizeSession([step({ daysSinceSeenBefore: 2 })]).highlight?.daysSinceSeen).toBe(2);
  });
});

describe('previewSessionPlan (kế hoạch trên Trang chủ)', () => {
  it.each([1, 15, 26, 60])('ngày %i: số kiến thức mỗi chặng khớp phiên thật, với seed nào cũng vậy', (journeyDay) => {
    const memoryViews = memoryViewsAtDay(journeyDay);
    const plan = previewSessionPlan({ mode: 'daily', catalog, memoryViews, journeyDay });
    for (const seed of ['a', 'b', 'c']) {
      const { steps } = buildLearningSession({ mode: 'daily', seed, catalog, memoryViews, journeyDay });
      for (const phase of SESSION_PHASES) {
        const keys = new Set(steps.filter((step) => phaseOfStep(step) === phase).map((step) => step.contentKey));
        expect(keys.size, `${phase} @ seed ${seed}`).toBe(plan[phase]);
      }
    }
  });

  it('người mới (ngày 1, chưa học gì): chỉ có chặng Mới', () => {
    const fresh = new Map(catalog.items.map((item) => [item.key, toMemoryView(item.key, item.type, null, NOW)]));
    const plan = previewSessionPlan({ mode: 'daily', catalog, memoryViews: fresh, journeyDay: 1 });
    expect(plan).toEqual({ review: 0, backlog: 0, new: plan.new, use: 0 });
    expect(plan.new).toBeGreaterThan(0);
  });
});

describe('phương án nhiễu chỉ từ thứ đã biết', () => {
  it('ngày 1 (chưa học gì): luyện chặng あいうえお chỉ có a/i/u/e/o — không có "ki", "ko"…', () => {
    const fresh = new Map(catalog.items.map((item) => [item.key, toMemoryView(item.key, item.type, null, NOW)]));
    const { steps } = buildLearningSession({ mode: 'daily', seed: 's', catalog, memoryViews: fresh, journeyDay: 1 });
    const firstChunk = new Set(steps.filter((step) => step.type === 'discover').slice(0, 5).map((step) => catalog.byKey.get(step.contentKey)!.reading));
    const practice = steps.filter((step) => step.type === 'recall' && step.isPractice).slice(0, 5);
    expect(practice.length).toBe(5);
    for (const step of practice) if (step.type === 'recall') for (const option of step.options) expect(firstChunk).toContain(option);
  });

  it.each([1, 15, 26, 60])('ngày %i: mọi phương án Gặp lại / Luyện ngay là cách đọc / nghĩa của thứ đã biết', (journeyDay) => {
    const memoryViews = memoryViewsAtDay(journeyDay);
    const { steps } = buildLearningSession({ mode: 'daily', seed: 'k', catalog, memoryViews, journeyDay });
    const known = new Set([...memoryViews.values()].filter((view) => view.isLearned).map((view) => view.contentKey));
    for (const step of steps) if (step.type === 'discover') known.add(step.contentKey);
    // Dự phòng hợp lệ: chưa đủ thứ đã biết cùng loại (mẫu câu đầu tiên) → mượn thứ CÙNG NGÀY, cũng được dạy trong phiên này.
    for (const item of catalog.items) if (item.day === journeyDay) known.add(item.key);
    const knownAnswers = new Set([...known].flatMap((key) => { const item = catalog.byKey.get(key)!; return [item.reading, item.meaning]; }));
    for (const step of steps) {
      if (step.type !== 'recall') continue;
      for (const option of step.options) expect(knownAnswers, `${step.face}: ${option}`).toContain(option);
    }
  });
});

describe('Học theo lựa chọn (focus)', () => {
  const buildFocus = (focusKeys: ContentKey[], views = viewsDay23, seed = 'focus-seed') =>
    buildLearningSession({ mode: 'focus', seed, catalog, memoryViews: views, journeyDay: 23, focusKeys });
  const isMet = (key: ContentKey) => (viewsDay23.get(key)?.encounterCount ?? 0) > 0;
  const kanji = catalog.items.filter((item) => item.type === 'kanji');
  const metKanji = kanji.filter((item) => isMet(item.key)).slice(0, 3).map((item) => item.key);
  const newKanji = kanji.filter((item) => !isMet(item.key)).slice(0, 7).map((item) => item.key);

  it('chỉ dùng đúng những kiến thức được chọn', () => {
    const keys = new Set(buildFocus([...metKanji, ...newKanji]).steps.map((step) => step.contentKey));
    expect([...keys].sort()).toEqual([...metKanji, ...newKanji].sort());
  });

  it('thứ đã gặp → hỏi lại trước (chặng Gặp lại); thứ chưa gặp → giới thiệu rồi luyện ngay theo chặng 5', () => {
    const plan = buildFocus([...newKanji, ...metKanji]);
    const review = plan.steps.slice(0, metKanji.length);
    expect(review.every((step) => step.type === 'recall' && !step.isPractice && step.phase === 'review')).toBe(true);
    const rest = plan.steps.slice(metKanji.length).map((step) => (step.type === 'discover' ? 'D' : 'P')).join('');
    expect(rest).toBe('DDDDDPPPPPDDPP');
  });

  it('chưa giới thiệu thì không hỏi: mỗi câu về thứ mới đều đứng sau thẻ giới thiệu của nó', () => {
    const plan = buildFocus(newKanji);
    plan.steps.forEach((step, index) => {
      if (step.type === 'discover') return;
      expect(plan.steps.slice(0, index).some((earlier) => earlier.type === 'discover' && earlier.contentKey === step.contentKey)).toBe(true);
    });
  });

  it('từ vựng đã học hỏi NGHĨA (từ viết bằng kana hỏi cách đọc thì đáp án là mặt chữ)', () => {
    const word = catalog.items.find((item) => item.type === 'vocabulary' && isMet(item.key))!;
    const [step] = buildFocus([word.key]).steps;
    expect(step.type === 'recall' && step.correctAnswer).toBe(word.meaning);
  });

  it('mẫu câu đã học → chọn câu đúng, nằm ở chặng Gặp lại', () => {
    const pattern = catalog.items.find((item) => item.type === 'grammar' && isMet(item.key));
    if (!pattern) return;
    const [step] = buildFocus([pattern.key]).steps;
    expect(step.type).toBe('use');
    expect(step.phase).toBe('review');
  });

  it('bỏ khoá không có thật, bỏ trùng, tối đa 20', () => {
    const many = catalog.items.filter((item) => item.type === 'vocabulary').slice(0, 30).map((item) => item.key);
    const plan = buildFocus([...many, many[0], 'kanji-99999' as ContentKey]);
    expect(new Set(plan.steps.map((step) => step.contentKey)).size).toBe(20);
  });

  it('không chọn gì → phiên rỗng (màn hình mời chọn kiến thức)', () => {
    expect(buildFocus([]).steps).toEqual([]);
  });
});
