import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadSeedContent } from '@/lib/data/seed-content';
import { kanjiReadingInWord, kanjiReadingIndex } from '@/features/learning/kanji-context';
import { lessonNumber } from '@/lib/utils/lesson';

/**
 * Lộ trình NekoNeko v3 (docs/INTEGRATION_NEKONEKO_V3.md · scripts/replan_v3.py):
 * chữ cái 1–10 (15–16 chữ/ngày) → bộ thủ 11–13 → bài 1–25 ở ngày 14–81 (số từ mỗi bài theo giáo trình) → tổng ôn & thi thử 82–90.
 */
const content = loadSeedContent();
const LESSON_DAYS = { from: 14, to: 81 };
const FINAL_FIRST_DAY = 82;
const wordsOn = (day: number) => content.vocabulary.filter((word) => word.day === day);

describe('thứ tự giai đoạn', () => {
  it('45 bộ thủ của lộ trình học gọn trong ngày 11–13 (15 bộ/ngày); không ngày nào khác có bộ thủ mới', () => {
    const scheduled = content.radicals.filter((radical) => radical.day !== null);
    expect(scheduled).toHaveLength(45);
    expect([11, 12, 13].map((day) => scheduled.filter((radical) => radical.day === day).length)).toEqual([15, 15, 15]);
    // Ngày bộ thủ chỉ có bộ thủ.
    for (const day of [11, 12, 13]) {
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

  it('không mất kiến thức: đủ 1.085 từ (1.063 từ của bài 1–25 + 22 từ giai đoạn chữ cái), 128 mẫu câu, 103 Kanji — mục nào cũng có ngày', () => {
    expect(content.vocabulary.filter((word) => word.day !== null)).toHaveLength(1085);
    expect(content.vocabulary.filter((word) => Number.isFinite(lessonNumber(word.lesson)))).toHaveLength(1063);
    expect(content.grammar.filter((pattern) => pattern.day !== null)).toHaveLength(128);
    expect(content.kanji.filter((kanji) => kanji.day !== null)).toHaveLength(103);
  });

  it('ngày học vừa sức: tối đa 24 từ, 6 Kanji mới, 3 mẫu câu', () => {
    for (let day = LESSON_DAYS.from; day <= LESSON_DAYS.to; day++) {
      expect(wordsOn(day).length).toBeLessThanOrEqual(24);
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

  it('mọi Kanji N5 đều có từ chứa nó trong bài 1–25 (không còn chữ phải dồn về ngày tổng ôn)', () => {
    const orphans = content.kanji.filter((kanji) => !content.vocabulary.some((word) => word.kanji.includes(kanji.character)));
    expect(orphans.map((kanji) => kanji.character)).toEqual([]);
    expect(content.kanji.every((kanji) => kanji.day! < FINAL_FIRST_DAY)).toBe(true);
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
  const sql = readFileSync(join(process.cwd(), 'supabase/migrations/20261022000001_nekoneko_v3.sql'), 'utf8');
  const mapping = [...sql.match(/insert into _journey_day_map values\s*([^;]+);/)![1].matchAll(/\((\d+), (\d+)\)/g)]
    .map(([, from, to]) => [Number(from), Number(to)] as const);

  it('chạy lại cả file vẫn an toàn: đổi tiến độ nằm trọn trong một khối DO, chỉ chạy một lần', () => {
    const block = sql.slice(sql.indexOf('do $replan_v3$'), sql.indexOf('$replan_v3$;'));
    for (const statement of ['update public.profiles', 'delete from public.journey_day_completions', 'insert into _journey_day_map'])
      expect(block).toContain(statement);
    expect(block).toMatch(/if exists \(select 1 from public\.journey_plan_versions where version = 'nekoneko-v3'\) then\s+return;/);
    expect(sql.slice(sql.indexOf('$replan_v3$;'))).not.toMatch(/_journey_/);
  });

  it('không đụng bảng trí nhớ (memory_items, review_events, learning_sessions, session_items)', () => {
    const code = sql.split('\n').filter((line) => !line.trimStart().startsWith('--')).join('\n');
    for (const table of ['memory_items', 'review_events', 'learning_sessions', 'session_items']) expect(code).not.toContain(table);
  });

  it('ngày cũ → ngày mới: đủ 90 ngày cũ, không bao giờ lùi thứ tự, ngày đích luôn là chữ cái / bộ thủ / đầu một bài / ngày ôn / tổng ôn', () => {
    expect(mapping.map(([from]) => from)).toEqual(Array.from({ length: 90 }, (_, index) => index + 1));
    for (let index = 1; index < mapping.length; index++) expect(mapping[index][1]).toBeGreaterThanOrEqual(mapping[index - 1][1]);
    const journey = content.journeyDays;
    for (const [, to] of mapping) {
      const minna = journey[to - 1].minna;
      expect(to < LESSON_DAYS.from || /\(1\/\d\)$/.test(minna) || minna.startsWith('Ôn') || to >= FINAL_FIRST_DAY).toBe(true);
    }
  });

  it('cột day trong migration khớp đúng dữ liệu seed (cùng id)', () => {
    for (const [table, rows] of [['kana', content.kana], ['kanji', content.kanji], ['grammar', content.grammar], ['vocabulary', content.vocabulary]] as const) {
      const block = sql.split(`update public.${table} as t set day`)[1].split(') as v(id, day)')[0];
      const days = new Map([...block.matchAll(/\((\d+), (\d+|null)\)/g)].map(([, id, day]) => [Number(id), day === 'null' ? null : Number(day)]));
      for (const row of rows) expect(days.get(row.id)).toBe(row.day);
    }
  });
});
