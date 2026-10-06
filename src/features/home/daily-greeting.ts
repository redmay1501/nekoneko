import type { SessionPlanPreview } from '@/features/learning/session-engine';
import { type RecallStreak, appDateKey, shiftDateKey } from '@/features/progress/recall-streak';

/**
 * LỜI CHÀO MỖI NGÀY — popup đầu tiên khi mở app trong ngày (sau lần chào đầu tiên 3 bước).
 * Nội dung đổi theo NGÀY và theo tình hình thật của người học: hôm nay học gì, chuỗi ngày, quay lại sau mấy ngày nghỉ,
 * đã học hết ngày chưa — kèm một câu tiếng Nhật của ngày (xoay vòng theo ngày).
 */

export interface DailyGreeting {
  /** yyyy-mm-dd giờ VN — trình duyệt nhớ đã chào ngày này chưa. */
  dateKey: string;
  message: string;
  /** "Hôm nay: 10 thứ mới · ôn 4 thứ đã học" — null khi không có gì để học. */
  todayLine: string | null;
  phrase: { jp: string; reading: string; vi: string };
  ctaLabel: string;
}

/** Câu tiếng Nhật của ngày — câu ngắn, thân thiện, dùng được ngay. */
const DAILY_PHRASES: ReadonlyArray<DailyGreeting['phrase']> = [
  { jp: 'がんばって！', reading: 'ganbatte', vi: 'Cố lên nhé!' },
  { jp: 'すこしずつ', reading: 'sukoshi zutsu', vi: 'Từng chút một' },
  { jp: 'おはようございます', reading: 'ohayō gozaimasu', vi: 'Chào buổi sáng' },
  { jp: 'まいにち べんきょうします', reading: 'mainichi benkyō shimasu', vi: 'Mỗi ngày tôi đều học' },
  { jp: 'だいじょうぶ', reading: 'daijōbu', vi: 'Không sao đâu' },
  { jp: 'また あした', reading: 'mata ashita', vi: 'Hẹn gặp lại ngày mai' },
  { jp: 'いっしょに がんばろう', reading: 'issho ni ganbarō', vi: 'Cùng cố gắng nào' },
  { jp: 'たのしいですね', reading: 'tanoshii desu ne', vi: 'Vui nhỉ' },
  { jp: 'ゆっくりで いいよ', reading: 'yukkuri de ii yo', vi: 'Chậm thôi cũng được' },
  { jp: 'できた！', reading: 'dekita!', vi: 'Làm được rồi!' },
  { jp: 'つづけることが だいじ', reading: 'tsuzukeru koto ga daiji', vi: 'Kiên trì mới là điều quan trọng' },
  { jp: 'きょうも よろしく', reading: 'kyō mo yoroshiku', vi: 'Hôm nay cũng nhờ bạn nhé' },
];

/** Từ ngày này tới ngày kia bao nhiêu ngày (theo lịch). */
function daysBetweenKeys(from: string, to: string): number {
  return Math.round((new Date(`${to}T00:00:00Z`).getTime() - new Date(`${from}T00:00:00Z`).getTime()) / 86_400_000);
}

export interface DailyGreetingInput {
  now: Date;
  journeyDay: number;
  dayTitle: string;
  plan: SessionPlanPreview;
  streak: RecallStreak;
  hasNewKnowledge: boolean;
  isReadyToComplete: boolean;
}

export function buildDailyGreeting(input: DailyGreetingInput): DailyGreeting {
  const { now, journeyDay, dayTitle, plan, streak } = input;
  const dateKey = appDateKey(now);
  const yesterday = shiftDateKey(dateKey, -1);
  const daysAway = streak.lastRecallDay ? daysBetweenKeys(streak.lastRecallDay, dateKey) : null;

  let message: string;
  if (input.isReadyToComplete) {
    message = `Bạn đã học hết ngày ${journeyDay} rồi 🎉 Xác nhận hoàn thành là mở được ngày ${journeyDay + 1}.`;
  } else if (daysAway === null) {
    message = journeyDay === 1
      ? 'Hôm nay là ngày đầu tiên của hành trình 90 ngày. Mình bắt đầu từ những chữ cái đầu tiên nhé 🌱'
      : `Hôm nay là ngày ${journeyDay} · ${dayTitle}. Mình bắt đầu nhẹ nhàng nhé.`;
  } else if (daysAway >= 2) {
    message = `Lâu rồi không gặp — ${daysAway} ngày rồi đó. Không sao cả, mình ôn nhẹ những thứ sắp quên trước nhé 🐾`;
  } else if (streak.currentStreak >= 2 && streak.lastRecallDay === yesterday) {
    message = `Chuỗi ${streak.currentStreak} ngày liên tiếp 🔥 Hôm nay học thêm một chút là thành ${streak.currentStreak + 1} ngày!`;
  } else if (!input.hasNewKnowledge) {
    message = `Ngày ${journeyDay} là ngày ôn tập — không có gì mới, chỉ gặp lại những thứ đã học cho thật chắc.`;
  } else {
    message = `Ngày ${journeyDay} · ${dayTitle}. Một ngày mới, một bước nhỏ.`;
  }

  const parts = [
    plan.new ? `${plan.new} thứ mới` : '',
    plan.backlog ? `học bù ${plan.backlog} thứ` : '',
    plan.review ? `ôn ${plan.review} thứ đã học` : '',
  ].filter(Boolean);

  const dayNumber = Math.floor(new Date(`${dateKey}T00:00:00Z`).getTime() / 86_400_000);
  return {
    dateKey,
    message,
    todayLine: parts.length ? `Hôm nay: ${parts.join(' · ')}` : null,
    phrase: DAILY_PHRASES[dayNumber % DAILY_PHRASES.length],
    ctaLabel: input.isReadyToComplete ? 'Xem ngày hôm nay' : plan.new ? 'Bắt đầu học' : 'Ôn ngay',
  };
}
