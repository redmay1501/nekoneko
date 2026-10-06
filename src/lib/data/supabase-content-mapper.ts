import type { N5Content } from '@/types/content';
import { byLessonNumber } from '@/lib/utils/lesson';
import type {
  DayTaskRow, GrammarRow, JlptGrammarRow, JourneyDayRow, KanaRow, KanjiRadicalRow, KanjiRow, LessonRow,
  ExampleSentenceRow, PracticeTemplateRow, RadicalRow, ReadingPassageRow, StudyResourceRow, VocabularyRow,
} from '@/lib/supabase/database-rows';

/**
 * Đổi dòng PostgreSQL (snake_case) ⇄ kiểu nội dung (camelCase).
 * Dùng chung cho việc ĐỌC (app) và GHI (script seed) để hai chiều không lệch nhau.
 */

export interface ContentRows {
  journeyDays: JourneyDayRow[]; dayTasks: DayTaskRow[]; kana: KanaRow[]; radicals: RadicalRow[];
  kanji: KanjiRow[]; vocabulary: VocabularyRow[]; grammar: GrammarRow[]; lessons: LessonRow[];
  jlptGrammar: JlptGrammarRow[]; studyResources: StudyResourceRow[]; readingPassages: ReadingPassageRow[];
  practiceTemplates: PracticeTemplateRow[]; exampleSentences: ExampleSentenceRow[]; kanjiRadicals: KanjiRadicalRow[];
}

export function contentFromRows(rows: ContentRows): N5Content {
  return {
    journeyDays: rows.journeyDays.map((row) => ({
      day: row.day, week: row.week, stage: row.stage, minna: row.minna, title: row.title,
      kanjiSummary: row.kanji_summary, radicalSummary: row.radical_summary, grammarSummary: row.grammar_summary,
      vocabSummary: row.vocab_summary, skill: row.skill, minutes: row.minutes,
    })),
    dayTasks: rows.dayTasks.map((row) => ({ day: row.day, orderNo: row.order_no, label: row.label, body: row.body, minutes: row.minutes })),
    kana: rows.kana.map((row) => ({ ...row })),
    radicals: rows.radicals.map((row) => ({
      id: row.id, radical: row.radical, nameJp: row.name_jp, meaning: row.meaning, kanjiList: row.kanji_list, tip: row.tip, day: row.day,
    })),
    kanji: rows.kanji.map((row) => ({
      id: row.id, character: row.character, hanViet: row.han_viet, meaning: row.meaning, onReading: row.on_reading,
      kunReading: row.kun_reading, strokes: row.strokes, words: row.words, tip: row.tip, day: row.day,
    })),
    vocabulary: rows.vocabulary.map((row) => ({ ...row })),
    grammar: rows.grammar.map((row) => ({
      id: row.id, pattern: row.pattern, usage: row.usage, exampleJp: row.example_jp, exampleVi: row.example_vi,
      lesson: row.lesson, day: row.day, exampleReading: row.example_reading ?? '', whenToUse: row.when_to_use ?? '',
      commonMistake: row.common_mistake ?? '', example2Jp: row.example2_jp ?? '', example2Reading: row.example2_reading ?? '',
      example2Vi: row.example2_vi ?? '',
    })),
    lessons: rows.lessons.map((row) => ({
      id: row.id, name: row.name, dayRange: row.day_range, dayCount: row.day_count,
      grammarCount: row.grammar_count, vocabCount: row.vocab_count, note: row.note,
    })).sort(byLessonNumber((lesson) => lesson.id)),
    jlptGrammar: rows.jlptGrammar.map((row) => ({ ...row })),
    studyResources: rows.studyResources.map((row) => ({ id: row.id, source: row.source, usedFor: row.used_for, howTo: row.how_to })),
    readingPassages: rows.readingPassages.map((row) => ({
      id: row.id, day: row.day, lesson: row.lesson, textJp: row.text_jp, questions: row.questions,
    })),
    practiceTemplates: rows.practiceTemplates.map((row) => ({
      id: row.id, kind: row.kind, contextJp: row.context_jp, sentenceJp: row.sentence_jp, promptVi: row.prompt_vi,
    })),
    exampleSentences: rows.exampleSentences.map((row) => ({
      id: row.id, jp: row.text_jp, vi: row.text_vi, viId: row.vi_id, owner: row.owner, viOwner: row.vi_owner,
    })),
    kanjiRadicals: rows.kanjiRadicals.map((row) => ({ kanjiId: row.kanji_id, radicalId: row.radical_id, position: row.position }))
      .sort((left, right) => left.kanjiId - right.kanjiId || left.position - right.position),
  };
}

