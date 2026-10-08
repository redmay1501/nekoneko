/**
 * Kana → romaji theo Hepburn (cách phiên chuẩn trong sách học và từ điển):
 *  - し = shi, ち = chi, つ = tsu, ふ = fu, じ/ぢ = ji, づ = zu, を = o, しゃ = sha;
 *  - っ gấp đôi phụ âm sau (きって = kitte), trước ch thì thành t (まっちゃ = matcha);
 *  - trường âm có dấu gạch: おう / おお = ō, うう = ū, ええ = ē, ああ = ā (じょうず = jōzu, おおきい = ōkii,
 *    ゆうめい = yūmei, おねえさん = onēsan); ー kéo dài nguyên âm trước (コーヒー = kōhī). いい và えい giữ nguyên
 *    (いい = ii, せんせい = sensei) — đúng quy ước Hepburn;
 *  - ん trước nguyên âm / や行 thêm dấu ' (きんえん = kin'en);
 *  - câu cố định có trợ từ は (đọc wa) hoặc gồm nhiều chữ: bảng SET_PHRASES (こんにちは = konnichiwa,
 *    おはようございます = ohayō gozaimasu).
 * Ký tự khác (〜, /, [ ], khoảng trắng, chữ Hán…) giữ nguyên.
 */
const BASE: Record<string, string> = {
  あ: 'a', い: 'i', う: 'u', え: 'e', お: 'o',
  か: 'ka', き: 'ki', く: 'ku', け: 'ke', こ: 'ko', が: 'ga', ぎ: 'gi', ぐ: 'gu', げ: 'ge', ご: 'go',
  さ: 'sa', し: 'shi', す: 'su', せ: 'se', そ: 'so', ざ: 'za', じ: 'ji', ず: 'zu', ぜ: 'ze', ぞ: 'zo',
  た: 'ta', ち: 'chi', つ: 'tsu', て: 'te', と: 'to', だ: 'da', ぢ: 'ji', づ: 'zu', で: 'de', ど: 'do',
  な: 'na', に: 'ni', ぬ: 'nu', ね: 'ne', の: 'no',
  は: 'ha', ひ: 'hi', ふ: 'fu', へ: 'he', ほ: 'ho', ば: 'ba', び: 'bi', ぶ: 'bu', べ: 'be', ぼ: 'bo',
  ぱ: 'pa', ぴ: 'pi', ぷ: 'pu', ぺ: 'pe', ぽ: 'po',
  ま: 'ma', み: 'mi', む: 'mu', め: 'me', も: 'mo', や: 'ya', ゆ: 'yu', よ: 'yo',
  ら: 'ra', り: 'ri', る: 'ru', れ: 're', ろ: 'ro', わ: 'wa', を: 'o', ん: 'n', ゔ: 'vu',
  ぁ: 'a', ぃ: 'i', ぅ: 'u', ぇ: 'e', ぉ: 'o',
};
/** Âm ghép: chữ cột い + ゃゅょ nhỏ (và vài tổ hợp Katakana thường gặp: ティ, ファ, ジェ…). */
const DIGRAPH: Record<string, string> = {
  きゃ: 'kya', きゅ: 'kyu', きょ: 'kyo', ぎゃ: 'gya', ぎゅ: 'gyu', ぎょ: 'gyo',
  しゃ: 'sha', しゅ: 'shu', しょ: 'sho', じゃ: 'ja', じゅ: 'ju', じょ: 'jo', しぇ: 'she', じぇ: 'je',
  ちゃ: 'cha', ちゅ: 'chu', ちょ: 'cho', ぢゃ: 'ja', ぢゅ: 'ju', ぢょ: 'jo', ちぇ: 'che',
  にゃ: 'nya', にゅ: 'nyu', にょ: 'nyo', ひゃ: 'hya', ひゅ: 'hyu', ひょ: 'hyo',
  びゃ: 'bya', びゅ: 'byu', びょ: 'byo', ぴゃ: 'pya', ぴゅ: 'pyu', ぴょ: 'pyo',
  みゃ: 'mya', みゅ: 'myu', みょ: 'myo', りゃ: 'rya', りゅ: 'ryu', りょ: 'ryo',
  てぃ: 'ti', でぃ: 'di', とぅ: 'tu', どぅ: 'du', ふぁ: 'fa', ふぃ: 'fi', ふぇ: 'fe', ふぉ: 'fo',
  うぃ: 'wi', うぇ: 'we', うぉ: 'wo', ゔぁ: 'va', ゔぃ: 'vi', ゔぇ: 've', ゔぉ: 'vo',
};
/**
 * Câu cố định — đọc theo cách người Nhật nói, không theo từng chữ: は làm trợ từ đọc "wa", tách chữ trong câu chào.
 * Khoá = cụm kana (đã tách theo khoảng trắng và "/").
 */
