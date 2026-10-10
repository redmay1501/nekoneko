import { pickDeterministic, shuffleDeterministic } from '@/lib/utils/deterministic-random';
import { realSentenceBlank } from './context-index';
import {
  getForgettingRadar,
  getReviewPriority,
  pickMemorySurprise,
} from '@/features/memory/memory-engine';
import { REVIEW_EVENT_TYPES, type ReviewEventType } from '@/features/memory/memory-types';
import type { MemoryView } from '@/features/memory/memory-types';
import { type KnowledgeCatalog, itemsScheduledOn, itemsScheduledUpTo } from './knowledge-catalog';
import { buildDiscoverCard } from './knowledge-presenter';
import { speechTextFor } from './speech-text';
import { MIN_ENCOUNTERS_TO_COUNT_AS_MET } from '@/features/roadmap/journey-progress';
import type { ContentKey, ContentType, KnowledgeItem } from './knowledge-types';
import { toContentKey } from './knowledge-types';
import { DAY_CHUNK_SIZE, MAX_FOCUS_ITEMS, SESSION_MODES, SESSION_MODE_CONFIG, type SessionMode } from './session-modes';
import {
  SESSION_PHASES,
  gradeAnswer,
  phaseOfStep,
  type AnsweredStep,
  type SessionPhase,
  type LearningSessionPlan,
  type SessionStepWithAnswer,
  type SessionSummary,
} from './session-types';

/**
 * ═══════════════════════════════════════════════════════════════════
 *  LEARNING SESSION ENGINE — một bộ máy cho mọi kiểu học
 * ═══════════════════════════════════════════════════════════════════
 *
 *  Đầu vào : chế độ, seed, danh mục kiến thức, trạng thái trí nhớ, ngày lộ trình.
 *  Đầu ra  : danh sách bước học (kèm đáp án — chỉ dùng ở server).
 *
 *  Thứ tự một phiên: Gặp lại bất ngờ → Gặp lại → [Khám phá một chặng → Luyện ngay chặng đó]… → Dùng trong câu.
 *  Kiến thức mới luôn được GIỚI THIỆU trước rồi mới hỏi; thứ chưa gặp không bao giờ xuất hiện ở bước hỏi.
 *  Kết phiên là Khoảnh khắc tiến bộ (do màn hình hiển thị, không phải một bước).
 *
 *  Hàm thuần, tất định theo seed. Tài liệu: docs/session-engine.md
 * ═══════════════════════════════════════════════════════════════════
 */

const OPTION_COUNT = 4;
/** Có ít nhất chừng này thứ đã biết cùng loại thì chỉ dùng chúng làm phương án (câu có thể chỉ 2–3 lựa chọn). */
const MIN_KNOWN_DISTRACTORS = 2;
const MEANING_TYPES: readonly ContentType[] = ['radical', 'kanji', 'vocabulary'];
/** Lấy rộng gấp 3 lần số cần rồi mới chọn — để mỗi phiên có chút khác nhau mà vẫn ưu tiên đúng. */
const CANDIDATE_POOL_MULTIPLIER = 3;
const MIN_CANDIDATE_POOL = 12;

export interface BuildLearningSessionInput {
  mode: SessionMode;
  seed: string;
  catalog: KnowledgeCatalog;
  memoryViews: ReadonlyMap<ContentKey, MemoryView>;
  journeyDay: number;
  /** Chế độ "focus": đúng những kiến thức người học chọn (đã lọc hợp lệ, tối đa MAX_FOCUS_ITEMS). */
  focusKeys?: readonly ContentKey[];
}

function buildOptions(correct: string, distractorPool: readonly string[], seed: string): string[] {
  const distractors = pickDeterministic(
    [...new Set(distractorPool)].filter((option) => option && option !== correct),
    OPTION_COUNT - 1,
    `${seed}:distractors`,
  );
  return shuffleDeterministic([correct, ...distractors], `${seed}:order`);
}

