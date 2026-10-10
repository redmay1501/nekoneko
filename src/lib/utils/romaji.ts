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
  ぁ: 'a', ぃ: 'i', ぅ: 'u', ぇ: 'e', ぉ: 'o', ゃ: 'ya', ゅ: 'yu', ょ: 'yo', ゎ: 'wa',
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

// ─── Câu và mẫu câu ─────────────────────────────────────────────────────────────────────────────────────────
// Câu đọc bằng kana đã tách theo cụm (わたしは がくせいです。) → "watashi wa gakusei desu." theo cách viết romaji
// của sách học: trợ từ tách riêng và đọc theo âm (は = wa, へ = e, を = o), です tách riêng, か hỏi cuối câu tách riêng.

const PARTICLE_READINGS: Record<string, string> = { は: 'wa', へ: 'e', を: 'o', には: 'ni wa', では: 'de wa', とは: 'to wa', へは: 'e wa' };
/** Trợ từ đứng cuối một cụm — dài trước để "には" không bị đọc thành "に" + "は". ね / よ không tách (ふね, かよう…). */
const TRAILING_PARTICLES = ['から', 'まで', 'より', 'には', 'では', 'とは', 'へは', 'でも', 'しか', 'だけ', 'は', 'へ', 'を', 'が', 'に', 'で', 'と', 'も', 'の', 'や'];
/** Trợ từ tách được cả khi phía trước chỉ có một chữ (きが → "ki ga", 〜は → "〜 wa"). */
const SHORT_PREFIX_PARTICLES = new Set(['は', 'へ', 'を', 'が']);
/**
 * Gốc thể て của động từ む / ぶ / ぬ trong kho từ vựng (よみます → よんで): "よんで" là MỘT từ, không phải
 * "よん" + trợ từ で (khác にほんで = "nihon de").
 */
const TE_FORM_STEMS = new Set('あそん あん しん すん たのん とん ならん のん やすん よん'.split(' '));
/**
 * Từ N5 tự nó kết thúc bằng chữ trông như trợ từ — không tách (こども ≠ "kodo mo", ちょっと ≠ "chot to").
 * Lọc từ kho từ vựng (content/seed/n5-content.json): từ ≥ 3 chữ kết thúc bằng một trong TRAILING_PARTICLES.
 */
const WORDS_ENDING_LIKE_PARTICLES = new Set(`
  あぱーと いかが いつか いつも いなか いもうと いんたーねっと えいが おとうと おなか かいもの きっと くだもの ここのか
  こども こーと しごと しずか すかーと せいと それから たてもの たべもの ちょっと てすと でぱーと とおか とても どうも
  どこか なにか なのか にぎやか のみもの のーと はつか ぱすぽーと ぴあの ふつか ぷれぜんと ぺっと ぽけっと ぽすと みっか
  むいか もっと やおや ようか よっか ろうか ずっと やっと さっき だれか きもの
`.trim().split(/\s+/));
const COPULAS = ['でしょう', 'でした', 'です', 'じゃ'];
const PUNCTUATION: Record<string, string> = { '。': '.', '、': ',', '？': '?', '！': '!', '「': '"', '」': '"' };

