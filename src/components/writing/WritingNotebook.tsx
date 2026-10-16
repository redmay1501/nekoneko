'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { isLikelyPalmStroke, isPenOnly, penInput, type PenMode, pointerDiagnostics } from '@/features/writing/pen-input';
import { createPortal } from 'react-dom';
import { AudioButton } from '@/components/common/AudioButton';
import { preloadStrokeOrders, type StrokeOrderData } from '@/features/learning/stroke-order';
import { dropEmptyEraseStep, EMPTY_INK, ERASER_RADIUS, type InkAction, type InkPoint, inkReducer, type InkState, type InkStroke, strokeHitsPoint } from '@/features/writing/ink';
import {
  DEFAULT_REPEATS, fillRepeats, type GhostMode, gridColumns, isGhostCell, type Notebook, type NotebookId, type NotebookPage, PRINT_AUTO_REPEATS,
  REPEAT_OPTIONS, type RepeatSetting, ghostCopies, VOCAB_LINE_OPTIONS, type VocabLines, wordLines,
} from '@/features/writing/notebook';
import type { PageProgress } from '@/features/writing/notebook-progress';
import { postJson } from '@/lib/api/api-client';
import { CellGhost, CellGrid, CellModel, eraserPointer, LineGhost, NotebookCell } from './NotebookCell';

type CellSize = 'nho' | 'vua' | 'lon';
interface NotebookSettings {
  repeats: RepeatSetting;
  ghost: GhostMode;
  showGrid: boolean;
  cellSize: CellSize;
  /** Sổ Từ vựng: viết bằng kana hay chữ Kanji (từ không có Kanji thì luôn là kana). */
  vocabForm: VocabForm;
  /** Sổ Từ vựng: số dòng kẻ để viết mỗi từ. */
  vocabLines: VocabLines;
}
type VocabForm = 'kana' | 'kanji';
const DEFAULT_SETTINGS: NotebookSettings = { repeats: DEFAULT_REPEATS, ghost: 'half', showGrid: true, cellSize: 'vua', vocabForm: 'kana', vocabLines: 'auto' };
const SETTINGS_KEY = 'neko-writing-notebook-settings';
const GHOST_LABELS: Record<GhostMode, string> = { all: 'Đồ chữ mờ', half: 'Nửa đồ, nửa tự viết', none: 'Tự viết' };
const SIZE_LABELS: Record<CellSize, string> = { nho: 'Nhỏ', vua: 'Vừa', lon: 'Lớn' };
/** Cỡ ô tối thiểu (px) của từng chế độ — khớp --nb-cell trong globals.css; ô giãn thêm cho kín bề rộng khung. */
const CELL_PX: Record<CellSize, number> = { nho: 52, vua: 64, lon: 84 };
const CELL_GAP_PX = 6;

/** Cùng múi giờ ở server và trình duyệt → không lệch khi hydrate. */
function formatPracticedAt(value: string): string {
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(value));
}

