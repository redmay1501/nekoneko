import type { DayTask, GrammarContent, JourneyDay, KanjiContent, RadicalContent, VocabularyContent } from '@/types/content';
import { pickDeterministic } from '@/lib/utils/deterministic-random';
import { primaryRadicalGlyph, type KnowledgeCatalog } from '@/features/learning/knowledge-catalog';
import { radicalsOfKanji } from '@/features/learning/knowledge-relations';
import { type KanaLesson, buildKanaLesson } from './kana-lesson';
import { lessonNumber } from '@/lib/utils/lesson';
import type { KnowledgeItem } from '@/features/learning/knowledge-types';
import { JOURNEY_TOTAL_DAYS, clampJourneyDay, stageOfDay, type JourneyStage } from './journey';
import { type JourneyPosition, relationToCurrentDay } from './journey-progress';

/**
 * "Một ngày học" (SC-12) — không phải bảng việc, mà là một buổi học có nhịp:
 * hôm đó gặp gì, trong bao lâu, theo thứ tự nào. Mọi nội dung lấy từ lộ trình Excel.
 */

export interface DayKnowledge {
  /** Chữ cái của ngày — Hiragana hoặc Katakana (Katakana = ngày Hiragana + 7), lấy từ danh mục kiến thức. */
  kana: KnowledgeItem[];
  radicals: RadicalContent[];
  kanji: KanjiContent[];
  grammar: GrammarContent[];
  vocabulary: VocabularyContent[];
}

export type TaskLine =
  | { kind: 'bullet'; text: string }
  | { kind: 'sub'; text: string }
  | { kind: 'line'; text: string };

export interface DayTaskView {
  glyph: string;
  name: string;
  minutes: number;
  lines: TaskLine[];
  background: string;
  color: string;
}

export interface ReviewTopic {
  label: string;
  count: number;
}

export interface DayPlanView {
  day: number;
  journeyDay: JourneyDay;
  stage: JourneyStage;
  relation: 'past' | 'today' | 'future';
  totalMinutes: number;
  summary: string;
  knowledge: DayKnowledge;
  hasNewKnowledge: boolean;
  /** Ngày ôn tập (không có kiến thức mới) — vài thứ nên gặp lại. */
  reviewSuggestions: KnowledgeItem[];
  /** Bảng chữ cái của ngày (hàng âm / âm đục / âm ghép) — null nếu ngày không có chữ cái. */
  kanaLesson: KanaLesson | null;
  /** "Vì sao học hôm nay?" — một câu, nói bằng lời thường. */
  purpose: string;
  /** Ngày ôn: ôn những gì (theo nhóm, có số lượng) — rỗng nếu ngày có kiến thức mới. */
  reviewTopics: ReviewTopic[];
  /** "Chữ 時 mang bộ 日 — bạn đã học bộ này từ ngày 17." */
  radicalBridge: { kanji: string; radical: string; meaning: string; day: number } | null;
  tasks: DayTaskView[];
}

/** Màu theo ký hiệu đầu nhãn đầu việc trong file Excel (◐ ôn, 部 bộ thủ, 漢 kanji…). */
const TASK_STYLE: Record<string, [string, string]> = {
  '◐': ['#FFF3DE', '#B8823A'], '部': ['#EAE4F7', '#6355A0'], '漢': ['#DFF3E4', '#3F7A4B'],
  '文': ['#FFEFF2', '#C2415A'], '語': ['#E2F0F8', '#3C6F93'], '耳': ['#FFF3DE', '#B8823A'],
  '読': ['#DFF3E4', '#3F7A4B'], 'あ': ['#FFEFF2', '#C2415A'], '✎': ['#EAE4F7', '#6355A0'],
  '?': ['#E2F0F8', '#3C6F93'], '⏱': ['#FFF3DE', '#B8823A'], '話': ['#EAE4F7', '#6355A0'],
};
const RELATION_BY_PROGRESS = { done: 'past', current: 'today', upcoming: 'future' } as const;
const DEFAULT_TASK_STYLE: [string, string] = ['#FAF5F1', '#7A736E'];
const REVIEW_SUGGESTION_COUNT = 10;
const SUB_LINE_PATTERN = /^(Mẹo|Từ ghép|Kanji chứa|Ví dụ)/i;
const INDENTED_LINE_PREFIX = '   ';