function romanizeChunk(chunk: string): string {
  const [, body, tail] = chunk.match(/^(.*?)([。、？！?!.,「」]*)$/) ?? ['', chunk, ''];
  const punctuation = [...tail].map((mark) => PUNCTUATION[mark] ?? mark).join('');
  const phrase = SET_PHRASES[toHiragana(body)];
  if (phrase) return phrase + punctuation;
  let rest = body;
  const words: string[] = [];
  // か / ね / よ cuối câu sau です / ます / ません / ましょう / た: "なんですか" → "nan desu ka", "きれいですね" → "kirei desu ne".
  if (/[すたんう]か$|す[ねよ]$/.test(rest) && !WORDS_ENDING_LIKE_PARTICLES.has(toHiragana(rest))) {
    words.unshift(kanaToRomaji(rest.slice(-1)));
    rest = rest.slice(0, -1);
  }
  // Một trợ từ cuối cụm (cụm còn ≥ 2 chữ và không phải từ tự kết thúc như vậy): "わたしも" → "watashi mo".
  // は / へ / を gần như luôn là trợ từ (kể cả sau "〜", "N"); trợ từ khác cần cụm ≥ 2 chữ phía trước (なに, この không tách).
  if (PARTICLE_READINGS[rest]) return PARTICLE_READINGS[rest] + punctuation;
  // Tối đa hai trợ từ nối nhau: "ごじまでに" → "goji made ni".
  for (let round = 0; round < 2; round++) {
    const particle = trailingParticle(rest);
    // Trợ từ thứ hai chỉ khi là trợ từ dài (まで|に, から|は) — "きょうと|へ" không tách tiếp thành "kyō to".
    if (!particle || (round === 1 && particle.length < 2)) break;
    words.unshift(PARTICLE_READINGS[particle] ?? kanaToRomaji(particle));
    rest = rest.slice(0, -particle.length);
  }
  const copula = COPULAS.find((candidate) => rest.endsWith(candidate));
  if (copula) {
    words.unshift(kanaToRomaji(copula));
    rest = rest.slice(0, -copula.length);
    // Trợ từ ngay trước です: "わたしのです" → "watashi no desu", "にちようびだけです" → "nichiyōbi dake desu".
    const particle = trailingParticle(rest);
    if (particle) { words.unshift(PARTICLE_READINGS[particle] ?? kanaToRomaji(particle)); rest = rest.slice(0, -particle.length); }
  }
  if (rest) words.unshift(kanaToRomaji(rest));
  return words.join(' ') + punctuation;
}

function trailingParticle(chunk: string): string | undefined {
  const word = toHiragana(chunk);
  if (WORDS_ENDING_LIKE_PARTICLES.has(word)) return undefined;
  // Bỏ chữ cuối mà thành một từ tự kết thúc như trợ từ (いもうと|は) → chỉ tách một chữ, không tách "とは".
  const singleOnly = WORDS_ENDING_LIKE_PARTICLES.has(word.slice(0, -1));
  return TRAILING_PARTICLES.find((candidate) => {
    if (!word.endsWith(candidate) || (singleOnly && candidate.length > 1)) return false;
    // よんで / とめないで là một từ (thể て, "đừng…"), không phải "… + で".
    if (candidate === 'で' && (TE_FORM_STEMS.has(word.slice(0, -1)) || word.endsWith('ないで'))) return false;
    return word.length - candidate.length >= (SHORT_PREFIX_PARTICLES.has(candidate) ? 1 : 2);
  });
}

/** Romaji cho câu / mẫu câu viết bằng kana (chữ Hán, ký hiệu như N1, 〜 giữ nguyên). */
export function sentenceRomaji(text: string): string {
  // Dấu câu cũng là ranh giới cụm: "とき、よく" → "とき、" + "よく".
  return text.replace(/([。、？！])(?=\S)/g, '$1 ').trim().split(/\s+/).filter(Boolean).map(romanizeChunk).join(' ').replace(/\s+([.,?!])/g, '$1');
}

/** Có chữ kana để phiên không (câu chỉ toàn chữ Hán / ký hiệu thì không hiện dòng romaji). */
export function hasKana(text: string): boolean {
  return /[぀-ヿ]/.test(text);
}

/** Âm On ・ Kun của Kanji → romaji: "ニチ・ジツ", "ひ・か" → "nichi, jitsu ・ hi, ka". */
export function kanjiReadingRomaji(onReading: string, kunReading: string): string {
  const part = (reading: string) => reading.split(/[・、,]/).map((value) => kanaToRomaji(value.trim())).filter(Boolean).join(', ');
  return [part(onReading), part(kunReading)].filter(Boolean).join(' ・ ');
}

/** Romaji cho mẫu ngữ pháp — chỉ khi mẫu không có chữ Hán (行きます sẽ thành "行kimasu", nửa nọ nửa kia). */
export function patternRomaji(pattern: string): string | undefined {
  return canRomanize(pattern) ? sentenceRomaji(pattern) : undefined;
}

/** Phiên được trọn vẹn: có kana và KHÔNG có chữ Hán (chữ Hán cần cách đọc riêng). */
export function canRomanize(text: string): boolean {
  return hasKana(text) && !/[\u4e00-\u9fff]/.test(text);
}
