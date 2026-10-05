/**
 * Kiểu dữ liệu NỘI DUNG HỌC — khớp 1-1 với content/seed/n5-content.json
 * và các bảng nội dung trong supabase/migrations.
 *
 * Nội dung là dữ liệu dùng chung cho mọi người học, không phụ thuộc user.
 * Nguồn sự thật: file Lo_trinh_JLPT_N5_90_ngay_Minna.xlsx.
 */

export interface JourneyDay {
  day: number;
  week: number | null;
  stage: string;
  minna: string;
  title: string;
  kanjiSummary: string;
  radicalSummary: string;
  grammarSummary: string;
  vocabSummary: string;
  skill: string;
  minutes: number;
}

export interface DayTask {
  day: number;
  orderNo: number;
  label: string;
  body: string;
  minutes: number;
}

export interface KanaContent {
  id: number;
  hiragana: string;
  katakana: string;
  romaji: string;
  tip: string;
  day: number | null;
}

export interface RadicalContent {
  id: number;
  radical: string;
  nameJp: string;
  meaning: string;
  kanjiList: string;
  tip: string;
  day: number | null;
}

export interface KanjiContent {
  id: number;
  character: string;
  hanViet: string;
  meaning: string;
  onReading: string;
  kunReading: string;
  strokes: number | null;
  words: string;
  tip: string;
  day: number | null;
}

export interface VocabularyContent {
  id: number;
  kana: string;
  kanji: string;
  meaning: string;
  tip: string;
  lesson: string;
  day: number | null;
}

export interface GrammarContent {
  id: number;
  pattern: string;
  usage: string;
  exampleJp: string;
  exampleVi: string;
  lesson: string;
  day: number | null;
}

export interface LessonContent {
  id: string;
  name: string;
  dayRange: string;
  dayCount: number | null;
  grammarCount: string;
  vocabCount: string;
  note: string;
}

export interface JlptGrammarContent {
  id: number;
  pattern: string;
  usage: string;
}

export interface StudyResource {
  id: number;
  source: string;
  usedFor: string;
  howTo: string;
}

export interface ReadingQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

export interface ReadingPassage {
  id: number;
  day: number;
  lesson: string;
  textJp: string;
  questions: ReadingQuestion[];
}

export interface PracticeTemplate {
  id: number;
  kind: string;
  contextJp: string;
  sentenceJp: string;
  promptVi: string;
}

/** Câu ví dụ tiếng Nhật ↔ tiếng Việt (Tatoeba, CC BY 2.0 FR) — mã câu + người đóng góp để ghi nguồn. */
export interface ExampleSentence {
  id: number;
  jp: string;
  vi: string;
  viId: number | null;
  owner: string | null;
  viOwner: string | null;
}

export interface N5Content {
  journeyDays: JourneyDay[];
  dayTasks: DayTask[];
  kana: KanaContent[];
  radicals: RadicalContent[];
  kanji: KanjiContent[];
  vocabulary: VocabularyContent[];
  grammar: GrammarContent[];
  lessons: LessonContent[];
  jlptGrammar: JlptGrammarContent[];
  studyResources: StudyResource[];
  readingPassages: ReadingPassage[];
  practiceTemplates: PracticeTemplate[];
  exampleSentences: ExampleSentence[];
}
