import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadSeedContent } from '@/lib/data/seed-content';
import { kanjiReadingInWord, kanjiReadingIndex } from '@/features/learning/kanji-context';
import { lessonNumber } from '@/lib/utils/lesson';

/**
 * Lộ trình phân bổ lại (docs/ROADMAP_REPLAN.md · scripts/roadmap_adjustments.py — roadmap-replan-v2):
 * chữ cái 1–14 → bộ thủ 15–17 → Minna bài 1–25 ở ngày 18–81 → tổng ôn & thi thử 82–90.
 */
const content = loadSeedContent();
const LESSON_DAYS = { from: 18, to: 81 };
const FINAL_FIRST_DAY = 82;
const ORPHAN_KANJI: string[] = []; // NekoNeko v2: cả 14 chữ trước đây "mồ côi" nay có từ N5 mới chứa nó → học ở ngày của từ
const wordsOn = (day: number) => content.vocabulary.filter((word) => word.day === day);

describe('thứ tự giai đoạn', () => {
  it('45 bộ thủ của lộ trình học gọn trong ngày 15–17 (15 bộ/ngày); không ngày nào khác có bộ thủ mới', () => {
    const scheduled = content.radicals.filter((radical) => radical.day !== null);
    expect(scheduled).toHaveLength(45);
    expect([15, 16, 17].map((day) => scheduled.filter((radical) => radical.day === day).length)).toEqual([15, 15, 15]);
    // Ngày bộ thủ chỉ có bộ thủ.
    for (const day of [15, 16, 17]) {
      expect(wordsOn(day)).toEqual([]);
      expect(content.kanji.filter((kanji) => kanji.day === day)).toEqual([]);
    }
  });

  it('bài 1 → 25 đúng thứ tự giáo trình; mỗi bài nằm trọn trong một khoảng ngày liền nhau, kéo dài 1–4 ngày', () => {
    const lessonOfDay = new Map<number, number>();
    for (const item of [...content.vocabulary, ...content.grammar]) {
      const lesson = lessonNumber(item.lesson);
      if (!Number.isFinite(lesson) || item.day === null || item.day < LESSON_DAYS.from) continue;
      expect(item.day).toBeLessThanOrEqual(LESSON_DAYS.to);
      const existing = lessonOfDay.get(item.day);
      if (existing !== undefined) expect(existing).toBe(lesson); // một ngày chỉ một bài
      lessonOfDay.set(item.day, lesson);
    }
    const ordered = [...lessonOfDay].sort(([left], [right]) => left - right).map(([, lesson]) => lesson);
    expect(ordered).toEqual([...ordered].sort((left, right) => left - right));
    expect([...new Set(ordered)]).toEqual(Array.from({ length: 25 }, (_, index) => index + 1));
    for (let lesson = 1; lesson <= 25; lesson++) {
      const days = [...lessonOfDay].filter(([, value]) => value === lesson).map(([day]) => day);
      expect(days.length).toBeGreaterThanOrEqual(1);
      expect(days.length).toBeLessThanOrEqual(4);
      expect(Math.max(...days) - Math.min(...days) + 1).toBe(days.length); // liền nhau
    }
  });

  it('không mất kiến thức: đủ 978 từ, 128 mẫu câu, 103 Kanji, 45 bộ thủ — mục nào cũng có ngày', () => {
    expect(content.vocabulary.filter((word) => word.day !== null)).toHaveLength(978);
    expect(content.grammar.filter((pattern) => pattern.day !== null)).toHaveLength(128);
    expect(content.kanji.filter((kanji) => kanji.day !== null)).toHaveLength(103);
  });

  // NekoNeko v2: nâng 21 → 26 từ/ngày để xếp đủ 223 từ N5 mới (trung bình ~15 từ/ngày; 16 ngày vượt 20).
  it('ngày học vừa sức: tối đa 26 từ, 6 Kanji mới, 3 mẫu câu', () => {
    for (let day = LESSON_DAYS.from; day <= LESSON_DAYS.to; day++) {
      expect(wordsOn(day).length).toBeLessThanOrEqual(26);
      expect(content.kanji.filter((kanji) => kanji.day === day).length).toBeLessThanOrEqual(6);
      expect(content.grammar.filter((pattern) => pattern.day === day).length).toBeLessThanOrEqual(3);
    }
  });
});

describe('Kanji học cùng ngày với từ vựng chứa nó', () => {
  it('mỗi Kanji của giai đoạn giáo trình nằm trong ít nhất một từ của CHÍNH ngày đó', () => {
    for (const kanji of content.kanji.filter((entry) => entry.day! < FINAL_FIRST_DAY)) {
      expect({ kanji: kanji.character, words: wordsOn(kanji.day!).some((word) => word.kanji.includes(kanji.character)) })
        .toEqual({ kanji: kanji.character, words: true });
    }
  });

  it('Kanji học đúng ngày của từ ĐẦU TIÊN chứa nó — không sớm hơn (chưa có ngữ cảnh), không muộn hơn', () => {
    for (const kanji of content.kanji.filter((entry) => entry.day! < FINAL_FIRST_DAY)) {
      const firstWordDay = Math.min(...content.vocabulary.filter((word) => word.kanji.includes(kanji.character)).map((word) => word.day!));
      expect({ kanji: kanji.character, day: kanji.day }).toEqual({ kanji: kanji.character, day: firstWordDay });
    }
  });

  it('Kanji N5 không có trong từ vựng giáo trình học ở ngày đầu tổng ôn, qua từ ví dụ của dữ liệu Kanji', () => {
    const orphans = content.kanji.filter((kanji) => !content.vocabulary.some((word) => word.kanji.includes(kanji.character)));
    expect(orphans.map((kanji) => kanji.character).sort()).toEqual([...ORPHAN_KANJI].sort());
    for (const kanji of orphans) {
      expect(kanji.day).toBe(FINAL_FIRST_DAY);
      expect(kanji.words.length).toBeGreaterThan(0);
    }
  });
});

