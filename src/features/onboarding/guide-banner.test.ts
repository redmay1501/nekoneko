import { describe, expect, it } from 'vitest';
import { GUIDE_BANNER_COLLAPSED_KEY, readGuideBannerCollapsed, shouldShowGuideBanner, writeGuideBannerCollapsed } from './guide-banner';

const base = { pathname: '/', isWelcomed: true, isGuideOpen: false };

describe('shouldShowGuideBanner', () => {
  it('hiện ở các trang thường sau khi đã xem hướng dẫn', () => {
    for (const pathname of ['/', '/lo-trinh', '/lo-trinh/ngay/18', '/vuon', '/hoc-tap/tu-vung', '/cai-dat', '/tri-nho']) {
      expect(shouldShowGuideBanner({ ...base, pathname })).toBe(true);
    }
  });

  it('ẩn khi chưa xem hướng dẫn lần đầu (welcomed_at trống)', () => {
    expect(shouldShowGuideBanner({ ...base, isWelcomed: false })).toBe(false);
    expect(shouldShowGuideBanner({ ...base, pathname: '/lo-trinh', isWelcomed: false })).toBe(false);
  });

  it('ẩn khi hướng dẫn đang mở (lần đầu hoặc xem lại)', () => {
    expect(shouldShowGuideBanner({ ...base, isGuideOpen: true })).toBe(false);
  });

  it('ẩn trong phiên học /hoc/* nhưng không nhầm với /hoc-tap', () => {
    expect(shouldShowGuideBanner({ ...base, pathname: '/hoc/daily' })).toBe(false);
    expect(shouldShowGuideBanner({ ...base, pathname: '/hoc/focus' })).toBe(false);
    expect(shouldShowGuideBanner({ ...base, pathname: '/hoc' })).toBe(false);
    expect(shouldShowGuideBanner({ ...base, pathname: '/hoc-tap' })).toBe(true);
  });

  it('ẩn khi đang làm bài (ván trò chơi, bài luyện tập, học theo ngày) — trang mục chính vẫn hiện', () => {
    for (const pathname of ['/tro-choi/ghep-the', '/luyen-tap/viet', '/lo-trinh/ngay/14/hoc']) expect(shouldShowGuideBanner({ ...base, pathname })).toBe(false);
    for (const pathname of ['/tro-choi', '/luyen-tap', '/lo-trinh/ngay/14']) expect(shouldShowGuideBanner({ ...base, pathname })).toBe(true);
  });
});

describe('tuỳ chọn thu gọn (localStorage)', () => {
  function memoryStorage() {
    const data = new Map<string, string>();
    return {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => { data.set(key, value); },
      removeItem: (key: string) => { data.delete(key); },
      data,
    };
  }

  it('ghi rồi đọc lại đúng', () => {
    const storage = memoryStorage();
    expect(readGuideBannerCollapsed(storage)).toBe(false);
    writeGuideBannerCollapsed(storage, true);
    expect(storage.data.get(GUIDE_BANNER_COLLAPSED_KEY)).toBe('1');
    expect(readGuideBannerCollapsed(storage)).toBe(true);
    writeGuideBannerCollapsed(storage, false);
    expect(readGuideBannerCollapsed(storage)).toBe(false);
  });

  it('bộ nhớ bị chặn / không có: không ném lỗi, mặc định mở rộng', () => {
    const blocked = {
      getItem: () => { throw new Error('blocked'); },
      setItem: () => { throw new Error('blocked'); },
      removeItem: () => { throw new Error('blocked'); },
    };
    expect(readGuideBannerCollapsed(blocked)).toBe(false);
    expect(() => writeGuideBannerCollapsed(blocked, true)).not.toThrow();
    expect(readGuideBannerCollapsed(null)).toBe(false);
  });
});