const SET_PHRASES: Record<string, string> = {
  こんにちは: 'konnichiwa',
  こんばんは: 'konbanwa',
  では: 'dewa',
  それでは: 'soredewa',
  じゃあ: 'jā',
  おはようございます: 'ohayō gozaimasu',
  ありがとうございます: 'arigatō gozaimasu',
  おめでとうございます: 'omedetō gozaimasu',
  おねがいします: 'onegai shimasu',
  しつれいします: 'shitsurei shimasu',
  おせわに: 'osewa ni',
  どうぞよろしく: 'dōzo yoroshiku',
  どういたしまして: 'dō itashimashite',
  もういちど: 'mō ichido',
  ううん: 'uun',
};
const MACRON: Record<string, string> = { a: 'ā', i: 'ī', u: 'ū', e: 'ē', o: 'ō' };
/** Nguyên âm trước + chữ kéo dài → trường âm (おう, おお, うう, ええ, ああ). いい, えい không gộp. */
const LENGTHENS: Record<string, string> = { a: 'あ', u: 'う', e: 'え', o: 'うお' };
const KATAKANA = /[ァ-ヶ]/g;
const toHiragana = (text: string) => text.replace(KATAKANA, (character) => String.fromCodePoint(character.codePointAt(0)! - 0x60));

export function kanaToRomaji(text: string): string {
  // Tách theo khoảng trắng / dấu "/" để tra câu cố định từng cụm, giữ nguyên dấu phân cách.
  return text.split(/(\s+|\/)/).map((part) => SET_PHRASES[toHiragana(part)] ?? romanizeWord(part)).join('');
}

function romanizeWord(text: string): string {
  const kana = toHiragana(text);
  let out = '';
  let geminate = false;
  for (let index = 0; index < kana.length; index++) {
    const pair = kana.slice(index, index + 2);
    const character = kana[index];
    if (character === 'っ') { geminate = true; continue; }
    if (character === 'ー') {
      const vowel = out.match(/[aeiou]$/)?.[0];
      out = vowel ? out.slice(0, -1) + MACRON[vowel] : `${out}-`;
      continue;
    }
    // Trường âm: nguyên âm vừa viết + あ/う/え/お kéo dài → một nguyên âm có gạch (じょうず = jōzu).
    const previous = out.match(/[aeiou]$/)?.[0];
    if (previous && !geminate && LENGTHENS[previous]?.includes(character) && !DIGRAPH[pair]) {
      out = out.slice(0, -1) + MACRON[previous];
      continue;
    }
    let syllable = DIGRAPH[pair];
    if (syllable) index++;
    else syllable = BASE[character];
    if (!syllable) { if (geminate) { out += 'っ'; geminate = false; } out += character; continue; }
    if (geminate) { out += syllable.startsWith('ch') ? 't' : syllable[0]; geminate = false; }
    // ん trước nguyên âm hoặc や/ゆ/よ: thêm ' để đọc đúng (kin'en, không phải ki-nen).
    if (character === 'ん' && /^[aeiouy]/.test(BASE[kana[index + 1]] ?? DIGRAPH[kana.slice(index + 1, index + 3)] ?? '')) syllable = "n'";
    out += syllable;
  }
  return out;
}

/**
 * Phiên âm một từ vựng: như kanaToRomaji, thêm tách động từ danh từ + します (勉強します = benkyō shimasu,
 * コピーします = kopī shimasu). Chỉ dựa vào kana thì không phân biệt được 話します (hanashimasu, một động từ),
 * nên dựa vào chữ Hán: phần trước します là ≥ 2 chữ Hán / katakana, hoặc danh từ kết thúc bằng し (引っ越しします).
 */
export function vocabularyRomaji(word: { kana: string; kanji?: string | null }): string {
  const { kana, kanji } = word;
  if (kana.endsWith('します') && kana !== 'します') {
    const stemKana = kana.slice(0, -3);
    const stemKanji = kanji?.endsWith('します') ? kanji.slice(0, -3) : '';
    const isNounVerb =
      /[ァ-ヶー]$/.test(stemKana) ||
      kana.endsWith('しします') ||
      (stemKanji.length >= 2 && /[\u4e00-\u9fff々]$/.test(stemKanji));
    if (isNounVerb) return `${kanaToRomaji(stemKana)} shimasu`;
  }
  return kanaToRomaji(kana);
}
