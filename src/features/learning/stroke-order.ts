import strokeOrderIndex from '@content/seed/stroke-order.json';

/**
 * Thứ tự nét viết — dữ liệu KanjiVG (© Ulrich Apel, CC BY-SA 3.0; ghi nguồn ở Cài đặt và public/strokes/LICENSE.txt),
 * tải bằng scripts/fetch-stroke-order.mjs.
 *
 * Mục lục (content/seed/stroke-order.json) cho biết chữ nào CÓ dữ liệu và bao nhiêu nét; hình từng nét nằm ở
 * public/strokes/<mã hex>.json, chỉ tải khi người học mở. Chữ không có trong mục lục → giao diện nói rõ
 * "chưa có thứ tự nét", không tự vẽ đoán.
 */

/** Hệ toạ độ của KanjiVG: ô vuông 109 × 109. */
export const STROKE_ORDER_BOX = 109;

export interface StrokeOrderData {
  c: string;
  /** Đường SVG của từng nét, đúng thứ tự viết. */
  strokes: string[];
  /** Vị trí đặt số thứ tự của từng nét. */
  labels: Array<[number, number]>;
}

const STROKE_COUNTS: Readonly<Record<string, number>> = strokeOrderIndex.strokeCounts;

export function strokeCountOf(character: string): number | undefined {
  return Object.hasOwn(STROKE_COUNTS, character) ? STROKE_COUNTS[character] : undefined;
}

export function hasStrokeOrder(character: string): boolean {
  return strokeCountOf(character) !== undefined;
}

/** Các chữ có dữ liệu trong một mặt chữ (âm ghép きゃ → き, ゃ). */
export function strokeOrderCharacters(text: string): string[] {
  return [...text].filter(hasStrokeOrder);
}

export function strokeOrderUrl(character: string): string {
  return `/strokes/${character.codePointAt(0)!.toString(16).padStart(5, '0')}.json`;
}

const cache = new Map<string, Promise<StrokeOrderData | null>>();

/** Tải hình nét của một chữ (dùng chung cho mọi component trên trang; lỗi mạng thì lần sau thử lại). */
export function loadStrokeOrder(character: string): Promise<StrokeOrderData | null> {
  if (!hasStrokeOrder(character)) return Promise.resolve(null);
  const cached = cache.get(character);
  if (cached) return cached;
  const request = fetch(strokeOrderUrl(character))
    .then((response) => (response.ok ? (response.json() as Promise<StrokeOrderData>) : null))
    .catch(() => null)
    .then((data) => {
      if (!data) cache.delete(character);
      return data;
    });
  cache.set(character, request);
  return request;
}

/** Điểm đầu của một nét — lệnh "M x,y" đầu tiên của đường SVG KanjiVG. */
export function strokeStartOf(path: string): Point | null {
  const match = path.match(/^\s*M\s*(-?[\d.]+)[\s,]*(-?[\d.]+)/i);
  return match ? [Number(match[1]), Number(match[2])] : null;
}

// ─── Chấm bài viết ở mức cơ bản ─────────────────────────────────────────────────────────────────────────────
// Người học viết đè lên chữ mẫu mờ (cùng hệ toạ độ KanjiVG), nên so được: đủ số nét chưa, từng nét bắt đầu
// đúng chỗ và đi đúng chiều chưa (theo đúng thứ tự). Không nhận dạng hình chữ — chỉ là kiểm tra cơ bản.

export type Point = readonly [number, number];

export interface StrokeEnds {
  start: Point;
  end: Point;
}

export type StrokeVerdict = 'ok' | 'reversed' | 'wrong-place';

export interface WritingCheck {
  expected: number;
  written: number;
  verdicts: StrokeVerdict[];
  isCorrect: boolean;
}

/** Sai số cho phép (đơn vị ô 109): ~ 1/5 ô — đủ rộng cho ngón tay trên điện thoại. */
const START_TOLERANCE = 22;
const END_TOLERANCE = 28;

const distance = (a: Point, b: Point) => Math.hypot(a[0] - b[0], a[1] - b[1]);

export function checkWriting(written: ReadonlyArray<ReadonlyArray<Point>>, reference: readonly StrokeEnds[]): WritingCheck {
  const verdicts = reference.slice(0, written.length).map((ends, index): StrokeVerdict => {
    const stroke = written[index];
    const start = stroke[0];
    const end = stroke[stroke.length - 1];
    if (distance(start, ends.start) <= START_TOLERANCE && distance(end, ends.end) <= END_TOLERANCE) return 'ok';
    if (distance(start, ends.end) <= START_TOLERANCE && distance(end, ends.start) <= END_TOLERANCE) return 'reversed';
    return 'wrong-place';
  });
  return {
    expected: reference.length,
    written: written.length,
    verdicts,
    isCorrect: written.length === reference.length && verdicts.every((verdict) => verdict === 'ok'),
  };
}

/** Câu nhận xét cho người học — chỉ ra NÉT ĐẦU TIÊN cần sửa, không liệt kê dồn dập. */
export function describeWritingCheck(check: WritingCheck): string {
  if (!check.written) return 'Viết chữ vào khung trước nhé.';
  if (check.isCorrect) return `Đúng cả ${check.expected} nét: đúng thứ tự, đúng chỗ bắt đầu và đúng chiều viết. 🎉`;
  const firstWrong = check.verdicts.findIndex((verdict) => verdict !== 'ok');
  if (firstWrong >= 0) {
    const stroke = `Nét ${firstWrong + 1}`;
    return check.verdicts[firstWrong] === 'reversed'
      ? `${stroke} đang viết ngược chiều. Bấm ▶ xem lại hướng của nét này rồi viết lại nhé.`
      : `${stroke} chưa đúng chỗ — có thể bạn viết sai thứ tự. Xem lại nét ${firstWrong + 1} trong hình động nhé.`;
  }
  return check.written < check.expected
    ? `Các nét đã viết đều đúng, còn thiếu ${check.expected - check.written} nét (chữ này có ${check.expected} nét).`
    : `Bạn viết ${check.written} nét, chữ này chỉ có ${check.expected} nét. Xoá và viết lại nhé.`;
}