/**
 * Phương án nhiễu CHỈ lấy từ thứ người học đã biết (đã học + đã được giới thiệu trong phiên này):
 * có chữ lạ chưa học thì người học đoán được đáp án bằng cách loại trừ, không phải nhớ.
 * Ưu tiên cùng ngày (あ/お, い/こ… phải phân biệt thật). Chưa đủ thứ đã biết (rất hiếm, ví dụ từ vựng đầu tiên)
 * thì mới mượn thứ cùng ngày, rồi cùng loại.
 */
function knownDistractors(item: KnowledgeItem, catalog: KnowledgeCatalog, known: ReadonlySet<ContentKey>): KnowledgeItem[] {
  const sameType = catalog.items.filter((candidate) => candidate.type === item.type && candidate.key !== item.key);
  const knownSameType = sameType.filter((candidate) => known.has(candidate.key));
  if (knownSameType.length >= MIN_KNOWN_DISTRACTORS) return knownSameType;
  // Thứ có NGHĨA (bộ thủ, kanji, từ) dùng chung được: kanji đầu tiên thì nhiễu bằng nghĩa của bộ thủ / từ đã biết.
  if (MEANING_TYPES.includes(item.type)) {
    const knownWithMeaning = catalog.items.filter((candidate) => candidate.key !== item.key && known.has(candidate.key) && MEANING_TYPES.includes(candidate.type));
    if (knownWithMeaning.length >= MIN_KNOWN_DISTRACTORS) return knownWithMeaning;
  }
  // Dự phòng: thêm thứ CÙNG NGÀY (cũng được dạy trong phiên này) — câu có thể chỉ còn 3 lựa chọn, vẫn hơn dùng thứ chưa học.
  const knownOrToday = [...new Set([...knownSameType, ...sameType.filter((candidate) => candidate.day === item.day)])];
  return knownOrToday.length >= MIN_KNOWN_DISTRACTORS ? knownOrToday : [...knownOrToday, ...sameType];
}

function selectRecallItems(input: BuildLearningSessionInput, count: number, excluded: Set<ContentKey>): KnowledgeItem[] {
  if (count <= 0) return [];
  const { catalog, memoryViews, mode, seed } = input;
  const learnedViews = [...memoryViews.values()].filter((view) => view.isLearned && view.contentType !== 'grammar');
  const config = SESSION_MODE_CONFIG[mode];

  const prioritized = config.recallSource === 'at-risk'
    ? getForgettingRadar(learnedViews, Number.MAX_SAFE_INTEGER)
    : [...learnedViews].sort((left, right) => getReviewPriority(left) - getReviewPriority(right));
  // Không đủ mục sắp quên thì bù bằng mục đến hạn — người dùng không bao giờ gặp phiên rỗng vô lý.
  const fallback = [...learnedViews].sort((left, right) => getReviewPriority(left) - getReviewPriority(right));
  const ordered = [...prioritized, ...fallback.filter((view) => !prioritized.includes(view))]
    .filter((view) => !excluded.has(view.contentKey));

  const poolSize = Math.max(count * CANDIDATE_POOL_MULTIPLIER, MIN_CANDIDATE_POOL);
  const pool = config.recallSource === 'at-risk' ? ordered.slice(0, count) : ordered.slice(0, poolSize);
  return pickDeterministic(pool, count, `${seed}:recall`)
    .map((view) => catalog.byKey.get(view.contentKey))
    .filter((item): item is KnowledgeItem => Boolean(item));
}

/**
 * Thứ tự giới thiệu kiến thức mới trong một ngày — đi từ mảnh nhỏ tới câu:
 * chữ cái → bộ thủ → kanji → từ vựng → ngữ pháp (Bộ thủ ↔ Kanji ↔ Từ ↔ Câu).
 */
const NEW_KNOWLEDGE_ORDER: readonly ContentType[] = ['hiragana', 'katakana', 'radical', 'kanji', 'vocabulary', 'grammar'];

