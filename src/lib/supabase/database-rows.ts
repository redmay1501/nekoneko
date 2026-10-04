/**
 * Kiểu của các dòng trong PostgreSQL (snake_case), dùng khi đọc kết quả Supabase.
 * Có thể thay bằng file sinh tự động: `supabase gen types typescript`.
 */

export interface JourneyDayRow {
  day: number; week: number | null; stage: string; minna: string; title: string;
  kanji_summary: string; radical_summary: string; grammar_summary: string; vocab_summary: string;
  skill: string; minutes: number;
}
export interface DayTaskRow { day: number; order_no: number; label: string; body: string; minutes: number }
export interface KanaRow { id: number; hiragana: string; katakana: string; romaji: string; tip: string; day: number | null }
export interface RadicalRow { id: number; radical: string; name_jp: string; meaning: string; kanji_list: string; tip: string; day: number | null }
export interface KanjiRow {
  id: number; character: string; han_viet: string; meaning: string; on_reading: string; kun_reading: string;
  strokes: number | null; words: string; tip: string; day: number | null;
}
export interface VocabularyRow { id: number; kana: string; kanji: string; meaning: string; tip: string; lesson: string; day: number | null }
export interface GrammarRow {
  id: number; pattern: string; usage: string; example_jp: string; example_vi: string; lesson: string; day: number | null;
}
export interface LessonRow {
  id: string; name: string; day_range: string; day_count: number | null; grammar_count: string; vocab_count: string; note: string;
}
export interface JlptGrammarRow { id: number; pattern: string; usage: string }
export interface StudyResourceRow { id: number; source: string; used_for: string; how_to: string }
export interface ReadingPassageRow {
  id: number; day: number; lesson: string; text_jp: string;
  questions: Array<{ question: string; options: string[]; correctIndex: number }>;
}
export interface PracticeTemplateRow { id: number; kind: string; context_jp: string; sentence_jp: string; prompt_vi: string }

export interface ProfileRow {
  id: string; display_name: string; start_date: string; exam_date: string | null; level: number;
  current_day: number; journey_completed_at: string | null;
}
export interface UserSettingsRow {
  user_id: string; daily_minutes: number; reminder_time: string | null;
  autoplay_audio: boolean; show_furigana: boolean; gentle_mode: boolean;
  welcomed_at: string | null;
  voice_gender?: string;
}
export interface MemoryItemRow {
  content_type: string; content_id: number; memory_score: number; encounter_count: number; correct_count: number;
  wrong_count: number; rescued_count: number; last_seen_at: string | null; last_recalled_at: string | null;
  next_review_at: string | null; created_at: string;
}
export interface LearningSessionRow {
  id: string; user_id: string; mode: string; journey_day: number | null; started_at: string; ended_at: string | null; summary: unknown;
}
export interface SessionItemRow {
  step_index: number; payload: unknown; correct_answer: string | null; answered_at: string | null; result: unknown;
}
