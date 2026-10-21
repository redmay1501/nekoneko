import type { GrammarContent } from '@/types/content';
import rawDrills from '@content/seed/grammar-drills.json';
import type { Blank, ExerciseItem } from '@/lib/utils/drill-checker';

/**
 * Bài tập luyện tập ngữ pháp (NekoNeko v2) — 4 dạng: thay thế, biến đổi câu, hỏi đáp theo gợi ý, hội thoại điền chỗ trống.
 * Nội dung tự soạn, chỉ mô phỏng DẠNG bài thông dụng. Chấm bằng src/lib/utils/drill-checker.ts.
 * Dữ liệu: content/seed/grammar-drills.json (200 bài, 25 bài × 8). Xem docs/INTEGRATION_NEKONEKO_V2.md.
 */

export type GrammarDrillType = 'substitution' | 'transformation' | 'qa' | 'dialogue';

export const GRAMMAR_DRILL_TYPES: ReadonlyArray<{ id: GrammarDrillType; label: string }> = [
  { id: 'substitution', label: 'Luyện thay thế' },
  { id: 'transformation', label: 'Biến đổi câu' },
  { id: 'qa', label: 'Hỏi đáp theo gợi ý' },
  { id: 'dialogue', label: 'Hội thoại điền chỗ trống' },
];

export interface DialogueLine { speaker: string; text: string; text_full: string; vi: string; reading: string }

interface DrillBase {
  id: string;
  grammar_lesson: number;
  lessonLabel: string;
  type_vi: string;
  grammarIds: number[];
  patterns: string[];
  instruction_vi: string;
}
export interface ItemDrill extends DrillBase {
  type: 'substitution' | 'transformation' | 'qa';
  frame?: string;
  answer_mode: 'exact' | 'model';
  items: ExerciseItem[];
}
export interface DialogueDrill extends DrillBase {
  type: 'dialogue';
  title_vi: string;
  lines: DialogueLine[];
  blanks: Blank[];
  script_for_listening?: boolean;
}
export type GrammarDrill = ItemDrill | DialogueDrill;

const ID = /^L\d{2}-[STQD]\d+$/;

/** Đọc + kiểm tra bài tập; lỗi dữ liệu thì ném ra một lần, liệt kê đủ (giống buildGrammarQuestionBank). */
export function buildGrammarDrills(
  grammar: readonly GrammarContent[],
  source: { exercises: unknown[] } = rawDrills as { exercises: unknown[] },
): GrammarDrill[] {
  const errors: string[] = [];
  const grammarIds = new Set(grammar.map((entry) => entry.id));
  const seen = new Set<string>();
  const drills = source.exercises as GrammarDrill[];
  for (const drill of drills) {
    const where = drill.id ?? '(không có id)';
    if (!ID.test(drill.id)) errors.push(`${where}: id sai định dạng.`);
    if (seen.has(drill.id)) errors.push(`${where}: trùng id.`);
    seen.add(drill.id);
    if (!GRAMMAR_DRILL_TYPES.some((type) => type.id === drill.type)) errors.push(`${where}: dạng bài lạ "${drill.type}".`);
    for (const id of drill.grammarIds ?? []) if (!grammarIds.has(id)) errors.push(`${where}: mẫu ngữ pháp ${id} không có trong dữ liệu.`);
    if (drill.type === 'dialogue') {
      const holes = new Set(drill.lines.flatMap((line) => [...line.text.matchAll(/\{\{(\d+)\}\}/g)].map((m) => Number(m[1]))));
      for (const blank of drill.blanks) {
        if (!holes.has(blank.n)) errors.push(`${where}: chỗ trống {{${blank.n}}} không có trong hội thoại.`);
        if (blank.options.length !== 4 || new Set(blank.options).size !== 4) errors.push(`${where}: chỗ trống ${blank.n} cần 4 lựa chọn khác nhau.`);
        if (blank.answer_index < 1 || blank.answer_index > 4) errors.push(`${where}: answer_index của chỗ trống ${blank.n} phải 1–4.`);
      }
      if (holes.size !== drill.blanks.length) errors.push(`${where}: số chỗ trống không khớp số blanks.`);
    } else {
      if (!drill.items?.length) errors.push(`${where}: không có mục nào.`);
      for (const item of drill.items ?? []) {
        if (!item.answers.length || item.answers.length !== item.readings.length) errors.push(`${where} mục ${item.n}: answers/readings phải cùng độ dài, ≥ 1.`);
      }
    }
  }
  if (errors.length) throw new Error(`Bài tập ngữ pháp không hợp lệ:\n${errors.join('\n')}`);
  return drills;
}

export const drillsOfLesson = (drills: readonly GrammarDrill[], lesson: number) => drills.filter((drill) => drill.grammar_lesson === lesson);
export const drillsOfPattern = (drills: readonly GrammarDrill[], grammarId: number) => drills.filter((drill) => drill.grammarIds.includes(grammarId));
