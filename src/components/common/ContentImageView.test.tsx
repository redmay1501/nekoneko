import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { learnerImageOf } from '@/features/learning/vocabulary-images';
import { ContentImageView } from './ContentImageView';

describe('ContentImageView', () => {
  it('có ảnh → img có alt và kích thước cố định', () => {
    const html = renderToStaticMarkup(<ContentImageView image={{ url: 'https://cdn/a.webp', alt: 'Con mèo' }} size={72} />);
    expect(html).toContain('src="https://cdn/a.webp"');
    expect(html).toContain('alt="Con mèo"');
    expect(html).toContain('width="72"');
  });
  it('không có ảnh → không vẽ gì', () => {
    expect(renderToStaticMarkup(<ContentImageView image={null} />)).toBe('');
  });
});

describe('learnerImageOf', () => {
  it('ảnh admin được ưu tiên; alt trống → dùng nghĩa', () => {
    expect(learnerImageOf('vocabulary', { id: 3, meaning: 'Giáo viên', image: { url: 'https://cdn/t.png', alt: '' } }))
      .toEqual({ url: 'https://cdn/t.png', alt: 'Giáo viên' });
  });
  it('từ vựng không có ảnh admin → icon có sẵn (nếu có); kanji không có → null', () => {
    expect(learnerImageOf('vocabulary', { id: 3, meaning: 'Giáo viên' })?.url).toBe('/icons/vocab/teacher.png');
    expect(learnerImageOf('kanji', { id: 1, meaning: 'một' })).toBeNull();
  });
});
