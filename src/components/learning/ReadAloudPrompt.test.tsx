import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ReadAloudPrompt } from './ReadAloudPrompt';

describe('ReadAloudPrompt (render ở server)', () => {
  const html = renderToStaticMarkup(
    <ReadAloudPrompt lessonLabel="BÀI 1" sentenceJp="わたしは 学生じゃ ありません。" reading="わたしは がくせいじゃ ありません。"
      meaningVi="Tôi không phải là học sinh." chipClass="pink" />,
  );

  it('hiện câu mẫu, cách đọc, nghĩa và nút nghe mẫu', () => {
    expect(html).toContain('わたしは 学生じゃ ありません。');
    expect(html).toContain('わたしは がくせいじゃ ありません。');
    expect(html).toContain('Tôi không phải là học sinh.');
    expect(html).toContain('Nghe mẫu');
  });

  it('chưa biết trình duyệt có hỗ trợ không → nút micro bị khoá, không có kết quả / điểm nào', () => {
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>🎙️ Bắt đầu nói/);
    expect(html).not.toMatch(/điểm|%|chuẩn/i);
  });
});
