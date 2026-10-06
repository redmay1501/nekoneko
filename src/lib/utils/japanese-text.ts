/**
 * So khớp câu trả lời gõ tiếng Nhật — không so chuỗi thô:
 *  - NFKC: chữ/số toàn-chiều-rộng ↔ nửa-chiều-rộng (Ａ→A, １→1, ｶ→カ);
 *  - bỏ khoảng trắng (cả khoảng trắng Nhật 　) và dấu câu (。、！？「」・…);
 *  - Katakana → Hiragana (gõ がくせい hay ガクセイ đều đúng khi hỏi cách đọc);
 *  - giữ nguyên dấu kéo dài "ー" (コーヒー ≠ コーヒ).
 */
const PUNCTUATION = /[\s　。、．，,.!！?？「」『』（）()・…〜～]/g;
const KATAKANA = /[ァ-ヶ]/g;
const KATAKANA_TO_HIRAGANA = 0x60;

export function normalizeJapanese(text: string, options: { foldKatakana?: boolean } = {}): string {
  const normalized = text.normalize('NFKC').replace(PUNCTUATION, '');
  return options.foldKatakana
    ? normalized.replace(KATAKANA, (character) => String.fromCodePoint(character.codePointAt(0)! - KATAKANA_TO_HIRAGANA))
    : normalized;
}

export interface JapaneseComparison {
  isCorrect: boolean;
  /** Đúng sau khi bỏ dấu câu / khoảng trắng / khác Katakana–Hiragana nhưng không khớp nguyên văn. */
  isLenient: boolean;
  /** Từng ký tự của đáp án: đúng hay sai vị trí — để tô chỗ sai cho người học. */
  diff: { character: string; isMatch: boolean }[];
  /** 0–100: tỉ lệ ký tự trùng (theo khoảng cách chỉnh sửa). */
  score: number;
}

function editDistance(left: string, right: string): number {
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let i = 1; i <= left.length; i++) {
    let diagonal = previous[0];
    previous[0] = i;
    for (let j = 1; j <= right.length; j++) {
      const above = previous[j];
      previous[j] = Math.min(previous[j] + 1, previous[j - 1] + 1, diagonal + (left[i - 1] === right[j - 1] ? 0 : 1));
      diagonal = above;
    }
  }
  return previous[right.length];
}

/** So câu người học gõ với đáp án (một hoặc nhiều đáp án chấp nhận được, ví dụ 学生 / がくせい). */
export function compareJapanese(answer: string, accepted: readonly string[], options: { foldKatakana?: boolean } = {}): JapaneseComparison {
  const typed = normalizeJapanese(answer, options);
  const candidates = accepted.map((expected) => ({ raw: expected, normalized: normalizeJapanese(expected, options) }));
  const best = candidates
    .map((candidate) => ({ ...candidate, distance: editDistance(typed, candidate.normalized) }))
    .sort((left, right) => left.distance - right.distance)[0];
  const isCorrect = best.distance === 0 && typed.length > 0;
  const length = Math.max(best.normalized.length, typed.length, 1);
  return {
    isCorrect,
    isLenient: isCorrect && !accepted.some((expected) => expected.trim() === answer.trim()),
    diff: [...best.normalized].map((character, index) => ({ character, isMatch: typed[index] === character })),
    score: Math.max(0, Math.round((1 - best.distance / length) * 100)),
  };
}
