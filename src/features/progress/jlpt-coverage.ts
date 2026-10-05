import type { KnowledgeCatalog } from '@/features/learning/knowledge-catalog';
import { type ContentKey, toContentKey } from '@/features/learning/knowledge-types';
import type { MemoryView } from '@/features/memory/memory-types';

/**
 * Ngữ pháp JLPT N5 (danh sách rà soát) không có bài học riêng — các mẫu này nằm rải rác trong ngữ pháp Minna.
 * Một mẫu JLPT tính là ĐÃ GẶP khi một mẫu Minna người học đã học có chứa nó (trong mẫu hoặc câu ví dụ).
 *
 * Khớp chuỗi sau khi chuẩn hoá: bỏ khoảng trắng, 〜, [ ], chú thích "(nhưng)"; "〜A〜B" cần đủ A và B trong cùng
 * một mẫu; thêm vài dạng chia (〜ている ↔ ています, 好きだ ↔ 好き, 分かる ↔ 分か…). Mẫu chỉ có tên tiếng Việt
 * ("Mệnh đề quan hệ") không khớp được → không bao giờ tự tính là đã gặp.
 */

const normalize = (text: string) => text.replace(/[\s〜～[\]]/g, '');

/** Mỗi cách viết = danh sách đoạn phải có mặt cùng lúc. */
export function jlptPatternForms(pattern: string): string[][] {
  const withoutNotes = pattern.replace(/\(.*?\)|（.*?）/g, '');
  return withoutNotes.split(/[／/]/).flatMap((alternative) => {
    const segments = alternative.split(/[〜～]/).map(normalize).filter(Boolean);
    if (!segments.length || segments.some((segment) => /[A-Za-zÀ-ỹ]/.test(segment))) return [];
    const variants = [segments];
    const last = segments[segments.length - 1];
    const replaceLast = (value: string) => [...segments.slice(0, -1), value];
    if (last.endsWith('ている')) variants.push(replaceLast(`${last.slice(0, -3)}ています`));
    if (last.length > 1 && (last.endsWith('だ') || last.endsWith('る'))) variants.push(replaceLast(last.slice(0, -1)));
    return variants;
  });
}

export interface JlptCoverage {
  /** Mẫu JLPT đã gặp qua các mẫu Minna đã học. */
  met: number;
  /** Mẫu JLPT có trong giáo trình Minna của lộ trình (học hết sẽ gặp). */
  coveredByCourse: number;
  total: number;
}

export function jlptGrammarCoverage(catalog: KnowledgeCatalog, views: ReadonlyMap<ContentKey, MemoryView>): JlptCoverage {
  const minna = catalog.content.grammar.map((pattern) => ({
    text: `${normalize(pattern.pattern)}|${normalize(pattern.exampleJp)}`,
    isLearned: views.get(toContentKey('grammar', pattern.id))?.isLearned ?? false,
  }));
  let met = 0;
  let coveredByCourse = 0;
  for (const jlpt of catalog.content.jlptGrammar) {
    const forms = jlptPatternForms(jlpt.pattern);
    const matching = minna.filter(({ text }) => forms.some((segments) => segments.every((segment) => text.includes(segment))));
    if (matching.length) coveredByCourse++;
    if (matching.some((pattern) => pattern.isLearned)) met++;
  }
  return { met, coveredByCourse, total: catalog.content.jlptGrammar.length };
}
