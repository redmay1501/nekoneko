import type { CSSProperties } from 'react';

const FULL_WIDTH = /[　-ヿ㐀-鿿豈-﫿！-｠々〆ヶ]/u;

/** Bề rộng ước lượng theo em: chữ Nhật / Hán toàn khổ = 1, khoảng trắng = .3, chữ Latin / số / dấu = .58. */
export function textEmWidth(text: string): number {
  let width = 0;
  for (const character of text) width += FULL_WIDTH.test(character) ? 1 : /\s/.test(character) ? 0.3 : 0.58;
  return Math.max(width, 1);
}

/**
 * Mặt chữ lớn tự vừa một dòng: cỡ chữ = bề rộng khung (container query, lớp `.fit-box` ở phần tử cha) ÷ độ rộng của chữ,
 * kẹp trong [minPx, maxPx]. Chữ ngắn giữ cỡ to nhất; chữ dài nhỏ dần thay vì rớt dòng. Dài tới mức chạm cỡ tối thiểu mới
 * xuống dòng — và chỉ ngắt ở khoảng trắng ("おじいさん / おばあさん"), không ngắt giữa một từ (`.fit-text`).
 */
export function fitTextStyle(text: string, maxPx: number, minPx: number): CSSProperties {
  return { '--fit-em': textEmWidth(text).toFixed(2), '--fit-max': `${maxPx}px`, '--fit-min': `${minPx}px` } as CSSProperties;
}
