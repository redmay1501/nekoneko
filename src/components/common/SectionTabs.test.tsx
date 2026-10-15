import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { SectionTabs } from './SectionTabs';

const tabs = [
  { id: 'nghe-go', label: 'Nghe và gõ', content: <p>NỘI DUNG NGHE</p> },
  { id: 'kanji', label: 'Viết tay Kanji', content: <p>NỘI DUNG KANJI</p> },
];

describe('SectionTabs (luyện viết tách hai tab)', () => {
  it('mặc định tab đầu: tab kia vẫn render nhưng bị ẩn (đổi tab không mất dữ liệu đang nhập)', () => {
    const html = renderToStaticMarkup(<SectionTabs tabs={tabs} param="muc" label="Cách luyện viết" />);
    const panelTag = (id: string) => html.match(new RegExp(`<div[^>]*id="panel-${id}"[^>]*>`))?.[0] ?? '';
    expect(html).toMatch(/aria-selected="true"[^>]*>Nghe và gõ/);
    expect(panelTag('nghe-go')).not.toContain('hidden');
    expect(panelTag('kanji')).toContain('hidden');
    expect(html).toContain('NỘI DUNG KANJI');
  });

  it('mở thẳng tab Kanji theo URL; tab lạ → tab đầu', () => {
    expect(renderToStaticMarkup(<SectionTabs tabs={tabs} param="muc" label="x" initialTab="kanji" />)).toMatch(/aria-selected="true"[^>]*>Viết tay Kanji/);
    expect(renderToStaticMarkup(<SectionTabs tabs={tabs} param="muc" label="x" initialTab="zzz" />)).toMatch(/aria-selected="true"[^>]*>Nghe và gõ/);
  });
});
