"""
Sinh supabase/migrations/20261118000001_minna_vocabulary_audit.sql từ content/seed/n5-content.json SAU khi chạy
scripts/apply_vocabulary_audit.py (docs/N5_VOCABULARY_COMPLETENESS_AUDIT.md).

  - vocabulary: thêm từ mới (id nối tiếp, đủ cột) + cập nhật nhãn bài và ngày theo id;
  - kanji: cột day (Kanji học cùng ngày với từ đầu tiên chứa nó);
  - journey_days: tóm tắt Kanji / từ và số phút (khung 90 ngày GIỮ NGUYÊN → không đổi tiến độ người học);
  - day_tasks: thay toàn bộ;
  - lessons: số từ thật mỗi bài.
  Bảng trí nhớ (memory_items, review_events, learning_sessions, session_items) KHÔNG đụng.

Chạy: python3 scripts/make_migration_vocabulary_audit.py
"""
import json, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONTENT = os.path.join(ROOT, "content", "seed", "n5-content.json")
AUDIT = os.path.join(ROOT, "content", "source", "minna-vocabulary-audit.json")
OUT = os.path.join(ROOT, "supabase", "migrations", "20261118000001_minna_vocabulary_audit.sql")
FIRST_NEW_ID = 1097


def q(text):
    return "'" + str(text).replace("'", "''") + "'"


def main():
    data = json.load(open(CONTENT, encoding="utf-8"))
    assert "minna-vocabulary-audit" in data["meta"].get("adjustments", []), "chạy scripts/apply_vocabulary_audit.py trước"
    vocab = sorted(data["vocabulary"], key=lambda w: w["id"])
    new = [w for w in vocab if w["id"] >= FIRST_NEW_ID]
    assert len(new) == len(json.load(open(AUDIT, encoding="utf-8"))["new"])
    out = ["""-- ═══════════════════════════════════════════════════════════════════
--  Audit từ vựng N5 theo Minna no Nihongo — docs/N5_VOCABULARY_COMPLETENESS_AUDIT.md
--
--  Thêm các từ của danh mục Minna còn thiếu, chuyển các từ đang gán sai bài về đúng bài giáo trình, chia lại
--  từ trong CÙNG các ngày của mỗi bài (khung 90 ngày không đổi), Kanji vẫn học cùng ngày với từ đầu tiên chứa nó.
--  Chỉ đổi DỮ LIỆU nội dung. Không xoá từ nào. Bảng trí nhớ gắn theo id kiến thức → KHÔNG đụng.
--  Sinh tự động bằng scripts/make_migration_vocabulary_audit.py — đừng sửa tay.
-- ═══════════════════════════════════════════════════════════════════

begin;
"""]
    rows = ",\n".join(f"  ({w['id']}, {q(w['kana'])}, {q(w['kanji'] or '')}, {q(w['meaning'])}, {q(w['tip'])}, {q(w['lesson'])}, {w['day']})" for w in new)
    out.append("insert into public.vocabulary (id, kana, kanji, meaning, tip, lesson, day) values\n"
               f"{rows}\non conflict (id) do update set kana = excluded.kana, kanji = excluded.kanji, meaning = excluded.meaning, "
               "tip = excluded.tip, lesson = excluded.lesson, day = excluded.day;\n")
    values = ",\n".join(f"  ({w['id']}, {q(w['lesson'])}, {'null' if w['day'] is None else w['day']})" for w in vocab)
    out.append("update public.vocabulary as t set lesson = v.lesson, day = v.day::int from (values\n"
               f"{values}\n) as v(id, lesson, day) where t.id = v.id and (t.lesson is distinct from v.lesson or t.day is distinct from v.day::int);\n")
    values = ",\n".join(f"  ({k['id']}, {'null' if k['day'] is None else k['day']})" for k in sorted(data["kanji"], key=lambda k: k["id"]))
    out.append(f"update public.kanji as t set day = v.day from (values\n{values}\n) as v(id, day) where t.id = v.id and t.day is distinct from v.day::int;\n")
    values = ",\n".join(f"  ({d['day']}, {q(d['kanjiSummary'])}, {q(d['vocabSummary'])}, {d['minutes']})" for d in data["journeyDays"])
    out.append("update public.journey_days as t set kanji_summary = v.kanji_summary, vocab_summary = v.vocab_summary, minutes = v.minutes "
               f"from (values\n{values}\n) as v(day, kanji_summary, vocab_summary, minutes) where t.day = v.day;\n")
    tasks = ",\n".join(f"  ({t['day']}, {t['orderNo']}, {q(t['label'])}, {q(t['body'])}, {t['minutes']})"
                       for t in sorted(data["dayTasks"], key=lambda t: (t["day"], t["orderNo"])))
    out.append(f"delete from public.day_tasks;\ninsert into public.day_tasks (day, order_no, label, body, minutes) values\n{tasks};\n")
    lessons = ",\n".join(f"  ({q(l['id'])}, {q(l['vocabCount'])})" for l in data["lessons"])
    out.append(f"update public.lessons as t set vocab_count = v.vocab_count from (values\n{lessons}\n) as v(id, vocab_count) where t.id = v.id;\n")
    out.append("commit;\n")
    open(OUT, "w", encoding="utf-8").write("\n".join(out))
    print("Đã ghi", os.path.relpath(OUT, ROOT), f"({len(new)} từ mới)")


if __name__ == "__main__":
    main()