export function rowsFromContent(content: N5Content): ContentRows {
  return {
    journeyDays: content.journeyDays.map((day) => ({
      day: day.day, week: day.week, stage: day.stage, minna: day.minna, title: day.title,
      kanji_summary: day.kanjiSummary, radical_summary: day.radicalSummary, grammar_summary: day.grammarSummary,
      vocab_summary: day.vocabSummary, skill: day.skill, minutes: day.minutes,
    })),
    dayTasks: content.dayTasks.map((task) => ({ day: task.day, order_no: task.orderNo, label: task.label, body: task.body, minutes: task.minutes })),
    kana: content.kana.map((kana) => ({ ...kana })),
    radicals: content.radicals.map((radical) => ({
      id: radical.id, radical: radical.radical, name_jp: radical.nameJp, meaning: radical.meaning,
      kanji_list: radical.kanjiList, tip: radical.tip, day: radical.day,
    })),
    kanji: content.kanji.map((kanji) => ({
      id: kanji.id, character: kanji.character, han_viet: kanji.hanViet, meaning: kanji.meaning, on_reading: kanji.onReading,
      kun_reading: kanji.kunReading, strokes: kanji.strokes, words: kanji.words, tip: kanji.tip, day: kanji.day,
    })),
    vocabulary: content.vocabulary.map((word) => ({ ...word })),
    grammar: content.grammar.map((pattern) => ({
      id: pattern.id, pattern: pattern.pattern, usage: pattern.usage, example_jp: pattern.exampleJp,
      example_vi: pattern.exampleVi, lesson: pattern.lesson, day: pattern.day, example_reading: pattern.exampleReading,
      when_to_use: pattern.whenToUse, common_mistake: pattern.commonMistake, example2_jp: pattern.example2Jp,
      example2_reading: pattern.example2Reading, example2_vi: pattern.example2Vi,
    })),
    lessons: content.lessons.map((lesson) => ({
      id: lesson.id, name: lesson.name, day_range: lesson.dayRange, day_count: lesson.dayCount,
      grammar_count: lesson.grammarCount, vocab_count: lesson.vocabCount, note: lesson.note,
    })),
    jlptGrammar: content.jlptGrammar.map((pattern) => ({ ...pattern })),
    studyResources: content.studyResources.map((resource) => ({
      id: resource.id, source: resource.source, used_for: resource.usedFor, how_to: resource.howTo,
    })),
    readingPassages: content.readingPassages.map((passage) => ({
      id: passage.id, day: passage.day, lesson: passage.lesson, text_jp: passage.textJp, questions: passage.questions,
    })),
    practiceTemplates: content.practiceTemplates.map((template) => ({
      id: template.id, kind: template.kind, context_jp: template.contextJp, sentence_jp: template.sentenceJp, prompt_vi: template.promptVi,
    })),
    exampleSentences: content.exampleSentences.map((sentence) => ({
      id: sentence.id, text_jp: sentence.jp, text_vi: sentence.vi, vi_id: sentence.viId, owner: sentence.owner, vi_owner: sentence.viOwner,
    })),
    kanjiRadicals: content.kanjiRadicals.map((link) => ({ kanji_id: link.kanjiId, radical_id: link.radicalId, position: link.position })),
  };
}

/** Tên bảng ứng với từng khoá trong ContentRows, kèm khoá chính để upsert. */
export const CONTENT_TABLES: ReadonlyArray<{ key: keyof ContentRows; table: string; conflictKey: string; orderBy: string }> = [
  { key: 'journeyDays', table: 'journey_days', conflictKey: 'day', orderBy: 'day' },
  { key: 'dayTasks', table: 'day_tasks', conflictKey: 'day,order_no', orderBy: 'day' },
  { key: 'kana', table: 'kana', conflictKey: 'id', orderBy: 'id' },
  { key: 'radicals', table: 'radicals', conflictKey: 'id', orderBy: 'id' },
  { key: 'kanji', table: 'kanji', conflictKey: 'id', orderBy: 'id' },
  { key: 'vocabulary', table: 'vocabulary', conflictKey: 'id', orderBy: 'id' },
  { key: 'grammar', table: 'grammar', conflictKey: 'id', orderBy: 'id' },
  { key: 'lessons', table: 'lessons', conflictKey: 'id', orderBy: 'id' },
  { key: 'jlptGrammar', table: 'jlpt_grammar', conflictKey: 'id', orderBy: 'id' },
  { key: 'studyResources', table: 'study_resources', conflictKey: 'id', orderBy: 'id' },
  { key: 'readingPassages', table: 'reading_passages', conflictKey: 'id', orderBy: 'id' },
  { key: 'practiceTemplates', table: 'practice_templates', conflictKey: 'id', orderBy: 'id' },
  { key: 'exampleSentences', table: 'example_sentences', conflictKey: 'id', orderBy: 'id' },
  // Sau radicals và kanji (khoá ngoại).
  { key: 'kanjiRadicals', table: 'kanji_radicals', conflictKey: 'kanji_id,radical_id', orderBy: 'kanji_id' },
];
