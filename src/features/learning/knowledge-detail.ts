import type { GrammarContent, KanjiContent, KanjiStory, RadicalContent, VocabularyContent } from '@/types/content';
import type { GameRecords } from '@/features/games/match-game';
import { kanjiStoryOf } from '@/lib/data/kanji-stories';
import { type KanjiStoryProgress, NO_STORY_PROGRESS, kanjiStoryProgressOf } from './kanji-story-progress';
import { type RadicalExpandableData, toRadicalExpandable } from './radical-view';
import type { MemoryView } from '@/features/memory/memory-types';
import { extractLessonNumber } from '@/lib/utils/text';
import type { KnowledgeCatalog } from './knowledge-catalog';
import { type ChainNode, buildKnowledgeChain } from './knowledge-presenter';
import {
  grammarUsingVocabulary,
  kanjiContainingRadical,
  kanjiInVocabulary,
  radicalsOfKanji,
  vocabularyContainingKanji,
} from './knowledge-relations';
import type { KnowledgeItem } from './knowledge-types';

/** Mọi thứ khay "Chi tiết kiến thức" cần — dựng ở server, gửi một lần. */
export interface KnowledgeDetailView {
  item: KnowledgeItem;
  memory: MemoryView;
  chain: ChainNode[];
  related: {
    radicals: RadicalContent[];
    kanji: KanjiContent[];
    vocabulary: VocabularyContent[];
    grammar: GrammarContent[];
    /** Kanji: các bộ thủ tạo nên chữ, đủ dữ liệu để mở rộng tại chỗ (nghĩa, mẹo, Kanji cùng bộ). */
    radicalDetails: RadicalExpandableData[];
  };
  /** Ngữ pháp: "Lỗi thường gặp" — mượn ghi chú của bài Minna (sheet 7, hạng mục Văn bản). */
  commonMistake: string | null;
  /** Kanji: câu chuyện ghi nhớ đang dùng (dùng chung cho mọi bài có chữ này); null nếu chưa có. */
  story: KanjiStory | null;
  /** Người học đã xem / đã đọc chuyện chưa — KHÔNG phải mức nhớ (mức nhớ ở `memory`). */
  storyProgress: KanjiStoryProgress;
}

const DEFAULT_MISTAKE_NOTE = 'Đọc kỹ ví dụ và tự đặt một câu của riêng bạn — đó là cách nhớ lâu nhất.';

/** `storyRecords`: user_settings.game_records của người học (không có — admin xem trước — thì coi như chưa đọc). */
export function buildKnowledgeDetail(item: KnowledgeItem, memory: MemoryView, catalog: KnowledgeCatalog, storyRecords?: GameRecords): KnowledgeDetailView {
  const related: KnowledgeDetailView['related'] = { radicals: [], kanji: [], vocabulary: [], grammar: [], radicalDetails: [] };
  let commonMistake: string | null = null;

  if (item.type === 'radical') related.kanji = kanjiContainingRadical(catalog, item.content);
  if (item.type === 'kanji') {
    related.radicals = radicalsOfKanji(catalog, item.content);
    related.radicalDetails = related.radicals.map((radical) => toRadicalExpandable(catalog, radical));
    related.vocabulary = vocabularyContainingKanji(catalog, item.content);
  }
  if (item.type === 'vocabulary') {
    related.kanji = kanjiInVocabulary(catalog, item.content);
    related.grammar = grammarUsingVocabulary(catalog, item.content);
  }
  if (item.type === 'grammar') {
    const lessonNumber = extractLessonNumber(item.content.lesson);
    const lesson = catalog.content.lessons.find((candidate) => extractLessonNumber(candidate.id) === lessonNumber);
    commonMistake = item.content.commonMistake || lesson?.note || DEFAULT_MISTAKE_NOTE;
  }

  const story = item.type === 'kanji' ? kanjiStoryOf(catalog.content, item.id) : null;
  const storyProgress = story && storyRecords ? kanjiStoryProgressOf(storyRecords, item.id) : NO_STORY_PROGRESS;
  return { item, memory, chain: buildKnowledgeChain(item, catalog), related, commonMistake, story, storyProgress };
}
