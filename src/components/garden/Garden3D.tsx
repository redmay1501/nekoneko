'use client';

import Link from 'next/link';
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { EmojiIcon } from '@/components/common/EmojiIcon';
import { layoutGardenPlants } from '@/features/garden/garden-layout';
import { focusSessionHref } from '@/features/learning/session-modes';
import { STATUS_PRESENTATION } from '@/features/memory/memory-rules';
import type { MemoryStatus } from '@/features/memory/memory-types';
import { useSheetStore } from '@/stores/sheet-store';
import type { GardenSceneHandle } from './garden3d/create-garden-scene';

/** Dữ liệu một cây — lấy từ trí nhớ thật của người học (trang Vườn truyền xuống). */
export interface GardenPlantEntry {
  contentKey: string;
  face: string;
  reading: string;
  meaning: string;
  status: MemoryStatus;
  lastEncounterText: string;
}

type Phase = 'loading' | 'ready' | 'fallback';

function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
    (context as WebGLRenderingContext | null)?.getExtension('WEBGL_lose_context')?.loseContext();
    return Boolean(context);
  } catch {
    return false;
  }
}

/** Máy yếu / màn nhỏ: bớt bóng đổ và chi tiết để vẫn mượt và chạm được. */
function isLowPower(): boolean {
  const navigatorInfo = navigator as Navigator & { deviceMemory?: number };
  const cores = navigatorInfo.hardwareConcurrency ?? 4;
  const memory = navigatorInfo.deviceMemory ?? 4;
  return cores <= 4 || memory <= 4 || Math.min(window.innerWidth, window.innerHeight) < 500;
}

/**
 * Vườn tri thức 3D: cảnh three.js tải lười (chỉ ở trình duyệt), mỗi kiến thức đã học là một cây; bấm cây → thẻ thông tin
 * với các lối đi sẵn có (khay chi tiết kiến thức, phiên ôn tập trung, cứu cây sắp quên).
 * Không có WebGL / lỗi tải → hiện `fallback` (phong cảnh 2D cũ) — trang vẫn dùng được.
 */
export function Garden3D({ plants, fallback }: { plants: GardenPlantEntry[]; fallback: ReactNode }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handleRef = useRef<GardenSceneHandle | null>(null);
  const [phase, setPhase] = useState<Phase>('loading');
  const [sceneReady, setSceneReady] = useState(false);
  const [charactersReady, setCharactersReady] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const openKnowledge = useSheetStore((state) => state.openKnowledge);

  const placements = useMemo(() => layoutGardenPlants(plants), [plants]);
  const placementsRef = useRef(placements);
  placementsRef.current = placements;
  const byKey = useMemo(() => new Map(plants.map((plant) => [plant.contentKey, plant])), [plants]);
  const selected = selectedKey ? byKey.get(selectedKey) ?? null : null;

  // Cảnh tạo MỘT lần khi mount (mô hình GLB, hình khối) — đổi cây / chọn cây chỉ cập nhật, không dựng lại.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    if (!supportsWebGL()) { setPhase('fallback'); return undefined; }
    let cancelled = false;
    import('./garden3d/create-garden-scene').then(({ createGardenScene }) => {
      if (cancelled) return;
      handleRef.current = createGardenScene({
        canvas,
        plants: placementsRef.current,
        lowPower: isLowPower(),
        reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        onSelect: (contentKey) => setSelectedKey(contentKey),
        onSceneReady: () => setSceneReady(true),
        onCharactersReady: () => setCharactersReady(true),
      });
      setPhase('ready');
    }).catch((error) => {
      console.warn('[garden] Không dựng được cảnh 3D — dùng phong cảnh 2D.', error);
      if (!cancelled) setPhase('fallback');
    });
    return () => {
      cancelled = true;
      handleRef.current?.dispose();
      handleRef.current = null;
    };
  }, []);

  useEffect(() => { handleRef.current?.setPlants(placements); }, [placements, phase]);
  useEffect(() => { handleRef.current?.setSelected(selectedKey); }, [selectedKey, phase]);
  useEffect(() => {
    if (!selectedKey) return undefined;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setSelectedKey(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedKey]);

  if (phase === 'fallback') return <>{fallback}</>;

  const presentation = selected ? STATUS_PRESENTATION[selected.status] : null;
  const needsRescue = selected?.status === 'fading' || selected?.status === 'weak';

  return (
    <section className="garden3d" aria-label="Khu vườn 3D — mỗi cây là một kiến thức bạn đã học">
      <canvas ref={canvasRef} className="garden3d-canvas" aria-hidden="true" />
      {!sceneReady || !charactersReady ? (
        <div className={`garden3d-loading${sceneReady ? ' is-soft' : ''}`} role="status">
          <span className="garden3d-spinner" aria-hidden="true" />
          {!sceneReady ? 'Đang trồng khu vườn…' : 'Hai bạn nhỏ đang ra xích đu…'}
        </div>
      ) : null}
      {phase === 'ready' ? (
        <div className="garden3d-tools">
          <button type="button" className="garden3d-tool" onClick={() => handleRef.current?.resetCamera()} aria-label="Về góc nhìn mặc định" title="Về góc nhìn mặc định">
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4.5h4.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </div>
      ) : null}
      {phase === 'ready' && !selected ? (
        <p className="garden3d-hint">{plants.length ? 'Chạm vào một cây để xem kiến thức · kéo để xoay · chụm / cuộn để phóng to' : 'Vườn đang chờ hạt đầu tiên 🌱 — học một từ là có cây đầu tiên.'}</p>
      ) : null}
      {selected && presentation ? (
        <div className="garden3d-panel" role="dialog" aria-label={`Cây: ${selected.face}`}>
          <button type="button" className="garden3d-close" onClick={() => setSelectedKey(null)} aria-label="Đóng">×</button>
          <div className="garden3d-panel-head">
            <span className="garden3d-panel-plant"><EmojiIcon emoji={presentation.plant} size={30} /></span>
            <div style={{ minWidth: 0 }}>
              <p className="jp garden3d-panel-face">{selected.face}</p>
              {selected.reading && selected.reading !== selected.face ? <p className="jp sm muted">{selected.reading}</p> : null}
            </div>
          </div>
          {selected.meaning ? <p className="sm mt-1">{selected.meaning}</p> : null}
          <p className="tiny mt-2">
            <span className="chip" style={{ background: presentation.background, color: presentation.color }}>{presentation.label}</span>
            <span className="muted"> · lần gần nhất: {selected.lastEncounterText}</span>
          </p>
          <div className="row wrap mt-3" style={{ gap: 8 }}>
            <button type="button" className="btn sm" onClick={() => openKnowledge(selected.contentKey)}>Xem chi tiết</button>
            {needsRescue
              ? <Link className="btn ghost sm" href={`/tri-nho/cuu/${selected.contentKey}`}>💧 Tưới lại</Link>
              : <Link className="btn ghost sm" href={focusSessionHref([selected.contentKey])}>🔁 Ôn lại</Link>}
          </div>
        </div>
      ) : null}
    </section>
  );
}
