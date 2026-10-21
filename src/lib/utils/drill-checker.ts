// NekoNeko – chấm đáp án bài tập (TypeScript, không phụ thuộc thư viện ngoài)
// Dùng được cho: substitution / transformation (answer_mode = "exact"), qa (answer_mode = "model"), dialogue (trắc nghiệm).

export type ExerciseItem = {
  n: number;
  is_example: boolean;
  prompt: string;
  cue_vi?: string;
  answers: string[];   // các cách viết được chấp nhận
  readings: string[];  // cách đọc (hiragana) tương ứng từng đáp án – để chấp nhận người học gõ toàn kana
};

export type Blank = { n: number; options: string[]; answer_index: number /* đếm từ 1 */; answers: string[] };

/** Chuẩn hóa để so sánh: NFKC (full/half width), bỏ khoảng trắng & dấu câu, katakana → hiragana. */
export function normalize(s: string): string {
  return s
    .normalize('NFKC')
    .replace(/[\s　]/g, '')
    .replace(/[。、．，,.!！?？「」『』（）()〜～ー\-・…]/g, (c) => (c === 'ー' ? 'ー' : ''))
    .replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60))
    .toLowerCase();
}

/** Chấm câu tự luận (substitution / transformation / qa). */
export function checkItem(input: string, item: ExerciseItem): { correct: boolean; matched?: string } {
  const x = normalize(input);
  if (!x) return { correct: false };
  for (let i = 0; i < item.answers.length; i++) {
    if (x === normalize(item.answers[i]) || x === normalize(item.readings[i] ?? '')) {
      return { correct: true, matched: item.answers[i] };
    }
  }
  return { correct: false };
}

/**
 * Với answer_mode = "model" (hỏi đáp tự do): nếu không khớp tuyệt đối, đề xuất hiển thị đáp án mẫu
 * và cho người học tự đánh giá ("Đúng ý" / "Chưa đúng"). Hàm dưới cho điểm gần đúng 0–1 để gợi ý.
 */
export function similarity(input: string, model: string): number {
  const a = normalize(input), b = normalize(model);
  if (!a || !b) return 0;
  const grams = (s: string) => new Set(Array.from({ length: Math.max(1, s.length - 1) }, (_, i) => s.slice(i, i + 2)));
  const A = grams(a), B = grams(b);
  let inter = 0;
  A.forEach((g) => { if (B.has(g)) inter++; });
  return (2 * inter) / (A.size + B.size);
}

/** Chấm chỗ trống hội thoại (chọn 1 trong 4). choice đếm từ 1. */
export function checkBlank(choice: number, blank: Blank): boolean {
  return choice === blank.answer_index;
}

/** Thay {{n}} trong câu hội thoại bằng nội dung (ví dụ ô chọn hoặc đáp án). */
export function renderLine(text: string, fill: (n: number) => string): string {
  return text.replace(/\{\{(\d+)\}\}/g, (_, n) => fill(Number(n)));
}
