/**
 * Nét viết tay trong Sổ luyện viết — dữ liệu thuần, không phụ thuộc DOM.
 * Toạ độ CHUẨN HOÁ 0–1 theo ô (tính lại từ getBoundingClientRect ở MỖI sự kiện) → đổi cỡ màn hình, cuộn trang,
 * xoay iPad hay đổi cỡ ô đều không làm lệch nét đã vẽ: nét được vẽ lại bằng SVG theo kích thước hiện tại.
 */
export type InkPoint = readonly [number, number];
export interface InkStroke {
  cellId: string;
  points: InkPoint[];
  /** Vẽ bằng gì (mouse / pen / touch) và lúc nào — để dọn vệt lòng bàn tay khi bút xuất hiện. */
  pointerType?: string;
  at?: number;
}

/**
 * Lịch sử dạng ảnh chụp: mỗi thao tác (viết một nét, một lần quẹt tẩy, xoá ô, xoá hết) đẩy trạng thái cũ vào `past`
 * → Hoàn tác / Làm lại hoạt động giống nhau cho mọi thao tác.
 */
export interface InkState {
  strokes: InkStroke[];
  past: InkStroke[][];
  future: InkStroke[][];
}

export const EMPTY_INK: InkState = { strokes: [], past: [], future: [] };
const MAX_HISTORY = 200;

export type InkAction =
  | { type: 'add'; stroke: InkStroke }
  | { type: 'undo' }
  | { type: 'redo' }
  | { type: 'clear-cell'; cellId: string }
  | { type: 'clear-all' }
  /** Bắt đầu một lần quẹt tẩy — ghi một bước lịch sử (cả lần quẹt hoàn tác một lần). */
  | { type: 'erase-begin' }
  /** Tẩy các nét bị quẹt trúng (trong lần quẹt đang diễn ra — không thêm bước lịch sử). */
  | { type: 'erase'; shouldErase: (stroke: InkStroke) => boolean }
  /** Bỏ nét không cần lưu lịch sử (dọn vệt lòng bàn tay). */
  | { type: 'remove'; shouldRemove: (stroke: InkStroke) => boolean };

function commit(state: InkState, strokes: InkStroke[]): InkState {
  if (strokes === state.strokes) return state;
  return { strokes, past: [...state.past, state.strokes].slice(-MAX_HISTORY), future: [] };
}

export function inkReducer(state: InkState, action: InkAction): InkState {
  switch (action.type) {
    case 'add':
      return action.stroke.points.length ? commit(state, [...state.strokes, action.stroke]) : state;
    case 'undo': {
      const previous = state.past.at(-1);
      return previous ? { strokes: previous, past: state.past.slice(0, -1), future: [...state.future, state.strokes] } : state;
    }
    case 'redo': {
      const next = state.future.at(-1);
      return next ? { strokes: next, past: [...state.past, state.strokes], future: state.future.slice(0, -1) } : state;
    }
    case 'clear-cell': {
      const kept = state.strokes.filter((stroke) => stroke.cellId !== action.cellId);
      return kept.length === state.strokes.length ? state : commit(state, kept);
    }
    case 'clear-all':
      return state.strokes.length ? commit(state, []) : state;
    case 'erase-begin':
      return { strokes: state.strokes, past: [...state.past, state.strokes].slice(-MAX_HISTORY), future: [] };
    case 'erase': {
      const kept = state.strokes.filter((stroke) => !action.shouldErase(stroke));
      return kept.length === state.strokes.length ? state : { ...state, strokes: kept };
    }
    case 'remove': {
      const kept = state.strokes.filter((stroke) => !action.shouldRemove(stroke));
      return kept.length === state.strokes.length ? state : { ...state, strokes: kept };
    }
  }
}

/** Lần quẹt tẩy không trúng nét nào → bỏ bước lịch sử rỗng vừa ghi (Hoàn tác không phải bấm thừa). */
export function dropEmptyEraseStep(state: InkState): InkState {
  return state.past.at(-1) === state.strokes ? { ...state, past: state.past.slice(0, -1) } : state;
}

/**
 * Nét có bị cục tẩy (tâm `point`, bán kính `radius` theo chiều cao ô) quẹt trúng không.
 * Ô chữ nhật (dòng kẻ): trục x nhân `aspect` để khoảng cách đo đúng như trên màn hình.
 */
export function strokeHitsPoint(stroke: InkStroke, point: InkPoint, radius: number, aspect = 1): boolean {
  const [px, py] = [point[0] * aspect, point[1]];
  const points = stroke.points.map(([x, y]) => [x * aspect, y] as const);
  if (points.length === 1) return Math.hypot(points[0][0] - px, points[0][1] - py) <= radius;
  for (let index = 1; index < points.length; index += 1) {
    const [ax, ay] = points[index - 1];
    const [bx, by] = points[index];
    const lengthSquared = (bx - ax) ** 2 + (by - ay) ** 2;
    const t = lengthSquared === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * (bx - ax) + (py - ay) * (by - ay)) / lengthSquared));
    if (Math.hypot(ax + t * (bx - ax) - px, ay + t * (by - ay) - py) <= radius) return true;
  }
  return false;
}

export const ERASER_RADIUS = 0.08;

/** Điểm con trỏ → toạ độ chuẩn hoá trong ô, kẹp trong 0–1. */
export function normalizePoint(clientX: number, clientY: number, rect: { left: number; top: number; width: number; height: number }): InkPoint {
  const clamp = (value: number) => Math.min(1, Math.max(0, value));
  return [clamp((clientX - rect.left) / rect.width), clamp((clientY - rect.top) / rect.height)];
}

/** Đường SVG mượt (đường cong qua trung điểm) trong hệ toạ độ `size` × `size`. Một điểm → chấm tròn nhỏ. */
export function strokePath(points: readonly InkPoint[], size = 100, width = size): string {
  if (!points.length) return '';
  // Ô chữ nhật (ô từ vựng): x theo bề ngang `width`, y theo `size` — toạ độ chuẩn hoá vẫn 0–1 theo từng chiều.
  const scaled = points.map(([x, y]) => [x * width, y * size] as const);
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
