import type { GrammarContent, N5Content } from '@/types/content';

interface GrammarNote {
  reading: string;
  when: string;
  mistake: string;
  example: { jp: string; reading: string; vi: string };
}

/** Dạng file content/seed/grammar-notes.json. */
export interface GrammarNotesSource {
  fixes: Record<string, Partial<Pick<GrammarContent, 'usage' | 'exampleVi'>>>;
  notes: Record<string, GrammarNote>;
}

type GrammarBase = Omit<GrammarContent, 'exampleReading' | 'whenToUse' | 'commonMistake' | 'example2Jp' | 'example2Reading' | 'example2Vi'>;

/** Gộp ghi chú ngữ pháp (cách đọc, khi nào dùng, lỗi thường gặp, ví dụ 2) và các chỗ sửa nội dung vào từng mẫu câu. */
export function withGrammarNotes<T extends { grammar: GrammarBase[] }>(content: T, source: GrammarNotesSource): Omit<T, 'grammar'> & Pick<N5Content, 'grammar'> {
  return {
    ...content,
    grammar: content.grammar.map((pattern) => {
      const note = source.notes[String(pattern.id)];
      return {
        ...pattern,
        ...source.fixes[String(pattern.id)],
        exampleReading: note?.reading ?? '',
        whenToUse: note?.when ?? '',
        commonMistake: note?.mistake ?? '',
        example2Jp: note?.example.jp ?? '',
        example2Reading: note?.example.reading ?? '',
        example2Vi: note?.example.vi ?? '',
      };
    }),
  };
}
