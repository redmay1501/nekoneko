'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { EmojiIcon } from '@/components/common/EmojiIcon';
import { STAGE_OF_STATUS, layoutGardenPlants } from '@/features/garden/garden-layout';
import { focusSessionHref } from '@/features/learning/session-modes';
import { STATUS_PRESENTATION } from '@/features/memory/memory-rules';
import type { MemoryStatus } from '@/features/memory/memory-types';
import { useSheetStore } from '@/stores/sheet-store';
import type { GardenSceneHandle, SceneAnchors, SignId, SignLabel } from './garden3d/create-garden-scene';

/** Dữ liệu một cây — lấy từ trí nhớ thật của người học (trang Vườn truyền xuống). */
export interface GardenPlantEntry {
  contentKey: string;
  face: string;
  reading: string;
  meaning: string;
  status: MemoryStatus;
  lastEncounterText: string;
}

/** Tiến độ một nhóm kiến thức (số thật từ catalog + trí nhớ) — hiện trên biển gỗ trong vườn. */
export interface GardenGroupProgress {
  id: SignId;
  label: string;
  glyph: string;
  learned: number;
  total: number;
  href: string;
}

/** Bộ lọc theo trạng thái ghi nhớ (số cây thật). */
export interface GardenStatusCount {
  status: MemoryStatus;
  label: string;
  description: string;
  count: number;
}

type Phase = 'loading' | 'ready' | 'fallback';

/** Màu ô biểu tượng trên từng biển (gradient trên → dưới). */
const SIGN_COLORS: Record<SignId, [string, string]> = {
  vocabulary: ['#F59AA8', '#E0687F'],
  kana: ['#F7A9C0', '#E2738F'],
  grammar: ['#9DB8EE', '#6F8FD8'],
  kanji: ['#F2A86B', '#DA7C3E'],
  radical: ['#9FD08E', '#62A85A'],
};

const CAT_LINES = ['Nyan~ Cùng học tiếp nhé!', 'Hôm nay tưới vườn chưa nè? 🌸', 'Mỗi cây là một điều bạn đã nhớ đó!', 'Đẩy xích đu cao hơn chút nha~'];

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

interface Garden3DProps {
  plants: GardenPlantEntry[];
  groups: GardenGroupProgress[];
  statusCounts: GardenStatusCount[];
  totalCount: number;
  fallback: ReactNode;
}

/**
 * Vườn tri thức 3D toàn khung: cảnh three.js tải lười (chỉ ở trình duyệt), mỗi kiến thức đã học là một cây; bấm cây → thẻ
 * thông tin với các lối đi sẵn có (khay chi tiết kiến thức, phiên ôn tập trung, cứu cây sắp quên).
 * Lớp HTML phủ trên cảnh: tiêu đề + bộ lọc trạng thái, chữ trên các biển gỗ nhóm kiến thức (đặt đúng lên mặt biển 3D,
 * cập nhật vị trí bằng ghi style trực tiếp — không setState mỗi khung hình), lời mèo khi được chạm.
 * Không có WebGL / lỗi tải → hiện `fallback` (phong cảnh 2D cũ) — trang vẫn dùng được.
 */
