import type { DayTask, GrammarContent, JourneyDay, KanjiContent, RadicalContent, VocabularyContent } from '@/types/content';
import { pickDeterministic } from '@/lib/utils/deterministic-random';
import { primaryRadicalGlyph, type KnowledgeCatalog } from '@/features/learning/knowledge-catalog';
import { radicalsOfKanji } from '@/features/learning/knowledge-relations';
import { type KanaLesson, buildKanaLesson } from './kana-lesson';
import { type KanjiContext, kanjiContextOf } from '@/features/learning/kanji-context';
import { lessonNumber } from '@/lib/utils/lesson';
import type { ContentKey, ContentType, KnowledgeItem } from '@/features/learning/knowledge-types';
import { JOURNEY_STAGES, JOURNEY_TOTAL_DAYS, clampJourneyDay, stageOfDay, type JourneyStage } from './journey';
import { type JourneyPosition, relationToCurrentDay } from './journey-progress';

/**
 * "Một ngày học" (SC-12) — không phải bảng việc, mà là một buổi học có nhịp:
 * hôm đó gặp gì, trong bao lâu, theo thứ tự nào. Mọi nội dung lấy từ lộ trình Excel.
 */

export interface DayKnowledge {
  /** Chữ cái của ngày — Hiragana hoặc Katakana (Katakana = ngày Hiragana + 7), lấy từ danh mục kiến thức. */
  kana: KnowledgeItem[];
  radicals: RadicalContent[];
  /** Kanji của ngày — theo thứ tự từ đầu tiên chứa nó trong ngày (Kanji học cùng từ). */
  kanji: KanjiContent[];
  grammar: GrammarContent[];
  vocabulary: VocabularyContent[];
}

export type TaskLine =
  | { kind: 'bullet'; text: string }
  | { kind: 'sub'; text: string }
  | { kind: 'line'; text: string };

/** Việc này làm ở đâu: trong app (học, ôn kiến thức) hay tự làm (viết tay, sách, nguồn nghe ngoài, đề giấy…). */
export type TaskPlace = 'app' | 'self';