describe('cách đọc của Kanji trong từ (suy từ dữ liệu, không đoán)', () => {
  const known = kanjiReadingIndex(content.kanji);
  const kanji = (character: string) => content.kanji.find((entry) => entry.character === character)!;
  const read = (character: string, face: string, kana: string) => kanjiReadingInWord(kanji(character), { kanji: face, kana }, known);

  it('ghép được thì trả cách đọc trong từ, kể cả biến âm (っ, âm đục)', () => {
    expect(read('先', '先生', 'せんせい')).toBe('せん');
    expect(read('生', '先生', 'せんせい')).toBe('せい');
    expect(read('学', '学校', 'がっこう')).toBe('がっ');
    expect(read('口', '出口', 'でぐち')).toBe('ぐち');
    expect(read('飲', '飲み物', 'のみもの')).toBe('の');
  });

  it('đọc đặc biệt hoặc dữ liệu không đủ → null (không đoán sai)', () => {
    expect(read('今', '今日', 'きょう')).toBeNull();
    expect(read('時', '時計', 'とけい')).toBeNull();
    expect(read('入', '入口', 'いりぐち')).toBeNull(); // dữ liệu chỉ có はい(る)・い(れる)
  });
});

describe('migration Supabase giữ trí nhớ và tiến độ', () => {
  const sql = readFileSync(join(process.cwd(), 'supabase/migrations/20261018000001_roadmap_replan_v2.sql'), 'utf8');
  const sqlV2 = readFileSync(join(process.cwd(), 'supabase/migrations/20261021000001_nekoneko_v2.sql'), 'utf8');
  const mapping = [...sql.match(/insert into _journey_day_map values\s*([^;]+);/)![1].matchAll(/\((\d+), (\d+)\)/g)]
    .map(([, from, to]) => [Number(from), Number(to)] as const);

  it('chạy lại cả file vẫn an toàn: đổi tiến độ nằm trọn trong một khối DO, chỉ chạy một lần', () => {
    const block = sql.slice(sql.indexOf('do $replan$'), sql.indexOf('$replan$;'));
    for (const statement of ['update public.profiles', 'delete from public.journey_day_completions', 'insert into _journey_day_map'])
      expect(block).toContain(statement);
    expect(block).toMatch(/if exists \(select 1 from public\.journey_plan_versions where version = 'roadmap-replan-v2'\) then\s+return;/);
    expect(sql.slice(sql.indexOf('$replan$;'))).not.toMatch(/_journey_/);
  });

  it('không đụng bảng trí nhớ (memory_items, review_events, learning_sessions, session_items)', () => {
    const code = sql.split('\n').filter((line) => !line.trimStart().startsWith('--')).join('\n');
    for (const table of ['memory_items', 'review_events', 'learning_sessions', 'session_items']) expect(code).not.toContain(table);
  });

  it('ngày cũ → ngày mới: chữ cái 1–14 không đổi, không bao giờ lùi thứ tự, ngày đích luôn là đầu một bài / ngày ôn / tổng ôn', () => {
    expect(mapping.map(([from]) => from)).toEqual(Array.from({ length: 76 }, (_, index) => index + 15));
    for (let index = 1; index < mapping.length; index++) expect(mapping[index][1]).toBeGreaterThanOrEqual(mapping[index - 1][1]);
    const journey = content.journeyDays;
    for (const [, to] of mapping) {
      const minna = journey[to - 1].minna;
      expect(/\(1\/\d\)$/.test(minna) || minna.startsWith('Ôn') || to >= FINAL_FIRST_DAY).toBe(true);
    }
  });

  it('cột day trong migration khớp đúng dữ liệu seed (cùng id)', () => {
    for (const [table, rows] of [['kanji', content.kanji], ['grammar', content.grammar]] as const) {
      const block = sql.split(`update public.${table} as t set day`)[1].split(') as v(id, day)')[0];
      const days = new Map([...block.matchAll(/\((\d+), (\d+|null)\)/g)].map(([, id, day]) => [Number(id), day === 'null' ? null : Number(day)]));
      const later = sqlV2.split(`update public.${table} as t set day`)[1]?.split(') as v(id, day)')[0] ?? '';
      for (const [, id, day] of later.matchAll(/\((\d+), (\d+|null)\)/g)) days.set(Number(id), day === 'null' ? null : Number(day)); // migration sau ghi đè
      for (const row of rows) if (days.has(row.id)) expect(days.get(row.id)).toBe(row.day); // id mới (113+) nằm ở migration bổ sung
    }
  });
});
