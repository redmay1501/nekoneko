import { JOURNEY_STAGES, JOURNEY_TOTAL_DAYS, type JourneyStage, stageOfDay } from './journey';

/**
 * Bố cục bản đồ lộ trình 90 ngày: đường uốn lượn 3 cột, mỗi chặng một torii,
 * mỗi tuần một bông sakura, Phú Sĩ ở cuối. Hàm thuần — chỉ tính toạ độ.
 */

export const JOURNEY_MAP = {
  WIDTH: 400,
  COLUMNS: 3,
  ROW_GAP: 58,
  TOP: 250,
  BOTTOM_SPACE: 120,
  SIDE_MARGIN: 70,
} as const;

export interface JourneyNode {
  day: number;
  x: number;
  y: number;
  radius: number;
  /**
   * done = đã qua và đã học hết kiến thức của ngày (hoặc ngày ôn đã qua) · partial = đã qua nhưng còn kiến thức học bù ·
   * today = ngày đang học · upcoming = chưa tới. "Đã qua" chỉ do người học bấm Hoàn thành — không theo ngày lịch.
   */
  state: 'done' | 'partial' | 'today' | 'upcoming';
  stage: JourneyStage;
  isWeekMark: boolean;
}

export interface JourneyMapLayout {
  width: number;
  height: number;
  pathData: string;
  nodes: JourneyNode[];
  stageBanners: Array<{ stage: JourneyStage; x: number; y: number; toriiX: number }>;
  finish: { x: number; y: number };
}

function nodePosition(index: number): { x: number; y: number } {
  const { COLUMNS, WIDTH, SIDE_MARGIN, TOP, ROW_GAP } = JOURNEY_MAP;
  const row = Math.floor(index / COLUMNS);
  const column = index % COLUMNS;
  const direction = row % 2 ? COLUMNS - 1 - column : column;
  return { x: SIDE_MARGIN + (direction * (WIDTH - SIDE_MARGIN * 2)) / (COLUMNS - 1), y: TOP + row * ROW_GAP };
}

/** Bán kính chấm: đủ rộng cho số hai chữ số (10, 45, 90) ở mọi cỡ màn hình — chữ không chạm viền. */
export const NODE_RADIUS = { NORMAL: 14, WEEK: 15, TODAY: 19 } as const;

/**
 * `isDayFullyLearned(day)` (tuỳ chọn): ngày đã qua có học hết kiến thức chưa — không có thì mọi ngày đã qua coi là done.
 */
export function buildJourneyMapLayout(currentDay: number, isJourneyComplete = false, isDayFullyLearned?: (day: number) => boolean): JourneyMapLayout {
  const { WIDTH, COLUMNS, ROW_GAP, TOP, BOTTOM_SPACE } = JOURNEY_MAP;
  const rows = Math.ceil(JOURNEY_TOTAL_DAYS / COLUMNS);
  const height = TOP + rows * ROW_GAP + BOTTOM_SPACE;

  let pathData = '';
  const nodes: JourneyNode[] = [];
  for (let index = 0; index < JOURNEY_TOTAL_DAYS; index++) {
    const point = nodePosition(index);
    if (index === 0) {
      pathData = `M${point.x} ${point.y}`;
    } else {
      const previous = nodePosition(index - 1);
      const bend = index % 2 ? 18 : -18;
      pathData += ` Q${(point.x + previous.x) / 2 + bend} ${(point.y + previous.y) / 2} ${point.x} ${point.y}`;
    }
    const day = index + 1;
    const isToday = day === currentDay && !isJourneyComplete;
    nodes.push({
      day, ...point,
      radius: isToday ? NODE_RADIUS.TODAY : day % 7 === 0 ? NODE_RADIUS.WEEK : NODE_RADIUS.NORMAL,
      state: isToday ? 'today'
        : day < currentDay || isJourneyComplete ? (isDayFullyLearned && !isDayFullyLearned(day) ? 'partial' : 'done')
          : 'upcoming',
      stage: stageOfDay(day),
      isWeekMark: day % 7 === 0,
    });
  }

  const stageBanners = JOURNEY_STAGES.map((stage) => {
    const point = nodePosition(stage.from - 1);
    return { stage, x: WIDTH / 2 - 96, y: point.y - 40, toriiX: point.x > WIDTH / 2 ? 20 : WIDTH - 62 };
  });

  const last = nodePosition(JOURNEY_TOTAL_DAYS - 1);
  return { width: WIDTH, height, pathData, nodes, stageBanners, finish: { x: last.x - 55, y: last.y + 30 } };
}
