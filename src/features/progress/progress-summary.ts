import type { KnowledgeCatalog } from '@/features/learning/knowledge-catalog';
import { type ContentKey, type ContentType, toContentKey } from '@/features/learning/knowledge-types';
import type { MemoryView } from '@/features/memory/memory-types';
import { STATUS_THRESHOLDS } from '@/features/memory/memory-rules';
import { JOURNEY_TOTAL_DAYS } from '@/features/roadmap/journey';
import { type JourneyPosition, completedDayCount } from '@/features/roadmap/journey-progress';
import { jlptGrammarCoverage } from './jlpt-coverage';

/**
 * Tiến độ & Thành tích — tính từ trạng thái trí nhớ và ngày lộ trình.
 * Không lưu riêng: một nguồn sự thật (memory_items), nhiều cách nhìn.
 */

export interface ProgressRow {
  label: string;
  done: number;
  total: number;
}

type Views = ReadonlyMap<ContentKey, MemoryView>;

function countLearned(catalog: KnowledgeCatalog, views: Views, type: ContentType): number {
  return catalog.items.filter((item) => item.type === type && views.get(item.key)?.isLearned).length;
}

export function buildProgressRows(catalog: KnowledgeCatalog, views: Views, journey: JourneyPosition): ProgressRow[] {
  const { content } = catalog;
  return [
    { label: 'Ngày học hoàn thành', done: completedDayCount(journey), total: JOURNEY_TOTAL_DAYS },
    { label: 'Hiragana + Katakana', done: countLearned(catalog, views, 'hiragana'), total: content.kana.length },
    { label: 'Bộ thủ', done: countLearned(catalog, views, 'radical'), total: content.radicals.length },
    { label: 'Kanji', done: countLearned(catalog, views, 'kanji'), total: content.kanji.length },
    { label: 'Ngữ pháp Minna', done: countLearned(catalog, views, 'grammar'), total: content.grammar.length },
    { label: 'Từ vựng', done: countLearned(catalog, views, 'vocabulary'), total: content.vocabulary.length },
    // Danh sách JLPT không có bài riêng: tính mẫu đã gặp qua ngữ pháp Minna đã học (jlpt-coverage.ts).
    { label: 'Ngữ pháp JLPT (đã gặp qua bài Minna)', done: jlptGrammarCoverage(catalog, views).met, total: content.jlptGrammar.length },
  ];
}

export interface Achievement {
  icon: string;
  title: string;
  description: string;
  isUnlocked: boolean;
}

/** Số chữ kana cơ bản (あ → ん). 58 chữ còn lại là âm đục / âm ghép. */
const BASIC_KANA_COUNT = 46;
const ACHIEVEMENT_RULES = {
  STREAK_DAYS: 7,
  FIRST_RADICALS: 10,
  VOCABULARY_MILESTONE: 100,
} as const;

function basicKanaRemembered(views: Views, type: 'hiragana' | 'katakana'): boolean {
  for (let id = 1; id <= BASIC_KANA_COUNT; id++) {
    const view = views.get(toContentKey(type, id));
    if (!view?.isLearned || view.memoryScore < STATUS_THRESHOLDS.LEARNING) return false;
  }
  return true;
}

/** Danh sách cột mốc — giữ nguyên tên và mô tả của prototype; điều kiện tính từ dữ liệu thật. */
/** `longestStreak`: chuỗi ngày ôn liên tiếp dài nhất từng có (recall-streak.ts) — đạt rồi thì không mất. */
export function buildAchievements(catalog: KnowledgeCatalog, views: Views, journey: JourneyPosition, longestStreak: number): Achievement[] {
  const allViews = [...views.values()];
  return [
    { icon: '🔥', title: 'Chuỗi 7 ngày', description: 'Bạn đã học 7 ngày liên tiếp', isUnlocked: longestStreak >= ACHIEVEMENT_RULES.STREAK_DAYS },
    { icon: 'neko:hiragana', title: 'Xong Hiragana', description: '46 chữ cơ bản đều đã nhớ', isUnlocked: basicKanaRemembered(views, 'hiragana') },
    { icon: 'neko:katakana', title: 'Xong Katakana', description: '46 chữ cơ bản đều đã nhớ', isUnlocked: basicKanaRemembered(views, 'katakana') },
    {
      icon: 'neko:radical', title: '10 bộ thủ đầu tiên', description: 'Bạn bắt đầu đoán được nghĩa Kanji',
      isUnlocked: countLearned(catalog, views, 'radical') >= ACHIEVEMENT_RULES.FIRST_RADICALS,
    },
    {
      icon: '🌸', title: 'Hoa đầu tiên nở', description: 'Một kiến thức đạt mức thành thạo',
      isUnlocked: allViews.some((view) => view.status === 'mastered'),
    },
    {
      icon: 'neko:vocabulary', title: '100 từ vựng', description: 'Bạn đã thuộc 100 từ',
      isUnlocked: countLearned(catalog, views, 'vocabulary') >= ACHIEVEMENT_RULES.VOCABULARY_MILESTONE,
    },
    { icon: 'neko:achievements', title: 'Chinh phục N5', description: 'Hoàn thành ngày 90', isUnlocked: journey.isJourneyComplete },
  ];
}
