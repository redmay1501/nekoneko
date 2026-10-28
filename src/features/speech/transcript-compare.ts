import { normalizeJapanese } from '@/lib/utils/japanese-text';

/**
 * So văn bản TRÌNH DUYỆT NHẬN DIỆN được với câu mẫu — đây là so khớp chữ, KHÔNG phải chấm phát âm:
 * trình duyệt có thể "đoán" đúng câu dù phát âm chưa chuẩn, hoặc viết khác (私 / わたし) dù đọc đúng.
 *
 * Chuẩn hoá (dùng chung normalizeJapanese): NFKC, bỏ khoảng trắng và dấu câu, Katakana → Hiragana; giữ "ー".
 * Câu mẫu có thể có nhiều dạng chấp nhận được (câu có Kanji và cách đọc bằng kana) — khớp một dạng là khớp.
 */

export interface DiffSegment {
  kind: 'same' | 'missing' | 'extra';
  /** Đoạn chữ (đã chuẩn hoá): same = có ở cả hai; missing = có trong câu mẫu, không có trong bản nhận diện; extra = ngược lại. */
  text: string;
}

export interface TranscriptComparison {
  isMatch: boolean;
  /** Dạng câu mẫu gần nhất với bản nhận diện (đã chuẩn hoá). */
  closestReference: string;
  recognized: string;
  segments: DiffSegment[];
  /**
   * Có chỗ "thiếu" và "thừa" nằm cạnh nhau mà một bên có Kanji, bên kia toàn kana (私 ↔ わたし) → có thể chỉ khác cách viết,
   * không hẳn là đọc khác. Chỉ thiếu (đọc thiếu nửa câu) hoặc chỉ thừa thì không tính.
   */
  mayBeScriptDifference: boolean;
}

const KANA_ONLY = /^[ぁ-ゟー]+$/u;
const KANJI_ONLY = /^[㐀-鿿豈-﫿々]+$/u;
const normalize = (text: string) => normalizeJapanese(text, { foldKatakana: true });

