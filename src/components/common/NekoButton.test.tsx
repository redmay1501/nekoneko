import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { existsSync } from 'node:fs';

vi.mock('next/image', () => ({ default: (props: { src: string; alt: string; className?: string }) => <img src={props.src} alt={props.alt} className={props.className} /> }));
vi.mock('next/link', () => ({ default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => <a href={href} {...rest}>{children}</a> }));

const { NEKO_BUTTON_POSES, NekoButton } = await import('./NekoButton');

describe('NekoButton', () => {
  it('ảnh mèo của mọi tư thế có thật trong public/', () => {
    for (const pose of Object.values(NEKO_BUTTON_POSES)) expect(existsSync(`public${pose.src}`)).toBe(true);
  });

  it('liên kết: giữ đường dẫn, có mèo, chữ và icon là code (không phải ảnh)', () => {
    const html = renderToStaticMarkup(<NekoButton href="/hoc/daily" leftIcon={<svg />}>Bắt đầu học</NekoButton>);
    expect(html).toContain('href="/hoc/daily"');
    expect(html).toContain('neko-btn-cat');
    expect(html).toContain('neko-btn-primary');
    expect(html).toMatch(/<span class="neko-btn-label">Bắt đầu học<\/span>/);
  });

  it('loading: spinner thay icon, khoá bấm', () => {
    const html = renderToStaticMarkup(<NekoButton loading leftIcon={<svg data-icon />}>Đang lưu</NekoButton>);
    expect(html).toContain('neko-btn-spinner');
    expect(html).not.toContain('data-icon');
    expect(html).toContain('disabled=""');
    expect(html).toContain('aria-busy="true"');
  });

  it('liên kết bị khoá: aria-disabled, không vào được bằng Tab', () => {
    const html = renderToStaticMarkup(<NekoButton href="/x" disabled>Khoá</NekoButton>);
    expect(html).toContain('aria-disabled="true"');
    expect(html).toContain('tabindex="-1"');
  });

  it('biến thể, cỡ, rộng hết, không mèo', () => {
    const html = renderToStaticMarkup(<NekoButton variant="quiz" size="lg" fullWidth catPose="none" type="submit">Kiểm tra</NekoButton>);
    expect(html).toContain('neko-btn-quiz');
    expect(html).toContain('neko-btn-lg');
    expect(html).toContain('is-full');
    expect(html).not.toContain('neko-btn-cat');
    expect(html).toContain('type="submit"');
  });
});
