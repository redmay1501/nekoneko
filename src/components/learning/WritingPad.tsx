'use client';

import { type PointerEvent, useEffect, useRef, useState } from 'react';
import { AudioButton } from '@/components/common/AudioButton';
import {
  STROKE_ORDER_BOX, type Point, type StrokeEnds, type StrokeOrderData, checkWriting, describeWritingCheck, hasStrokeOrder,
  loadStrokeOrder, strokeCountOf,
} from '@/features/learning/stroke-order';
import { StrokeOrder } from './StrokeOrder';

const CANVAS_SIZE = 600;
const STROKE_WIDTH = 16;
const STROKE_COLOR = '#FF5B73';

interface WritingPadProps {
  character: string;
  reading: string;
  /** Số nét dự phòng khi chữ không có dữ liệu thứ tự nét. */
  expectedStrokes?: number;
  note?: string;
}

/**
 * Luyện viết: xem thứ tự nét (hình động) rồi viết đè lên chữ mẫu mờ (chuột, ngón tay hoặc bút).
 * Chữ có dữ liệu KanjiVG: chữ mẫu vẽ bằng chính các nét đó (cùng hệ toạ độ) nên chấm được từng nét —
 * đúng thứ tự, đúng chỗ bắt đầu, đúng chiều. Không có dữ liệu → chỉ đối chiếu số nét.
 */
export function WritingPad({ character, reading, expectedStrokes, note }: WritingPadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const guideRef = useRef<SVGGElement>(null);
  const strokesRef = useRef<Point[][]>([]);
  const isDrawingRef = useRef(false);
  const [strokeCount, setStrokeCount] = useState(0);
  const [checkMessage, setCheckMessage] = useState('');
  const [guide, setGuide] = useState<StrokeOrderData | null>(null);
  const hasGuide = hasStrokeOrder(character);
  const expected = strokeCountOf(character) ?? expectedStrokes;

  useEffect(() => {
    const context = canvasRef.current?.getContext('2d');
    if (!context) return;
    context.lineWidth = STROKE_WIDTH;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.strokeStyle = STROKE_COLOR;
  }, []);

  useEffect(() => {
    let isCurrent = true;
    loadStrokeOrder(character).then((data) => { if (isCurrent) setGuide(data?.c === character ? data : null); });
    return () => { isCurrent = false; };
  }, [character]);

  function canvasPoint(event: PointerEvent<HTMLCanvasElement>): [number, number] {
    const canvas = event.currentTarget;
    const rect = canvas.getBoundingClientRect();
    return [((event.clientX - rect.left) * canvas.width) / rect.width, ((event.clientY - rect.top) * canvas.height) / rect.height];
  }
  const toGuideSpace = ([x, y]: [number, number]): Point => [(x * STROKE_ORDER_BOX) / CANVAS_SIZE, (y * STROKE_ORDER_BOX) / CANVAS_SIZE];

  function startStroke(event: PointerEvent<HTMLCanvasElement>) {
    const context = event.currentTarget.getContext('2d');
    if (!context) return;
    isDrawingRef.current = true;
    setStrokeCount((count) => count + 1);
    setCheckMessage('');
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = canvasPoint(event);
    strokesRef.current.push([toGuideSpace(point)]);
    context.beginPath();
    context.moveTo(...point);
  }

  function continueStroke(event: PointerEvent<HTMLCanvasElement>) {
    if (!isDrawingRef.current) return;
    const point = canvasPoint(event);
    strokesRef.current.at(-1)?.push(toGuideSpace(point));
    const context = event.currentTarget.getContext('2d');
    context?.lineTo(...point);
    context?.stroke();
  }

  function clear() {
    const canvas = canvasRef.current;
    canvas?.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
    strokesRef.current = [];
    setStrokeCount(0);
    setCheckMessage('');
  }

  /** Điểm đầu và cuối của từng nét mẫu — đo trên chính các nét mờ đang hiển thị. */
  function referenceEnds(): StrokeEnds[] {
    const paths = guideRef.current ? [...guideRef.current.querySelectorAll('path')] : [];
    return paths.map((path) => {
      const length = path.getTotalLength();
      const start = path.getPointAtLength(0);
      const end = path.getPointAtLength(length);
      return { start: [start.x, start.y], end: [end.x, end.y] };
    });
  }

  function check() {
    if (guide) {
      setCheckMessage(describeWritingCheck(checkWriting(strokesRef.current, referenceEnds())));
    } else if (!strokeCount) {
      setCheckMessage('Viết chữ vào khung trước nhé.');
    } else if (expected === undefined) {
      setCheckMessage(`Bạn đã viết ${strokeCount} nét. Hãy đối chiếu dáng chữ với mẫu mờ.`);
    } else if (strokeCount === expected) {
      setCheckMessage(`Đủ ${expected} nét. Hãy đối chiếu thứ tự và dáng chữ với mẫu mờ.`);
    } else {
      setCheckMessage(`Bạn viết ${strokeCount}/${expected} nét. Thử xoá và viết lại nhé.`);
    }
  }

  return (
    <div className="card writing-pad">
      <div className="writing-layout">
        {hasGuide ? (
          <div className="writing-guide">
            <p className="tiny muted center mb-2">① Xem thứ tự nét</p>
            <StrokeOrder key={character} character={character} size={180} />
          </div>
        ) : null}
        <div className="center">
          <p className="tiny muted mb-2">{hasGuide ? '② Viết đè lên chữ mờ, đúng thứ tự nét' : 'Viết theo chữ mờ bên dưới'}</p>
          <div className="writing-canvas">
            {guide ? (
              <svg viewBox={`0 0 ${STROKE_ORDER_BOX} ${STROKE_ORDER_BOX}`} aria-hidden="true">
                <g ref={guideRef} className="writing-ghost">{guide.strokes.map((path, index) => <path key={index} d={path} />)}</g>
              </svg>
            ) : (
              <span className="jp glyph writing-ghost-glyph" aria-hidden="true">{character}</span>
            )}
            <svg viewBox="0 0 100 100" aria-hidden="true">
              <path d="M50 4V96M4 50H96" stroke="#F6EDE9" strokeWidth="1" strokeDasharray="3 3" />
            </svg>
            <canvas ref={canvasRef} width={CANVAS_SIZE} height={CANVAS_SIZE} aria-label={`Khung luyện viết chữ ${character}`}
              onPointerDown={startStroke} onPointerMove={continueStroke}
              onPointerUp={() => { isDrawingRef.current = false; }} onPointerCancel={() => { isDrawingRef.current = false; }} />
          </div>
          <div className="row" style={{ justifyContent: 'center', gap: 8 }}>
            <button type="button" className="btn ghost sm" onClick={clear}>Xoá</button>
            <button type="button" className="btn sm" onClick={check}>Kiểm tra</button>
            <AudioButton text={character} label={`Nghe ${reading}`} className="btn ghost sm" />
            <span className="sm soft">{reading}{expected ? ` · ${expected} nét` : ''}</span>
          </div>
          {checkMessage ? <p className="sm mt-2" role="status">{checkMessage}</p> : null}
        </div>
      </div>
      {note ? <p className="sm soft mt-3.5 center">{note}</p> : null}
    </div>
  );
}
