"""
Sinh supabase/migrations/20261022000001_nekoneko_v3.sql từ content/seed/n5-content.json SAU khi chạy scripts/replan_v3.py.

Migration làm đúng như roadmap-replan-v2 (cùng cấu trúc, cùng cách giữ tiến độ):
  - kana / radicals / kanji / vocabulary / grammar: CHỈ cột day, theo id (nội dung, mẹo, nhãn bài mới vào bằng `npm run seed:content`);
  - journey_days + day_tasks: thay toàn bộ 90 ngày;
  - lessons: khoảng ngày, số ngày, số từ / mẫu;
  - profiles.current_day + journey_day_completions: đổi ngày cũ → ngày mới theo content/source/nekoneko-v3-day-map.json,
    chạy MỘT lần (journey_plan_versions = 'nekoneko-v3').
  - Bảng trí nhớ (memory_items, review_events, learning_sessions, session_items) KHÔNG đụng.

Chạy: python3 scripts/make_migration_v3.py
"""
import json, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONTENT = os.path.join(ROOT, "content", "seed", "n5-content.json")
DAY_MAP = os.path.join(ROOT, "content", "source", "nekoneko-v3-day-map.json")
OUT = os.path.join(ROOT, "supabase", "migrations", "20261022000001_nekoneko_v3.sql")


def q(text):
    return "'" + str(text).replace("'", "''") + "'"


def day_update(table, rows):
    values = ",\n".join(f"  ({r['id']}, {'null' if r['day'] is None else r['day']})" for r in sorted(rows, key=lambda r: r["id"]))
    return (f"update public.{table} as t set day = v.day from (values\n{values}\n"
            f") as v(id, day) where t.id = v.id and t.day is distinct from v.day::int;\n")