/** Dãy chung dài nhất theo ký tự → các đoạn giống / thiếu / thừa (gộp các ký tự liền nhau cùng loại). */
export function diffSegments(reference: string, recognized: string): DiffSegment[] {
  const left = [...reference];
  const right = [...recognized];
  const table = Array.from({ length: left.length + 1 }, () => new Array<number>(right.length + 1).fill(0));
  for (let i = left.length - 1; i >= 0; i -= 1) {
    for (let j = right.length - 1; j >= 0; j -= 1) {
      table[i][j] = left[i] === right[j] ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }
  const segments: DiffSegment[] = [];
  const push = (kind: DiffSegment['kind'], character: string) => {
    const last = segments[segments.length - 1];
    if (last?.kind === kind) last.text += character;
    else segments.push({ kind, text: character });
  };
  let i = 0;
  let j = 0;
  while (i < left.length && j < right.length) {
    if (left[i] === right[j]) { push('same', left[i]); i += 1; j += 1; }
    else if (table[i + 1][j] >= table[i][j + 1]) { push('missing', left[i]); i += 1; }
    else { push('extra', right[j]); j += 1; }
  }
  while (i < left.length) { push('missing', left[i]); i += 1; }
  while (j < right.length) { push('extra', right[j]); j += 1; }
  return segments;
}

/** Một đoạn "thiếu" và một đoạn "thừa" nằm cạnh nhau, một bên toàn Kanji còn bên kia toàn kana (私 ↔ わたし). */
function hasScriptSwap(segments: DiffSegment[]): boolean {
  return segments.some((segment, index) => {
    const next = segments[index + 1];
    if (!next || segment.kind === 'same' || next.kind === 'same' || segment.kind === next.kind) return false;
    // Một bên toàn chữ Hán, bên kia toàn kana và không ngắn hơn (学生 ↔ がくせい) — đọc thiếu「まで働きます」thừa「よ」không tính.
    const isSwap = (kanji: string, kana: string) => KANJI_ONLY.test(kanji) && KANA_ONLY.test(kana) && kana.length >= kanji.length;
    return isSwap(segment.text, next.text) || isSwap(next.text, segment.text);
  });
}

const changedLength =(segments: DiffSegment[]) => segments.filter((segment) => segment.kind !== 'same').reduce((sum, segment) => sum + segment.text.length, 0);

export function compareTranscript(recognizedText: string, referenceForms: readonly string[]): TranscriptComparison {
  const recognized = normalize(recognizedText);
  const forms = [...new Set(referenceForms.map(normalize).filter(Boolean))];
  const scored = forms.map((form) => ({ form, segments: diffSegments(form, recognized) }))
    .sort((left, right) => changedLength(left.segments) - changedLength(right.segments));
  const best = scored[0] ?? { form: '', segments: diffSegments('', recognized) };
  const isMatch = recognized.length > 0 && forms.includes(recognized);
  return {
    isMatch,
    closestReference: best.form,
    recognized,
    segments: best.segments,
    mayBeScriptDifference: !isMatch && hasScriptSwap(best.segments),
  };
}

/**
 * Đổi chữ Hán trong bản nhận diện sang kana bằng TỪ ĐIỂN TỪ VỰNG của app (dạng viết ↔ cách đọc, khớp dài nhất trước):
 * Whisper hay viết 私は学生です trong khi câu mẫu là わたしは がくせいです — cùng cách đọc nhưng khác chữ.
 * Chữ Hán không có trong từ điển thì giữ nguyên (không đoán cách đọc).
 */
export function kanaizeWithDictionary(text: string, dictionary: ReadonlyArray<readonly [string, string]>): string {
  const entries = [...dictionary].filter(([written]) => /[㐀-鿿々]/u.test(written)).sort((left, right) => right[0].length - left[0].length);
  let result = '';
  for (let index = 0; index < text.length;) {
    const entry = entries.find(([written]) => text.startsWith(written, index));
    if (entry) { result += entry[1]; index += entry[0].length; } else { result += text[index]; index += 1; }
  }
  return result;
}

/** So bản nhận diện với mẫu, thử cả bản đã đổi chữ Hán → kana; lấy kết quả khớp / ít khác nhất. */
export function compareTranscriptWithDictionary(recognizedText: string, referenceForms: readonly string[], dictionary: ReadonlyArray<readonly [string, string]>): TranscriptComparison {
  const direct = compareTranscript(recognizedText, referenceForms);
  if (direct.isMatch || !dictionary.length) return direct;
  const kana = compareTranscript(kanaizeWithDictionary(recognizedText, dictionary), referenceForms);
  return kana.isMatch || changedLength(kana.segments) < changedLength(direct.segments) ? kana : direct;
}

const O_ROW = new Set([...'おこそとのほもよろをごぞどぼぽょ']);
const E_ROW = new Set([...'えけせてねへめれげぜでべぺ']);
/**
 * Bỏ những khác biệt Whisper hay tự thêm / bớt và Neko CHƯA đánh giá được: っ, ー, nguyên âm kéo dài (おう → お, えい → え).
 * Dùng để không báo "đọc khác" chỉ vì trường âm / âm ngắt — đây KHÔNG phải kết luận người học đọc đúng hai điểm đó.
 */
export function withoutLengthMarks(text: string): string {
  const kana = normalize(text).replace(/[っー]/g, '');
  let result = '';
  for (const character of kana) {
    const previous = result.at(-1) ?? '';
    if ((character === 'う' && O_ROW.has(previous)) || (character === 'い' && E_ROW.has(previous))) continue;
    result += character;
  }
  return result;
}

/** Khớp khi bỏ qua trường âm / っ (sau khi đã đổi chữ Hán → kana bằng từ điển). */
export function matchesIgnoringLength(recognizedText: string, referenceForms: readonly string[], dictionary: ReadonlyArray<readonly [string, string]>): boolean {
  const recognized = withoutLengthMarks(kanaizeWithDictionary(recognizedText, dictionary));
  return recognized.length > 0 && referenceForms.some((form) => withoutLengthMarks(form) === recognized);
}
