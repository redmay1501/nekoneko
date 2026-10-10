import type { MemoryView } from '@/features/memory/memory-types';
import type { KnowledgeListRowData } from './knowledge-list';
import { type KnowledgeCatalog, itemsOfType } from './knowledge-catalog';
import { kanjiContainingRadical } from './knowledge-relations';
import type { ContentKey } from './knowledge-types';
import { kanjiReadingRomaji, patternRomaji, vocabularyRomaji } from '@/lib/utils/romaji';

/**
 * Dựng các dòng cho bốn kho kiến thức (Bộ thủ · Kanji · Từ vựng · Ngữ pháp).
 * Giữ đúng cách prototype đặt tiêu đề / phụ đề cho từng loại.
 */

type Views = ReadonlyMap<ContentKey, MemoryView>;

function memoryOf(views: Views, key: ContentKey) {
  const view = views.get(key);
  return { status: view?.status ?? 'new', memoryScore: view?.memoryScore ?? 0 } as const;
}

export function radicalRows(catalog: KnowledgeCatalog, views: Views): KnowledgeListRowData[] {
  return itemsOfType(catalog, 'radical').map((item) => ({
    contentKey: item.key, face: item.face, title: item.content.meaning, subtitle: item.content.nameJp,
    ...memoryOf(views, item.key), endNote: `${kanjiContainingRadical(catalog, item.content).length} kanji`,
  }));
}

export function kanjiRows(catalog: KnowledgeCatalog, views: Views): KnowledgeListRowData[] {
  return itemsOfType(catalog, 'kanji').map((item) => ({
    contentKey: item.key, face: item.face, title: `${item.content.hanViet} · ${item.content.meaning}`,
    subtitle: `${item.content.onReading} ・ ${item.content.kunReading || '—'}`,
    romaji: kanjiReadingRomaji(item.content.onReading, item.content.kunReading), ...memoryOf(views, item.key),
  }));
}

export function vocabularyRows(catalog: KnowledgeCatalog, views: Views) {
  return itemsOfType(catalog, 'vocabulary').map((item) => ({
    contentKey: item.key, face: item.face, title: item.content.meaning, subtitle: item.content.kana,
    romaji: vocabularyRomaji(item.content), lesson: item.content.lesson, faceSize: 22, ...memoryOf(views, item.key),
  }));
}

export interface GrammarLessonGroup {
  lesson: string;
  rows: KnowledgeListRowData[];
}

export function grammarGroups(catalog: KnowledgeCatalog, views: Views): GrammarLessonGroup[] {
  const groups = new Map<string, KnowledgeListRowData[]>();
  for (const item of itemsOfType(catalog, 'grammar')) {
    const rows = groups.get(item.content.lesson) ?? [];
    rows.push({
      contentKey: item.key, face: item.face, title: item.content.pattern, subtitle: item.content.exampleVi,
      hideFace: true, showStatusLabel: true, romaji: patternRomaji(item.content.pattern), ...memoryOf(views, item.key),
    });
    groups.set(item.content.lesson, rows);
  }
  return [...groups.entries()].map(([lesson, rows]) => ({ lesson, rows }));
}

export function countLearnedOfType(catalog: KnowledgeCatalog, views: Views, type: 'radical' | 'kanji' | 'vocabulary' | 'grammar') {
  const items = itemsOfType(catalog, type);
  return { learned: items.filter((item) => views.get(item.key)?.isLearned).length, total: items.length };
}
