import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ReadingQuiz } from './ReadingQuiz';
import { READING_PASSAGES } from '@/lib/data/reading-passages';

describe('ReadingQuiz', () => {
  it('chưa làm xong thì KHÔNG hiện bản dịch (render ban đầu)', () => {
    const passage = READING_PASSAGES[0];
    const html = renderToStaticMarkup(<ReadingQuiz passageId={passage.id} questions={passage.questions} textVi={passage.textVi} nextHref={null} />);
    expect(html).toContain(passage.questions[0].question);
    expect(html).not.toContain(passage.textVi);
    expect(html).not.toContain('Xem bản dịch');
  });

  it('mọi bài đọc đều có bản dịch cả đoạn', () => {
    for (const passage of READING_PASSAGES) expect(passage.textVi.trim().length).toBeGreaterThan(20);
  });
});
