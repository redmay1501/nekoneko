'use client';

import { memo, type PointerEvent, useCallback, useRef, useState } from 'react';
import { activeStrokes, decidePointer, penInput } from '@/features/writing/pen-input';
import { type InkPoint, type InkStroke, normalizePoint, shouldAddPoint, strokePath } from '@/features/writing/ink';
import { STROKE_ORDER_BOX, type StrokeOrderData } from '@/features/learning/stroke-order';

interface NotebookCellProps {
  cellId: string;
  glyph: string;
  /** Có chữ mờ để đồ theo. */
  hasGhost: boolean;
  /** Nét KanjiVG của chữ (nếu có) — chữ mờ vẽ đúng dáng nét viết tay; không có thì dùng font. */
  guide: StrokeOrderData | null;
  showGrid: boolean;
  isActive: boolean;
  strokes: readonly InkStroke[];
  onStroke: (stroke: InkStroke) => void;
  onFocusCell: (cellId: string) => void;
  label: string;
  /** Ô từ vựng: rộng / cao (1 = ô vuông). Ô chữ nhật chứa cả từ; viewBox và CSS aspect-ratio cùng tỉ lệ nên nét không lệch. */
  aspect?: number;
  /** Dòng kẻ của sổ Từ vựng: chữ mờ lặp lại `ghostCopies` lần dọc dòng (thay vì một chữ giữa ô). */
  ghostCopies?: number;
}

/** Lưới ô tập viết kiểu vở Nhật: chữ thập nét đứt ở giữa (田). Ô từ vựng (chữ nhật): chỉ đường ngang giữa. */
export function CellGrid({ aspect = 1 }: { aspect?: number }) {
  if (aspect > 1) return <path className="nb-grid" d={`M3 50H${100 * aspect - 3}`} />;
  return <path className="nb-grid" d="M50 3V97M3 50H97" />;
}

/** Chữ mờ lặp lại dọc một dòng kẻ (sổ Từ vựng) — mỗi chữ ≈ LINE_GHOST_SIZE chiều cao dòng, cách nhau một chữ. */
export const LINE_GHOST_SIZE = 0.4;
export function LineGhost({ word, copies }: { word: string; copies: number }) {
  const fontSize = 100 * LINE_GHOST_SIZE;
  const step = (Math.max(1, [...word].length) + 1) * fontSize;
  return (
    <g className="nb-ghost-text">
      {Array.from({ length: copies }, (_, index) => (
        <text key={index} x={20 + index * step} y="50" dominantBaseline="central" fontSize={fontSize}>{word}</text>
      ))}
    </g>
  );
}

/** Cả từ trong một ô chữ nhật — chữ in (mờ để đồ, hoặc đậm làm mẫu), không đánh số nét. */
export function WordText({ word, aspect, className }: { word: string; aspect: number; className: 'nb-ghost-text' | 'nb-model-text' }) {
  const length = Math.max(1, [...word].length);
  const fontSize = Math.min(72, (100 * aspect * 0.9) / length);
  return <text className={className} x={50 * aspect} y="52" textAnchor="middle" dominantBaseline="central" fontSize={fontSize}>{word}</text>;
}

/** Chữ mờ: nét KanjiVG (cùng hệ toạ độ 109 → thu về 100) hoặc chữ in khi không có dữ liệu nét. */
export function CellGhost({ glyph, guide, className = 'nb-ghost' }: { glyph: string; guide: StrokeOrderData | null; className?: string }) {
  if (guide) {
    const scale = 100 / STROKE_ORDER_BOX;
    return <g className={className} transform={`scale(${scale})`}>{guide.strokes.map((path, index) => <path key={index} d={path} />)}</g>;
  }
  const isPair = [...glyph].length > 1;
  return (
    <text className={`${className}-text`} x="50" y="52" textAnchor="middle" dominantBaseline="central" fontSize={isPair ? 46 : 78}>{glyph}</text>
  );
}

/**
 * Ô giới thiệu đầu dòng: chữ mẫu vẽ từng nét theo KanjiVG, đánh số thứ tự nét ở điểm đầu mỗi nét.
 * Chữ không có dữ liệu nét (âm ghép きゃ…) → chữ in, không đánh số (không đoán thứ tự).
 */
export function CellModel({ glyph, guide }: { glyph: string; guide: StrokeOrderData | null }) {
  if (!guide) return <CellGhost glyph={glyph} guide={null} className="nb-model" />;
  const scale = 100 / STROKE_ORDER_BOX;
  return (
    <g transform={`scale(${scale})`}>
      <g className="nb-model">{guide.strokes.map((path, index) => <path key={index} d={path} />)}</g>
      <g className="nb-order-numbers">
        {guide.labels.map(([x, y], index) => <text key={index} x={x} y={y}>{index + 1}</text>)}
      </g>
    </g>
  );
}