export interface DayTaskView {
  glyph: string;
  name: string;
  minutes: number;
  place: TaskPlace;
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
  /**
   * Câu nối kanji với bộ đã học.
   * isPrimary: bộ đứng đầu chữ. Bộ phụ thì nói "trong chữ có hình", không nói "mang bộ".
   */
  radicalBridge: { kanji: string; radical: string; meaning: string; day: number; isPrimary: boolean } | null;
  tasks: DayTaskView[];
  /** Thời gian theo kế hoạch (Excel), tách trong app / tự làm. */
  minutesInApp: number;
  minutesSelf: number;
  /**
   * Từ vựng cần ôn của ngày ôn — lấy từ việc "Từ vựng" bắt đầu bằng "Ôn…": từ được liệt kê (khớp đúng mặt chữ trong kho)
   * hoặc khoảng bài ("bài 1–10"). Ghi chung chung ("ôn phần yếu") thì rỗng — không đoán.
   */
  reviewVocabulary: VocabularyContent[];
  /**
   * Ngày ôn giữa lộ trình: kiến thức THẬT của các ngày học ngay trước nó (từ sau ngày ôn trước tới hôm qua — đúng "tuần" mà
   * ngày ôn nhắc tới, ví dụ ngày 26 → ngày 18–25). Ngày có kiến thức mới, hoặc ngay sau một ngày ôn khác (tổng ôn 83–90), là null.
   */
  reviewWindow: { from: number; to: number; keys: ContentKey[]; counts: Array<{ type: ContentType; count: number }> } | null;
  /** Mỗi Kanji của ngày (theo id): từ của hôm nay chứa nó (kèm cách đọc trong từ) và từ đã học trước đó có cùng chữ. */
  kanjiContext: Record<number, KanjiContext>;
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

/**
 * Việc học kiến thức có trong app (chữ cái, âm đục / ghép, từ, Kanji, mẫu câu, bộ thủ, khởi động = ôn nhanh, ✓ ôn câu mờ).
 * Còn lại là tự làm: ✎ viết tay, ? tự kiểm tra trên giấy, 耳 nghe nguồn ngoài, 読 đọc sách, 📝 đề giấy, ◎ 🎒…
 */
const IN_APP_GLYPHS = new Set(['あ', '゛', 'ゃ', '語', '漢', '文', '部', '◐', '✓']);
const VOCABULARY_GLYPH = '語';
/**
 * Thứ tự các loại việc trong ngày (ký hiệu đầu nhãn Excel): Kanji ngay sau Từ vựng — chữ Hán học trong từ chứa nó —,
 * rồi mới tới Ngữ pháp. Loại khác (✎ ? 耳 読…) đứng sau, giữ thứ tự gốc.
 */
const TASK_ORDER = ['◐', 'あ', '゛', 'ゃ', '部', '語', '漢', '文'];
const taskRank = (task: DayTask) => {
  const rank = TASK_ORDER.indexOf(task.label.trim()[0] ?? '');
  return rank < 0 ? TASK_ORDER.length : rank;
};

function toTaskView(task: DayTask, newWordCount: number, reviewWordCount: number, hasGrammar: boolean): DayTaskView {
  const glyph = task.label.trim()[0] ?? '·';
  const [background, color] = TASK_STYLE[glyph] ?? DEFAULT_TASK_STYLE;
  // Việc "Từ vựng": danh sách từ đã hiện ở mục Kiến thức của ngày (bấm từng từ để xem) → không lặp lại cả danh sách
  // và câu "Trong sách, xem thêm…" ở đây; chỉ nói gọn bao nhiêu từ, xem ở đâu.
  const vocabularyLine = glyph !== VOCABULARY_GLYPH ? null
    : newWordCount ? `Học ${newWordCount} từ mới của ngày — danh sách ở mục “Kiến thức của ngày”, bấm từng từ để nghe và xem ví dụ.`
      : reviewWordCount ? `Ôn ${reviewWordCount} từ — danh sách và nút “Ôn ${reviewWordCount} từ” ở mục “Kiến thức của ngày”.`
        : null;
  return {
    glyph,
    name: task.label.replace(/^\S+\s*/, '') || task.label,
    minutes: task.minutes,
    place: IN_APP_GLYPHS.has(glyph) ? 'app' : 'self',
    lines: vocabularyLine ? [{ kind: 'line', text: vocabularyLine }] : inAppFirst(glyph, formatTaskBody(task.body), hasGrammar),
    background,
    color,
  };
}

/** Câu trong việc "trong app" nhưng chỉ ra sách giấy (練習A/B/C, sách bài tập Minna…). */
const BOOK_EXERCISE = /練習|trong sách|sách bài tập|問題集/;

/**
 * Việc học trong app mà Excel chỉ ghi bài tập sách giấy: đưa phần làm được trong app lên trước, câu về sách thành dòng phụ
 * "(tuỳ chọn)". Không bỏ chữ nào; việc tự làm (耳 nghe, 読 đọc nguồn ngoài) giữ nguyên vì app chưa có tài liệu đó.
 */
function inAppFirst(glyph: string, lines: TaskLine[], hasGrammar: boolean): TaskLine[] {
  if (!IN_APP_GLYPHS.has(glyph) || !lines.some((line) => BOOK_EXERCISE.test(line.text))) return lines;
  const inApp: TaskLine[] = glyph === '文'
    ? [{ kind: 'line', text: hasGrammar
      ? 'Luyện ngay trong app: “Thẻ & kiểm tra” ở phần Ngữ pháp — Việt → Nhật, Nhật → Việt, Sắp xếp câu, Tự viết câu.'
      : 'Trong app: ôn mẫu câu của tuần bằng nút “Ôn kiến thức tuần” ở mục Kiến thức của ngày.' }]
    : [];
  return [...inApp, ...lines.map((line): TaskLine => (BOOK_EXERCISE.test(line.text)
    ? { kind: 'sub', text: `Có sách Minna (tuỳ chọn): ${line.text.replace(/^→\s*/, '')}` } : line))];
}

/**
 * Từ vựng của việc "Ôn …": (1) từ được liệt kê, khớp đúng mặt chữ trong kho (はい, 大きい…); (2) "bài 1–10" → từ của
 * các bài đó. Không khớp được thì bỏ qua (không đoán).
 */
export function reviewVocabularyOf(task: DayTask | undefined, vocabulary: readonly VocabularyContent[]): VocabularyContent[] {
  if (!task || !/^(Ôn|Kiểm tra lại)/.test(task.body.trim())) return [];
  const range = task.body.match(/bài\s*(\d+)\s*[–-]\s*(\d+)/i);
  if (range) {
    const [first, last] = [Number(range[1]), Number(range[2])];
    return vocabulary.filter((word) => {
      const lesson = lessonNumber(word.lesson);
      return lesson >= first && lesson <= last;
    });
  }
  const byFace = new Map<string, VocabularyContent>();
  for (const word of vocabulary) {
    if (word.kanji) byFace.set(word.kanji, word);
    if (!byFace.has(word.kana)) byFace.set(word.kana, word);
  }
  const tokens = task.body.match(/[\u3040-\u30ff\u4e00-\u9fff々ー]+/g) ?? [];
  return [...new Map(tokens.map((token) => byFace.get(token)).filter((word): word is VocabularyContent => Boolean(word))
    .map((word) => [word.id, word])).values()];
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
    kanji: orderByFirstWord(content.kanji.filter((kanji) => kanji.day === day), content.vocabulary.filter((word) => word.day === day)),
    grammar: content.grammar.filter((pattern) => pattern.day === day),
    vocabulary: content.vocabulary.filter((word) => word.day === day),
  };
  const hasNewKnowledge = Object.values(knowledge).some((list) => list.length > 0);