/** Kiến thức của ngày đang học mà người học CHƯA gặp, theo thứ tự cố định. */
export function unmetKnowledgeOfDay(
  catalog: KnowledgeCatalog,
  memoryViews: ReadonlyMap<ContentKey, MemoryView>,
  journeyDay: number,
): KnowledgeItem[] {
  return itemsScheduledOn(catalog, journeyDay)
    .filter((item) => (memoryViews.get(item.key)?.encounterCount ?? 0) < MIN_ENCOUNTERS_TO_COUNT_AS_MET)
    .sort((left, right) =>
      NEW_KNOWLEDGE_ORDER.indexOf(left.type) - NEW_KNOWLEDGE_ORDER.indexOf(right.type) || left.id - right.id);
}

/**
 * HỌC BÙ (BACKLOG): kiến thức của các ngày TRƯỚC ngày đang học mà người học chưa gặp lần nào — ví dụ bấm
 * "Hoàn thành ngày" khi còn sót, hoặc bỏ dở. Suy ra từ trí nhớ (không có bảng riêng) nên không bao giờ mất:
 * còn chưa gặp thì vẫn nằm đây. Ngày cũ nhất trước, trong ngày theo thứ tự cố định.
 */
export function backlogKnowledge(
  catalog: KnowledgeCatalog,
  memoryViews: ReadonlyMap<ContentKey, MemoryView>,
  journeyDay: number,
): KnowledgeItem[] {
  return itemsScheduledUpTo(catalog, journeyDay - 1)
    .filter((item) => (memoryViews.get(item.key)?.encounterCount ?? 0) < MIN_ENCOUNTERS_TO_COUNT_AS_MET)
    .sort((left, right) => (left.day ?? 0) - (right.day ?? 0)
      || NEW_KNOWLEDGE_ORDER.indexOf(left.type) - NEW_KNOWLEDGE_ORDER.indexOf(right.type) || left.id - right.id);
}

/**
 * Kiến thức mới của phiên, theo hai nhóm học riêng (mỗi nhóm giới thiệu xong mới luyện):
 *  1. học bù — tối đa backlogPerSession thứ của ngày cũ;
 *  2. hôm nay — phần KẾ TIẾP của ngày đang học, không chọn ngẫu nhiên (dừng ở đâu lần sau học tiếp đúng chỗ đó).
 */
function selectDiscoverGroups(input: BuildLearningSessionInput, count: number, excluded: Set<ContentKey>): { phase: SessionPhase; items: KnowledgeItem[] }[] {
  const { catalog, memoryViews, journeyDay, mode } = input;
  const config = SESSION_MODE_CONFIG[mode];
  const backlog = backlogKnowledge(catalog, memoryViews, journeyDay).filter((item) => !excluded.has(item.key)).slice(0, config.backlogPerSession);
  if (config.newKnowledgeScope === 'backlog-only') return [{ phase: 'backlog', items: backlog }];
  const unmet = unmetKnowledgeOfDay(catalog, memoryViews, journeyDay).filter((item) => !excluded.has(item.key));
  const today = config.newKnowledgeScope === 'rest-of-day' ? unmet : unmet.slice(0, Math.max(0, count));
  return [{ phase: 'backlog' as const, items: backlog }, { phase: 'new' as const, items: today }].filter((group) => group.items.length > 0);
}

function buildRecallStep(item: KnowledgeItem, catalog: KnowledgeCatalog, stepIndex: number, seed: string, known: ReadonlySet<ContentKey>): SessionStepWithAnswer {
  const sameType = knownDistractors(item, catalog, known);
  return {
    type: 'recall', stepIndex, contentKey: item.key, face: item.face,
    question: item.type === 'vocabulary' || item.type === 'kanji' ? 'Từ này đọc là gì?' : 'Chữ này đọc là gì?',
    options: buildOptions(item.reading, sameType.map((candidate) => candidate.reading), `${seed}:${item.key}`),
    correctAnswer: item.reading,
  };
}

/** Loại kiến thức mà câu luyện ngay hỏi CÁCH ĐỌC (chữ cái); các loại khác hỏi NGHĨA. */
const PRACTICE_BY_READING: readonly ContentType[] = ['hiragana', 'katakana'];

/**
 * Câu luyện ngay sau khi vừa giới thiệu: chữ cái → đọc là gì; bộ thủ/kanji/từ → nghĩa là gì.
 * Hỏi nghĩa (không hỏi cách đọc) vì từ viết bằng kana thì "cách đọc" chính là mặt chữ — hỏi vậy vô nghĩa.
 */
