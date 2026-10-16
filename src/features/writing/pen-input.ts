/**
 * Viết bằng bút (Apple Pencil, bút Surface / Android) — chống "tì tay": khi đã dùng bút, chạm tay vào ô viết KHÔNG vẽ.
 *  - auto (mặc định): bình thường nhận cả tay lẫn bút; ngay khi thấy nét bút đầu tiên → chỉ nhận bút, và NHỚ trên máy này
 *    (mở lại trang vẫn chỉ nhận bút). Vùng chạm to như lòng bàn tay luôn bị bỏ qua. Nét tay vừa vẽ ngay trước nét bút đầu
 *    tiên (thường là vệt lòng bàn tay) được dọn đi — xem RECENT_PALM_MS.
 *  - pen: luôn chỉ nhận bút.  - all: nhận cả tay (tắt chống tì tay).
 * Tay đặt xuống TRƯỚC rồi bút mới chạm → huỷ nét của tay, nhường cho bút (lòng bàn tay thường chạm trước đầu bút).
 */
export type PenMode = 'auto' | 'pen' | 'all';
export type PointerKind = 'mouse' | 'pen' | 'touch' | string;

/** Vùng chạm lớn hơn chừng này (px) gần như chắc chắn là lòng bàn tay / cạnh tay, không phải đầu ngón. */
export const PALM_CONTACT_PX = 100;

export interface PointerDecisionInput {
  pointerType: PointerKind;
  /** Kích thước vùng chạm (PointerEvent.width / height) — trình duyệt không báo thì 0 hoặc 1. */
  contactWidth?: number;
  contactHeight?: number;
  mode: PenMode;
  /** Đã thấy bút trong lần mở trang này. */
  penSeen: boolean;
  /** Loại con trỏ đang vẽ dở (null = chưa vẽ). */
  activePointerType: PointerKind | null;
}

/** start = bắt đầu nét mới · replace = huỷ nét đang vẽ dở (của tay) rồi bắt đầu nét bút · ignore = bỏ qua. */
export function decidePointer({ pointerType, mode, penSeen, activePointerType, contactWidth = 0, contactHeight = 0 }: PointerDecisionInput): 'start' | 'replace' | 'ignore' {
  const penOnly = mode === 'pen' || (mode === 'auto' && (penSeen || pointerType === 'pen'));
  // Chỉ nhận bút: CHỈ chấp nhận bút và chuột / trackpad — mọi loại chạm khác (touch, hoặc loại trình duyệt báo lạ) đều bỏ qua.
  if (penOnly && pointerType !== 'pen' && pointerType !== 'mouse') return 'ignore';
  // Chưa thấy bút nhưng vùng chạm to như lòng bàn tay → bỏ qua (trừ khi người học chọn "Nhận cả bút và tay").
  if (pointerType === 'touch' && mode === 'auto' && Math.max(contactWidth, contactHeight) > PALM_CONTACT_PX) return 'ignore';
  if (activePointerType === null) return 'start';
  if (pointerType === 'pen' && activePointerType === 'touch' && mode !== 'all') return 'replace';
  return 'ignore';
}

// Trạng thái dùng chung cho mọi ô trên trang (useSyncExternalStore), lưu lựa chọn của người học trên máy này.
const STORAGE_KEY = 'neko-pen-mode';
/** Máy này đã từng dùng bút → lần sau mở trang là chỉ nhận bút ngay (không chờ nét bút đầu tiên). */
const PEN_SEEN_KEY = 'neko-pen-seen';
let mode = 'auto' as PenMode;
let penSeen = false;
let loaded = false;
const listeners = new Set<() => void>();
let snapshot: { mode: PenMode; penSeen: boolean } = { mode, penSeen };

function emit() {
  snapshot = { mode, penSeen };
  for (const listener of listeners) listener();
}

function load() {
  if (loaded || typeof window === 'undefined') return;
  loaded = true;
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === 'pen' || saved === 'all' || saved === 'auto') mode = saved;
    penSeen = window.localStorage.getItem(PEN_SEEN_KEY) === '1';
    snapshot = { mode, penSeen };
  } catch { /* trình duyệt chặn lưu → mặc định auto */ }
}

export const penInput = {
  subscribe(listener: () => void) { load(); listeners.add(listener); return () => listeners.delete(listener); },
  getSnapshot() { load(); return snapshot; },
  getServerSnapshot() { return SERVER_SNAPSHOT; },
  notePen() {
    if (penSeen) return;
    penSeen = true;
    try { window.localStorage.setItem(PEN_SEEN_KEY, '1'); } catch { /* bỏ qua */ }
    emit();
  },
  /** "Nhận cả bút và tay" cũng quên rằng máy này có bút — chọn lại "Tự nhận" thì học lại từ nét bút kế tiếp. */
  forgetPen() {
    penSeen = false;
    try { window.localStorage.removeItem(PEN_SEEN_KEY); } catch { /* bỏ qua */ }
    emit();
  },
  setMode(next: PenMode) {
    mode = next;
    try { window.localStorage.setItem(STORAGE_KEY, next); } catch { /* bỏ qua */ }
    emit();
  },
};
const SERVER_SNAPSHOT = { mode: 'auto' as PenMode, penSeen: false };

export function isPenOnly(state: { mode: PenMode; penSeen: boolean }): boolean {
  return state.mode === 'pen' || (state.mode === 'auto' && state.penSeen);
}

/** Nét đang vẽ dở trên TOÀN trang (mỗi lúc một nét) — để bút có thể huỷ nét do lòng bàn tay ở ô khác. */
let activeStroke: { pointerType: PointerKind; cancel: () => void } | null = null;

export const activeStrokes = {
  current(): PointerKind | null { return activeStroke?.pointerType ?? null; },
  begin(pointerType: PointerKind, cancel: () => void) { activeStroke = { pointerType, cancel }; },
  /** Huỷ nét đang vẽ dở (không lưu) — dùng khi bút đặt xuống sau lòng bàn tay. */
  cancelCurrent() { const stroke = activeStroke; activeStroke = null; stroke?.cancel(); },
  end(cancel: () => void) { if (activeStroke?.cancel === cancel) activeStroke = null; },
};

/** Khi bút xuất hiện lần đầu, nét CHẠM TAY tạo trong khoảng này trước đó được coi là vệt lòng bàn tay và bị xoá. */
export const RECENT_PALM_MS = 2500;

export function isLikelyPalmStroke(stroke: { pointerType?: string; at?: number }, penAt: number): boolean {
  return stroke.pointerType === 'touch' && stroke.at !== undefined && penAt - stroke.at <= RECENT_PALM_MS && stroke.at <= penAt;
}

/** Nhật ký chạm gần nhất — hiện trong "Chẩn đoán bút / chạm" để người học chụp màn hình gửi khi còn bị dính tì tay. */
export interface PointerLogEntry {
  at: number;
  pointerType: string;
  width: number;
  height: number;
  pressure: number;
  isPrimary: boolean;
  decision: string;
}
const LOG_SIZE = 8;
let pointerLog: PointerLogEntry[] = [];
const logListeners = new Set<() => void>();
export const pointerDiagnostics = {
  record(entry: PointerLogEntry) {
    pointerLog = [entry, ...pointerLog].slice(0, LOG_SIZE);
    for (const listener of logListeners) listener();
  },
  subscribe(listener: () => void) { logListeners.add(listener); return () => logListeners.delete(listener); },
  getSnapshot: () => pointerLog,
  getServerSnapshot: () => EMPTY_LOG,
};
const EMPTY_LOG: PointerLogEntry[] = [];
