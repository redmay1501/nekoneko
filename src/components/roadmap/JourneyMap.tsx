'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { buildJourneyMapLayout } from '@/features/roadmap/journey-map-layout';
import { startNavigation } from '@/stores/navigation-progress-store';

const FONT = 'Be Vietnam Pro,sans-serif';
const SAKURA_SIZE = 20;
const TORII_SIZE = 42;

interface JourneyMapProps {
  currentDay: number;
  startDateLabel: string;
  isJourneyComplete: boolean;
}

/**
 * Bản đồ 90 ngày: con đường uốn lượn, torii đầu mỗi chặng, sakura mỗi tuần, Phú Sĩ cuối đường.
 * Toạ độ do journey-map-layout.ts tính — component chỉ vẽ.
 */
export function JourneyMap({ currentDay, startDateLabel, isJourneyComplete }: JourneyMapProps) {
  const router = useRouter();
  const { width, height, pathData, nodes, stageBanners, finish } = buildJourneyMapLayout(currentDay, isJourneyComplete);
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
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Bản đồ 90 ngày">
        <g opacity=".5">
          <path d={`M0 ${height - 70} Q100 ${height - 120} 200 ${height - 72} T400 ${height - 78} L400 ${height} L0 ${height} Z`} fill="#CFE3CC" />
        </g>
        <path d={pathData} stroke="#F4E2DC" strokeWidth="20" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d={pathData} stroke="#FFFFFF" strokeWidth="12" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="2 14" />
        <g transform={`translate(${width / 2 - 110},26)`}>
          <text x="110" y="18" textAnchor="middle" fontSize="15" fontWeight="700" fill="#5E5A57" fontFamily={FONT}>Bắt đầu từ đây</text>
          <text x="110" y="40" textAnchor="middle" fontSize="11.5" fill="#8E8781" fontFamily={FONT}>{startDateLabel} · あいうえお</text>
        </g>

        {nodes.filter((node) => node.isWeekMark).map((node) => (
          <use key={`sakura-${node.day}`} href="#sakura" x={node.x + (node.x > width / 2 ? -46 : 26)} y={node.y - 10}
            width={SAKURA_SIZE} height={SAKURA_SIZE} opacity=".8" />
        ))}
        {stageBanners.map(({ stage, x, y, toriiX }) => (
          <g key={stage.name}>
            <g transform={`translate(${x},${y})`}>
              <rect width="192" height="26" rx="13" fill="#FFFFFF" opacity=".92" />
              <text x="96" y="18" textAnchor="middle" fontSize="12" fontWeight="700" fill="#5E5A57" fontFamily={FONT}>
                {stage.emoji} {stage.name} · ngày {stage.from}–{stage.to}
              </text>
            </g>
            <use href="#torii" x={toriiX} y={y + 20} width={TORII_SIZE} height={TORII_SIZE} opacity=".85" />
          </g>
        ))}

        {nodes.map((node) => {
          const isToday = node.state === 'today';
          const isDone = node.state === 'done';
          return (
            <g key={node.day} className="daynode" role="link" tabIndex={0} data-reveal aria-label={`Ngày ${node.day}${isToday ? ' — hôm nay' : ''}`}
              onClick={() => openDay(node.day)}
              onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') openDay(node.day); }}>
              {isToday ? <circle cx={node.x} cy={node.y} r="17" fill="#FF5B73" opacity=".4" className="pulse" /> : null}
              {/* Vùng chạm vô hình 44px quanh mỗi chấm (chấm vẽ nhỏ hơn). */}
              <circle className="touch-target" cx={node.x} cy={node.y} r="22" fill="transparent" />
              <circle className="hit" cx={node.x} cy={node.y} r={node.radius}
                fill={isToday ? '#FF5B73' : isDone ? node.stage.color : '#FFFFFF'}
                stroke={isDone || isToday ? 'none' : '#EADFDA'} strokeWidth="2" />
              <text x={node.x} y={node.y + 4} textAnchor="middle" fontSize={isToday ? 12 : 9.5} fontWeight="700"
                fill={isToday ? '#fff' : isDone ? '#4F4A46' : '#B5ADA8'} fontFamily={FONT}>{node.day}</text>
              {isToday ? (
                <use href="#noko" className="today-neko" x={node.x + (node.x > width / 2 ? -66 : 22)} y={node.y - 46} width="44" height="44" />
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
    </div>
  );
}