function buildPracticeStep(item: KnowledgeItem, catalog: KnowledgeCatalog, stepIndex: number, seed: string, known: ReadonlySet<ContentKey>): SessionStepWithAnswer {
  const distractorItems = knownDistractors(item, catalog, known);
  const byReading = PRACTICE_BY_READING.includes(item.type);
  const correctAnswer = byReading ? item.reading : item.meaning;
  return {
    type: 'recall', isPractice: true, stepIndex, contentKey: item.key, face: item.face,
    question: byReading ? 'Chữ bạn vừa học đọc là gì?' : 'Bạn vừa học — nó nghĩa là gì?',
    options: buildOptions(correctAnswer, distractorItems.map((candidate) => (byReading ? candidate.reading : candidate.meaning)), `${seed}:practice:${item.key}`),
    correctAnswer,
  };
}

/** Giới thiệu từng chặng (tối đa DAY_CHUNK_SIZE thứ), mỗi chặng xong thì luyện ngay đúng những thứ vừa học. */
function buildDiscoverAndPracticeSteps(
  items: KnowledgeItem[], input: BuildLearningSessionInput, firstIndex: number, phase: SessionPhase, known: Set<ContentKey>,
): SessionStepWithAnswer[] {
  const steps: SessionStepWithAnswer[] = [];
  for (let start = 0; start < items.length; start += DAY_CHUNK_SIZE) {
    const chunk = items.slice(start, start + DAY_CHUNK_SIZE);
    // Giới thiệu xong chặng này thì nó thành "đã biết" — phương án luyện ngay lấy từ chính chặng + thứ đã học.
    for (const item of chunk) known.add(item.key);
    for (const item of chunk) {
      steps.push({
        type: 'discover', stepIndex: firstIndex + steps.length, contentKey: item.key, phase,
        card: buildDiscoverCard(item, input.catalog, input.journeyDay, input.memoryViews), correctAnswer: null,
        ...(phase === 'backlog' && item.day !== null ? { fromDay: item.day } : {}),
      });
    }
    // Đảo thứ tự để luyện thật sự là nhớ lại, không phải đọc lại theo đúng thứ tự vừa xem.
    for (const item of shuffleDeterministic(chunk, `${input.seed}:practice-order:${start}`)) {
      steps.push({ ...buildPracticeStep(item, input.catalog, firstIndex + steps.length, input.seed, known), phase });
    }
  }
  return steps;
}

