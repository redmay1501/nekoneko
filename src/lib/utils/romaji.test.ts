import { describe, expect, it } from 'vitest';
import { kanaToRomaji, vocabularyRomaji } from './romaji';

describe('kanaToRomaji (Hepburn)', () => {
  it.each([
    ['あちら', 'achira'], ['じむしょ', 'jimusho'], ['がくせい', 'gakusei'], ['しゃしん', 'shashin'],
    ['きって', 'kitte'], ['まっちゃ', 'matcha'], ['ちょっと', 'chotto'], ['ふつか', 'futsuka'],
    ['きんえん', "kin'en"], ['せんせい', 'sensei'], ['いい', 'ii'], ['おにいさん', 'oniisan'],
  ])('âm thường: %s → %s', (kana, romaji) => {
    expect(kanaToRomaji(kana)).toBe(romaji);
  });

  it.each([
    ['じょうず', 'jōzu'], ['きょうしつ', 'kyōshitsu'], ['おおきい', 'ōkii'], ['ゆうめい', 'yūmei'],
    ['おねえさん', 'onēsan'], ['おかあさん', 'okāsan'], ['とおか', 'tōka'], ['ちょうど', 'chōdo'],
    ['コーヒー', 'kōhī'], ['パーティー', 'pātī'], ['ノート', 'nōto'], ['さようなら', 'sayōnara'],
  ])('trường âm có gạch: %s → %s', (kana, romaji) => {
    expect(kanaToRomaji(kana)).toBe(romaji);
  });

  it.each([
    ['こんにちは', 'konnichiwa'], ['こんばんは', 'konbanwa'], ['では', 'dewa'], ['それでは', 'soredewa'],
    ['おはようございます', 'ohayō gozaimasu'], ['ありがとうございます', 'arigatō gozaimasu'],
    ['おねがいします', 'onegai shimasu'], ['おせわに なりました', 'osewa ni narimashita'],
  ])('câu cố định (は đọc wa, tách chữ): %s → %s', (kana, romaji) => {
    expect(kanaToRomaji(kana)).toBe(romaji);
  });

  it('は, へ, を trong từ thường vẫn đọc ha, he, o', () => {
    expect(kanaToRomaji('はな')).toBe('hana');
    expect(kanaToRomaji('へや')).toBe('heya');
    expect(kanaToRomaji('ごはん')).toBe('gohan');
  });

  it('giữ nguyên ký hiệu chú thích của dữ liệu', () => {
    expect(kanaToRomaji('きれい[な]')).toBe('kirei[na]');
    expect(kanaToRomaji('〜さん')).toBe('〜san');
    expect(kanaToRomaji('だれ / どなた')).toBe('dare / donata');
    expect(kanaToRomaji('トイレ / おてあらい')).toBe('toire / otearai');
  });

  it('tách danh từ + します, giữ nguyên động từ thường', () => {
    expect(vocabularyRomaji({ kanji: '勉強します', kana: 'べんきょうします' })).toBe('benkyō shimasu');
    expect(vocabularyRomaji({ kanji: '引っ越しします', kana: 'ひっこしします' })).toBe('hikkoshi shimasu');
    expect(vocabularyRomaji({ kana: 'コピーします' })).toBe('kopī shimasu');
    expect(vocabularyRomaji({ kanji: '話します', kana: 'はなします' })).toBe('hanashimasu');
    expect(vocabularyRomaji({ kanji: '無くします', kana: 'なくします' })).toBe('nakushimasu');
    expect(vocabularyRomaji({ kana: 'します' })).toBe('shimasu');
    expect(vocabularyRomaji({ kanji: 'お願いします', kana: 'おねがいします' })).toBe('onegai shimasu');
  });
});
