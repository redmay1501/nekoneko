import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { KanaReading } from './KanaReading';

const html = (text: string, reading?: string, isParticle = false) => renderToStaticMarkup(<KanaReading text={text} reading={reading} isParticle={isParticle} />);

describe('KanaReading — phiên âm đáp án sau khi trả lời', () => {
  it('chữ có Kanji: kana + romaji', () => {
    expect(html('学校', 'がっこう')).toContain('がっこう');
    expect(html('学校', 'がっこう')).toContain('gakkō');
  });
  it('chữ chỉ có katakana / hiragana: romaji', () => {
    expect(html('エンジニア')).toContain('enjinia');
    expect(html('がっこう')).toContain('gakkō');
  });
  it('trợ từ (bài trợ từ) đọc theo trợ từ; chữ cái は vẫn là ha', () => {
    expect(html('は', undefined, true)).toContain('wa');
    expect(html('を', undefined, true)).toContain('>o<');
    expect(html('に', undefined, true)).toContain('ni');
    expect(html('は')).toContain('ha');
  });
  it('nghĩa tiếng Việt, romaji, Kanji không có cách đọc: không hiện gì', () => {
    expect(html('Kỹ sư')).toBe('');
    expect(html('gakkō')).toBe('');
    expect(html('学校')).toBe('');
  });
});