/**
 * Một ô viết: SVG riêng (không dùng một canvas cho cả trang). Toạ độ chuẩn hoá 0–1 đo lại ở MỖI sự kiện con trỏ,
 * nét vẽ lại bằng SVG theo cỡ hiện tại → cuộn trang, đổi cỡ, xoay iPad không làm lệch nét.
 * Chuột, ngón tay và bút đều viết được; touch-action: none chỉ trong ô (cuộn trang bằng lề / chữ mẫu).
 */
function NotebookCellView({ cellId, glyph, hasGhost, guide, showGrid, isActive, strokes, onStroke, onFocusCell, label, aspect = 1, ghostCopies }: NotebookCellProps) {
  const [live, setLive] = useState<InkPoint[] | null>(null);
  const pointsRef = useRef<InkPoint[]>([]);
  const pointerRef = useRef<number | null>(null);

  function pointOf(event: PointerEvent<SVGSVGElement>): InkPoint {
    return normalizePoint(event.clientX, event.clientY, event.currentTarget.getBoundingClientRect());
  }

  // Huỷ nét đang vẽ dở của ô này mà không lưu (lòng bàn tay bị bút "giành" lại).
  const cancel = useCallback(() => {
    pointerRef.current = null;
    pointsRef.current = [];
    setLive(null);
  }, []);

  function start(event: PointerEvent<SVGSVGElement>) {
    if (event.pointerType === 'mouse' && event.button > 0) return; // chỉ nút chính của chuột
    if (event.pointerType === 'pen') penInput.notePen();
    const { mode, penSeen } = penInput.getSnapshot();
    const decision = decidePointer({ pointerType: event.pointerType, mode, penSeen, activePointerType: activeStrokes.current() });
    event.preventDefault();
    if (decision === 'ignore') return; // tì tay khi đang dùng bút, hoặc ngón thứ hai
    if (decision === 'replace') activeStrokes.cancelCurrent();
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* Safari có thể từ chối với con trỏ đã kết thúc */ }
    pointerRef.current = event.pointerId;
    activeStrokes.begin(event.pointerType, cancel);
    pointsRef.current = [pointOf(event)];
    setLive(pointsRef.current);
    onFocusCell(cellId);
  }

  function move(event: PointerEvent<SVGSVGElement>) {
    if (pointerRef.current !== event.pointerId) return;
    // Bút / chuột nhanh: lấy cả các điểm bị gộp giữa hai khung hình để nét không gãy khúc.
    const events = typeof event.nativeEvent.getCoalescedEvents === 'function' ? event.nativeEvent.getCoalescedEvents() : [];
    const rect = event.currentTarget.getBoundingClientRect();
    const candidates = events.length ? events.map((item) => normalizePoint(item.clientX, item.clientY, rect)) : [pointOf(event)];
    let changed = false;
    for (const point of candidates) {
      if (shouldAddPoint(pointsRef.current.at(-1), point)) { pointsRef.current = [...pointsRef.current, point]; changed = true; }
    }
    if (changed) setLive(pointsRef.current);
  }

  function end(event: PointerEvent<SVGSVGElement>) {
    if (pointerRef.current !== event.pointerId) return;
    pointerRef.current = null;
    activeStrokes.end(cancel);
    // pointercancel (Safari huỷ thao tác) vẫn giữ phần đã vẽ — người học thấy gì thì được nấy.
    if (pointsRef.current.length) onStroke({ cellId, points: pointsRef.current });
    pointsRef.current = [];
    setLive(null);
  }

  return (
    <svg className={`nb-cell ${ghostCopies !== undefined ? 'nb-line' : ''} ${isActive ? 'is-active' : ''}`} viewBox={`0 0 ${100 * aspect} 100`} role="img" aria-label={label}
      style={aspect !== 1 ? { aspectRatio: `${aspect} / 1` } : undefined}
      onPointerDown={start} onPointerMove={move} onPointerUp={end} onPointerCancel={end} onContextMenu={(event) => event.preventDefault()}>
      {showGrid ? <CellGrid aspect={aspect} /> : null}
      {hasGhost ? (ghostCopies !== undefined ? <LineGhost word={glyph} copies={ghostCopies} />
        : aspect !== 1 ? <WordText word={glyph} aspect={aspect} className="nb-ghost-text" /> : <CellGhost glyph={glyph} guide={guide} />) : null}
      <g className="nb-ink">
        {strokes.map((stroke, index) => <path key={index} d={strokePath(stroke.points, 100, 100 * aspect)} />)}
        {live ? <path d={strokePath(live, 100, 100 * aspect)} /> : null}
      </g>
    </svg>
  );
}

/** Chỉ vẽ lại ô có nét / trạng thái thay đổi (một trang có thể có hơn 100 ô). */
export const NotebookCell = memo(NotebookCellView, (previous, next) =>
  previous.glyph === next.glyph && previous.aspect === next.aspect && previous.ghostCopies === next.ghostCopies && previous.hasGhost === next.hasGhost && previous.guide === next.guide && previous.showGrid === next.showGrid
  && previous.isActive === next.isActive && previous.onStroke === next.onStroke && previous.onFocusCell === next.onFocusCell
  && previous.strokes.length === next.strokes.length && previous.strokes.every((stroke, index) => stroke === next.strokes[index]));