function readSettings(): NotebookSettings {
  try {
    const saved = JSON.parse(window.localStorage.getItem(SETTINGS_KEY) ?? 'null') as Partial<NotebookSettings> | null;
    if (!saved) return DEFAULT_SETTINGS;
    return {
      repeats: saved.repeats === 'auto' || (REPEAT_OPTIONS as readonly number[]).includes(Number(saved.repeats)) ? saved.repeats! : DEFAULT_SETTINGS.repeats,
      ghost: saved.ghost && saved.ghost in GHOST_LABELS ? saved.ghost : DEFAULT_SETTINGS.ghost,
      showGrid: typeof saved.showGrid === 'boolean' ? saved.showGrid : DEFAULT_SETTINGS.showGrid,
      cellSize: saved.cellSize && saved.cellSize in SIZE_LABELS ? saved.cellSize : DEFAULT_SETTINGS.cellSize,
      vocabForm: saved.vocabForm === 'kanji' ? 'kanji' : 'kana',
      vocabLines: (VOCAB_LINE_OPTIONS as readonly unknown[]).includes(saved.vocabLines) ? saved.vocabLines! : 'auto',
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

interface WritingNotebookProps {
  notebooks: Notebook[];
  initialProgress: Record<string, PageProgress>;
  initialNotebookId?: string;
  initialPageNumber?: number;
}

/**
 * Sổ luyện viết: bìa (chọn sổ) → trang (mỗi chữ một dòng: chữ mẫu + N ô lặp lại). Viết trực tiếp bằng chuột / ngón tay / bút.
 * Nét viết chỉ giữ trong phiên (lật trang qua lại vẫn còn); tiến độ chỉ ghi khi viết nét đầu tiên và khi người học bấm
 * "Đã luyện xong trang" — không ghi trí nhớ, không đổi lộ trình.
 */
export function WritingNotebook({ notebooks, initialProgress, initialNotebookId, initialPageNumber }: WritingNotebookProps) {
  const initialNotebook = notebooks.find((notebook) => notebook.id === initialNotebookId) ?? null;
  const [notebookId, setNotebookId] = useState<NotebookId | null>(initialNotebook?.id ?? null);
  const [pageIndex, setPageIndex] = useState(() => Math.min(Math.max((initialPageNumber ?? 1) - 1, 0), (initialNotebook?.pages.length ?? 1) - 1));
  const [settings, setSettings] = useState<NotebookSettings>(DEFAULT_SETTINGS);
  const [inkByPage, setInkByPage] = useState<Record<string, InkState>>({});
  const [activeCell, setActiveCell] = useState<string | null>(null);
  const [progress, setProgress] = useState(initialProgress);
  const [guides, setGuides] = useState<Record<string, StrokeOrderData>>({});
  const [printScope, setPrintScope] = useState<'page' | 'notebook' | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const startedRef = useRef(new Set<string>());
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  // Chỉ ghi URL sau khi người học tự chọn sổ / lật trang — tab đang ẩn không được đổi ?muc= của tab khác.
  const shouldSyncUrlRef = useRef(false);
  const settingsRef = useRef<HTMLDetailsElement>(null);
  const pen = useSyncExternalStore(penInput.subscribe, penInput.getSnapshot, penInput.getServerSnapshot);
  // Bút vừa xuất hiện lần đầu → dọn các nét chạm tay vừa vẽ ngay trước đó (thường là vệt lòng bàn tay).
  const wasPenSeen = useRef(pen.penSeen);
  useEffect(() => {
    if (pen.penSeen && !wasPenSeen.current && pen.mode === 'auto') {
      const penAt = Date.now();
      setInkByPage((current) => Object.fromEntries(Object.entries(current).map(([pageId, state]) => [
        pageId, inkReducer(state, { type: 'remove', shouldRemove: (stroke) => isLikelyPalmStroke(stroke, penAt) }),
      ])));
    }
    wasPenSeen.current = pen.penSeen;
  }, [pen.penSeen, pen.mode]);
  const paperRef = useRef<HTMLElement>(null);
  const [cellsWidth, setCellsWidth] = useState(0);

  // Đo bề rộng vùng ô (đổi cỡ cửa sổ, xoay iPad, mở / đóng thanh bên) → tính lại số cột cho kín khung.
  useEffect(() => {
    const paper = paperRef.current;
    if (!paper) return;
    const measure = () => {
      const style = getComputedStyle(paper);
      setCellsWidth(paper.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(paper);
    return () => observer.disconnect();
  }, [notebookId]);

  // Bảng Tuỳ chỉnh: bấm ra ngoài hoặc nhấn Esc thì đóng.
  useEffect(() => {
    function closeOnOutside(event: PointerEvent) {
      const panel = settingsRef.current;
      if (panel?.open && !panel.contains(event.target as Node)) panel.open = false;
    }
    function closeOnEscape(event: KeyboardEvent) {
      const panel = settingsRef.current;
      if (event.key === 'Escape' && panel?.open) { panel.open = false; panel.querySelector('summary')?.focus(); }
    }
    document.addEventListener('pointerdown', closeOnOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => { document.removeEventListener('pointerdown', closeOnOutside); document.removeEventListener('keydown', closeOnEscape); };
  }, []);

  const notebook = notebooks.find((item) => item.id === notebookId) ?? null;
  const page: NotebookPage | null = notebook ? notebook.pages[Math.min(pageIndex, notebook.pages.length - 1)] : null;
  const ink = (page && inkByPage[page.id]) || EMPTY_INK;

  useEffect(() => setSettings(readSettings()), []);
  useEffect(() => {
    try { window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch { /* trình duyệt chặn lưu → dùng mặc định lần sau */ }
  }, [settings]);

  // Nét KanjiVG cho chữ mờ (một tệp cho mọi chữ, tải một lần).
  useEffect(() => {
    let isCurrent = true;
    preloadStrokeOrders().then((bundle) => {
      if (!isCurrent || !bundle) return;
      setGuides(Object.fromEntries(Object.entries(bundle).map(([character, data]) => [character, { c: character, ...data }])));
    });
    return () => { isCurrent = false; };
  }, []);

  // Giữ URL theo sổ / trang đang mở (mở lại hoặc gửi link đúng trang) — không tải lại trang.
  useEffect(() => {
    if (!shouldSyncUrlRef.current) return;
    const url = new URL(window.location.href);
    url.searchParams.set('muc', 'so');
    if (notebook && page) { url.searchParams.set('so', notebook.id); url.searchParams.set('trang', String(page.number)); }
    else { url.searchParams.delete('so'); url.searchParams.delete('trang'); }
    window.history.replaceState(window.history.state, '', url);
  }, [notebook, page]);

  // In: dựng tờ in → gọi hộp thoại in của trình duyệt → dọn khi in xong.
  useEffect(() => {
    if (!printScope) return;
    if (settingsRef.current) settingsRef.current.open = false;
    const done = () => setPrintScope(null);
    window.addEventListener('afterprint', done);
    const frame = window.requestAnimationFrame(() => window.print());
    return () => { window.removeEventListener('afterprint', done); window.cancelAnimationFrame(frame); };
  }, [printScope]);

  const dispatchInk = useCallback((action: InkAction) => {
    if (!page) return;
    setInkByPage((current) => ({ ...current, [page.id]: inkReducer(current[page.id] ?? EMPTY_INK, action) }));
  }, [page]);

  const eraseStart = useCallback(() => dispatchInk({ type: 'erase-begin' }), [dispatchInk]);
  const erase = useCallback((cellId: string, points: InkPoint[], aspect: number) => {
    dispatchInk({ type: 'erase', shouldErase: (stroke) => stroke.cellId === cellId && points.some((point) => strokeHitsPoint(stroke, point, ERASER_RADIUS, aspect)) });
  }, [dispatchInk]);
  // Vòng tròn cục tẩy đi theo bút / ngón tay / chuột (iPad không có con trỏ chuột → phải tự vẽ). Cập nhật thẳng style,
  // không qua state, để không vẽ lại cả trang ở mỗi lần di chuyển.
  const eraserCursorRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (tool !== 'eraser') return;
    const cursor = eraserCursorRef.current;
    if (!cursor) return;
    let isPressed = false;
    const overWritingArea = (event: PointerEvent) => Boolean((event.target as Element | null)?.closest?.('.nb-paper'));
    const place = (event: PointerEvent) => {
      // Chuột / bút rê (hover) thì hiện cả khi chưa bấm; chạm tay chỉ hiện lúc đang quẹt.
      const isVisible = overWritingArea(event) && (isPressed || event.pointerType !== 'touch');
      cursor.style.opacity = isVisible ? '1' : '0';
      cursor.style.transform = `translate(${event.clientX}px, ${event.clientY}px) translate(-50%, -50%) scale(${isPressed ? 1 : 0.9})`;
    };
    const down = (event: PointerEvent) => { isPressed = true; place(event); };
    const up = (event: PointerEvent) => { isPressed = false; place(event); if (event.pointerType === 'touch') cursor.style.opacity = '0'; };
    window.addEventListener('pointermove', place, { passive: true });
    window.addEventListener('pointerdown', down, { passive: true });
    window.addEventListener('pointerup', up, { passive: true });
    window.addEventListener('pointercancel', up, { passive: true });
    return () => {
      window.removeEventListener('pointermove', place);
      window.removeEventListener('pointerdown', down);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      cursor.style.opacity = '0';
    };
  }, [tool]);

  // Nhấc bút / tay ở BẤT KỲ đâu → kết thúc lần quẹt tẩy (lần quẹt trượt hết thì bỏ bước Hoàn tác rỗng).
  useEffect(() => {
    if (tool !== 'eraser' || !page) return;
    const finish = () => {
      if (eraserPointer.end()) setInkByPage((current) => ({ ...current, [page.id]: dropEmptyEraseStep(current[page.id] ?? EMPTY_INK) }));
    };
    window.addEventListener('pointerup', finish);
    window.addEventListener('pointercancel', finish);
    return () => { window.removeEventListener('pointerup', finish); window.removeEventListener('pointercancel', finish); };
  }, [tool, page]);

  const sendProgress = useCallback(async (pageId: string, action: 'start' | 'complete' | 'uncomplete') => {
    try {
      const result = await postJson<{ progress: PageProgress }>('/api/writing/notebook', { pageId, action });
      setProgress((current) => ({ ...current, [pageId]: result.progress }));
      return true;
    } catch {
      setMessage('Chưa lưu được tiến độ — kiểm tra mạng rồi thử lại nhé.');
      return false;
    }
  }, []);

  const handleStroke = useCallback((stroke: InkStroke) => {
    dispatchInk({ type: 'add', stroke });
    // Nét ĐẦU TIÊN trên trang mới là "đã bắt đầu" (mở trang không tính). Mỗi trang gửi một lần mỗi phiên.
    if (page && !startedRef.current.has(page.id)) {
      startedRef.current.add(page.id);
      void sendProgress(page.id, 'start');
    }
  }, [dispatchInk, page, sendProgress]);

  const strokesByCell = useMemo(() => {
    const map = new Map<string, InkStroke[]>();
    for (const stroke of ink.strokes) map.set(stroke.cellId, [...(map.get(stroke.cellId) ?? []), stroke]);
    return map;
  }, [ink.strokes]);
  // Mảng rỗng dùng chung → ô chưa có nét không vẽ lại khi ô khác có nét mới.
  const noStrokes = useMemo<InkStroke[]>(() => [], []);

  function openNotebook(id: NotebookId) {
    const target = notebooks.find((item) => item.id === id);
    if (!target) return;
    // Mở lại ở trang luyện gần nhất của sổ (nếu có), không thì trang đầu.
    const recent = target.pages.map((item, index) => ({ index, at: progress[item.id]?.lastPracticedAt ?? '' })).filter((item) => item.at).sort((left, right) => right.at.localeCompare(left.at))[0];
    shouldSyncUrlRef.current = true;
    setNotebookId(id);
    setPageIndex(recent?.index ?? 0);
    setActiveCell(null);
    setMessage(null);
  }

  function goTo(index: number) {
    if (!notebook) return;
    shouldSyncUrlRef.current = true;
    setPageIndex(Math.min(Math.max(index, 0), notebook.pages.length - 1));
    setActiveCell(null);
    setMessage(null);
    document.getElementById('so-luyen-viet')?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }

  async function toggleDone() {
    if (!page) return;
    const isDone = progress[page.id]?.state === 'done';
    if (await sendProgress(page.id, isDone ? 'uncomplete' : 'complete')) setMessage(isDone ? 'Đã bỏ đánh dấu "luyện xong".' : 'Đã đánh dấu trang này là luyện xong 🌸');
  }

  function clearPage() {
    if (!page || !ink.strokes.length) return;
    dispatchInk({ type: 'clear-all' });
    setMessage('Đã xoá hết nét trên trang. Bấm "Hoàn tác" nếu lỡ tay.');
  }

  const doneCount = (target: Notebook) => target.pages.filter((item) => progress[item.id]?.state === 'done').length;

  if (!notebook || !page) {
    return (
      <section id="so-luyen-viet" className="nb" aria-label="Sổ luyện viết">
        <p className="soft sm mb-2.5">Như vở tập viết: mỗi dòng một chữ — chữ mẫu, rồi các ô để đồ theo chữ mờ và tự viết. Chọn một cuốn sổ.</p>
        <div className="nb-covers">
          {notebooks.map((item) => {
            const done = doneCount(item);
            return (
              <button key={item.id} type="button" className={`nb-cover nb-cover-${item.id}`} onClick={() => openNotebook(item.id)}>
                <span className="nb-cover-label">ノート</span>
                <span className="nb-cover-glyph jp" aria-hidden="true">{item.id === 'tu-vung' ? '語' : item.pages[0].rows[0].glyph}</span>
                <b className="nb-cover-title">Sổ {item.title}</b>
                <span className="sm soft">{item.description}</span>
                <span className="nb-cover-progress">
                  <span className="nb-bar" aria-hidden="true"><span style={{ width: `${(done / item.pages.length) * 100}%` }} /></span>
                  <span className="tiny">{done}/{item.pages.length} trang đã luyện xong</span>
                </span>
              </button>
            );
          })}
        </div>
      </section>
    );
  }

  const columns = gridColumns(cellsWidth, CELL_PX[settings.cellSize], CELL_GAP_PX);
  const filled = fillRepeats(columns);
  // Cỡ ô thật của sổ chữ — ô từ vựng cao đúng bằng cỡ này để các sổ trông như nhau.
  const unitPx = cellsWidth > 0 ? Math.floor((cellsWidth - (columns - 1) * CELL_GAP_PX) / columns) : CELL_PX[settings.cellSize];
  const layout = { columns, rows: filled.rows, unitPx, repeats: settings.repeats === 'auto' ? filled.repeats : settings.repeats };
  const pageProgress = progress[page.id];
  const sizeClass = `nb-size-${settings.cellSize}`;
  return (
    <section id="so-luyen-viet" className={`nb ${sizeClass} ${tool === 'eraser' ? 'is-erasing' : ''}`} aria-label={`Sổ ${notebook.title}`}>
      <div className="nb-head">
        <button type="button" className="btn ghost sm" onClick={() => { shouldSyncUrlRef.current = true; setNotebookId(null); }}>← Các cuốn sổ</button>
        <div className="nb-head-title">
          <b>Sổ {notebook.title}</b>
          <span className="tiny muted">{doneCount(notebook)}/{notebook.pages.length} trang đã luyện xong</span>
        </div>
        <span className="nb-bar nb-head-bar" aria-hidden="true"><span style={{ width: `${(doneCount(notebook) / notebook.pages.length) * 100}%` }} /></span>
      </div>

      <details className="nb-toc">
        <summary>Mục lục · trang {page.number}/{notebook.pages.length}</summary>
        <ol>
          {notebook.pages.map((item, index) => {
            const state = progress[item.id]?.state ?? 'new';
            return (
              <li key={item.id}>
                <button type="button" className={index === pageIndex ? 'on' : ''} aria-current={index === pageIndex ? 'page' : undefined} onClick={() => goTo(index)}>
                  <span className="nb-toc-num">{item.number}</span>
                  <span className="nb-toc-title jp">{item.title}</span>
                  <span className={`nb-state ${state}`}>{state === 'done' ? '✓ Xong' : state === 'started' ? 'Đang luyện' : ''}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </details>

      <div className="nb-tools" role="toolbar" aria-label="Công cụ viết">
        <span className="nb-tool-switch" role="group" aria-label="Công cụ">
          <button type="button" className={tool === 'pen' ? 'on' : ''} aria-pressed={tool === 'pen'} onClick={() => setTool('pen')}>✏️ Viết</button>
          <button type="button" className={tool === 'eraser' ? 'on' : ''} aria-pressed={tool === 'eraser'} onClick={() => setTool('eraser')}
            title="Quẹt qua nét viết sai để xoá cả nét. Hoàn tác để lấy lại.">🧽 Tẩy</button>
        </span>
        <button type="button" className="btn ghost sm nb-icon-btn" onClick={() => dispatchInk({ type: 'undo' })} disabled={!ink.past.length}
          aria-label="Hoàn tác" title="Hoàn tác"><HistoryIcon direction="undo" /></button>
        <button type="button" className="btn ghost sm nb-icon-btn" onClick={() => dispatchInk({ type: 'redo' })} disabled={!ink.future.length}
          aria-label="Làm lại" title="Làm lại"><HistoryIcon direction="redo" /></button>
        <button type="button" className="btn ghost sm" onClick={clearPage} disabled={!ink.strokes.length}>🗑 Xoá hết</button>
        {/* Trạng thái bút: nhãn, KHÔNG phải nút (chạm nhầm / tì tay vào không được tắt chống tì tay). Đổi chế độ ở ⚙️ Tuỳ chỉnh. */}
        {isPenOnly(pen) ? (
          <span className="nb-pen-chip" role="status" title="Đang chỉ nhận nét bút — chạm tay vào ô viết không vẽ. Đổi ở ⚙️ Tuỳ chỉnh → Bút cảm ứng.">✏️ Chỉ nhận bút</span>
        ) : pen.mode === 'all' ? (
          <button type="button" className="btn ghost sm nb-pen-chip is-touch" onClick={() => penInput.setMode('auto')}
            title="Đang nhận cả chạm tay. Bấm để quay về tự nhận bút (bỏ qua chạm tay khi dùng bút).">✋ Đang nhận cả tay · bấm để chỉ nhận bút</button>
        ) : null}
        <details className="nb-settings" ref={settingsRef}>
          <summary className="btn ghost sm">⚙️ Tuỳ chỉnh</summary>
          <div className="nb-settings-panel">
            {notebook.id === 'tu-vung' ? (
              <label className="nb-setting"><span>Số dòng viết mỗi từ</span>
                <select value={settings.vocabLines} onChange={(event) => setSettings((current) => ({ ...current, vocabLines: event.target.value === 'auto' ? 'auto' : Number(event.target.value) as VocabLines }))}>
                  <option value="auto">Tự động ({layout.rows} dòng)</option>
                  {VOCAB_LINE_OPTIONS.map((value) => <option key={value} value={value}>{value} dòng</option>)}
                </select></label>
            ) : (
              <label className="nb-setting"><span>Số ô mỗi chữ</span>
                <select value={settings.repeats} onChange={(event) => setSettings((current) => ({ ...current, repeats: event.target.value === 'auto' ? 'auto' : Number(event.target.value) }))}>
                  <option value="auto">Đầy khung ({layout.rows} hàng · {fillRepeats(layout.columns).repeats} ô)</option>
                  {REPEAT_OPTIONS.map((value) => <option key={value} value={value}>{value} ô</option>)}
                </select></label>
            )}
            <label className="nb-setting"><span>Chữ mờ</span>
              <select value={settings.ghost} onChange={(event) => setSettings((current) => ({ ...current, ghost: event.target.value as GhostMode }))}>
                {(Object.keys(GHOST_LABELS) as GhostMode[]).map((value) => <option key={value} value={value}>{GHOST_LABELS[value]}</option>)}
              </select></label>
            {notebook.id === 'tu-vung' ? (
              <label className="nb-setting"><span>Từ vựng viết bằng</span>
                <select value={settings.vocabForm} onChange={(event) => setSettings((current) => ({ ...current, vocabForm: event.target.value as VocabForm }))}>
                  <option value="kana">Kana (hiragana / katakana)</option>
                  <option value="kanji">Chữ Kanji (từ có Kanji)</option>
                </select>
              </label>
            ) : null}
            <label className="nb-setting"><span>Cỡ ô</span>
              <select value={settings.cellSize} onChange={(event) => setSettings((current) => ({ ...current, cellSize: event.target.value as CellSize }))}>
                {(Object.keys(SIZE_LABELS) as CellSize[]).map((value) => <option key={value} value={value}>{SIZE_LABELS[value]}</option>)}
              </select></label>
            <label className="nb-setting"><span>Bút cảm ứng (iPad, máy tính bảng)</span>
              <select value={pen.mode} onChange={(event) => { const next = event.target.value as PenMode; penInput.setMode(next); if (next === 'all') penInput.forgetPen(); }}>
                <option value="auto">Tự nhận — dùng bút rồi thì bỏ qua chạm tay</option>
                <option value="pen">Chỉ nhận bút</option>
                <option value="all">Nhận cả bút và tay</option>
              </select></label>
            <PenDiagnostics />
            <label className="nb-setting nb-check"><input type="checkbox" checked={settings.showGrid} onChange={(event) => setSettings((current) => ({ ...current, showGrid: event.target.checked }))} /> Đường kẻ hướng dẫn trong ô</label>
            <div className="nb-setting"><span>In / lưu PDF (khổ A4, ô trống để viết tay)</span>
              <span className="row wrap" style={{ gap: 6 }}>
                <button type="button" className="btn ghost sm" onClick={() => setPrintScope('page')}>🖨️ In trang này</button>
                <button type="button" className="btn ghost sm" onClick={() => setPrintScope('notebook')}>🖨️ In cả sổ ({notebook.pages.length} trang)</button>
              </span></div>
          </div>
        </details>
      </div>

      <article className="nb-paper" ref={paperRef}>
        <header className="nb-paper-head">
          <div>
            <h2 className="jp">{page.title}</h2>
            <p className="tiny muted">{page.subtitle}</p>
          </div>
          <span className="nb-page-no">Trang {page.number}/{notebook.pages.length}</span>
        </header>
        {page.rows.map((row, rowIndex) => row.word ? (
          <WordLinesRow key={`${page.id}-${rowIndex}`} word={(settings.vocabForm === 'kanji' && row.word.kanji ? row.word.kanji : row.word.kana).join('')}
            reading={settings.vocabForm === 'kanji' && row.word.kanji ? row.word.kana.join('') : row.word.kanji?.join('') ?? ''} meaning={row.meaning ?? ''}
            speech={row.speech}
            rowId={`${page.id}-${rowIndex}-${settings.vocabForm === 'kanji' && row.word.kanji ? 'k' : 'h'}`}
            width={cellsWidth} lineHeight={layout.unitPx} autoRows={layout.rows} setting={settings.vocabLines} ghost={settings.ghost} showGrid={settings.showGrid}
            activeCell={activeCell} strokesByCell={strokesByCell} noStrokes={noStrokes} onStroke={handleStroke} onFocusCell={setActiveCell} eraser={{ tool, erase, eraseStart }} />
        ) : (
          <NotebookRowView key={`${page.id}-${rowIndex}`} row={row} rowId={`${page.id}-${rowIndex}`} repeats={layout.repeats} columns={layout.columns} ghost={settings.ghost}
            showGrid={settings.showGrid} guide={[...row.glyph].length === 1 ? guides[row.glyph] ?? null : null} activeCell={activeCell}
            strokesByCell={strokesByCell} noStrokes={noStrokes} onStroke={handleStroke} onFocusCell={setActiveCell} eraser={{ tool, erase, eraseStart }} />
        ))}
      </article>

      <div className="nb-foot">
        <button type="button" className="btn ghost" onClick={() => goTo(pageIndex - 1)} disabled={pageIndex === 0}>← Trang trước</button>
        <button type="button" className={`btn ${pageProgress?.state === 'done' ? 'ghost' : ''}`} onClick={toggleDone} aria-pressed={pageProgress?.state === 'done'}>
          {pageProgress?.state === 'done' ? '✓ Đã luyện xong · bỏ đánh dấu' : 'Đã luyện xong trang này'}
        </button>
        <button type="button" className="btn ghost" onClick={() => goTo(pageIndex + 1)} disabled={pageIndex >= notebook.pages.length - 1}>Trang sau →</button>
      </div>
      <p className="tiny muted center mt-2" role="status">
        {message ?? (pageProgress?.lastPracticedAt ? `Luyện gần nhất: ${formatPracticedAt(pageProgress.lastPracticedAt)}` : 'Nét viết chỉ giữ trong lần mở này; tiến độ lưu khi bạn viết và khi bấm "Đã luyện xong".')}
      </p>

      {tool === 'eraser' ? createPortal(
        <div ref={eraserCursorRef} className="nb-eraser-cursor" aria-hidden="true"
          style={{ width: Math.round(2 * ERASER_RADIUS * layout.unitPx), height: Math.round(2 * ERASER_RADIUS * layout.unitPx) }} />,
        document.body,
      ) : null}
      {printScope ? createPortal(
        <PrintSheets pages={printScope === 'notebook' ? notebook.pages : [page]} notebookTitle={notebook.title} repeats={settings.repeats === 'auto' ? PRINT_AUTO_REPEATS : settings.repeats}
          vocabLines={settings.vocabLines} vocabForm={settings.vocabForm} ghost={settings.ghost} showGrid={settings.showGrid} guides={guides} />,
        document.body,
      ) : null}
    </section>
  );
}

type EraserProps = { tool: 'pen' | 'eraser'; erase: (cellId: string, points: InkPoint[], aspect: number) => void; eraseStart: () => void };

function NotebookRowView({ row, rowId, repeats, columns, ghost, showGrid, guide, activeCell, strokesByCell, noStrokes, onStroke, onFocusCell, eraser }: {
  row: NotebookPage['rows'][number]; rowId: string; repeats: number; columns: number; ghost: GhostMode; showGrid: boolean; guide: StrokeOrderData | null;
  activeCell: string | null; strokesByCell: Map<string, InkStroke[]>; noStrokes: InkStroke[];
  onStroke: (stroke: InkStroke) => void; onFocusCell: (cellId: string) => void; eraser: EraserProps;
}) {
  const description = [row.glyph, row.label, row.meaning, row.reading, row.strokeCount ? `${row.strokeCount} nét` : ''].filter(Boolean).join(' · ');
  return (
    // Vùng viết chỉ có ô: không chữ, không nút → chạm / vuốt trên điện thoại không bôi chọn nhầm thứ khác.
    <section className="nb-row" aria-label={`Luyện chữ ${description}`}>
      {/* Đúng `columns` cột, ô giãn đều cho kín bề rộng khung (không chừa khoảng trống bên phải). */}
      <div className="nb-cells" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {/* Ô đầu dòng: chữ mẫu (đậm, không viết vào) — rồi các ô lặp lại trên cùng dòng. */}
        {/* Ô mẫu + nút 🔊 ở góc (bấm nghe đọc chữ) — nút nằm trong ô mẫu nên không che chỗ viết. */}
        <span className="nb-sample-wrap">
          <svg className="nb-cell nb-cell-sample" viewBox="0 0 100 100" role="img"
            aria-label={guide ? `Chữ mẫu ${row.glyph}: ${guide.strokes.length} nét, có đánh số thứ tự` : `Chữ mẫu ${row.glyph}`}
            onContextMenu={(event) => event.preventDefault()}>
            {showGrid ? <CellGrid /> : null}
            <CellModel glyph={row.glyph} guide={guide} />
          </svg>
          <AudioButton text={row.speech} label={`Nghe ${row.glyph}`} className="nb-listen" />
        </span>
        {Array.from({ length: repeats }, (_, index) => {
          const cellId = `${rowId}-${index}`;
          return (
            <NotebookCell key={cellId} cellId={cellId} glyph={row.glyph} hasGhost={isGhostCell(index, repeats, ghost)} guide={guide} showGrid={showGrid}
              isActive={activeCell === cellId} strokes={strokesByCell.get(cellId) ?? noStrokes} onStroke={onStroke} onFocusCell={onFocusCell}
              tool={eraser.tool} onErase={eraser.erase} onEraseStart={eraser.eraseStart}
              label={`Ô ${index + 1} luyện chữ ${row.glyph}${isGhostCell(index, repeats, ghost) ? ' (có chữ mờ)' : ''}`} />
          );
        })}
      </div>
    </section>
  );
}

/** Tờ in A4: chữ mẫu + ô có chữ mờ / ô trống theo tuỳ chỉnh — để viết tay trên giấy (không in nét đã viết trên màn hình). */
function PrintSheets({ pages, notebookTitle, repeats, vocabLines, vocabForm, ghost, showGrid, guides }: {
  pages: NotebookPage[]; notebookTitle: string; repeats: number; vocabLines: VocabLines; vocabForm: VocabForm; ghost: GhostMode; showGrid: boolean;
  guides: Record<string, StrokeOrderData>;
}) {
  return (
    <div className="nb-print-root" aria-hidden="true">
      {pages.map((page) => (
        <section key={page.id} className="nb-sheet">
          <header className="nb-sheet-head"><b>Sổ {notebookTitle} · <span className="jp">{page.title}</span></b><span>{page.subtitle} · Trang {page.number}</span></header>
          {page.rows.map((row, rowIndex) => {
            if (row.word) {
              const word = (vocabForm === 'kanji' && row.word.kanji ? row.word.kanji : row.word.kana).join('');
              const reading = vocabForm === 'kanji' && row.word.kanji ? row.word.kana.join('') : row.word.kanji?.join('') ?? '';
              const { lines, ghostLines } = wordLines({ setting: vocabLines, autoRows: 2, ghost });
              // Dòng in: 140 mm × 12 mm → tỉ lệ ≈ 11,7.
              const aspect = 140 / 12;
              return (
                <div key={rowIndex} className="nb-sheet-row nb-sheet-vocab">
                  <div className="nb-sheet-vocab-label"><b className="jp">{word}</b>{reading ? <span className="jp">{reading}</span> : null}<span>{row.meaning}</span></div>
                  <div className="nb-sheet-vocab-lines">
                    {Array.from({ length: lines }, (_, index) => (
                      <svg key={index} className="nb-sheet-line" viewBox={`0 0 ${100 * aspect} 100`}>
                        {showGrid ? <CellGrid aspect={aspect} /> : null}
                        {index < ghostLines ? <LineGhost word={word} copies={ghostCopies(aspect, [...word].length)} /> : null}
                      </svg>
                    ))}
                  </div>
                </div>
              );
            }
            const guide = [...row.glyph].length === 1 ? guides[row.glyph] ?? null : null;
            return (
              <div key={rowIndex} className="nb-sheet-row">
                <p className="nb-sheet-caption"><b className="jp">{row.glyph}</b> {row.label}{row.meaning ? ` · ${row.meaning}` : ''}{row.reading ? ` · ${row.reading}` : ''}{row.strokeCount ? ` · ${row.strokeCount} nét` : ''}</p>
                <div className="nb-sheet-cells">
                  <svg className="nb-sheet-cell is-sample" viewBox="0 0 100 100">{showGrid ? <CellGrid /> : null}<CellGhost glyph={row.glyph} guide={guide} className="nb-model" /></svg>
                  {Array.from({ length: repeats }, (_, index) => (
                    <svg key={index} className="nb-sheet-cell" viewBox="0 0 100 100">{showGrid ? <CellGrid /> : null}{isGhostCell(index, repeats, ghost) ? <CellGhost glyph={row.glyph} guide={guide} /> : null}</svg>
                  ))}
                </div>
              </div>
            );
          })}
          <footer className="nb-sheet-foot">NekoNeko · Sổ luyện viết</footer>
        </section>
      ))}
    </div>
  );
}

const VOCAB_LABEL_PX = 176;
const VOCAB_NARROW_PX = 560;

/**
 * Dòng từ vựng kiểu vở kẻ dòng: ô nhỏ đầu dòng (từ, cách đọc, nghĩa tiếng Việt) rồi các dòng kẻ chạy hết bề ngang
 * để tự viết. Màn hẹp (điện thoại): ô chữ ở trên, dòng kẻ ở dưới. Mỗi dòng là một vùng vẽ riêng (toạ độ chuẩn hoá).
 */
function WordLinesRow({ word, reading, meaning, speech, rowId, width, lineHeight, autoRows, setting, ghost, showGrid, activeCell, strokesByCell, noStrokes, onStroke, onFocusCell, eraser }: {
  word: string; reading: string; meaning: string; speech: string; rowId: string; width: number; lineHeight: number; autoRows: number; setting: VocabLines;
  ghost: GhostMode; showGrid: boolean; activeCell: string | null; strokesByCell: Map<string, InkStroke[]>; noStrokes: InkStroke[];
  onStroke: (stroke: InkStroke) => void; onFocusCell: (cellId: string) => void; eraser: EraserProps;
}) {
  const isNarrow = width > 0 && width < VOCAB_NARROW_PX;
  const lineWidth = width > 0 ? (isNarrow ? width : width - VOCAB_LABEL_PX - 14) : lineHeight * 10;
  const aspect = Math.max(2, Math.round((lineWidth / Math.max(40, lineHeight)) * 100) / 100);
  const { lines, ghostLines } = wordLines({ setting, autoRows, ghost });
  const copies = ghostCopies(aspect, [...word].length);
  const label = `${word}${reading ? ` (${reading})` : ''} — ${meaning}`;
  return (
    <section className={`nb-row nb-vocab-row ${isNarrow ? 'is-narrow' : ''}`} aria-label={`Luyện viết từ ${label}`}>
      <div className="nb-vocab-label">
        <AudioButton text={speech} label={`Nghe ${word}`} className="nb-listen" />
        <b className="jp nb-vocab-word">{word}</b>
        {reading ? <span className="jp nb-vocab-reading">{reading}</span> : null}
        <span className="nb-vocab-meaning">{meaning}</span>
      </div>
      <div className="nb-vocab-lines">
        {Array.from({ length: lines }, (_, index) => {
          const cellId = `${rowId}-dong-${index}`;
          return (
            <NotebookCell key={cellId} cellId={cellId} glyph={word} aspect={aspect} ghostCopies={copies} hasGhost={index < ghostLines} guide={null}
              showGrid={showGrid} isActive={activeCell === cellId} strokes={strokesByCell.get(cellId) ?? noStrokes} onStroke={onStroke}
              onFocusCell={onFocusCell} tool={eraser.tool} onErase={eraser.erase} onEraseStart={eraser.eraseStart} label={`Dòng ${index + 1} để viết từ ${label}${index < ghostLines ? ' — có chữ mờ' : ''}`} />
          );
        })}
      </div>
    </section>
  );
}

/** Chẩn đoán bút / chạm: 8 lần chạm gần nhất vào ô viết — để chụp màn hình gửi khi vẫn bị dính tì tay. */
function PenDiagnostics() {
  const log = useSyncExternalStore(pointerDiagnostics.subscribe, pointerDiagnostics.getSnapshot, pointerDiagnostics.getServerSnapshot);
  const pen = useSyncExternalStore(penInput.subscribe, penInput.getSnapshot, penInput.getServerSnapshot);
  const label = (decision: string) => decision === 'ignore' ? 'bỏ qua' : decision === 'replace' ? 'nhận (huỷ nét tay)' : 'nhận';
  return (
    <details className="nb-setting nb-diagnostics">
      <summary>🔍 Chẩn đoán bút / chạm</summary>
      <p className="tiny muted" style={{ fontWeight: 400 }}>
        Chế độ: {pen.mode === 'auto' ? 'Tự nhận' : pen.mode === 'pen' ? 'Chỉ nhận bút' : 'Nhận cả tay'} · máy {pen.penSeen ? 'đã' : 'chưa'} dùng bút.
        Vẫn bị dính tì tay? Viết vài nét, chạm tay thử, rồi chụp màn hình bảng này gửi lại.
      </p>
      {log.length ? (
        <table className="nb-diag-table">
          <thead><tr><th>Loại</th><th>Cỡ</th><th>Lực</th><th>Chính</th><th>Kết quả</th></tr></thead>
          <tbody>
            {log.map((entry) => (
              <tr key={entry.at + entry.pointerType + entry.width} className={entry.decision === 'ignore' ? 'is-ignored' : ''}>
                <td>{entry.pointerType}</td><td>{entry.width}×{entry.height}</td><td>{entry.pressure}</td><td>{entry.isPrimary ? 'có' : 'không'}</td><td>{label(entry.decision)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : <p className="tiny muted" style={{ fontWeight: 400 }}>Chưa có lần chạm nào vào ô viết.</p>}
    </details>
  );
}

/** Mũi tên cong Hoàn tác / Làm lại — vẽ SVG cho rõ ở mọi font (ký tự ↶ ↷ hiển thị rất nhỏ trên nhiều máy). */
function HistoryIcon({ direction }: { direction: 'undo' | 'redo' }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true" style={direction === 'redo' ? { transform: 'scaleX(-1)' } : undefined}>
      <path d="M9 14 4 9l5-5" />
      <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
    </svg>
  );
}
