import { describe, expect, it } from 'vitest';
import { detectVoiceGender, pickJapaneseVoice, type VoiceLike } from './japanese-voices';

const voice = (name: string, lang = 'ja-JP'): VoiceLike => ({ name, lang });

const EDGE = [
  voice('Microsoft Nanami Online (Natural) - Japanese (Japan)'),
  voice('Microsoft Keita Online (Natural) - Japanese (Japan)'),
  voice('Microsoft Haruka - Japanese (Japan)'),
  voice('Microsoft Aria Online (Natural) - English (United States)', 'en-US'),
];
const MAC = [voice('Kyoko'), voice('Otoya (Enhanced)'), voice('Samantha', 'en-US')];
const CHROME = [voice('Google 日本語'), voice('Google US English', 'en-US')];

describe('detectVoiceGender', () => {
  it('nhận đúng giọng nữ/nam phổ biến', () => {
    expect(detectVoiceGender(EDGE[0])).toBe('female');
    expect(detectVoiceGender(EDGE[1])).toBe('male');
    expect(detectVoiceGender(MAC[0])).toBe('female');
    expect(detectVoiceGender(MAC[1])).toBe('male');
    expect(detectVoiceGender(CHROME[0])).toBe('female');
  });

  it('"Female" không bị nhận nhầm thành nam', () => {
    expect(detectVoiceGender(voice('Japanese Female'))).toBe('female');
  });

  it('giọng lạ → không rõ', () => {
    expect(detectVoiceGender(voice('ja-jp-x-htm-local'))).toBe('unknown');
  });
});

describe('pickJapaneseVoice', () => {
  it('chọn giọng tiếng Nhật đúng giới tính, ưu tiên giọng Natural', () => {
    expect(pickJapaneseVoice(EDGE, 'female')?.voice.name).toContain('Nanami');
    expect(pickJapaneseVoice(EDGE, 'male')?.voice.name).toContain('Keita');
  });

  it('không bao giờ chọn giọng tiếng Anh', () => {
    expect(pickJapaneseVoice(CHROME, 'male')?.voice.lang).toBe('ja-JP');
    expect(pickJapaneseVoice([voice('Samantha', 'en-US')], 'female')).toBeNull();
  });

  it('thiếu giọng đúng loại → dùng giọng tiếng Nhật khác và báo không khớp', () => {
    const choice = pickJapaneseVoice(CHROME, 'male');
    expect(choice?.voice.name).toBe('Google 日本語');
    expect(choice?.matchesPreference).toBe(false);
  });

  it('nhận cả mã ngôn ngữ dạng ja_JP (Android)', () => {
    expect(pickJapaneseVoice([voice('ja-jp-x-htm-local', 'ja_JP')], 'female')?.gender).toBe('unknown');
  });
});
