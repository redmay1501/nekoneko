'use client';

import { useEffect, useState } from 'react';
import {
  STROKE_ORDER_BOX, type StrokeOrderData, hasStrokeOrder, loadStrokeOrder, strokeStartOf,
} from '@/features/learning/stroke-order';

interface StrokeOrderProps {
  character: string;
  /** Cạnh khung (px). Khung co lại theo bề ngang màn hình. */
  size?: number;
}

type LoadState = { character: string; data: StrokeOrderData | null } | null;

/**
 * Thứ tự nét của một chữ: chữ lớn, số thứ tự từng nét, hình động vẽ từng nét.
 * Mặc định hiện đủ chữ kèm số (không tự chạy — người học bấm ▶ khi muốn xem). Có Phát / Dừng / Từ đầu và
 * ‹ › để xem từng nét. Chữ không có dữ liệu → nói rõ, không vẽ đoán.
 */
export function StrokeOrder({ character, size = 200 }: StrokeOrderProps) {
  const [loaded, setLoaded] = useState<LoadState>(null);
  /** Số nét đã vẽ xong. Bằng tổng số nét = hiện đủ chữ. */
  const [step, setStep] = useState(Number.POSITIVE_INFINITY);
  const [isPlaying, setIsPlaying] = useState(false);
  /** Tăng mỗi lần xem lại / nhảy nét → nét đang vẽ chạy lại từ đầu. Dừng thì giữ nguyên chỗ đang vẽ. */
  const [run, setRun] = useState(0);
  const isAvailable = hasStrokeOrder(character);

  useEffect(() => {
    if (!isAvailable) return;
    let isCurrent = true;
    loadStrokeOrder(character).then((data) => { if (isCurrent) setLoaded({ character, data }); });
    return () => { isCurrent = false; };
  }, [character, isAvailable]);

  if (!isAvailable) {
    return <p className="tiny muted center stroke-order-missing">Chữ {character} chưa có dữ liệu thứ tự nét.</p>;
  }
  const data = loaded?.character === character ? loaded.data : null;
  if (!loaded || loaded.character !== character) {
    // Giữ đúng chỗ của khung + nút điều khiển + chú thích → tải xong trang không bị nhảy.
    return (
      <div className="stroke-order" aria-busy="true" aria-label="Đang tải thứ tự nét">
        <div className="stroke-order-box skeleton" style={{ width: `min(${size}px, 70vw)` }} />
        <div className="stroke-order-controls stroke-order-placeholder" aria-hidden="true" />
        <p className="tiny" aria-hidden="true">&nbsp;</p>
      </div>
    );
  }
  if (!data) return <p className="tiny muted center stroke-order-missing">Chưa tải được thứ tự nét — kiểm tra mạng rồi mở lại nhé.</p>;

  const total = data.strokes.length;
  const drawn = Math.min(step, total);
  const isDone = drawn >= total;
  const currentStart = isDone ? null : strokeStartOf(data.strokes[drawn]);

  function play() {
    if (isDone) { setStep(0); setRun((value) => value + 1); }
    setIsPlaying(true);
  }
  function restart() {
    setStep(0);
    setRun((value) => value + 1);
    setIsPlaying(true);
  }
  function goTo(next: number) {
    setIsPlaying(false);
    setRun((value) => value + 1);
    setStep(Math.max(0, Math.min(total, next)));
  }
  function finishStroke() {
    const next = drawn + 1;
    setStep(next);
    if (next >= total) setIsPlaying(false);
  }

  return (
    <figure className="stroke-order">
      <svg viewBox={`0 0 ${STROKE_ORDER_BOX} ${STROKE_ORDER_BOX}`} className="stroke-order-box" style={{ width: `min(${size}px, 70vw)` }}
        role="img" aria-label={`Thứ tự nét chữ ${character}: ${total} nét`}>
        <path className="so-grid" d="M54.5 2V107M2 54.5H107" />
        <g className="so-ghost">{data.strokes.map((path, index) => <path key={index} d={path} />)}</g>
        <g className="so-ink">
          {data.strokes.slice(0, drawn).map((path, index) => <path key={index} d={path} />)}
          {!isDone ? (
            <path key={`${run}-${drawn}`} d={data.strokes[drawn]} pathLength={1} className="so-drawing"
              style={{ animationPlayState: isPlaying ? 'running' : 'paused' }} onAnimationEnd={finishStroke} />
          ) : null}
        </g>
        {currentStart ? <circle className="so-start" cx={currentStart[0]} cy={currentStart[1]} r={3.2} /> : null}
        <g className="so-labels">
          {data.labels.map(([x, y], index) => (
            index <= drawn ? <text key={index} x={x} y={y} className={index === drawn ? 'on' : undefined}>{index + 1}</text> : null
          ))}
        </g>
      </svg>
      <div className="stroke-order-controls" role="group" aria-label="Điều khiển hình động thứ tự nét">
        <button type="button" className="btn ghost sm" onClick={() => goTo(drawn - 1)} disabled={drawn === 0} aria-label="Nét trước">‹</button>
        {isPlaying
          ? <button type="button" className="btn sm" onClick={() => setIsPlaying(false)}>⏸ Dừng</button>
          : <button type="button" className="btn sm" onClick={play}>▶ {isDone ? 'Xem viết' : 'Tiếp'}</button>}
        <button type="button" className="btn ghost sm" onClick={restart} aria-label="Xem lại từ đầu">↺</button>
        <button type="button" className="btn ghost sm" onClick={() => goTo(drawn + 1)} disabled={isDone} aria-label="Nét sau">›</button>
      </div>
      <figcaption className="tiny muted center">{isDone ? `${total} nét` : `Nét ${drawn + 1}/${total}`}</figcaption>
    </figure>
  );
}
