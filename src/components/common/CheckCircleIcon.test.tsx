import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { CheckCircleIcon } from './CheckCircleIcon';

describe('CheckCircleIcon', () => {
  it('chưa xong = vòng rỗng; đã xong = nền đặc, tích trắng (phân biệt bằng hình, không chỉ màu); ẩn với trình đọc màn hình', () => {
    const empty = renderToStaticMarkup(<CheckCircleIcon />);
    const filled = renderToStaticMarkup(<CheckCircleIcon filled />);
    expect(empty).toContain('fill="none"');
    expect(filled).toContain('fill="currentColor"');
    expect(filled).toContain('stroke="#fff"');
    expect(empty).toContain('aria-hidden="true"');
  });
});