  const firstKanji = knowledge.kanji[0];
  const kanjiRadicals = firstKanji ? radicalsOfKanji(catalog, firstKanji) : [];
  const bridgeRadical = kanjiRadicals.find((radical) => (radical.day ?? JOURNEY_TOTAL_DAYS) < (firstKanji?.day ?? 0));

  // Dòng thời gian theo thứ tự học: khởi động → chữ cái → bộ thủ → từ vựng → Kanji → ngữ pháp → việc tự làm (giữ thứ tự Excel trong cùng nhóm).
  tasks.sort((left, right) => taskRank(left) - taskRank(right) || left.orderNo - right.orderNo);
  const reviewVocabulary = knowledge.vocabulary.length ? [] : reviewVocabularyOf(tasks.find((task) => task.label.trim().startsWith(VOCABULARY_GLYPH)), content.vocabulary);
  const taskViews = tasks.map((task) => toTaskView(task, knowledge.vocabulary.length, reviewVocabulary.length, knowledge.grammar.length > 0));

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
      ? {
          kanji: firstKanji.character,
          radical: primaryRadicalGlyph(bridgeRadical.radical),
          meaning: bridgeRadical.meaning,
          day: bridgeRadical.day ?? 0,
          isPrimary: kanjiRadicals[0]?.id === bridgeRadical.id,
        }
      : null,
    tasks: taskViews,
    minutesInApp: taskViews.filter((task) => task.place === 'app').reduce((sum, task) => sum + task.minutes, 0),
    minutesSelf: taskViews.filter((task) => task.place === 'self').reduce((sum, task) => sum + task.minutes, 0),
    reviewVocabulary,
    kanaLesson: buildKanaLesson(knowledge.kana, catalog.items.filter(isKana)),
    purpose: describePurpose(knowledge, journeyDay),
    reviewTopics: hasNewKnowledge ? [] : reviewTopicsBefore(catalog, day),
    reviewWindow: hasNewKnowledge ? null : reviewWindowOf(catalog, day),
    kanjiContext: Object.fromEntries(knowledge.kanji.map((kanji) => [kanji.id, kanjiContextOf(kanji, content, day)])),
  };
}

const FINAL_STAGE = JOURNEY_STAGES[JOURNEY_STAGES.length - 1];

/** Kanji theo thứ tự xuất hiện trong từ của ngày (chữ của từ đầu tiên trước); chữ không nằm trong từ nào đứng cuối. */
function orderByFirstWord(kanji: KanjiContent[], words: readonly VocabularyContent[]): KanjiContent[] {
  // Vị trí = (từ đầu tiên chứa chữ, vị trí chữ trong từ đó) → 先生 cho 先 rồi 生.
  const position = (entry: KanjiContent) => {
    const index = words.findIndex((word) => (word.kanji ?? '').includes(entry.character));
    return index < 0 ? [words.length, 0] : [index, [...words[index].kanji].indexOf(entry.character)];
  };
  return [...kanji].sort((left, right) => {
    const [leftWord, leftChar] = position(left);
    const [rightWord, rightChar] = position(right);
    return leftWord - rightWord || leftChar - rightChar || left.id - right.id;
  });
}
const REVIEW_TYPE_ORDER: readonly ContentType[] = ['vocabulary', 'grammar', 'radical', 'kanji'];

/** Kiến thức (không tính chữ cái) của các ngày học liền trước ngày ôn `day`. */
export function reviewWindowOf(catalog: KnowledgeCatalog, day: number): DayPlanView['reviewWindow'] {
  // Tổng ôn & thi thử: ôn theo chủ đề của ngày (trợ từ, chia động từ, đề…), không theo "tuần vừa học".
  if (day > FINAL_STAGE.from) return null;
  const learnable = (item: KnowledgeItem) => !isKana(item) && item.day !== null;
  const hasKnowledge = (candidate: number) => catalog.items.some((item) => learnable(item) && item.day === candidate);
  let from = day;
  while (from > 1 && hasKnowledge(from - 1)) from -= 1;
  if (from === day) return null;
  const items = catalog.items.filter((item) => learnable(item) && item.day! >= from && item.day! < day)
    .sort((left, right) => REVIEW_TYPE_ORDER.indexOf(left.type) - REVIEW_TYPE_ORDER.indexOf(right.type));
  return {
    from, to: day - 1,
    keys: items.map((item) => item.key),
    counts: REVIEW_TYPE_ORDER.map((type) => ({ type, count: items.filter((item) => item.type === type).length })).filter((entry) => entry.count),
  };
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
    return `${lesson}${journeyDay.title}. Mẫu câu là cách nói. Từ và Kanji là thứ bạn đặt vào câu đó.`;
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
