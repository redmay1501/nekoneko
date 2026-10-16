'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { preloadStrokeOrders, type StrokeOrderData } from '@/features/learning/stroke-order';
import { EMPTY_INK, type InkAction, inkReducer, type InkState, type InkStroke } from '@/features/writing/ink';
import {
  DEFAULT_REPEATS, type GhostMode, isGhostCell, type Notebook, type NotebookId, type NotebookPage, REPEAT_OPTIONS,
} from '@/features/writing/notebook';
import type { PageProgress } from '@/features/writing/notebook-progress';
import { postJson } from '@/lib/api/api-client';
import { CellGhost, CellGrid, CellModel, NotebookCell } from './NotebookCell';

type CellSize = 'nho' | 'vua' | 'lon';
interface NotebookSettings {
  repeats: number;
  ghost: GhostMode;
  showGrid: boolean;
  cellSize: CellSize;
}
const DEFAULT_SETTINGS: NotebookSettings = { repeats: DEFAULT_REPEATS, ghost: 'half', showGrid: true, cellSize: 'vua' };
const SETTINGS_KEY = 'neko-writing-notebook-settings';
const GHOST_LABELS: Record<GhostMode, string> = { all: 'Đồ chữ mờ', half: 'Nửa đồ, nửa tự viết', none: 'Tự viết' };
const SIZE_LABELS: Record<CellSize, string> = { nho: 'Nhỏ', vua: 'Vừa', lon: 'Lớn' };

/** Cùng múi giờ ở server và trình duyệt → không lệch khi hydrate. */
function formatPracticedAt(value: string): string {
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(value));
}

