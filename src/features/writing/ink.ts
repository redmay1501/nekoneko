/**
 * Nét viết tay trong Sổ luyện viết — dữ liệu thuần, không phụ thuộc DOM.
 * Toạ độ CHUẨN HOÁ 0–1 theo ô (tính lại từ getBoundingClientRect ở MỖI sự kiện) → đổi cỡ màn hình, cuộn trang,
 * xoay iPad hay đổi cỡ ô đều không làm lệch nét đã vẽ: nét được vẽ lại bằng SVG theo kích thước hiện tại.
 */
export type InkPoint = readonly [number, number];
export interface InkStroke {
  cellId: string;
  points: InkPoint[];
}

export interface InkState {
  strokes: InkStroke[];
  /** Nét vừa hoàn tác — "Làm lại" đưa về. Viết nét mới thì xoá danh sách này. */
  undone: InkStroke[];
}

export const EMPTY_INK: InkState = { strokes: [], undone: [] };

export type InkAction =
  | { type: 'add'; stroke: InkStroke }
  | { type: 'undo' }
  | { type: 'redo' }
  | { type: 'clear-cell'; cellId: string }
  | { type: 'clear-all' };

export function inkReducer(state: InkState, action: InkAction): InkState {
  switch (action.type) {
    case 'add':
      return action.stroke.points.length ? { strokes: [...state.strokes, action.stroke], undone: [] } : state;
    case 'undo': {
      const last = state.strokes.at(-1);
      return last ? { strokes: state.strokes.slice(0, -1), undone: [...state.undone, last] } : state;
    }
    case 'redo': {
      const last = state.undone.at(-1);
      return last ? { strokes: [...state.strokes, last], undone: state.undone.slice(0, -1) } : state;
    }
    case 'clear-cell':
      return { strokes: state.strokes.filter((stroke) => stroke.cellId !== action.cellId), undone: [] };
    case 'clear-all':
      return EMPTY_INK;
  }
}

/** Điểm con trỏ → toạ độ chuẩn hoá trong ô, kẹp trong 0–1. */
export function normalizePoint(clientX: number, clientY: number, rect: { left: number; top: number; width: number; height: number }): InkPoint {
  const clamp = (value: number) => Math.min(1, Math.max(0, value));
  return [clamp((clientX - rect.left) / rect.width), clamp((clientY - rect.top) / rect.height)];
}

/** Đường SVG mượt (đường cong qua trung điểm) trong hệ toạ độ `size` × `size`. Một điểm → chấm tròn nhỏ. */
export function strokePath(points: readonly InkPoint[], size = 100): string {
  if (!points.length) return '';
  const scaled = points.map(([x, y]) => [x * size, y * size] as const);
  const fixed = (value: number) => Math.round(value * 10) / 10;
  if (scaled.length === 1) {
    const [x, y] = scaled[0];
    return `M${fixed(x)} ${fixed(y)}l0.01 0`;
  }
  let path = `M${fixed(scaled[0][0])} ${fixed(scaled[0][1])}`;
  for (let index = 1; index < scaled.length - 1; index += 1) {
    const [x, y] = scaled[index];
    const [nextX, nextY] = scaled[index + 1];
    path += `Q${fixed(x)} ${fixed(y)} ${fixed((x + nextX) / 2)} ${fixed((y + nextY) / 2)}`;
  }
  const [lastX, lastY] = scaled[scaled.length - 1];
  return `${path}L${fixed(lastX)} ${fixed(lastY)}`;
}

/** Bỏ điểm quá sát điểm trước (giảm rung tay, nhẹ dữ liệu). */
export function shouldAddPoint(previous: InkPoint | undefined, next: InkPoint, minDistance = 0.006): boolean {
  if (!previous) return true;
  return Math.hypot(next[0] - previous[0], next[1] - previous[1]) >= minDistance;
}
