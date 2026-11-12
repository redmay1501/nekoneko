import rawKanjiStories from '@content/seed/kanji-stories.json';
import type { ImageLicenseStatus, KanjiStory, KanjiStoryExampleWord, KanjiStoryStatus, N5Content } from '@/types/content';
import type { KanjiStoryRow } from '@/lib/supabase/database-rows';

/**
 * Câu chuyện ghi nhớ Kanji — DỮ LIỆU, tách khỏi giao diện.
 *
 * Nguồn:
 *  - content/seed/kanji-stories.json — sinh từ thư viện HTML bằng scripts/import-kanji-stories.py (demo, test, seed).
 *  - bảng kanji_stories (migration 20261112000001) — production, `npm run seed:content` thêm dòng còn thiếu.
 *
 * Phiên bản: khoá (kanjiId, locale, version). Bản hiển thị = bản `published` có version cao nhất của (kanjiId, locale).
 * Viết lại chuyện → thêm version mới, bản cũ vẫn còn (rollback = archive bản mới). Không đụng tiến độ học.
 */
export const DEFAULT_STORY_LOCALE = 'vi';

/** Dạng file content/seed/kanji-stories.json (thêm `character` và `source` để đối chiếu — không đưa vào app). */
interface KanjiStorySeed extends KanjiStory {
  character: string;
  source: { meaning: string; onyomi: string; kunyomi: string; imageStatus: string };
}
export interface KanjiStoriesSource {
  source: { file: string; sha256: string; cards: number; version: number };
  stories: KanjiStorySeed[];
}

export const KANJI_STORIES_SOURCE = rawKanjiStories as unknown as KanjiStoriesSource;

function toStory(seed: KanjiStorySeed): KanjiStory {
  return {
    kanjiId: seed.kanjiId, locale: seed.locale, version: seed.version, status: seed.status, sourceId: seed.sourceId,
    category: seed.category, categoryLabel: seed.categoryLabel, title: seed.title, content: seed.content,
    memoryTip: seed.memoryTip, exampleWords: seed.exampleWords.map((word) => ({ ...word })),
    image: seed.image ? { ...seed.image } : null,
  };
}

/** Chuyện trong repo (dùng ở demo, test, seed — và làm dự phòng khi bảng kanji_stories chưa có). */
export function loadSeedKanjiStories(): KanjiStory[] {
  return KANJI_STORIES_SOURCE.stories.map(toStory);
}

/** Gắn chuyện vào nội dung. Chuyện của kanji không còn trong nội dung (bị ẩn / xoá) thì bỏ. */
export function withKanjiStories<T extends Omit<N5Content, 'kanjiStories'>>(content: T, stories: readonly KanjiStory[]): T & Pick<N5Content, 'kanjiStories'> {
  const kanjiIds = new Set(content.kanji.map((kanji) => kanji.id));
  return { ...content, kanjiStories: stories.filter((story) => kanjiIds.has(story.kanjiId)) };
}

const storyIndexByContent = new WeakMap<readonly KanjiStory[], Map<string, KanjiStory>>();
const indexKey = (kanjiId: number, locale: string) => `${kanjiId}:${locale}`;

/** Chỉ mục (kanjiId, locale) → bản published mới nhất; dựng một lần cho mỗi mảng nội dung (nội dung được cache). */
function storyIndex(stories: readonly KanjiStory[]): Map<string, KanjiStory> {
  let index = storyIndexByContent.get(stories);
  if (!index) {
    index = new Map();
    for (const story of stories) {
      if (story.status !== 'published') continue;
      const key = indexKey(story.kanjiId, story.locale);
      const current = index.get(key);
      if (!current || story.version > current.version) index.set(key, story);
    }
    storyIndexByContent.set(stories, index);
  }
  return index;
}

/** Chuyện đang dùng của một kanji; chưa có bản cho ngôn ngữ này thì về tiếng Việt; không có thì null. */
export function kanjiStoryOf(content: Pick<N5Content, 'kanjiStories'>, kanjiId: number, locale = DEFAULT_STORY_LOCALE): KanjiStory | null {
  const index = storyIndex(content.kanjiStories ?? []);
  return index.get(indexKey(kanjiId, locale)) ?? index.get(indexKey(kanjiId, DEFAULT_STORY_LOCALE)) ?? null;
}

// ─────────────── Bảng kanji_stories ⇄ KanjiStory ───────────────

const STATUSES: readonly KanjiStoryStatus[] = ['draft', 'published', 'archived'];
const LICENSE_STATUSES: readonly ImageLicenseStatus[] = ['unverified', 'verified', 'rejected'];

export function kanjiStoryFromRow(row: KanjiStoryRow): KanjiStory {
  const exampleWords = Array.isArray(row.example_words) ? row.example_words as KanjiStoryExampleWord[] : [];
  return {
    kanjiId: row.kanji_id, locale: row.locale, version: row.version,
    status: STATUSES.includes(row.status as KanjiStoryStatus) ? row.status as KanjiStoryStatus : 'draft',
    sourceId: row.source_id ?? '', category: row.category, categoryLabel: row.category_label, title: row.title,
    content: row.content, memoryTip: row.memory_tip,
    exampleWords: exampleWords.filter((word) => word && typeof word.word === 'string').map((word) => ({ word: word.word, reading: word.reading ?? '' })),
    image: row.image_url ? {
      url: row.image_url, ...(row.image_hosted_url ? { hostedUrl: row.image_hosted_url } : {}), alt: row.image_alt, sourceUrl: row.image_source_url, sourceLabel: row.image_source_label,
      provider: row.image_provider, credit: row.image_credit, width: row.image_width, height: row.image_height,
      resolution: row.image_resolution, license: row.image_license, licenseUrl: row.image_license_url,
      // Giá trị lạ trong database → coi như chưa xác minh (không bao giờ tự nâng thành "verified").
      licenseStatus: LICENSE_STATUSES.includes(row.image_license_status as ImageLicenseStatus) ? row.image_license_status as ImageLicenseStatus : 'unverified',
      description: row.image_description, usageNote: row.image_usage_note,
    } : null,
  };
}

export function kanjiStoryToRow(story: KanjiStory): KanjiStoryRow {
  const image = story.image;
  return {
    kanji_id: story.kanjiId, locale: story.locale, version: story.version, status: story.status, source_id: story.sourceId || null,
    category: story.category, category_label: story.categoryLabel, title: story.title, content: story.content,
    memory_tip: story.memoryTip, example_words: story.exampleWords.map((word) => ({ ...word })),
    image_url: image?.url ?? null, image_hosted_url: image?.hostedUrl ?? null, image_alt: image?.alt ?? '', image_source_url: image?.sourceUrl ?? '',
    image_source_label: image?.sourceLabel ?? '', image_provider: image?.provider ?? '', image_credit: image?.credit ?? '',
    image_width: image?.width ?? null, image_height: image?.height ?? null, image_resolution: image?.resolution ?? '',
    image_license: image?.license ?? '', image_license_url: image?.licenseUrl ?? '',
    image_license_status: image?.licenseStatus ?? 'unverified', image_description: image?.description ?? '',
    image_usage_note: image?.usageNote ?? '',
  };
}
