import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { KanjiStory } from '@/types/content';
import { applyContentOverlays } from './content-overlays';
import { KANJI_STORIES_SOURCE, kanjiStoryFromRow, kanjiStoryOf, kanjiStoryToRow, loadSeedKanjiStories, withKanjiStories } from './kanji-stories';
import { loadSeedContent } from './seed-content';

const HTML_PATH = join(process.cwd(), KANJI_STORIES_SOURCE.source.file);
const hasHtml = existsSync(HTML_PATH);

/** Đọc lại thư viện HTML theo cách độc lập với script import (regex thay vì html.parser) để đối chiếu nguyên văn. */
function parseHtmlCards(html: string) {
  const decode = (text: string) => text.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
  return [...html.matchAll(/<article class="kanji-card"[\s\S]*?<\/article>/g)].map(([card]) => ({
    character: decode(/class="char">([\s\S]*?)<\/div>/.exec(card)![1]),
    story: decode(/class="story">([\s\S]*?)<\/p>/.exec(card)![1]),
    tip: decode(/class="memory-hook"><b>[^<]*<\/b>([\s\S]*?)<\/div>/.exec(card)![1]),
    imageUrl: decode(/<img[^>]*src="([^"]+)"/.exec(card)![1]),
    sourceUrl: decode(/class="picture-link" href="([^"]+)"/.exec(card)![1]),
    exampleWord: decode(/class="example-word">([\s\S]*?)<\/div>/.exec(card)![1]),
  }));
}

