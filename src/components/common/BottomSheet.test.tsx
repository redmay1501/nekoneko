import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { BottomSheet } from './BottomSheet';

describe('BottomSheet (popup từ vựng / Kanji)', () => {
  it('placement=center → lớp sheet-center, là dialog modal có nút đóng và lớp phủ', () => {
    const html = renderToStaticMarkup(<BottomSheet isOpen placement="center" label="Chi tiết kiến thức" onClose={() => undefined}><p>水</p></BottomSheet>);
    expect(html).toContain('class="sheet sheet-center on"');
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain('aria-label="Đóng"');
    expect(html).toContain('class="scrim on"');
  });

  it('mặc định giữ thẻ nổi ở góc; đóng thì không render nội dung', () => {
    const html = renderToStaticMarkup(<BottomSheet isOpen={false} label="x" onClose={() => undefined}><p>NỘI DUNG</p></BottomSheet>);
    expect(html).not.toContain('sheet-center');
    expect(html).not.toContain('NỘI DUNG');
  });
});
