"""
Audit từ vựng N5 theo Minna no Nihongo (2026-11-18) — docs/N5_VOCABULARY_COMPLETENESS_AUDIT.md.

    python3 scripts/apply_vocabulary_audit.py      # áp dụng lên content/seed/n5-content.json

Đọc content/source/minna-vocabulary-audit.json:
  • moves  — từ đã có nhưng gán SAU bài Minna dạy nó lần đầu → chuyển về đúng bài (giữ id → trí nhớ người học giữ nguyên);
  • new    — từ của danh mục Minna còn thiếu (đã xác minh) → thêm (id mới, nối tiếp);
  • minnaOrder — thứ tự từ trong danh mục mỗi bài.
Không xoá từ nào. Mỗi bài GIỮ NGUYÊN số ngày và khoảng ngày (không đổi lộ trình 90 ngày, không cần đổi tiến độ người học):
từ của giáo trình (theo thứ tự danh mục) học trước, rồi tới từ N5 bổ sung; Kanji vẫn học đúng ngày của từ ĐẦU TIÊN chứa nó
(≤ 6 Kanji mới mỗi ngày). Nhiệm vụ ngày (語 Từ vựng, 漢 Kanji), tóm tắt ngày và số từ mỗi bài được sinh lại cho khớp.
Chạy lại lần 2 không làm gì (meta.adjustments có "minna-vocabulary-audit").
"""
import json, os, re, sys
from collections import defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# Không giới hạn số từ mỗi ngày theo thời gian học (người học tự cân đối); vẫn giữ trần an toàn để không dồn cả bài vào một ngày.
os.environ.setdefault("NEKO_MAX_WORDS", "40")
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import replan_v3  # noqa: E402
from replan_v3 import split_words, lesson_label_maps, MAX_KANJI, MAX_WORDS  # noqa: E402
from roadmap_adjustments import MINUTES, _kanji_line, _task, _lesson_no, _kanji_chars  # noqa: E402

CONTENT = os.path.join(ROOT, "content", "seed", "n5-content.json")
AUDIT = os.path.join(ROOT, "content", "source", "minna-vocabulary-audit.json")
NAME = "minna-vocabulary-audit"
VOCAB_LABEL, KANJI_LABEL = "語  Từ vựng", "漢  Kanji"


def norm(text):
    return re.sub(r"[〜～\s\[\]()（）、]", "", text or "")


def forms(word):
    return {norm(p) for raw in (word.get("kanji") or "", word["kana"]) for p in re.split(r"[／/・]", raw) if norm(p)}


