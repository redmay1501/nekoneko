/**
 * Viết bằng bút (Apple Pencil, bút Surface / Android) — chống "tì tay": khi đã dùng bút, chạm tay vào ô viết KHÔNG vẽ.
 *  - auto (mặc định): bình thường nhận cả tay lẫn bút; ngay khi thấy nét bút đầu tiên → chỉ nhận bút cho tới khi tải lại trang.
 *  - pen: luôn chỉ nhận bút.  - all: nhận cả tay (tắt chống tì tay).
 * Tay đặt xuống TRƯỚC rồi bút mới chạm → huỷ nét của tay, nhường cho bút (lòng bàn tay thường chạm trước đầu bút).
 */
export type PenMode = 'auto' | 'pen' | 'all';
export type PointerKind = 'mouse' | 'pen' | 'touch' | string;

export interface PointerDecisionInput {
  pointerType: PointerKind;
  mode: PenMode;
  /** Đã thấy bút trong lần mở trang này. */
  penSeen: boolean;
  /** Loại con trỏ đang vẽ dở (null = chưa vẽ). */
  activePointerType: PointerKind | null;
}

/** start = bắt đầu nét mới · replace = huỷ nét đang vẽ dở (của tay) rồi bắt đầu nét bút · ignore = bỏ qua. */
export function decidePointer({ pointerType, mode, penSeen, activePointerType }: PointerDecisionInput): 'start' | 'replace' | 'ignore' {
  const penOnly = mode === 'pen' || (mode === 'auto' && (penSeen || pointerType === 'pen'));
  if (pointerType === 'touch' && penOnly) return 'ignore';
  if (activePointerType === null) return 'start';
  if (pointerType === 'pen' && activePointerType === 'touch' && mode !== 'all') return 'replace';
  return 'ignore';
}

// Trạng thái dùng chung cho mọi ô trên trang (useSyncExternalStore), lưu lựa chọn của người học trên máy này.
const STORAGE_KEY = 'neko-pen-mode';
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
    if (saved === 'pen' || saved === 'all' || saved === 'auto') { mode = saved; snapshot = { mode, penSeen }; }
  } catch { /* trình duyệt chặn lưu → mặc định auto */ }
}

export const penInput = {
  subscribe(listener: () => void) { load(); listeners.add(listener); return () => listeners.delete(listener); },
  getSnapshot() { load(); return snapshot; },
  getServerSnapshot() { return SERVER_SNAPSHOT; },
  notePen() { if (!penSeen) { penSeen = true; emit(); } },
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