/** Dàn lại đoạn văn của Excel cho dễ đọc — không bỏ chữ nào. */
export function formatTaskBody(body: string): TaskLine[] {
  return body.split('\n').flatMap((raw): TaskLine[] => {
    const text = raw.trim();
    if (!text) return [];
    if (text.startsWith('•')) return [{ kind: 'bullet', text: text.slice(1).trim() }];
    if (SUB_LINE_PATTERN.test(text) || raw.startsWith(INDENTED_LINE_PREFIX)) return [{ kind: 'sub', text }];
    return [{ kind: 'line', text }];
  });
}

function toTaskView(task: DayTask): DayTaskView {
  const glyph = task.label.trim()[0] ?? '·';
  const [background, color] = TASK_STYLE[glyph] ?? DEFAULT_TASK_STYLE;
  return {
    glyph,
    name: task.label.replace(/^\S+\s*/, '') || task.label,
    minutes: task.minutes,
    lines: formatTaskBody(task.body),
    background,
    color,
  };
}

function summarize(knowledge: DayKnowledge): string {
  const parts: string[] = [];
  if (knowledge.kana.length) parts.push(`${knowledge.kana.length} chữ cái`);
  if (knowledge.radicals.length) parts.push(`bộ ${knowledge.radicals.map((radical) => primaryRadicalGlyph(radical.radical)).join('・')}`);
  if (knowledge.kanji.length) parts.push(`${knowledge.kanji.length} chữ Kanji`);
  if (knowledge.grammar.length) parts.push(`${knowledge.grammar.length} mẫu câu`);
  if (knowledge.vocabulary.length) parts.push(`${knowledge.vocabulary.length} từ mới`);
  return parts.length ? `Hôm nay bạn gặp ${parts.join(' · ')}.` : 'Hôm nay là một ngày ôn lại.';
}

export function buildDayPlan(catalog: KnowledgeCatalog, requestedDay: number, journey: JourneyPosition): DayPlanView {
  const day = clampJourneyDay(requestedDay);
  const { content } = catalog;
  const journeyDay = content.journeyDays[day - 1];
  const tasks = content.dayTasks.filter((task) => task.day === day).sort((left, right) => left.orderNo - right.orderNo);
  const knowledge: DayKnowledge = {
    kana: catalog.items.filter((item) => (item.type === 'hiragana' || item.type === 'katakana') && item.day === day),
    radicals: content.radicals.filter((radical) => radical.day === day),
    kanji: content.kanji.filter((kanji) => kanji.day === day),
    grammar: content.grammar.filter((pattern) => pattern.day === day),
    vocabulary: content.vocabulary.filter((word) => word.day === day),
  };
  const hasNewKnowledge = Object.values(knowledge).some((list) => list.length > 0);

  const firstKanji = knowledge.kanji[0];
  const bridgeRadical = firstKanji
    ? radicalsOfKanji(catalog, firstKanji).find((radical) => (radical.day ?? JOURNEY_TOTAL_DAYS) < (firstKanji.day ?? 0))
    : undefined;

  const reviewPool = catalog.items.filter((item) => item.day !== null && item.day < day && item.type !== 'hiragana' && item.type !== 'katakana');

  return {
    day,
    journeyDay,
    stage: stageOfDay(day),
    relation: RELATION_BY_PROGRESS[relationToCurrentDay(day, journey)],
    totalMinutes: tasks.reduce((sum, task) => sum + task.minutes, 0) || journeyDay.minutes,
    summary: summarize(knowledge),
    knowledge,
    hasNewKnowledge,
    // Mỗi mặt chữ một lần (本 vừa là Kanji vừa là từ vựng — gợi ý hai lần trông như lỗi).
    reviewSuggestions: hasNewKnowledge ? [] : pickDeterministic([...new Map(reviewPool.map((item) => [item.face, item])).values()], REVIEW_SUGGESTION_COUNT, `review:${day}`),
    radicalBridge: firstKanji && bridgeRadical
      ? { kanji: firstKanji.character, radical: primaryRadicalGlyph(bridgeRadical.radical), meaning: bridgeRadical.meaning, day: bridgeRadical.day ?? 0 }
      : null,
    tasks: tasks.map(toTaskView),
    kanaLesson: buildKanaLesson(knowledge.kana, catalog.items.filter(isKana)),
    purpose: describePurpose(knowledge, journeyDay),
    reviewTopics: hasNewKnowledge ? [] : reviewTopicsBefore(catalog, day),
  };
}

