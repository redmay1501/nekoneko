import type { DayTask, GrammarContent, JourneyDay, KanaContent, KanjiContent, RadicalContent, VocabularyContent } from '@/types/content';
import { pickDeterministic } from '@/lib/utils/deterministic-random';
import { primaryRadicalGlyph, type KnowledgeCatalog } from '@/features/learning/knowledge-catalog';
import { radicalsOfKanji } from '@/features/learning/knowledge-relations';
import type { KnowledgeItem } from '@/features/learning/knowledge-types';
import { JOURNEY_TOTAL_DAYS, clampJourneyDay, stageOfDay, type JourneyStage } from './journey';
import { type JourneyPosition, relationToCurrentDay } from './journey-progress';

/**
 * "Một ngày học" (SC-12) — không phải bảng việc, mà là một buổi học có nhịp:
 * hôm đó gặp gì, trong bao lâu, theo thứ tự nào. Mọi nội dung lấy từ lộ trình Excel.
 */

export interface DayKnowledge {
  kana: KanaContent[];
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
    kana: content.kana.filter((kana) => kana.day === day),
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
    reviewSuggestions: hasNewKnowledge ? [] : pickDeterministic(reviewPool, REVIEW_SUGGESTION_COUNT, `review:${day}`),
    radicalBridge: firstKanji && bridgeRadical
      ? { kanji: firstKanji.character, radical: primaryRadicalGlyph(bridgeRadical.radical), meaning: bridgeRadical.meaning, day: bridgeRadical.day ?? 0 }
      : null,
    tasks: tasks.map(toTaskView),
  };
}

/** Dải 7 ngày quanh ngày đang xem. */
export function buildDayStrip(day: number): number[] {
  const STRIP_LENGTH = 7;
  const first = Math.max(1, Math.min(JOURNEY_TOTAL_DAYS - STRIP_LENGTH + 1, day - 3));
  return Array.from({ length: STRIP_LENGTH }, (_, index) => first + index);
}
