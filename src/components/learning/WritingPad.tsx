'use client';

import { type PointerEvent, useEffect, useRef, useState } from 'react';
import { AudioButton } from '@/components/common/AudioButton';

const CANVAS_SIZE = 600;
const STROKE_WIDTH = 16;
const STROKE_COLOR = '#FF5B73';

interface WritingPadProps {
  character: string;
  reading: string;
  expectedStrokes?: number;
  note?: string;
}

/** Luyện viết: viết theo chữ mờ trên khung ô vuông (chuột, ngón tay hoặc bút). */
export function WritingPad({ character, reading, expectedStrokes, note }: WritingPadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const [strokeCount, setStrokeCount] = useState(0);
  const [checkMessage, setCheckMessage] = useState('');

  useEffect(() => {
    const context = canvasRef.current?.getContext('2d');
    if (!context) return;
    context.lineWidth = STROKE_WIDTH;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.strokeStyle = STROKE_COLOR;
  }, []);

  function pointFrom(event: PointerEvent<HTMLCanvasElement>): [number, number] {
    const canvas = event.currentTarget;
    const rect = canvas.getBoundingClientRect();
    return [((event.clientX - rect.left) * canvas.width) / rect.width, ((event.clientY - rect.top) * canvas.height) / rect.height];
  }

  function startStroke(event: PointerEvent<HTMLCanvasElement>) {
    const context = event.currentTarget.getContext('2d');
    if (!context) return;
    isDrawingRef.current = true;
    setStrokeCount((count) => count + 1);
    setCheckMessage('');
    event.currentTarget.setPointerCapture(event.pointerId);
    context.beginPath();
    context.moveTo(...pointFrom(event));
  }

  function continueStroke(event: PointerEvent<HTMLCanvasElement>) {
    if (!isDrawingRef.current) return;
    const context = event.currentTarget.getContext('2d');
    context?.lineTo(...pointFrom(event));
    context?.stroke();
  }

  function clear() {
    const canvas = canvasRef.current;
    canvas?.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
    setStrokeCount(0);
    setCheckMessage('');
  }

  function checkStrokeCount() {
    if (!strokeCount) {
      setCheckMessage('Viết chữ vào khung trước nhé.');
    } else if (expectedStrokes === undefined) {
      setCheckMessage(`Bạn đã viết ${strokeCount} nét. Hãy đối chiếu dáng chữ với mẫu mờ.`);
    } else if (strokeCount === expectedStrokes) {
      setCheckMessage(`Đủ ${expectedStrokes} nét. Hãy đối chiếu thứ tự và dáng chữ với mẫu mờ.`);
    } else {
      setCheckMessage(`Bạn viết ${strokeCount}/${expectedStrokes} nét. Thử xoá và viết lại nhé.`);
    }
  }

  return (
    <div className="card center">
      <p className="sm muted">Viết theo chữ mờ bên dưới. Bấm kiểm tra để đối chiếu số nét.</p>
      <div style={{ position: 'relative', width: 'min(300px,86vw)', aspectRatio: '1/1', margin: '14px auto', borderRadius: 20,
        border: '2px dashed #EADFDA', background: '#fff' }}>
        <span className="jp" aria-hidden="true" style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center',
          fontSize: 170, color: '#F3EBE7', userSelect: 'none' }}>{character}</span>
        <svg viewBox="0 0 100 100" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} aria-hidden="true">
          <path d="M50 4V96M4 50H96" stroke="#F6EDE9" strokeWidth="1" strokeDasharray="3 3" />
        </svg>
        <canvas ref={canvasRef} width={CANVAS_SIZE} height={CANVAS_SIZE} aria-label={`Khung luyện viết chữ ${character}`}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', touchAction: 'none', borderRadius: 20 }}
          onPointerDown={startStroke} onPointerMove={continueStroke}
          onPointerUp={() => { isDrawingRef.current = false; }} onPointerLeave={() => { isDrawingRef.current = false; }} />
      </div>
      <div className="row" style={{ justifyContent: 'center', gap: 8 }}>
        <button type="button" className="btn ghost sm" onClick={clear}>Xoá</button>
        <button type="button" className="btn sm" onClick={checkStrokeCount}>Kiểm tra nét</button>
        <AudioButton text={character} label={`Nghe ${reading}`} className="btn ghost sm" />
        <span className="sm soft">{reading}</span>
      </div>
      {checkMessage ? <p className="sm mt-2" role="status">{checkMessage}</p> : null}
      {note ? <p className="sm soft mt-3.5">{note}</p> : null}
    </div>
  );
}