function readSettings(): NotebookSettings {
  try {
    const saved = JSON.parse(window.localStorage.getItem(SETTINGS_KEY) ?? 'null') as Partial<NotebookSettings> | null;
    if (!saved) return DEFAULT_SETTINGS;
    return {
      repeats: (REPEAT_OPTIONS as readonly number[]).includes(saved.repeats ?? 0) ? saved.repeats! : DEFAULT_SETTINGS.repeats,
      ghost: saved.ghost && saved.ghost in GHOST_LABELS ? saved.ghost : DEFAULT_SETTINGS.ghost,
      showGrid: typeof saved.showGrid === 'boolean' ? saved.showGrid : DEFAULT_SETTINGS.showGrid,
      cellSize: saved.cellSize && saved.cellSize in SIZE_LABELS ? saved.cellSize : DEFAULT_SETTINGS.cellSize,
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
  // Chỉ ghi URL sau khi người học tự chọn sổ / lật trang — tab đang ẩn không được đổi ?muc= của tab khác.
  const shouldSyncUrlRef = useRef(false);
  const settingsRef = useRef<HTMLDetailsElement>(null);

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
                <span className="nb-cover-glyph jp" aria-hidden="true">{item.pages[0].rows[0].glyph}</span>
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

  const pageProgress = progress[page.id];
  const sizeClass = `nb-size-${settings.cellSize}`;
  return (
    <section id="so-luyen-viet" className={`nb ${sizeClass}`} aria-label={`Sổ ${notebook.title}`}>
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
        <button type="button" className="btn ghost sm" onClick={() => dispatchInk({ type: 'undo' })} disabled={!ink.strokes.length && !ink.cleared?.length}>↶ Hoàn tác</button>
        <button type="button" className="btn ghost sm" onClick={() => dispatchInk({ type: 'redo' })} disabled={!ink.undone.length}>↷ Làm lại</button>
        <button type="button" className="btn ghost sm" onClick={() => activeCell && dispatchInk({ type: 'clear-cell', cellId: activeCell })}
          disabled={!activeCell || !strokesByCell.get(activeCell)?.length}>Xoá ô đang viết</button>
        <button type="button" className="btn ghost sm" onClick={clearPage} disabled={!ink.strokes.length}>🗑 Xoá hết</button>
        <details className="nb-settings" ref={settingsRef}>
          <summary className="btn ghost sm">⚙️ Tuỳ chỉnh</summary>
          <div className="nb-settings-panel">
            <label className="nb-setting"><span>Số ô mỗi chữ</span>
              <select value={settings.repeats} onChange={(event) => setSettings((current) => ({ ...current, repeats: Number(event.target.value) }))}>
                {REPEAT_OPTIONS.map((value) => <option key={value} value={value}>{value} ô</option>)}
              </select></label>
            <label className="nb-setting"><span>Chữ mờ</span>
              <select value={settings.ghost} onChange={(event) => setSettings((current) => ({ ...current, ghost: event.target.value as GhostMode }))}>
                {(Object.keys(GHOST_LABELS) as GhostMode[]).map((value) => <option key={value} value={value}>{GHOST_LABELS[value]}</option>)}
              </select></label>
            <label className="nb-setting"><span>Cỡ ô</span>
              <select value={settings.cellSize} onChange={(event) => setSettings((current) => ({ ...current, cellSize: event.target.value as CellSize }))}>
                {(Object.keys(SIZE_LABELS) as CellSize[]).map((value) => <option key={value} value={value}>{SIZE_LABELS[value]}</option>)}
              </select></label>
            <label className="nb-setting nb-check"><input type="checkbox" checked={settings.showGrid} onChange={(event) => setSettings((current) => ({ ...current, showGrid: event.target.checked }))} /> Đường kẻ hướng dẫn trong ô</label>
            <div className="nb-setting"><span>In / lưu PDF (khổ A4, ô trống để viết tay)</span>
              <span className="row wrap" style={{ gap: 6 }}>
                <button type="button" className="btn ghost sm" onClick={() => setPrintScope('page')}>🖨️ In trang này</button>
                <button type="button" className="btn ghost sm" onClick={() => setPrintScope('notebook')}>🖨️ In cả sổ ({notebook.pages.length} trang)</button>
              </span></div>
          </div>
        </details>
      </div>

      <article className="nb-paper">
        <header className="nb-paper-head">
          <div>
            <h2 className="jp">{page.title}</h2>
            <p className="tiny muted">{page.subtitle}</p>
          </div>
          <span className="nb-page-no">Trang {page.number}/{notebook.pages.length}</span>
        </header>
        {page.rows.map((row, rowIndex) => (
          <NotebookRowView key={`${page.id}-${rowIndex}`} row={row} rowId={`${page.id}-${rowIndex}`} repeats={settings.repeats} ghost={settings.ghost}
            showGrid={settings.showGrid} guide={[...row.glyph].length === 1 ? guides[row.glyph] ?? null : null} activeCell={activeCell}
            strokesByCell={strokesByCell} noStrokes={noStrokes} onStroke={handleStroke} onFocusCell={setActiveCell} />
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

      {printScope ? createPortal(
        <PrintSheets pages={printScope === 'notebook' ? notebook.pages : [page]} notebookTitle={notebook.title} repeats={settings.repeats} ghost={settings.ghost} showGrid={settings.showGrid} guides={guides} />,
        document.body,
      ) : null}
    </section>
  );
}

function NotebookRowView({ row, rowId, repeats, ghost, showGrid, guide, activeCell, strokesByCell, noStrokes, onStroke, onFocusCell }: {
  row: NotebookPage['rows'][number]; rowId: string; repeats: number; ghost: GhostMode; showGrid: boolean; guide: StrokeOrderData | null;
  activeCell: string | null; strokesByCell: Map<string, InkStroke[]>; noStrokes: InkStroke[];
  onStroke: (stroke: InkStroke) => void; onFocusCell: (cellId: string) => void;
}) {
  const description = [row.glyph, row.label, row.meaning, row.reading, row.strokeCount ? `${row.strokeCount} nét` : ''].filter(Boolean).join(' · ');
  return (
    // Vùng viết chỉ có ô: không chữ, không nút → chạm / vuốt trên điện thoại không bôi chọn nhầm thứ khác.
    <section className="nb-row" aria-label={`Luyện chữ ${description}`}>
      <div className="nb-cells">
        {/* Ô đầu dòng: chữ mẫu (đậm, không viết vào) — rồi các ô lặp lại trên cùng dòng. */}
        <svg className="nb-cell nb-cell-sample" viewBox="0 0 100 100" role="img"
          aria-label={guide ? `Chữ mẫu ${row.glyph}: ${guide.strokes.length} nét, có đánh số thứ tự` : `Chữ mẫu ${row.glyph}`}
          onContextMenu={(event) => event.preventDefault()}>
          {showGrid ? <CellGrid /> : null}
          <CellModel glyph={row.glyph} guide={guide} />
        </svg>
        {Array.from({ length: repeats }, (_, index) => {
          const cellId = `${rowId}-${index}`;
          return (
            <NotebookCell key={cellId} cellId={cellId} glyph={row.glyph} hasGhost={isGhostCell(index, repeats, ghost)} guide={guide} showGrid={showGrid}
              isActive={activeCell === cellId} strokes={strokesByCell.get(cellId) ?? noStrokes} onStroke={onStroke} onFocusCell={onFocusCell}
              label={`Ô ${index + 1} luyện chữ ${row.glyph}${isGhostCell(index, repeats, ghost) ? ' (có chữ mờ)' : ''}`} />
          );
        })}
      </div>
    </section>
  );
}

/** Tờ in A4: chữ mẫu + ô có chữ mờ / ô trống theo tuỳ chỉnh — để viết tay trên giấy (không in nét đã viết trên màn hình). */
function PrintSheets({ pages, notebookTitle, repeats, ghost, showGrid, guides }: {
  pages: NotebookPage[]; notebookTitle: string; repeats: number; ghost: GhostMode; showGrid: boolean; guides: Record<string, StrokeOrderData>;
}) {
  return (
    <div className="nb-print-root" aria-hidden="true">
      {pages.map((page) => (
        <section key={page.id} className="nb-sheet">
          <header className="nb-sheet-head"><b>Sổ {notebookTitle} · <span className="jp">{page.title}</span></b><span>{page.subtitle} · Trang {page.number}</span></header>
          {page.rows.map((row, rowIndex) => {
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