def balanced_days(words, parts, seen, known):
    """Chia `words` (đã xếp thứ tự học) vào `parts` ngày, số từ đều nhau; từ nào làm ngày đang xếp vượt MAX_KANJI Kanji
    mới thì dời sang ngày sau (giữ thứ tự các từ còn lại). Trả về None nếu không xếp được."""
    seen, queue, groups = set(seen), list(words), []
    for index in range(parts):
        remaining_days = parts - index
        target = -(-len(queue) // remaining_days)
        group, deferred, fresh_today = [], [], set()
        while queue and len(group) < target:
            word = queue.pop(0)
            fresh = {c for c in _kanji_chars(word, known) if c not in seen and c not in fresh_today}
            if remaining_days > 1 and len(fresh_today | fresh) > MAX_KANJI:
                deferred.append(word)
                continue
            fresh_today |= fresh
            group.append(word)
        queue = deferred + queue
        seen |= fresh_today
        groups.append(group)
        if len(fresh_today) > MAX_KANJI or len(group) > MAX_WORDS:
            return None
    return groups if not queue else None


def main():
    data = json.load(open(CONTENT, encoding="utf-8"))
    applied = data.setdefault("meta", {}).setdefault("adjustments", [])
    if NAME in applied:
        print("Đã áp dụng trước đó — không làm gì.")
        return
    audit = json.load(open(AUDIT, encoding="utf-8"))
    vocab, kanji_list = data["vocabulary"], data["kanji"]
    vocab_label, _ = lesson_label_maps(data)
    by_id = {w["id"]: w for w in vocab}

    # ── 1. Chuyển bài + thêm từ ──
    for move in audit["moves"]:
        word = by_id[move["id"]]
        assert _lesson_no(word["lesson"]) != move["lesson"], f"#{move['id']} đã ở bài {move['lesson']}"
        word["lesson"] = vocab_label[move["lesson"]]
    existing = set().union(*(forms(w) for w in vocab))
    next_id = max(by_id) + 1
    for entry in audit["new"]:
        word = {"id": next_id, "kana": entry["kana"], "kanji": entry["kanji"], "meaning": entry["meaning"], "tip": entry["tip"],
                "lesson": vocab_label[entry["lesson"]], "day": None}
        assert not (forms(word) & existing) or entry["kana"] in ("かえます",), f"từ đã có: {entry['kana']} {entry['kanji']}"
        vocab.append(word)
        next_id += 1

    # ── 2. Chia lại từng bài trong đúng các ngày của bài ──
    lesson_days = defaultdict(list)
    for row in data["journeyDays"]:
        m = re.match(r"Bài (\d+) \((\d+)/(\d+)\)", row["minna"] or "")
        if m:
            lesson_days[int(m.group(1))].append(row["day"])
    known = {k["character"] for k in kanji_list}
    kanji_by_char = {k["character"]: k for k in kanji_list}
    kana_stage_last = min(min(days) for days in lesson_days.values()) - 1
    seen, plan = set(), {}
    for n in range(1, 26):
        days = sorted(lesson_days[n])
        words = [w for w in vocab if _lesson_no(w["lesson"]) == n and not (w["day"] is not None and w["day"] <= kana_stage_last)]
        order = {}
        for i, entry in enumerate(audit["minnaOrder"][str(n)]):
            for f in entry.split("|"):
                order.setdefault(norm(f), i)
        rank = lambda w: min((order[f] for f in forms(w) if f in order), default=None)
        textbook = sorted((w for w in words if rank(w) is not None), key=lambda w: (rank(w), w["id"]))
        extra = sorted((w for w in words if rank(w) is None), key=lambda w: (w["day"] or 999, w["id"]))
        ordered = textbook + extra
        groups = split_words(ordered, len(days), seen, known)
        if any(len({c for w in g for c in _kanji_chars(w, known)} - seen - {c for h in groups[:i] for w in h for c in _kanji_chars(w, known)}) > MAX_KANJI
               for i, g in enumerate(groups)):
            groups = balanced_days(ordered, len(days), seen, known) or groups
        for day, group in zip(days, groups):
            fresh = []
            for w in group:
                w["day"] = day
                for c in _kanji_chars(w, known):
                    if c not in seen:
                        seen.add(c)
                        fresh.append(c)
            for c in fresh:
                kanji_by_char[c]["day"] = day
            plan[day] = {"lesson": n, "words": group, "kanji": fresh}
            if len(group) > MAX_WORDS or len(fresh) > MAX_KANJI:
                raise SystemExit(f"Bài {n}, ngày {day}: {len(group)} từ, {len(fresh)} Kanji — vượt trần")
    orphan = [k for k in kanji_list if k["character"] not in seen]
    assert not orphan, f"Kanji không còn từ nào chứa: {''.join(k['character'] for k in orphan)}"

    # ── 3. Nhiệm vụ ngày + tóm tắt ngày ──
    rows = {r["day"]: r for r in data["journeyDays"]}
    tasks_of = defaultdict(list)
    for t in sorted(data["dayTasks"], key=lambda t: (t["day"], t["orderNo"])):
        tasks_of[t["day"]].append(t)
    words_with = lambda char, words: [w for w in words if char in (w.get("kanji") or "")]
    for day, e in plan.items():
        n = e["lesson"]
        vocab_task = _task(day, VOCAB_LABEL, MINUTES["word"] * len(e["words"]) + 3,
                           f"Từ mới Minna bài {n}:\n" + "\n".join(f"• {w['kana']}" + (f"（{w['kanji']}）" if w["kanji"] else "") + f" = {w['meaning']}" for w in e["words"]))
        kanji_task = None
        if e["kanji"]:
            body = [f"Học {len(e['kanji'])} chữ Kanji ngay trong từ của hôm nay — nhớ cách đọc trong từ trước, chưa cần thuộc mọi âm đọc."]
            body += [_kanji_line(kanji_by_char[c], words_with(c, e["words"])) for c in e["kanji"]]
            kanji_task = _task(day, KANJI_LABEL, MINUTES["kanji"] * len(e["kanji"]), "\n".join(body))
        old = [t for t in tasks_of[day] if t["label"] not in (VOCAB_LABEL, KANJI_LABEL)]
        # Thứ tự cũ: Khởi động → Từ vựng → Kanji → Ngữ pháp → việc tự học.
        new_tasks = old[:1] + [vocab_task] + ([kanji_task] if kanji_task else []) + old[1:]
        for i, t in enumerate(new_tasks, 1):
            t["day"], t["orderNo"] = day, i
        tasks_of[day] = new_tasks
        rows[day]["vocabSummary"] = f"{len(e['words'])} từ"
        rows[day]["kanjiSummary"] = "、".join(e["kanji"]) or "—"
        rows[day]["minutes"] = sum(t["minutes"] for t in new_tasks)

    # Ngày ôn: danh sách Kanji của các bài được ôn.
    for day, row in rows.items():
        m = re.match(r"Ôn bài (\d+)(?:–(\d+))?", row["minna"] or "")
        if not m:
            continue
        first, last = int(m.group(1)), int(m.group(2) or m.group(1))
        review_kanji = [c for d, e in sorted(plan.items()) if first <= e["lesson"] <= last for c in e["kanji"]]
        span = f"bài {first}–{last}" if first != last else f"bài {first}"
        for t in tasks_of[day]:
            if t["label"] == KANJI_LABEL:
                t["body"] = (f"Ôn {len(review_kanji)} chữ Kanji của Minna {span} qua từ chứa nó: che nghĩa → đọc từ, che từ → nhớ chữ. "
                             f"Trong app, đánh dấu chữ còn mờ.\n" + " ・ ".join(review_kanji))
    data["dayTasks"] = [t for day in sorted(tasks_of) for t in tasks_of[day]]

    # ── 4. Bảng bài: số từ thật ──
    for lesson in data["lessons"]:
        n = int(re.search(r"\d+", lesson["id"]).group())
        lesson["vocabCount"] = f"{sum(1 for w in vocab if _lesson_no(w['lesson']) == n)} từ"

    applied.append(NAME)
    json.dump(data, open(CONTENT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    per_day = sorted(((len(e["words"]), len(e["kanji"]), d) for d, e in plan.items()), reverse=True)
    print(f"Xong: {len(vocab)} từ (+{len(audit['new'])} từ mới, {len(audit['moves'])} từ chuyển bài). "
          f"Ngày nặng nhất: {per_day[0][0]} từ (ngày {per_day[0][2]}); Kanji tối đa {max(k for _, k, _ in per_day)}/ngày.")
    print("Số từ mỗi bài:", " ".join(f"B{n}:{sum(1 for w in vocab if _lesson_no(w['lesson']) == n)}" for n in range(1, 26)))


if __name__ == "__main__":
    main()
