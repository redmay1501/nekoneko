import type {
  GrammarContent,
  KanaContent,
  KanjiContent,
  RadicalContent,
  VocabularyContent,
} from '@/types/content';

/**
 * Sáu loại kiến thức được Memory Engine theo dõi riêng từng mục.
 * Hiragana và Katakana tách riêng (dù chung một bảng `kana`) vì người học nhớ
 * chúng độc lập — giống prototype (h1 / k1).
 */
export const CONTENT_TYPES = {
  HIRAGANA: 'hiragana',
  KATAKANA: 'katakana',
  RADICAL: 'radical',
  KANJI: 'kanji',
  VOCABULARY: 'vocabulary',
  GRAMMAR: 'grammar',
} as const;

export type ContentType = (typeof CONTENT_TYPES)[keyof typeof CONTENT_TYPES];

export const ALL_CONTENT_TYPES: readonly ContentType[] = Object.values(CONTENT_TYPES);

/** Định danh duy nhất của một kiến thức, dạng "kanji-12". An toàn khi đặt trong URL. */
export type ContentKey = `${ContentType}-${number}`;

export function toContentKey(type: ContentType, id: number): ContentKey {
  return `${type}-${id}`;
}

export function parseContentKey(key: string): { type: ContentType; id: number } | null {
  const match = /^([a-z]+)-(\d+)$/.exec(key);
  if (!match) return null;
  const type = match[1] as ContentType;
  if (!ALL_CONTENT_TYPES.includes(type)) return null;
  return { type, id: Number(match[2]) };
}

interface KnowledgeItemBase {
  key: ContentKey;
  id: number;
  /** Thứ hiện to nhất trên thẻ: chữ, từ, hoặc mẫu câu. */
  face: string;
  /** Cách đọc: romaji cho kana, kana cho từ vựng, On/Kun cho kanji, câu ví dụ cho ngữ pháp. */
  reading: string;
  /** Nghĩa tiếng Việt. */
  meaning: string;
  /** Ngày học theo lộ trình 90 ngày. */
  day: number | null;
}

export type KnowledgeItem =
  | (KnowledgeItemBase & { type: 'hiragana'; content: KanaContent })
  | (KnowledgeItemBase & { type: 'katakana'; content: KanaContent })
  | (KnowledgeItemBase & { type: 'radical'; content: RadicalContent })
  | (KnowledgeItemBase & { type: 'kanji'; content: KanjiContent })
  | (KnowledgeItemBase & { type: 'vocabulary'; content: VocabularyContent })
  | (KnowledgeItemBase & { type: 'grammar'; content: GrammarContent });

/** Nhãn tiếng Việt cho từng loại kiến thức. */
export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  hiragana: 'Hiragana',
  katakana: 'Katakana',
  radical: 'Bộ thủ',
  kanji: 'Kanji',
  vocabulary: 'Từ vựng',
  grammar: 'Ngữ pháp',
};