function buildUseSteps(
  input: BuildLearningSessionInput, count: number, firstIndex: number, excluded: Set<ContentKey>, known: ReadonlySet<ContentKey>,
): SessionStepWithAnswer[] {
  if (count <= 0) return [];
  const { catalog, memoryViews, journeyDay, seed } = input;
  const learnedGrammar = catalog.content.grammar.filter((pattern) => pattern.day !== null && pattern.day <= journeyDay);
  if (!learnedGrammar.length) return []; // Giai đoạn bảng chữ cái chưa có mẫu câu để dùng.

  const learnedVocabulary = catalog.content.vocabulary.filter((word) => memoryViews.get(toContentKey('vocabulary', word.id))?.isLearned);
  const template = catalog.content.practiceTemplates[0];
  // Phiên "Học hết ngày": ưu tiên luyện đúng mẫu câu của ngày đó.
  const todaysGrammar = SESSION_MODE_CONFIG[input.mode].newKnowledgeScope === 'rest-of-day'
    ? learnedGrammar.filter((pattern) => pattern.day === journeyDay) : [];
  const grammarPicks = [...todaysGrammar, ...pickDeterministic(learnedGrammar.filter((pattern) => !todaysGrammar.includes(pattern)), count, `${seed}:use`)]
    .slice(0, count);
  const steps: SessionStepWithAnswer[] = [];
  // Câu nhiễu: câu mẫu của ngữ pháp đã biết (bỏ câu dạng bảng chia "書きます → 書いて").
  const isSentence = (sentence: string) => Boolean(sentence) && !/[→/／]/.test(sentence);
  const knownSentences = learnedGrammar.filter((pattern) => known.has(toContentKey('grammar', pattern.id))).map((pattern) => pattern.exampleJp).filter(isSentence);
  const sentencePool = knownSentences.length >= MIN_KNOWN_DISTRACTORS ? knownSentences : learnedGrammar.map((pattern) => pattern.exampleJp).filter(isSentence);

  grammarPicks.forEach((pattern, offset) => {
    const stepIndex = firstIndex + steps.length;
    const shouldFillBlank = offset % 2 === 1 && template && learnedVocabulary.length > 0;
    if (shouldFillBlank) {
      const available = learnedVocabulary.filter((candidate) => !excluded.has(toContentKey('vocabulary', candidate.id)));
      // Ưu tiên từ có câu thật (Tatoeba) — câu mẫu chung "わたしは ＿＿ です" chỉ hợp với danh từ chỉ người.
      const withRealSentence = available.filter((candidate) => {
        const candidateItem = catalog.byKey.get(toContentKey('vocabulary', candidate.id));
        return candidateItem ? realSentenceBlank(catalog, candidateItem) !== null : false;
      });
      const word = pickDeterministic(withRealSentence.length ? withRealSentence : available, 1, `${seed}:fill:${pattern.id}`)[0];
      if (word) {
        const key = toContentKey('vocabulary', word.id);
        excluded.add(key);
        // Ưu tiên câu thật có từ này (Tatoeba); chưa có thì dùng câu mẫu chung.
        const item = catalog.byKey.get(key);
        const blank = item ? realSentenceBlank(catalog, item, known) : null;
        if (blank) {
          steps.push({
            type: 'use', variant: 'fill-blank', stepIndex, contentKey: key,
            contextJp: '', sentenceJp: blank.sentenceJp, promptVi: blank.vi,
            options: buildOptions(blank.answer, blank.distractorPool, `${seed}:real:${word.id}`),
            correctAnswer: blank.answer,
          });
          return;
        }
        steps.push({
          type: 'use', variant: 'fill-blank', stepIndex, contentKey: key,
          contextJp: template.contextJp, sentenceJp: template.sentenceJp,
          promptVi: template.promptVi.replace('{meaning}', word.meaning.toLowerCase()),
          options: buildOptions(word.kana, knownDistractors(catalog.byKey.get(key)!, catalog, known).map((candidate) => candidate.reading), `${seed}:fill:${word.id}`),
          correctAnswer: word.kana,
        });
        return;
      }
    }
    const key = toContentKey('grammar', pattern.id);
    // Ngoại lệ có chủ đích: mẫu câu vừa Khám phá trong phiên "Học hết ngày" được dùng ngay trong câu.
    if (excluded.has(key) && !todaysGrammar.includes(pattern)) return;
    excluded.add(key);
    steps.push({
      type: 'use', variant: 'choose-sentence', stepIndex, contentKey: key, promptVi: pattern.exampleVi,
      options: buildOptions(pattern.exampleJp, sentencePool, `${seed}:choose:${pattern.id}`),
      correctAnswer: pattern.exampleJp,
    });
  });
  return steps;
}

/**
 * Phiên "Học theo lựa chọn": thứ ĐÃ GẶP → hỏi lại trước (biết mình còn nhớ gì); thứ CHƯA GẶP → giới thiệu từng chặng
 * rồi luyện ngay — cùng luật với phiên hằng ngày (chưa giới thiệu thì không hỏi). Mẫu câu đã học thì hỏi bằng câu ví dụ.
 */
