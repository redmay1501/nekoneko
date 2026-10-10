import { describe, expect, it } from 'vitest';
import { hasKana, kanaToRomaji, patternRomaji, sentenceRomaji, vocabularyRomaji } from './romaji';

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

describe('sentenceRomaji — câu và mẫu câu', () => {
  it.each([
    ['わたしは グエンです。', 'watashi wa guen desu.'],
    ['わたしは がくせいじゃ ありません。', 'watashi wa gakusei ja arimasen.'],
    ['これは なんですか。', 'kore wa nan desu ka.'],
    ['がっこうへ いきます。', 'gakkō e ikimasu.'],
    ['パンを たべます。', 'pan o tabemasu.'],
    ['あした きょうとへ いきますか。', 'ashita kyōto e ikimasu ka.'],
    ['N1 は N2 です', 'N1 wa N2 desu'],
    ['N を V ます', 'N o V masu'],
    ['こんにちは。', 'konnichiwa.'],
    ['きのうは あめでした。', 'kinō wa ame deshita.'],
    ['わたしも ベトナムじんです。', 'watashi mo betonamujin desu.'],
    ['つくえの うえに ほんが あります。', 'tsukue no ue ni hon ga arimasu.'],
    ['こどもの とき、よく かわで およぎました。', 'kodomo no toki, yoku kawa de oyogimashita.'],
    ['ちょっと まって ください。', 'chotto matte kudasai.'],
    ['この へやは せまいですが、きれいです。', 'kono heya wa semai desu ga, kirei desu.'],
    ['いっしょに ひるごはんを たべませんか。', 'issho ni hirugohan o tabemasen ka.'],
    ['くじから ごじまで はたらきます。', 'kuji kara goji made hatarakimasu.'],
    ['〜は 〜ですか', '〜 wa 〜 desu ka'],
    ['いま ほんを よんで います。', 'ima hon o yonde imasu.'],
    ['にほんで はたらきます。', 'nihon de hatarakimasu.'],
    ['いもうとは りょうりが できます。', 'imōto wa ryōri ga dekimasu.'],
    ['ごじまでに かえります。', 'goji made ni kaerimasu.'],
    ['こうえんに きが あります。', 'kōen ni ki ga arimasu.'],
    ['せんえんしか ありません。', "sen'en shika arimasen."],
    ['きれいな はなですね。', 'kireina hana desu ne.'],
    ['この ほんは わたしのです。', 'kono hon wa watashi no desu.'],
    ['ここに くるまを とめないで ください。', 'koko ni kuruma o tomenaide kudasai.'],
  ])('%s → %s', (kana, romaji) => {
    expect(sentenceRomaji(kana)).toBe(romaji);
  });

  it('nhận biết có kana để phiên', () => {
    expect(hasKana('日本')).toBe(false);
    expect(hasKana('日本へ')).toBe(true);
  });
});

describe('chữ nhỏ đứng riêng', () => {
  it('ゃ ゅ ょ ャ → ya yu yo ya; âm ghép vẫn đọc liền', () => {
    expect(['ゃ', 'ゅ', 'ょ', 'ャ'].map(kanaToRomaji)).toEqual(['ya', 'yu', 'yo', 'ya']);
    expect(kanaToRomaji('きゃ')).toBe('kya');
  });
});

describe('patternRomaji — mẫu ngữ pháp, kể cả có chữ Hán', () => {
  it.each([
    ['場所 へ 行きます / 来ます / 帰ります', 'basho e ikimasu / kimasu / kaerimasu'],
    ['乗り物 で 行きます', 'norimono de ikimasu'],
    ['今 〜時 〜分です', 'ima 〜ji 〜fun desu'],
    ['〜人 / 〜台 / 〜枚 / 〜冊', '〜nin / 〜dai / 〜mai / 〜satsu'],
    ['人 と V', 'hito to V'],
    ['N が 好き / 嫌い / 上手 / 下手 です', 'N ga suki / kirai / jōzu / heta desu'],
    ['N1 [の中] で 何/どこ/だれ が いちばん Adj ですか', 'N1 [no naka] de nani/doko/dare ga ichiban Adj desu ka'],
    ['どこ[へ]も 行きません', 'doko[e] mo ikimasen'],
    ['普通形 と 思います', 'futsūkei to omoimasu'],
    ['N1 の N2 (chất liệu, chủ đề)', 'N1 no N2 (chất liệu, chủ đề)'],
  ])('%s → %s', (pattern, romaji) => {
    expect(patternRomaji(pattern)).toBe(romaji);
  });

  it('mẫu là câu tiếng Việt → không có dòng romaji', () => {
    expect(patternRomaji('Cách chia thể て')).toBeUndefined();
    expect(patternRomaji('Thể từ điển (辞書形)')).toBeUndefined();
  });

  it('mọi chữ Hán trong 112 mẫu N5 đều có cách đọc', async () => {
    const { default: content } = await import('@content/seed/n5-content.json');
    const { patternKana } = await import('./romaji');
    expect(content.grammar.filter((item) => patternKana(item.pattern) === null).map((item) => item.pattern)).toEqual([]);
  });
});