export function Garden3D({ plants, groups, statusCounts, totalCount, fallback }: Garden3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handleRef = useRef<GardenSceneHandle | null>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const catAnchorsRef = useRef<SceneAnchors['cats'] | null>(null);
  const [phase, setPhase] = useState<Phase>('loading');
  const [sceneReady, setSceneReady] = useState(false);
  const [charactersReady, setCharactersReady] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [filter, setFilter] = useState<MemoryStatus | null>(null);
  const [bubble, setBubble] = useState<{ side: -1 | 1; text: string } | null>(null);
  const bubbleSideRef = useRef<-1 | 1 | null>(null);
  const openKnowledge = useSheetStore((state) => state.openKnowledge);

  // Mọi cây trong MỘT cảnh: hết chỗ trong vườn thì trồng ra đồng cỏ quanh vườn (garden-layout) — không chia khu.
  const placements = useMemo(() => layoutGardenPlants(plants), [plants]);
  const placementsRef = useRef(placements);
  placementsRef.current = placements;
  const byKey = useMemo(() => new Map(plants.map((plant) => [plant.contentKey, plant])), [plants]);
  const selected = selectedKey ? byKey.get(selectedKey) ?? null : null;

  const placeBubble = useCallback(() => {
    const element = bubbleRef.current;
    const side = bubbleSideRef.current;
    const anchors = catAnchorsRef.current;
    if (!element || side === null || !anchors) return;
    const anchor = anchors[String(side) as '-1' | '1'];
    element.style.transform = `translate(${anchor.x}px, ${anchor.y}px) translate(-50%, calc(-100% - 22px))`;
  }, []);

  /** Vị trí đầu hai nhân vật (để đặt lời thoại) — ghi style trực tiếp, không setState mỗi khung hình. */
  const onAnchors = useCallback((anchors: SceneAnchors) => {
    catAnchorsRef.current = anchors.cats;
    placeBubble();
  }, [placeBubble]);

  const router = useRouter();
  const groupsRef = useRef(groups);
  groupsRef.current = groups;
  // Chữ trên biển 3D: vẽ một lần lúc dựng cảnh từ số liệu thật (trang tải lại sau mỗi lần học nên số luôn mới).
  const signLabels = useMemo<SignLabel[]>(() => groups.map((group) => ({
    id: group.id, label: group.label, glyph: group.glyph, learned: group.learned, total: group.total, color: SIGN_COLORS[group.id],
  })), [groups]);
  const signLabelsRef = useRef(signLabels);
  signLabelsRef.current = signLabels;

  // Cảnh tạo MỘT lần khi mount (mô hình GLB, hình khối) — đổi cây / chọn cây / lọc chỉ cập nhật, không dựng lại.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    if (!supportsWebGL()) { setPhase('fallback'); return undefined; }
    let cancelled = false;
    import('./garden3d/create-garden-scene').then(async ({ createGardenScene }) => {
      if (cancelled) return;
      // Đợi font (Nunito / Zen Maru Gothic) sẵn sàng để chữ vẽ lên biển đúng kiểu chữ của app.
      await document.fonts?.ready.catch(() => undefined);
      if (cancelled) return;
      handleRef.current = createGardenScene({
        canvas,
        signLabels: signLabelsRef.current,
        onSignTap: (id) => {
          const group = groupsRef.current.find((item) => item.id === id);
          if (group) router.push(group.href);
        },
        plants: placementsRef.current,
        lowPower: isLowPower(),
        reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        onSelect: (contentKey) => setSelectedKey(contentKey),
        onSceneReady: () => setSceneReady(true),
        onCharactersReady: () => setCharactersReady(true),
        onAnchors,
        onCatTap: (side) => setBubble({ side, text: CAT_LINES[Math.floor(Math.random() * CAT_LINES.length)] }),
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
  }, [onAnchors, router]);

  useEffect(() => { handleRef.current?.setPlants(placements); }, [placements, phase]);
  useEffect(() => { handleRef.current?.setSelected(selectedKey); }, [selectedKey, phase]);
  useEffect(() => { handleRef.current?.setFilter(filter ? STAGE_OF_STATUS[filter] : null); }, [filter, phase]);
  useEffect(() => {
    if (!selectedKey) return undefined;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setSelectedKey(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedKey]);
  // Lời mèo: hiện 2.8s rồi tắt.
  useEffect(() => {
    bubbleSideRef.current = bubble?.side ?? null;
    placeBubble();
    if (!bubble) return undefined;
    const timer = window.setTimeout(() => setBubble(null), 2800);
    return () => window.clearTimeout(timer);
  }, [bubble, placeBubble]);

  if (phase === 'fallback') return <>{fallback}</>;

  const presentation = selected ? STATUS_PRESENTATION[selected.status] : null;
  const needsRescue = selected?.status === 'fading' || selected?.status === 'weak';

  return (
    <section className="garden3d" aria-label="Khu vườn 3D — mỗi cây là một kiến thức bạn đã học">
      <canvas ref={canvasRef} className="garden3d-canvas" aria-hidden="true" />

      {/* Biển gỗ nhóm kiến thức vẽ trong cảnh 3D (bấm được); danh sách này cho bàn phím / trình đọc màn hình. */}
      <nav className="sr-only" aria-label="Các nhóm kiến thức">
        {groups.map((group) => (
          <Link key={group.id} href={group.href}>{`${group.label}: đã học ${group.learned} trên ${group.total}`}</Link>
        ))}
      </nav>

      <div className="garden3d-head">
        <h1 className="sr-only">Vườn tri thức</h1>
        {/* Bấm biển tên vườn → bỏ lọc, bỏ chọn cây: hiện lại toàn bộ cây. */}
        <button type="button" className={`garden3d-title${filter ? ' is-filtered' : ''}`}
          aria-label={filter ? `Hiện lại toàn bộ ${totalCount} cây` : `Vườn tri thức — ${totalCount} cây`}
          onClick={() => { setFilter(null); setSelectedKey(null); }}>
          <span className="garden3d-title-label" aria-hidden="true">Vườn tri thức</span>
          <span className="garden3d-count" aria-hidden="true">{totalCount} cây{filter ? ' · xem tất cả' : ''}</span>
        </button>
        <div className="garden3d-filters" role="radiogroup" aria-label="Lọc cây theo trạng thái ghi nhớ">
          {statusCounts.map((item) => {
            const isOn = filter === item.status;
            return (
              <button key={item.status} type="button" role="radio" aria-checked={isOn} title={item.description}
                className={`garden3d-filter${isOn ? ' is-on' : ''}`} onClick={() => setFilter(isOn ? null : item.status)}>
                <EmojiIcon emoji={STATUS_PRESENTATION[item.status].plant} size={20} />
                <span><b>{item.label}</b> · {item.count} cây</span>
              </button>
            );
          })}
        </div>
      </div>

      {bubble ? <div ref={bubbleRef} className="garden3d-bubble" role="status">{bubble.text}</div> : null}

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
          {/* Thu phóng bằng nút — luôn dùng được trên điện thoại / iPad (một tay, hoặc khi cử chỉ hai ngón không ăn). */}
          <button type="button" className="garden3d-tool" onClick={() => handleRef.current?.zoomBy(0.72)} aria-label="Phóng to" title="Phóng to">
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" /></svg>
          </button>
          <button type="button" className="garden3d-tool" onClick={() => handleRef.current?.zoomBy(1.4)} aria-label="Thu nhỏ — xem cả vườn" title="Thu nhỏ — xem cả vườn">
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M5 12h14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" /></svg>
          </button>
        </div>
      ) : null}
      {phase === 'ready' && !selected ? (
        <p className="garden3d-hint">
          <span aria-hidden="true">👆</span>
          {plants.length ? 'Chạm vào một cây để xem kiến thức · kéo để xoay · chụm / cuộn để phóng to, thu nhỏ để thấy cả đồng cỏ' : 'Vườn đang chờ hạt đầu tiên 🌱 — học một từ là có cây đầu tiên.'}
        </p>
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
              ? <Link className="btn ghost sm" href={`/tri-nho/cuu/${selected.contentKey}?returnTo=%2Fvuon`}>💧 Tưới lại</Link>
              : <Link className="btn ghost sm" href={focusSessionHref([selected.contentKey])}>🔁 Ôn lại</Link>}
          </div>
        </div>
      ) : null}
    </section>
  );
}