function buildFocusSteps(input: BuildLearningSessionInput, known: Set<ContentKey>): SessionStepWithAnswer[] {
  const { catalog, memoryViews, seed } = input;
  const items = [...new Set(input.focusKeys ?? [])]
    .map((key) => catalog.byKey.get(key))
    .filter((item): item is KnowledgeItem => Boolean(item))
    .slice(0, MAX_FOCUS_ITEMS);
  const isMet = (item: KnowledgeItem) => (memoryViews.get(item.key)?.encounterCount ?? 0) >= MIN_ENCOUNTERS_TO_COUNT_AS_MET;
  const steps: SessionStepWithAnswer[] = [];
  for (const item of shuffleDeterministic(items.filter(isMet), `${seed}:focus-review`)) {
    steps.push({ ...buildFocusReviewStep(item, input, steps.length, known), phase: 'review' });
  }
  const unmet = items.filter((item) => !isMet(item))
    .sort((left, right) => NEW_KNOWLEDGE_ORDER.indexOf(left.type) - NEW_KNOWLEDGE_ORDER.indexOf(right.type));
  steps.push(...buildDiscoverAndPracticeSteps(unmet, input, steps.length, 'new', known));
  return steps;
}

/**
 * Hỏi lại một thứ đã gặp: chữ cái, Kanji → cách đọc; từ vựng, bộ thủ → nghĩa (từ viết bằng kana mà hỏi cách đọc thì
 * đáp án chính là mặt chữ); mẫu câu → chọn câu đúng.
 */
function buildFocusReviewStep(item: KnowledgeItem, input: BuildLearningSessionInput, stepIndex: number, known: ReadonlySet<ContentKey>): SessionStepWithAnswer {
  if (item.type === 'grammar') return buildGrammarCheckStep(item, input, stepIndex, known);
  if (item.type === 'vocabulary' || item.type === 'radical') {
    const step = buildPracticeStep(item, input.catalog, stepIndex, input.seed, known);
    return step.type === 'recall' ? { ...step, isPractice: false, question: 'Nó nghĩa là gì?' } : step;
  }
  return buildRecallStep(item, input.catalog, stepIndex, input.seed, known);
}

/** Mẫu câu đã học: chọn câu tiếng Nhật đúng với câu tiếng Việt (như bước Dùng trong câu). */
function buildGrammarCheckStep(item: KnowledgeItem, input: BuildLearningSessionInput, stepIndex: number, known: ReadonlySet<ContentKey>): SessionStepWithAnswer {
  const pattern = input.catalog.content.grammar.find((candidate) => toContentKey('grammar', candidate.id) === item.key)!;
  const isSentence = (sentence: string) => Boolean(sentence) && !/[→/／]/.test(sentence);
  const knownSentences = input.catalog.content.grammar
    .filter((candidate) => known.has(toContentKey('grammar', candidate.id))).map((candidate) => candidate.exampleJp).filter(isSentence);
  const pool = knownSentences.length > MIN_KNOWN_DISTRACTORS ? knownSentences : input.catalog.content.grammar.map((candidate) => candidate.exampleJp).filter(isSentence);
  return {
    type: 'use', variant: 'choose-sentence', stepIndex, contentKey: item.key, promptVi: pattern.exampleVi,
    options: buildOptions(pattern.exampleJp, pool, `${input.seed}:focus-grammar:${pattern.id}`),
    correctAnswer: pattern.exampleJp,
  };
}

/** Dựng một phiên học theo chế độ. */
export function buildLearningSession(input: BuildLearningSessionInput): LearningSessionPlan {
  const { mode, seed, catalog, memoryViews } = input;
  const { composition } = SESSION_MODE_CONFIG[mode];
  const used = new Set<ContentKey>();
  const steps: SessionStepWithAnswer[] = [];
  // Thứ người học đã biết — nguồn duy nhất cho phương án nhiễu; lớn dần khi phiên giới thiệu thứ mới.
  const known = new Set([...memoryViews.values()].filter((view) => view.isLearned).map((view) => view.contentKey));
  if (mode === SESSION_MODES.FOCUS) {
    return { mode, steps: buildFocusSteps(input, known).map((step, index) => ({ ...step, stepIndex: index, phase: step.phase ?? phaseOfStep(step) })) };
  }

  if (composition.surprise > 0) {
    const surprise = pickMemorySurprise([...memoryViews.values()], `${seed}:${mode}`);
    const item = surprise ? catalog.byKey.get(surprise.contentKey) : undefined;
    if (item) {
      used.add(item.key);
      steps.push({
        type: 'surprise', stepIndex: steps.length, contentKey: item.key,
        face: item.face, reading: item.reading, meaning: item.meaning, audioText: speechTextFor(item), correctAnswer: null,
      });
    }
  }

  for (const item of selectRecallItems(input, composition.recall, used)) {
    used.add(item.key);
    steps.push(buildRecallStep(item, catalog, steps.length, seed, known));
  }

  for (const group of selectDiscoverGroups(input, composition.discover, used)) {
    for (const item of group.items) used.add(item.key);
    steps.push(...buildDiscoverAndPracticeSteps(group.items, input, steps.length, group.phase, known));
  }

  steps.push(...buildUseSteps(input, composition.use, steps.length, used, known));

  // Gặp lại & bất ngờ → chặng review; Dùng trong câu → use (học bù / mới đã gắn chặng ở trên).
  return { mode, steps: steps.map((step, index) => ({ ...step, stepIndex: index, phase: step.phase ?? phaseOfStep(step) })) };
}