def main():
    data = json.load(open(CONTENT, encoding="utf-8"))
    assert "nekoneko-v3" in data["meta"].get("adjustments", []), "chạy scripts/replan_v3.py trước"
    day_map = {int(k): v for k, v in json.load(open(DAY_MAP, encoding="utf-8"))["map"].items()}
    radicals = [r for r in data["radicals"] if r.get("day") is not None]
    out = ["""-- ═══════════════════════════════════════════════════════════════════
--  Lộ trình N5 NekoNeko v3 — docs/INTEGRATION_NEKONEKO_V3.md, scripts/replan_v3.py
--
--  Chữ cái 1–10 (15–16 chữ/ngày) → bộ thủ 11–13 → bài 1–25 ở ngày 14–81 (số từ mỗi bài theo giáo trình,
--  1.063 từ; Kanji cùng ngày với từ đầu tiên chứa nó) → tổng ôn & thi thử 82–90.
--
--  Chỉ đổi DỮ LIỆU nội dung, không đổi cấu trúc bảng:
--    - kana / radicals / kanji / vocabulary / grammar: CHỈ cột day, theo id. Nội dung, mẹo nhớ, nhãn bài, từ mới và
--      16 mẫu câu mới vào bằng `npm run seed:content` (chạy NGAY SAU migration này);
--    - journey_days, day_tasks: thay bằng 90 ngày mới;
--    - lessons: khoảng ngày, số ngày, số từ / mẫu thật;
--    - profiles.current_day và journey_day_completions: đổi số ngày cũ → ngày mới (đầu bài đang học),
--      chạy một lần (journey_plan_versions = 'nekoneko-v3').
--  Bảng trí nhớ (memory_items, review_events, learning_sessions…) gắn theo id kiến thức → KHÔNG đụng.
--  Sinh tự động bằng scripts/make_migration_v3.py — đừng sửa tay.
-- ═══════════════════════════════════════════════════════════════════

begin;
"""]
    out.append(day_update("kana", data["kana"]))
    out.append(day_update("radicals", radicals))
    out.append(day_update("kanji", data["kanji"]))
    out.append(day_update("vocabulary", data["vocabulary"]))
    out.append(day_update("grammar", data["grammar"]))
    out.append("-- Lịch ngày + việc của ngày: thay toàn bộ (day_tasks xoá theo cascade).\ndelete from public.journey_days;\n")
    rows = ",\n".join(
        f"  ({d['day']}, {d['week']}, {q(d['stage'])}, {q(d['minna'])}, {q(d['title'])}, {q(d['kanjiSummary'])}, {q(d['radicalSummary'])}, "
        f"{q(d['grammarSummary'])}, {q(d['vocabSummary'])}, {q(d['skill'])}, {d['minutes']})" for d in data["journeyDays"])
    out.append("insert into public.journey_days (day, week, stage, minna, title, kanji_summary, radical_summary, grammar_summary, "
               f"vocab_summary, skill, minutes) values\n{rows};\n")
    tasks = ",\n".join(f"  ({t['day']}, {t['orderNo']}, {q(t['label'])}, {q(t['body'])}, {t['minutes']})"
                       for t in sorted(data["dayTasks"], key=lambda t: (t["day"], t["orderNo"])))
    out.append(f"insert into public.day_tasks (day, order_no, label, body, minutes) values\n{tasks};\n")
    lessons = ",\n".join(f"  ({q(l['id'])}, {q(l['dayRange'])}, {l['dayCount']}, {q(l['vocabCount'])}, {q(l['grammarCount'])})" for l in data["lessons"])
    out.append("update public.lessons as t set day_range = v.day_range, day_count = v.day_count, vocab_count = v.vocab_count, "
               f"grammar_count = v.grammar_count from (values\n{lessons}\n) as v(id, day_range, day_count, vocab_count, grammar_count) where t.id = v.id;\n")
    mapping = ", ".join(f"({old}, {new})" for old, new in sorted(day_map.items()))
    out.append(f"""-- Tiến độ người học: ngày cũ → ngày mới (đầu bài đang học, không lùi về trước, không tự đánh dấu phần chưa học).
do $replan_v3$
begin
  create table if not exists public.journey_plan_versions (
    version     text primary key,
    applied_at  timestamptz not null default now()
  );
  alter table public.journey_plan_versions enable row level security;
  if exists (select 1 from public.journey_plan_versions where version = 'nekoneko-v3') then
    return;
  end if;

  drop table if exists pg_temp._journey_day_map;
  create temporary table _journey_day_map (old_day int primary key, new_day int not null);
  insert into _journey_day_map values
  {mapping};

  update public.profiles as p set current_day = m.new_day
    from _journey_day_map m where p.current_day = m.old_day;

  -- Nhật ký ngày đã xong: dời sang ngày mới; nhiều ngày cũ gộp vào một ngày mới → giữ lần xong SỚM nhất.
  -- Ngày mới chỉ được coi là xong khi MỌI ngày cũ gộp vào nó đã xong.
  drop table if exists pg_temp._journey_moved_completions;
  create temporary table _journey_moved_completions as
    select c.user_id, m.new_day as day, min(c.method) as method, min(c.completed_at) as completed_at
    from public.journey_day_completions c join _journey_day_map m on m.old_day = c.day
    group by c.user_id, m.new_day
    having count(*) = (select count(*) from _journey_day_map m2 where m2.new_day = m.new_day);
  delete from public.journey_day_completions c using _journey_day_map m where c.day = m.old_day;
  insert into public.journey_day_completions (user_id, day, method, completed_at)
    select user_id, day, method, completed_at from _journey_moved_completions
    on conflict (user_id, day) do nothing;

  insert into public.journey_plan_versions (version) values ('nekoneko-v3');
  drop table _journey_moved_completions;
  drop table _journey_day_map;
end
$replan_v3$;

commit;
""")
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    open(OUT, "w", encoding="utf-8").write("\n".join(out))
    print("Đã ghi", os.path.relpath(OUT, ROOT))


if __name__ == "__main__":
    main()