/** Dải 7 ngày quanh ngày đang xem. */
export function buildDayStrip(day: number): number[] {
  const STRIP_LENGTH = 7;
  const first = Math.max(1, Math.min(JOURNEY_TOTAL_DAYS - STRIP_LENGTH + 1, day - 3));
  return Array.from({ length: STRIP_LENGTH }, (_, index) => first + index);
}

const isKana = (item: KnowledgeItem) => item.type === 'hiragana' || item.type === 'katakana';

/** "Vì sao học hôm nay?" — theo loại kiến thức của ngày. Ví dụ đã kiểm tra là từ có thật, viết đúng. */
function describePurpose(knowledge: DayKnowledge, journeyDay: JourneyDay): string {
  const kana = knowledge.kana;
  if (kana.length) {
    const isKatakana = kana[0].type === 'katakana';
    if (kana.every((item) => [...item.face].length === 2)) {
      return isKatakana
        ? 'Âm ghép Katakana có trong nhiều từ mượn: ジュース (nước ép), ニュース (tin tức). Học xong là đọc được toàn bộ Katakana.'
        : 'Âm ghép có trong rất nhiều từ thường ngày: しゃしん (ảnh), きょう (hôm nay), でんしゃ (tàu điện). Học xong là đọc được toàn bộ Hiragana.';
    }
    if (kana.every((item) => /^[gzjdbp]/i.test(item.reading))) {
      return isKatakana
        ? 'Âm đục Katakana xuất hiện trong nhiều từ mượn: テレビ (ti vi), バス (xe buýt), パン (bánh mì).'
        : 'Âm đục xuất hiện trong rất nhiều từ: ごはん (cơm), だいがく (đại học), ございます. Chỉ cần nhớ quy luật thêm dấu, không phải học chữ mới hoàn toàn.';
    }
    return isKatakana
      ? 'Katakana dùng để viết từ mượn nước ngoài như テレビ, コーヒー. Bạn đã biết cách đọc từ Hiragana — giờ chỉ cần nhớ mặt chữ mới.'
      : 'Hiragana là bảng chữ cái gốc của tiếng Nhật — mọi từ, mọi câu đều cần nó. Học theo từng hàng âm để nhớ theo quy luật.';
  }
  if (knowledge.grammar.length || knowledge.vocabulary.length || knowledge.kanji.length) {
    const lesson = journeyDay.minna && journeyDay.minna !== '—' ? `${journeyDay.minna} — ` : '';
    return `${lesson}${journeyDay.title}. Mẫu câu cho bạn cách nói, từ vựng và Kanji là thứ để điền vào — học cùng nhau để dùng được ngay.`;
  }
  return 'Không có kiến thức mới. Hôm nay để những gì đã học bám chắc hơn — Neko chọn đúng những thứ bạn sắp quên.';
}

/** Ngày ôn nhìn lại tối đa chừng này ngày — tức là đúng tuần vừa học (ngày ôn hằng tuần rơi vào ngày thứ 7). */
const REVIEW_LOOKBACK_DAYS = 6;

/** Ngày ôn: ôn những gì — các nhóm kiến thức của tuần vừa qua (chữ cái theo loại, từ / mẫu câu theo bài, Kanji, bộ thủ). */
function reviewTopicsBefore(catalog: KnowledgeCatalog, day: number): ReviewTopic[] {
  const recent = catalog.items.filter((item) => item.day !== null && item.day < day && item.day >= day - REVIEW_LOOKBACK_DAYS);
  const pool = recent.length ? recent : catalog.items.filter((item) => item.day !== null && item.day < day);
  const counts = new Map<string, number>();
  const add = (label: string) => counts.set(label, (counts.get(label) ?? 0) + 1);
  for (const item of pool) {
    if (isKana(item)) {
      const script = item.type === 'katakana' ? 'Katakana' : 'Hiragana';
      add([...item.face].length === 2 ? `Âm ghép ${script}` : /^[gzjdbp]/i.test(item.reading) ? `Âm đục ${script}` : `${script} cơ bản`);
    } else if (item.type === 'vocabulary') add(lessonLabel('Từ vựng', item.content.lesson));
    else if (item.type === 'grammar') add(lessonLabel('Mẫu câu', item.content.lesson));
    else if (item.type === 'kanji') add('Kanji');
    else add('Bộ thủ');
  }
  return [...counts].map(([label, count]) => ({ label, count }));
}

function lessonLabel(prefix: string, lesson: string): string {
  const number = lessonNumber(lesson);
  return Number.isFinite(number) ? `${prefix} bài ${number}` : `${prefix} đã học`;
}
