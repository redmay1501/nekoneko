import type { N5Content } from '@/types/content';
import { type AdminEntity, foldSearch } from './content-entities';

/**
 * Soát lộ trình 90 ngày — chỉ ĐỌC nội dung, không đổi tiến độ của ai (không bao giờ tự đánh dấu hoàn thành ngày).
 *  - thiếu: ngày có tóm tắt (vd. "Từ vựng: …") nhưng không có mục nào gắn day = ngày đó; ngày không có đầu việc;
 *  - trùng: cùng một từ / chữ / bộ / mẫu gắn vào nhiều ngày (hoặc nhiều dòng trong cùng ngày).
 */
export interface DayAudit {
  day: number;
  title: string;
  week: number | null;
  counts: Record<AdminEntity, number>;
  taskCount: number;
  missing: string[];
}

export interface DuplicateGroup {
  entity: AdminEntity;
  key: string;
  items: Array<{ id: number; day: number | null }>;
}

const SUMMARY_FIELD: Record<AdminEntity, 'vocabSummary' | 'kanjiSummary' | 'radicalSummary' | 'grammarSummary'> = {
  vocabulary: 'vocabSummary', kanji: 'kanjiSummary', radical: 'radicalSummary', grammar: 'grammarSummary',
};
const LABEL: Record<AdminEntity, string> = { vocabulary: 'từ vựng', kanji: 'kanji', radical: 'bộ thủ', grammar: 'ngữ pháp' };
/** Tóm tắt kiểu "—", "(ôn tập)", rỗng → ngày đó không định dạy loại này. */
const hasPlannedContent = (summary: string) => summary.trim().replace(/[—–\-()（）.\s]/g, '').length > 0 && !/^(ôn|on tap|không)/i.test(summary.trim());

export function itemsByEntity(content: N5Content): Record<AdminEntity, Array<{ id: number; day: number | null; key: string }>> {
  return {
    vocabulary: content.vocabulary.map((word) => ({ id: word.id, day: word.day, key: `${word.kana}|${word.kanji}|${foldSearch(word.meaning)}` })),
    kanji: content.kanji.map((kanji) => ({ id: kanji.id, day: kanji.day, key: kanji.character })),
    radical: content.radicals.map((radical) => ({ id: radical.id, day: radical.day, key: radical.radical })),
    grammar: content.grammar.map((pattern) => ({ id: pattern.id, day: pattern.day, key: pattern.pattern })),
  };
}

export function auditRoadmap(content: N5Content): { days: DayAudit[]; duplicates: DuplicateGroup[]; unassigned: Record<AdminEntity, number> } {
  const items = itemsByEntity(content);
  const entities = Object.keys(items) as AdminEntity[];
  const days: DayAudit[] = [];
  for (let day = 1; day <= 90; day += 1) {
    const journeyDay = content.journeyDays.find((entry) => entry.day === day);
    const counts = Object.fromEntries(entities.map((entity) => [entity, items[entity].filter((item) => item.day === day).length])) as Record<AdminEntity, number>;
    const taskCount = content.dayTasks.filter((task) => task.day === day).length;
    const missing: string[] = [];
    if (!journeyDay) missing.push('Chưa có dòng journey_days cho ngày này');
    else {
      for (const entity of entities) {
        const summary = journeyDay[SUMMARY_FIELD[entity]] ?? '';
        if (hasPlannedContent(summary) && counts[entity] === 0) missing.push(`Tóm tắt có ${LABEL[entity]} ("${summary.slice(0, 40)}") nhưng chưa gắn mục nào`);
      }
    }
    if (taskCount === 0) missing.push('Chưa có đầu việc (day_tasks)');
    days.push({ day, title: journeyDay?.title ?? '', week: journeyDay?.week ?? null, counts, taskCount, missing });
  }
  const duplicates: DuplicateGroup[] = [];
  for (const entity of entities) {
    const groups = new Map<string, Array<{ id: number; day: number | null }>>();
    for (const item of items[entity]) groups.set(item.key, [...(groups.get(item.key) ?? []), { id: item.id, day: item.day }]);
    for (const [key, group] of groups) if (group.length > 1) duplicates.push({ entity, key, items: group });
  }
  const unassigned = Object.fromEntries(entities.map((entity) => [entity, items[entity].filter((item) => item.day === null).length])) as Record<AdminEntity, number>;
  return { days, duplicates, unassigned };
}