/** Chấm một câu trả lời. null = bước không có đúng/sai (Khám phá). */
export function evaluateStepAnswer(step: SessionStepWithAnswer, answer: string): boolean | null {
  return gradeAnswer(step, answer);
}

export function reviewEventTypeForStep(step: SessionStepWithAnswer): ReviewEventType {
  switch (step.type) {
    case 'surprise':
      return REVIEW_EVENT_TYPES.SURPRISE;
    case 'recall':
      return REVIEW_EVENT_TYPES.RECALL;
    case 'discover':
      return REVIEW_EVENT_TYPES.DISCOVER;
    case 'use':
      return REVIEW_EVENT_TYPES.USE;
  }
}

/** Tổng kết cho Khoảnh khắc tiến bộ. */
export function summarizeSession(answeredSteps: readonly AnsweredStep[]): SessionSummary {
  // "Nhớ lại" = gặp lại thứ đã học từ trước; câu luyện ngay của thứ vừa học không tính.
  const recalledSteps = answeredSteps.filter(
    (step) => (step.stepType === 'surprise' || step.stepType === 'recall') && step.isCorrect === true && !step.isPractice,
  );
  // Câu nổi bật "Bạn vừa nhớ lại X sau N ngày" chỉ có ý nghĩa khi đã cách ít nhất một ngày.
  const highlightSource = [...recalledSteps]
    .filter((step) => (step.daysSinceSeenBefore ?? 0) >= 1)
    .sort((left, right) => (right.daysSinceSeenBefore ?? 0) - (left.daysSinceSeenBefore ?? 0))[0];
  return {
    recalled: recalledSteps.length,
    learnedNew: answeredSteps.filter((step) => step.stepType === 'discover').length,
    usedInContext: answeredSteps.filter((step) => step.stepType === 'use' && step.isCorrect === true).length,
    missed: answeredSteps.filter((step) => step.isCorrect === false).length,
    highlight: highlightSource
      ? { contentKey: highlightSource.contentKey, face: highlightSource.face, daysSinceSeen: highlightSource.daysSinceSeenBefore ?? 0 }
      : null,
  };
}

export type SessionPlanPreview = Record<SessionPhase, number>;

/**
 * Kế hoạch phiên sắp tới cho Trang chủ: mỗi chặng có bao nhiêu kiến thức (đếm kiến thức, không đếm bước).
 * Dựng thử đúng phiên mà Session Engine sẽ dựng — số lượng không phụ thuộc seed, chỉ món cụ thể là khác.
 */
export function previewSessionPlan(input: Omit<BuildLearningSessionInput, 'seed'>): SessionPlanPreview {
  const { steps } = buildLearningSession({ ...input, seed: 'preview' });
  const keysByPhase = new Map<SessionPhase, Set<ContentKey>>(SESSION_PHASES.map((phase) => [phase, new Set()]));
  for (const step of steps) keysByPhase.get(phaseOfStep(step))?.add(step.contentKey);
  return Object.fromEntries(SESSION_PHASES.map((phase) => [phase, keysByPhase.get(phase)?.size ?? 0])) as SessionPlanPreview;
}
