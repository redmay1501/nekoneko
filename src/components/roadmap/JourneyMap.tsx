'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LottieAnimation } from '@/components/common/LottieAnimation';
import { buildJourneyMapLayout } from '@/features/roadmap/journey-map-layout';
import { startNavigation } from '@/stores/navigation-progress-store';

const FONT = 'Nunito,sans-serif';
const SAKURA_SIZE = 20;
const TORII_SIZE = 42;

interface JourneyMapProps {
  currentDay: number;
  /** Ngày người học bắt đầu (profiles.start_date — ghi khi tạo tài khoản, không suy ra từ hôm nay). */
  startDateLabel: string;
  /** Nội dung ngày 1 của lộ trình (từ dữ liệu, vd. "Hiragana: hàng あ・か"). */
  firstDayTitle: string;
  isJourneyComplete: boolean;
  /** Ngày (đã qua) còn kiến thức chưa học — vẽ "còn học bù" thay vì "đã xong". */
  unfinishedDays?: number[];
}

const STATE_LABEL = { done: 'đã hoàn thành', partial: 'đã qua, còn kiến thức học bù', today: 'hôm nay — đang học', upcoming: 'chưa học' } as const;

/** Màu 3D của chấm ngày theo trạng thái: mặt trên sáng → dưới đậm, đế (lip) đậm hơn nằm lệch xuống tạo khối. */
const DOT_GRADIENTS = {
  done: ['#FF9EAC', '#F2667C'],
  partial: ['#FFFFFF', '#FFE3E9'],
  today: ['#FF8A9C', '#E24159'],
  upcoming: ['#FFFFFF', '#F1E9E4'],
} as const;

/**
 * Bản đồ 90 ngày: bãi biển động (Lottie) ở đầu bản đồ, con đường cát uốn lượn với chấm ngày 3D,
 * torii đầu mỗi chặng, sakura mỗi tuần, Phú Sĩ cuối đường.
 * Toạ độ do journey-map-layout.ts tính — component chỉ vẽ.
 */