describe('kanji-stories.json — dữ liệu nhập từ thư viện v9', () => {
  const content = loadSeedContent();
  const stories = KANJI_STORIES_SOURCE.stories;

  it('đủ 103 câu chuyện, không trùng chữ / trùng (kanjiId, locale, version)', () => {
    expect(stories).toHaveLength(103);
    expect(new Set(stories.map((story) => story.character)).size).toBe(103);
    expect(new Set(stories.map((story) => `${story.kanjiId}:${story.locale}:${story.version}`)).size).toBe(103);
  });

  it('mỗi chuyện gắn đúng một kanji CÓ SẴN của app (cùng mặt chữ) — không tạo kanji mới', () => {
    const kanjiById = new Map(content.kanji.map((kanji) => [kanji.id, kanji]));
    for (const story of stories) expect(kanjiById.get(story.kanjiId)?.character, story.sourceId).toBe(story.character);
    expect(content.kanji).toHaveLength(103);
    expect(new Set(content.kanjiStories.map((story) => story.kanjiId))).toEqual(new Set(content.kanji.map((kanji) => kanji.id)));
  });

  it('không chuyện nào thiếu nội dung, câu chốt, ảnh, nguồn ảnh, giấy phép', () => {
    for (const story of stories) {
      expect(story.content.length, story.character).toBeGreaterThan(40);
      expect(story.memoryTip, story.character).not.toBe('');
      expect(story.title).toBe('Chuyện nhớ Kanji');
      expect(story.exampleWords.length, story.character).toBeGreaterThan(0);
      expect(story.image?.url, story.character).toMatch(/^https:\/\/(cdn\.pixabay\.com|upload\.wikimedia\.org)\//);
      expect(story.image?.sourceUrl, story.character).toMatch(/^https:\/\/(pixabay\.com|commons\.wikimedia\.org)\//);
      expect(story.image?.sourceLabel, story.character).not.toBe('');
      expect(story.image?.license, story.character).not.toBe('');
    }
  });

  it('có URL nguồn KHÔNG có nghĩa là đã xác minh giấy phép — mọi ảnh nhập vào đều "unverified"', () => {
    expect(new Set(stories.map((story) => story.image?.licenseStatus))).toEqual(new Set(['unverified']));
  });

  it.skipIf(!hasHtml)('giữ NGUYÊN VĂN câu chuyện, câu chốt, URL ảnh, trang nguồn và từ ứng dụng của file HTML', () => {
    const html = readFileSync(HTML_PATH, 'utf8');
    expect(createHash('sha256').update(html).digest('hex')).toBe(KANJI_STORIES_SOURCE.source.sha256);
    const cards = parseHtmlCards(html);
    expect(cards).toHaveLength(103);
    const byCharacter = new Map(stories.map((story) => [story.character, story]));
    for (const card of cards) {
      const story = byCharacter.get(card.character)!;
      expect(story.content, card.character).toBe(card.story);
      expect(story.memoryTip, card.character).toBe(card.tip);
      expect(story.image?.url, card.character).toBe(card.imageUrl);
      expect(story.image?.sourceUrl, card.character).toBe(card.sourceUrl);
      expect(story.exampleWords[0].word, card.character).toBe(card.exampleWord);
    }
  });
});

const story = (patch: Partial<KanjiStory>): KanjiStory => ({
  kanjiId: 1, locale: 'vi', version: 1, status: 'published', sourceId: '', category: '', categoryLabel: '', title: 'T',
  content: 'chuyện', memoryTip: 'chốt', exampleWords: [], image: null, ...patch,
});

describe('kanjiStoryOf — chọn phiên bản', () => {
  it('lấy bản published có version cao nhất; bỏ draft / archived', () => {
    const kanjiStories = [
      story({ version: 1, content: 'v1' }), story({ version: 3, status: 'draft', content: 'v3-draft' }),
      story({ version: 2, content: 'v2' }), story({ version: 4, status: 'archived', content: 'v4-archived' }),
    ];
    expect(kanjiStoryOf({ kanjiStories }, 1)?.content).toBe('v2');
  });

  it('ngôn ngữ chưa có bản → dùng tiếng Việt; kanji không có chuyện → null', () => {
    const kanjiStories = [story({ locale: 'vi', content: 'vi' }), story({ kanjiId: 2, locale: 'en', content: 'en' })];
    expect(kanjiStoryOf({ kanjiStories }, 1, 'en')?.content).toBe('vi');
    expect(kanjiStoryOf({ kanjiStories }, 2, 'en')?.content).toBe('en');
    expect(kanjiStoryOf({ kanjiStories }, 2)).toBeNull();
    expect(kanjiStoryOf({ kanjiStories }, 99)).toBeNull();
  });

  it('nội dung cache cũ chưa có trường kanjiStories → null, không lỗi', () => {
    expect(kanjiStoryOf({} as { kanjiStories: KanjiStory[] }, 1)).toBeNull();
  });

  it('Kanji xuất hiện ở nhiều bài dùng CHUNG một bản chuyện (cùng object)', () => {
    const content = loadSeedContent();
    const id = content.kanji[0].id;
    expect(kanjiStoryOf(content, id)).toBe(kanjiStoryOf(content, id));
  });
});

describe('withKanjiStories / bảng kanji_stories', () => {
  it('kanji bị admin ẩn → chuyện của nó cũng không hiện', () => {
    const content = loadSeedContent();
    const hiddenId = content.kanji[0].id;
    const base: Omit<typeof content, 'kanjiStories'> & { kanjiStories?: unknown } = { ...content };
    delete base.kanjiStories;
    const visible = applyContentOverlays(base, [{ content_type: 'kanji', content_id: hiddenId, status: 'archived' }], [], (path) => path);
    const withStories = withKanjiStories(visible, loadSeedKanjiStories());
    expect(withStories.kanjiStories.some((entry) => entry.kanjiId === hiddenId)).toBe(false);
    expect(withStories.kanjiStories).toHaveLength(102);
  });

  it('ghi rồi đọc lại dòng database không mất trường nào', () => {
    for (const entry of loadSeedKanjiStories()) expect(kanjiStoryFromRow(kanjiStoryToRow(entry))).toEqual(entry);
  });

  it('bản sao ảnh trên Storage (image_hosted_url) đi qua database mà vẫn giữ URL gốc', () => {
    const seed = loadSeedKanjiStories()[0];
    expect(seed.image?.hostedUrl).toBeUndefined();
    const hosted = { ...seed, image: { ...seed.image!, hostedUrl: 'https://x.supabase.co/storage/v1/object/public/content-media/kanji-stories/2-vi-v9.webp' } };
    const parsed = kanjiStoryFromRow(kanjiStoryToRow(hosted));
    expect(parsed.image?.hostedUrl).toBe(hosted.image.hostedUrl);
    expect(parsed.image?.url).toBe(seed.image?.url);
  });

  it('giá trị lạ trong database không bao giờ tự thành "published" / "verified"', () => {
    const row = { ...kanjiStoryToRow(loadSeedKanjiStories()[0]), status: 'weird', image_license_status: 'ok' };
    const parsed = kanjiStoryFromRow(row);
    expect(parsed.status).toBe('draft');
    expect(parsed.image?.licenseStatus).toBe('unverified');
  });
});
