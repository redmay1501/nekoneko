"""
Kiểm duyệt câu ví dụ (2026-11-18): bỏ câu Tatoeba không phù hợp (tục / thô / sai ngữ pháp / dịch sai / văn cổ ngoài N5),
sửa bản dịch sai, sửa 3 câu NekoNeko, thêm câu NekoNeko tự nhiên thay cho câu bị bỏ (cùng từ cần ví dụ).
Đọc content/source/example-sentence-review.json → ghi content/seed/examples.json, content/seed/examples-nekoneko.json và
supabase/migrations/20261118000002_example_sentence_review.sql (bảng example_sentences trên production).

    python3 scripts/apply_example_review.py
Chạy lại an toàn (câu đã bỏ thì bỏ qua, câu thêm nhận theo nội dung).
"""
import json, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REVIEW = os.path.join(ROOT, "content", "source", "example-sentence-review.json")
TATOEBA = os.path.join(ROOT, "content", "seed", "examples.json")
NEKO = os.path.join(ROOT, "content", "seed", "examples-nekoneko.json")
OUT = os.path.join(ROOT, "supabase", "migrations", "20261118000002_example_sentence_review.sql")


def q(text):
    return "null" if text is None else "'" + str(text).replace("'", "''") + "'"


def save(path, data):
    json.dump(data, open(path, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    open(path, "a", encoding="utf-8").write("\n")


def main():
    review = json.load(open(REVIEW, encoding="utf-8"))
    tatoeba, neko = json.load(open(TATOEBA, encoding="utf-8")), json.load(open(NEKO, encoding="utf-8"))
    removed = {r["id"] for r in review["remove"]}
    tatoeba["sentences"] = [s for s in tatoeba["sentences"] if s["id"] not in removed]
    by_id = {s["id"]: s for s in tatoeba["sentences"] + neko["sentences"]}
    for fix in review["translations"]:
        by_id[fix["id"]]["vi"] = fix["vi"]
        by_id[fix["id"]]["viOwner"] = "NekoNeko"   # bản dịch đã sửa — không còn là bản dịch gốc của Tatoeba
        by_id[fix["id"]]["viId"] = None
    for edit in review["nekonekoEdits"]:
        for key in ("jp", "vi"):
            if key in edit:
                by_id[edit["id"]][key] = edit[key]
    existing = {s["jp"] for s in neko["sentences"]}
    next_id = max(s["id"] for s in neko["sentences"]) + 1
    added = []
    for entry in review["add"]:
        if entry["jp"] in existing:
            continue
        sentence = {"id": next_id, "jp": entry["jp"], "vi": entry["vi"], "viId": None, "owner": "NekoNeko", "viOwner": "NekoNeko"}
        neko["sentences"].append(sentence)
        added.append(sentence)
        next_id += 1
    save(TATOEBA, tatoeba)
    save(NEKO, neko)

    changed = [by_id[f["id"]] for f in review["translations"]] + [by_id[e["id"]] for e in review["nekonekoEdits"]]
    added_all = [s for s in neko["sentences"] if s["jp"] in {a["jp"] for a in review["add"]}]
    upserts = ",\n".join(f"  ({s['id']}, {q(s['jp'])}, {q(s['vi'])}, {q(s.get('viId'))}, {q(s['owner'])}, {q(s['viOwner'])})" for s in changed + added_all)
    sql = f"""-- ═══════════════════════════════════════════════════════════════════
--  Kiểm duyệt câu ví dụ — content/source/example-sentence-review.json (lý do từng câu)
--  Bỏ {len(removed)} câu Tatoeba không phù hợp, sửa bản dịch / câu sai, thêm câu NekoNeko thay thế.
--  Sinh tự động bằng scripts/apply_example_review.py — đừng sửa tay.
-- ═══════════════════════════════════════════════════════════════════
begin;
delete from public.example_sentences where id in ({', '.join(str(i) for i in sorted(removed))});
insert into public.example_sentences (id, text_jp, text_vi, vi_id, owner, vi_owner) values
{upserts}
on conflict (id) do update set text_jp = excluded.text_jp, text_vi = excluded.text_vi, vi_id = excluded.vi_id,
  owner = excluded.owner, vi_owner = excluded.vi_owner;
commit;
"""
    open(OUT, "w", encoding="utf-8").write(sql)
    print(f"Bỏ {len(removed)} câu, sửa {len(changed)}, thêm {len(added)} (tổng thay thế {len(added_all)}). Đã ghi {os.path.relpath(OUT, ROOT)}")


if __name__ == "__main__":
    main()
