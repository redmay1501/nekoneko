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

/** Ảnh minh hoạ admin gắn cho một mục (Supabase Storage, bucket content-media). Không có → giao diện tự bỏ qua. */
export interface ContentImage {
  url: string;
  /** Mô tả ảnh cho trình đọc màn hình — rỗng thì dùng nghĩa của mục. */
  alt: string;
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
  image?: ContentImage | null;
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
  image?: ContentImage | null;
}

export interface VocabularyContent {
  id: number;
  kana: string;
  kanji: string;
  meaning: string;
  tip: string;
  lesson: string;
  day: number | null;
  image?: ContentImage | null;
}

export interface GrammarContent {
  id: number;
  pattern: string;
  usage: string;
  exampleJp: string;
  exampleVi: string;
  lesson: string;
  day: number | null;
  /** Cách đọc (kana) của câu ví dụ — chế độ học hiện, chế độ kiểm tra ẩn. */
  exampleReading: string;
  whenToUse: string;
  commonMistake: string;
  example2Jp: string;
  example2Reading: string;
  example2Vi: string;
  image?: ContentImage | null;
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
  /** Tên bài (tiếng Việt). */
  title: string;
  textJp: string;
  /** Bản dịch cả đoạn — hiện sau khi làm xong. */
  textVi: string;
  /** Cả đoạn viết bằng kana (bài có chữ Hán) — người học bật "Xem cách đọc" khi chưa đọc được chữ Hán. */
  textKana?: string;
  /** Từ trong bài thuộc bài Minna SAU (chưa học tới) — hiện kèm cách đọc, nghĩa, bài sẽ học. */
  glossary?: ReadingGlossaryEntry[];
  questions: ReadingQuestion[];
}

export interface ReadingGlossaryEntry {
  /** Đúng dạng chữ xuất hiện trong bài. */
  word: string;
  reading: string;
  meaning: string;
  /** "Bài 10" — bài Minna dạy từ này. */
  lesson: string;
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

/** Kanji ↔ bộ thủ theo id (content/seed/kanji-radicals.json). position 0 = bộ chính, sau đó là bộ nhìn thấy trong chữ. */
export interface KanjiRadicalLink {
  kanjiId: number;
  radicalId: number;
  position: number;
}

/**
 * Câu chuyện ghi nhớ Kanji (content/seed/kanji-stories.json · bảng kanji_stories).
 * Tách khỏi KanjiContent: đổi / thêm phiên bản chuyện không đụng tới kanji, lộ trình hay tiến độ học.
 * Mỗi (kanjiId, locale) chỉ một bản được dùng — bản `published` có version cao nhất (lib/data/kanji-stories.ts).
 * Nghĩa / âm đọc vẫn lấy của KanjiContent; chuyện chỉ mang phần kể, mẹo chốt, từ ứng dụng và ảnh.
 */
export type KanjiStoryStatus = 'draft' | 'published' | 'archived';
/** Có URL nguồn ≠ đã được cấp phép dùng thương mại. 'unverified' cho tới khi có người kiểm tra. */
export type ImageLicenseStatus = 'unverified' | 'verified' | 'rejected';

export interface KanjiStoryImage {
  /** URL ảnh gốc của thư viện (Pixabay CDN / Wikimedia) — dùng trực tiếp, không thay, không cắt. */
  url: string;
  /**
   * Bản sao ảnh trên Supabase Storage của app (scripts/host-kanji-story-images.ts). Có thì dùng trước — không phụ thuộc
   * CDN bên ngoài; tải lỗi thì về `url` gốc. Không có trong dữ liệu repo (demo dùng URL gốc).
   */
  hostedUrl?: string;
  alt: string;
  /** Trang nguồn của ảnh. */
  sourceUrl: string;
  /** Nguyên văn nhãn nguồn, ví dụ "Pixabay · Clker-Free-Vector-Images". */
  sourceLabel: string;
  provider: string;
  credit: string;
  /** Kích thước gốc (để giữ tỉ lệ khung, tránh nhảy bố cục); null khi nguồn không ghi số đo. */
  width: number | null;
  height: number | null;
  resolution: string;
  license: string;
  licenseUrl: string;
  licenseStatus: ImageLicenseStatus;
  description: string;
  usageNote: string;
}

export interface KanjiStoryExampleWord {
  word: string;
  reading: string;
}

export interface KanjiStory {
  kanjiId: number;
  locale: string;
  version: number;
  status: KanjiStoryStatus;
  /** Mã thẻ trong thư viện gốc (n5-001…), để đối chiếu khi nhập phiên bản mới. */
  sourceId: string;
  category: string;
  categoryLabel: string;
  title: string;
  content: string;
  memoryTip: string;
  exampleWords: KanjiStoryExampleWord[];
  image: KanjiStoryImage | null;
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
  kanjiRadicals: KanjiRadicalLink[];
  /** Mọi phiên bản / ngôn ngữ đã nhập; chọn bản hiển thị bằng kanjiStoryOf(). */
  kanjiStories: KanjiStory[];
}