export function JourneyMap({ currentDay, startDateLabel, firstDayTitle, isJourneyComplete, unfinishedDays = [] }: JourneyMapProps) {
  const router = useRouter();
  const unfinished = new Set(unfinishedDays);
  const { width, height, pathData, nodes, stageBanners, finish } = buildJourneyMapLayout(currentDay, isJourneyComplete, (day) => !unfinished.has(day));
  const openDay = (day: number) => {
    startNavigation();
    router.push(`/lo-trinh/ngay/${day}`);
  };
  // Ngày đang học gần như chắc chắn được bấm tiếp → tải sẵn trang đó khi bản đồ vừa hiện.
  useEffect(() => {
    router.prefetch(`/lo-trinh/ngay/${currentDay}`);
  }, [router, currentDay]);

  return (
    <div className="map-wrap">
      {/* Cảnh biển chỉ nằm TRONG khung bản đồ: trời, mây, sóng vỗ ở đầu; con đường bắt đầu trên bờ cát. */}
      <div className="map-scene" aria-hidden="true">
        <LottieAnimation src="/animations/roadmap-beach.json" className="map-scene-beach" fit="cover" stillFrame={0} />
        <LottieAnimation src="/animations/garden-palm.json" className="map-scene-tree map-scene-palm" stillFrame={30} />
        <LottieAnimation src="/animations/garden-wind-tree.json" className="map-scene-tree map-scene-wind" stillFrame={120} />
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Bản đồ 90 ngày">
        <defs>
          {Object.entries(DOT_GRADIENTS).map(([state, [top, bottom]]) => (
            <linearGradient key={state} id={`dot-${state}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={top} />
              <stop offset="1" stopColor={bottom} />
            </linearGradient>
          ))}
          <linearGradient id="banner-face" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#FFFFFF" />
            <stop offset="1" stopColor="#FFF1E8" />
          </linearGradient>
        </defs>
        <path d={`M0 ${height - 70} Q100 ${height - 120} 200 ${height - 72} T400 ${height - 78} L400 ${height} L0 ${height} Z`} fill="#EFC994" opacity=".45" />
        {/* Đường cát nổi khối: bóng đổ → mặt đường → vết chân chấm chấm. */}
        <path d={pathData} transform="translate(0,4)" stroke="rgba(176,120,62,.22)" strokeWidth="22" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d={pathData} stroke="#FFF7EC" strokeWidth="20" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d={pathData} stroke="#F0C994" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="1 13" />
        <g transform={`translate(${width / 2 - 110},18)`}>
          <rect x="0" y="0" width="220" height="52" rx="18" fill="#FFFFFF" opacity=".86" />
          <text x="110" y="22" textAnchor="middle" fontSize="14" fontWeight="800" fill="#5E5A57" fontFamily={FONT}>Ngày bắt đầu học: {startDateLabel}</text>
          <text x="110" y="41" textAnchor="middle" fontSize="11.5" fill="#8E8781" fontFamily={FONT}>Ngày 1 · {firstDayTitle}</text>
        </g>

        {nodes.filter((node) => node.isWeekMark).map((node) => (
          <use key={`sakura-${node.day}`} href="#sakura" x={node.x + (node.x > width / 2 ? -46 : 26)} y={node.y - 10}
            width={SAKURA_SIZE} height={SAKURA_SIZE} opacity=".8" />
        ))}
        {stageBanners.map(({ stage, x, y, toriiX }) => (
          <g key={stage.name}>
            <g transform={`translate(${x},${y})`} className="stage-banner">
              <rect y="3" width="192" height="26" rx="13" fill={stage.color} />
              <rect width="192" height="26" rx="13" fill="url(#banner-face)" stroke={stage.color} strokeWidth="1.5" />
              <rect x="10" y="3" width="172" height="8" rx="4" fill="#FFFFFF" opacity=".7" />
              <text x="96" y="18" textAnchor="middle" fontSize="12" fontWeight="700" fill="#5E5A57" fontFamily={FONT}>
                {stage.emoji} {stage.name} · ngày {stage.from}–{stage.to}
              </text>
            </g>
            <use href="#torii" x={toriiX} y={y + 20} width={TORII_SIZE} height={TORII_SIZE} opacity=".85" />
          </g>
        ))}

        {nodes.map((node) => {
          const isToday = node.state === 'today';
          return (
            <g key={node.day} className={`daynode is-${node.state}`} role="link" tabIndex={0} aria-label={`Ngày ${node.day} — ${STATE_LABEL[node.state]}`}
              onClick={() => openDay(node.day)}
              onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') openDay(node.day); }}>
              {isToday ? <circle cx={node.x} cy={node.y} r={node.radius} className="pulse day-pulse" /> : null}
              {/* Vùng chạm vô hình 44px quanh mỗi chấm (chấm vẽ nhỏ hơn). */}
              <circle className="touch-target" cx={node.x} cy={node.y} r="22" fill="transparent" />
              {/* Chấm 3D: đế đậm lệch xuống + mặt chuyển màu + vệt bóng sáng; số có bóng đổ 1px. */}
              <g className="day-face">
                <ellipse className="day-shadow" cx={node.x} cy={node.y + node.radius + 2.5} rx={node.radius * 0.9} ry={node.radius * 0.3} />
                <circle className="day-lip" cx={node.x} cy={node.y + 3} r={node.radius} />
                <circle className="hit day-dot" cx={node.x} cy={node.y} r={node.radius} fill={`url(#dot-${node.state})`} />
                <ellipse className="day-gloss" cx={node.x} cy={node.y - node.radius * 0.5} rx={node.radius * 0.62} ry={node.radius * 0.26} />
                <text className="day-number-shadow" x={node.x} y={node.y + 1.2} textAnchor="middle" dominantBaseline="central" fontFamily={FONT}>{node.day}</text>
                {/* Căn giữa theo tâm chữ (dominant-baseline: central) — không cộng lệch tay theo cỡ font. */}
                <text className="day-number" x={node.x} y={node.y} textAnchor="middle" dominantBaseline="central" fontFamily={FONT}>{node.day}</text>
              </g>
              {node.state === 'done' ? (
                // Dấu ✓ nhỏ góc trên phải — trạng thái không chỉ dựa vào màu.
                <g className="day-badge" transform={`translate(${node.x + node.radius * 0.72},${node.y - node.radius * 0.72})`} aria-hidden="true">
                  <circle r="5.5" />
                  <path d="M-2.6 0.1 -0.8 1.9 2.7 -1.8" />
                </g>
              ) : null}
              {isToday ? (
                <svg className="today-neko" x={node.x - 25} y={node.y - 55} width="50" height="50" viewBox="0 0 120 120" aria-hidden="true">
                  <use href="#noko" x="0" y="0" width="120" height="120" />
                </svg>
              ) : null}
            </g>
          );
        })}

        <g transform={`translate(${finish.x},${finish.y})`}>
          <path d="M0 70 55 0l55 70z" fill="#C7DCEE" />
          <path d="M38 26 55 9l18 17c-6 3-12 2-18 0-6-2-12-3-17 0z" fill="#FBFDFF" />
          <text x="55" y="96" textAnchor="middle" fontSize="14" fontWeight="700" fill="#5E5A57" fontFamily={FONT}>🏆 JLPT N5</text>
        </g>
      </svg>
      <ul className="map-legend" aria-label="Chú thích trạng thái ngày">
        <li><span className="legend-dot is-done">✓</span>Đã hoàn thành</li>
        <li><span className="legend-dot is-partial" />Đã qua, còn học bù</li>
        <li><span className="legend-dot is-today" />Đang học</li>
        <li><span className="legend-dot is-upcoming" />Chưa học</li>
      </ul>
    </div>
  );
}
