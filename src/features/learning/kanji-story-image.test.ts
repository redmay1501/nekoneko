import { describe, expect, it } from 'vitest';
import { storyImageCandidates } from './kanji-story-image';

describe('storyImageCandidates', () => {
  it('có bản sao trên Storage → thử bản sao trước, lỗi thì về URL gốc', () => {
    expect(storyImageCandidates({ hostedUrl: 'https://x.supabase.co/a.webp', url: 'https://cdn.pixabay.com/a.png' }))
      .toEqual(['https://x.supabase.co/a.webp', 'https://cdn.pixabay.com/a.png']);
  });
  it('chưa có bản sao → chỉ URL gốc; trùng / rỗng thì bỏ', () => {
    expect(storyImageCandidates({ url: 'https://cdn.pixabay.com/a.png' })).toEqual(['https://cdn.pixabay.com/a.png']);
    expect(storyImageCandidates({ hostedUrl: 'u', url: 'u' })).toEqual(['u']);
    expect(storyImageCandidates({ hostedUrl: '', url: '' })).toEqual([]);
  });
});
