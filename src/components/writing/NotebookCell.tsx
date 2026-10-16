'use client';

import { memo, type PointerEvent, useRef, useState } from 'react';
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
}

/** Lưới ô tập viết kiểu vở Nhật: chữ thập nét đứt ở giữa (田). */
export function CellGrid() {
  return <path className="nb-grid" d="M50 3V97M3 50H97" />;
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
 * Một ô viết: SVG riêng (không dùng một canvas cho cả trang). Toạ độ chuẩn hoá 0–1 đo lại ở MỖI sự kiện con trỏ,
 * nét vẽ lại bằng SVG theo cỡ hiện tại → cuộn trang, đổi cỡ, xoay iPad không làm lệch nét.
 * Chuột, ngón tay và bút đều viết được; touch-action: none chỉ trong ô (cuộn trang bằng lề / chữ mẫu).
 */
function NotebookCellView({ cellId, glyph, hasGhost, guide, showGrid, isActive, strokes, onStroke, onFocusCell, label }: NotebookCellProps) {
  const [live, setLive] = useState<InkPoint[] | null>(null);
  const pointsRef = useRef<InkPoint[]>([]);
  const pointerRef = useRef<number | null>(null);

  function pointOf(event: PointerEvent<SVGSVGElement>): InkPoint {
    return normalizePoint(event.clientX, event.clientY, event.currentTarget.getBoundingClientRect());
  }

  function start(event: PointerEvent<SVGSVGElement>) {
    if (event.button > 0 || pointerRef.current !== null) return; // chỉ nút chính; một ngón / một bút mỗi lúc
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    pointerRef.current = event.pointerId;
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
    if (pointsRef.current.length) onStroke({ cellId, points: pointsRef.current });
    pointsRef.current = [];
    setLive(null);
  }

  return (
    <svg className={`nb-cell ${isActive ? 'is-active' : ''}`} viewBox="0 0 100 100" role="img" aria-label={label}
      onPointerDown={start} onPointerMove={move} onPointerUp={end} onPointerCancel={end}>
      {showGrid ? <CellGrid /> : null}
      {hasGhost ? <CellGhost glyph={glyph} guide={guide} /> : null}
      <g className="nb-ink">
        {strokes.map((stroke, index) => <path key={index} d={strokePath(stroke.points)} />)}
        {live ? <path d={strokePath(live)} /> : null}
      </g>
    </svg>
  );
}

/** Chỉ vẽ lại ô có nét / trạng thái thay đổi (một trang có thể có hơn 100 ô). */
export const NotebookCell = memo(NotebookCellView, (previous, next) =>
  previous.glyph === next.glyph && previous.hasGhost === next.hasGhost && previous.guide === next.guide && previous.showGrid === next.showGrid
  && previous.isActive === next.isActive && previous.onStroke === next.onStroke && previous.onFocusCell === next.onFocusCell
  && previous.strokes.length === next.strokes.length && previous.strokes.every((stroke, index) => stroke === next.strokes[index]));
