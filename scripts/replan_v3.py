"""
NekoNeko v3 — chia lại lộ trình 90 ngày trên content/seed/n5-content.json ĐANG DÙNG.

  • Chữ cái: 10 ngày thay vì 14 — mỗi ngày học trọn 15–16 âm (あかさ / たなは / まやらわん), rồi âm đục, âm ghép;
    Katakana lặp lại y như vậy ở ngày 6–10.
  • Bộ thủ: 3 ngày (15 bộ/ngày) — ngày 11–13.
  • Bài 1–25: từ ngày 14, số từ mỗi bài đúng số từ của giáo trình (tổng 1.063, đọc từ content/source/nekoneko-v3.json),
    ≤ 22 từ / 6 Kanji / 3 mẫu câu mỗi ngày; Kanji học đúng ngày của từ ĐẦU TIÊN chứa nó; ngày ôn xen kẽ ở ranh giới bài.
  • Tổng ôn & thi thử: 9 ngày cuối (82–90), giữ nguyên nội dung.
  • Không đổi id của mục cũ → bảng trí nhớ giữ nguyên. Ghi bảng ánh xạ ngày cũ → mới để migration chuyển tiến độ.

Chạy (đặt cạnh roadmap_adjustments.py):
    python3 scripts/replan_v3.py
Ghi đè: content/seed/n5-content.json, content/seed/reading-passages.json (cột day),
        content/source/nekoneko-v3-day-map.json (ánh xạ ngày cũ → mới, dùng cho migration).
Chạy lại lần 2 không làm gì (meta.adjustments có "nekoneko-v3").
"""
import json, math, os, re, sys
from collections import Counter, defaultdict

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from roadmap_adjustments import MINUTES, SELF_TASK_GLYPHS, LESSON_WARMUP, _kanji_line, _task, _lesson_no, _kanji_chars  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONTENT = os.path.join(ROOT, "content", "seed", "n5-content.json")
PASSAGES = os.path.join(ROOT, "content", "seed", "reading-passages.json")
EXTRA = os.path.join(ROOT, "content", "source", "nekoneko-v3.json")
DAY_MAP = os.path.join(ROOT, "content", "source", "nekoneko-v3-day-map.json")
NAME = "nekoneko-v3"

TOTAL_DAYS = 90
OLD_KANA_DAYS, OLD_RADICAL_DAYS = 14, (15, 16, 17)
KANA_GROUPS = [  # (ngày Hiragana, id kana từ…tới, tên hàng) — Katakana = +5 ngày
    (1, 1, 15, "あ・か・さ"), (2, 16, 30, "た・な・は"), (3, 31, 46, "ま・や・ら・わ・ん"), (4, 47, 71, None), (5, 72, 104, None)]
KATAKANA_OFFSET = 5
KANA_DAYS = 10
RADICAL_DAYS = [11, 12, 13]
FIRST_LESSON_DAY = 14
FINAL_DAYS = 9                      # 82–90, giữ nguyên nội dung
MAX_WORDS, MAX_KANJI, MAX_GRAMMAR, MAX_LESSON_DAYS = int(os.environ.get("NEKO_MAX_WORDS", 24)), 6, 3, 4
MAX_KANA_WORDS = 7                  # từ học trong giai đoạn chữ cái, tối đa mỗi ngày
LEARN_MINUTES = {"learn": 35, "write": 35, "check": 20}   # ngày 15–16 âm (trước: 25/25/15 cho 10 âm)


def lesson_label_maps(data):
    vocab_label, grammar_label = {}, {}
    for w in data["vocabulary"]:
        n = _lesson_no(w["lesson"])
        if n and re.search(r"\(\d+ từ\)$", w["lesson"]):
            vocab_label.setdefault(n, w["lesson"])
    for g in data["grammar"]:
        grammar_label.setdefault(_lesson_no(g["lesson"]), g["lesson"])
    return vocab_label, grammar_label


# ── Kana ──────────────────────────────────────────────────────────────
SMALL = {"ゃ": "や", "ゅ": "ゆ", "ょ": "よ", "っ": "つ", "ャ": "ヤ", "ュ": "ユ", "ョ": "ヨ", "ッ": "ツ",
         "ぁ": "あ", "ぃ": "い", "ぅ": "う", "ぇ": "え", "ぉ": "お", "ァ": "ア", "ィ": "イ", "ゥ": "ウ", "ェ": "エ", "ォ": "オ"}


def kana_known_by(kana_list):
    """chữ → ngày học (Hiragana theo cột day, Katakana +5). Chữ nhỏ ゃゅょっ… học ở ngày âm ghép."""
    known = {"ー": 1, "・": 1, " ": 1, "　": 1, "〜": 1, "～": 1}
    for k in kana_list:
        for face, offset in ((k["hiragana"], 0), (k["katakana"], KATAKANA_OFFSET)):
            day = k["day"] + offset
            if len(face) == 1:
                known[face] = min(known.get(face, 99), day)
            else:  # âm ghép: chữ nhỏ thứ hai học ở ngày âm ghép
                known[face[1]] = min(known.get(face[1], 99), day)
    for small, base in SMALL.items():
        if small not in known and base in known:
            known[small] = 5 if small in "ぁぃぅぇぉっ" else 10
    return known


def learn_body(kanas, rows, katakana):
    face = "katakana" if katakana else "hiragana"
    listing = "  ".join(f"{k[face]} ({'o' if k[face] in 'をヲ' else k['romaji']})" for k in kanas)
    notes = []
    chars = {k[face] for k in kanas}
    if {"を", "ん"} & chars:
        notes.append("を đọc là o. ん là một nhịp riêng, không phải na.")
    if {"ヲ", "ン"} & chars:
        notes.append("ヲ đọc là o, giống を. Phân biệt ン (nét nghiêng lên) và ソ (nét rơi xuống).")
    if {"シ", "ツ"} & chars:
        notes.append("Phân biệt シ (2 chấm ngang, nét cuối hất lên) và ツ (2 chấm dọc, nét cuối rơi xuống).")
    special = [f"{c} = {r}" for c, r in (("し", "shi"), ("ち", "chi"), ("つ", "tsu"), ("ふ", "fu")) if c in chars]
    if special:
        notes.append(", ".join(special) + " — đọc khác quy luật hàng.")
    return f"Học {len(kanas)} âm — trọn hàng {rows}: {listing}. " + (" ".join(notes) + " " if notes else "") + "Xem thứ tự nét trước khi viết."


def words_listing(words):
    return " ・ ".join(f"{w['kanji'] or w['kana']} ({w['meaning'][:1].lower() + w['meaning'][1:]})" for w in words)


# ── Chia bài ──────────────────────────────────────────────────────────
def split_words(words, parts, seen, known):
    """Cắt từ (giữ thứ tự) thành `parts` nhóm liền nhau; tải = từ + 2 × Kanji mới, lớn nhất nhỏ nhất."""
    seen = set(seen)
    fresh_counts = []
    for word in words:
        fresh = [c for c in _kanji_chars(word, known) if c not in seen]
        seen.update(fresh)
        fresh_counts.append(len(fresh))

    def load(a, b):
        kanji = sum(fresh_counts[a:b])
        over = kanji > MAX_KANJI or (b - a) > MAX_WORDS
        return (b - a) + 2 * kanji + (1000 if over else 0)

    memo = {}

    def best(i, k):
        if (i, k) not in memo:
            if k == 1:
                memo[(i, k)] = (load(i, len(words)), (len(words),))
            else:
                memo[(i, k)] = min(((max(load(i, j), best(j, k - 1)[0]), (j,) + best(j, k - 1)[1])
                                    for j in range(i + 1, len(words) - k + 2)), key=lambda r: r[0])
        return memo[(i, k)]

    groups, start = [], 0
    for end in best(0, parts)[1]:
        groups.append(words[start:end])
        start = end
    return groups


def feasible(words, parts, seen, known):
    if parts > len(words):
        return False
    groups = split_words(words, parts, seen, known)
    seen = set(seen)
    for group in groups:
        fresh = {c for w in group for c in _kanji_chars(w, known) if c not in seen}
        seen |= fresh
        if len(group) > MAX_WORDS or len(fresh) > MAX_KANJI:
            return False
    return True


def review_count(parts, order, interval):
    count, since = 0, 0
    for n in order:
        since += parts[n]
        if since >= interval and n != order[-1]:
            count, since = count + 1, 0
    return count + 1  # ôn cuối cùng


def main():
    data = json.load(open(CONTENT, encoding="utf-8"))
    applied = data.setdefault("meta", {}).setdefault("adjustments", [])
    if NAME in applied:
        print("Đã áp dụng trước đó — không làm gì.")
        return
    extra = json.load(open(EXTRA, encoding="utf-8"))
    vocab, kanji_list, grammar, radicals = data["vocabulary"], data["kanji"], data["grammar"], data["radicals"]
    old_rows = {d["day"]: d for d in data["journeyDays"]}
    old_tasks = defaultdict(list)
    for t in sorted(data["dayTasks"], key=lambda t: (t["day"], t["orderNo"])):
        old_tasks[t["day"]].append(t)
    vocab_label, grammar_label = lesson_label_maps(data)
    old_day = {("vocabulary", w["id"]): w["day"] for w in vocab}

    # ── 1. Dữ liệu: chuyển bài, mẹo, từ mới, mẫu câu mới, Kanji mới ──
    by_id = {w["id"]: w for w in vocab}
    for wid, lesson in extra["vocabularyLessonMoves"].items():
        by_id[int(wid)]["lesson"] = vocab_label[lesson]
    for wid, tip in extra["vocabularyTips"].items():
        if not by_id[int(wid)]["tip"].strip():
            by_id[int(wid)]["tip"] = tip
    next_id = max(by_id) + 1
    new_ids = []
    for w in extra["vocabularyNew"]:
        vocab.append({"id": next_id, "kana": w["kana"], "kanji": w["kanji"], "meaning": w["meaning"], "tip": w["tip"],
                      "lesson": vocab_label[w["lesson"]], "day": None})
        new_ids.append(next_id)
        next_id += 1
    gids = {g["id"] for g in grammar}
    for g in extra["grammarNew"]:
        if g["id"] not in gids:
            grammar.append({"id": g["id"], "pattern": g["pattern"], "usage": g["usage"], "exampleJp": g["exampleJp"],
                            "exampleVi": g["exampleVi"], "day": None, "lesson": grammar_label[g["lesson"]]})
    kanji_chars = {k["character"] for k in kanji_list}
    next_kid = max(k["id"] for k in kanji_list) + 1
    for k in extra["kanjiNew"]:
        if k["character"] in kanji_chars:
            continue
        kanji_list.append({key: k[key] for key in ("character", "hanViet", "meaning", "onReading", "kunReading", "strokes", "words", "tip")}
                          | {"id": next_kid, "day": None})
        next_kid += 1
    known = {k["character"] for k in kanji_list}
    kanji_by_char = {k["character"]: k for k in kanji_list}

    # ── 2. Chữ cái: 10 ngày ──
    kana_by_id = {k["id"]: k for k in data["kana"]}
    for day, first, last, _ in KANA_GROUPS:
        for i in range(first, last + 1):
            kana_by_id[i]["day"] = day
    known_kana = kana_known_by(data["kana"])
    kana_words = sorted((w for w in vocab if w["day"] is not None and w["day"] <= OLD_KANA_DAYS), key=lambda w: (w["day"], w["id"]))
    per_day = Counter()
    for w in kana_words:
        need = max(known_kana.get(c, 99) for c in w["kana"])
        if need > KANA_DAYS:
            raise SystemExit(f"Từ giai đoạn chữ cái {w['kana']} có chữ chưa học: không xếp được")
        days = [d for d in range(max(need, 4), KANA_DAYS + 1) if per_day[d] < MAX_KANA_WORDS]
        # ngày âm ghép (5, 10) là ngày ôn từ — chỉ dùng khi từ cần chính âm ghép của ngày đó
        day = next((d for d in days if d not in (5, KANA_DAYS)), days[0])
        w["day"] = day
        per_day[day] += 1
    kana_word_ids = {w["id"] for w in kana_words}

    plan = []
    for katakana in (False, True):
        for day, first, last, rows in KANA_GROUPS:
            plan.append({"kind": "kana", "katakana": katakana, "group": (day, first, last, rows)})
    for index, day in enumerate(OLD_RADICAL_DAYS):
        plan.append({"kind": "radical", "old": day})

    # ── 3. Bài 1–25 ──
    words_of, grammar_of, parts, fresh_of = {}, {}, {}, {}
    seen = set()
    order_key = lambda w: (0, old_day.get(("vocabulary", w["id"])) or 0, w["id"]) if w["id"] not in new_ids else (1, 0, new_ids.index(w["id"]))
    for n in range(1, 26):
        words_of[n] = sorted((w for w in vocab if _lesson_no(w["lesson"]) == n and w["id"] not in kana_word_ids), key=order_key)
        grammar_of[n] = sorted((g for g in grammar if _lesson_no(g["lesson"]) == n), key=lambda g: (g["day"] or 999, g["id"]))
        base = max(math.ceil(len(words_of[n]) / MAX_WORDS), math.ceil(len(grammar_of[n]) / MAX_GRAMMAR), 1)
        # số ngày nhỏ nhất mà cắt được (mỗi ngày ≤ MAX_WORDS từ và ≤ MAX_KANJI Kanji mới, từ giữ thứ tự)
        parts[n] = next((k for k in range(base, MAX_LESSON_DAYS + 1) if feasible(words_of[n], k, seen, known)), None)
        assert parts[n], f"bài {n}: không chia được trong {MAX_LESSON_DAYS} ngày"
        fresh = [c for w in words_of[n] for c in _kanji_chars(w, known) if c not in seen and not seen.add(c)]
        fresh_of[n] = len(fresh)
    order = list(range(1, 26))
    budget = TOTAL_DAYS - KANA_DAYS - len(RADICAL_DAYS) - FINAL_DAYS
    interval = next(i for i in range(8, 30) if sum(parts.values()) + review_count(parts, order, i) <= budget)
    # ngày dư → bài nặng nhất (tải trên mỗi ngày), không vượt 4 ngày/bài, không làm phát sinh thêm ngày ôn
    while True:
        spare = budget - sum(parts.values()) - review_count(parts, order, interval)
        if spare <= 0:
            break
        cands = sorted((n for n in order if parts[n] < MAX_LESSON_DAYS),
                       key=lambda n: -(len(words_of[n]) + 2 * fresh_of[n] + 10 * len(grammar_of[n])) / parts[n])
        added = False
        for n in cands:
            parts[n] += 1
            if sum(parts.values()) + review_count(parts, order, interval) <= budget:
                added = True
                break
            parts[n] -= 1
        if not added:
            break
    assert sum(parts.values()) + review_count(parts, order, interval) == budget, \
        f"không chia được đúng {budget} ngày (bài {sum(parts.values())} + ôn {review_count(parts, order, interval)})"

    seen = set()
    since, review_from = 0, 1
    for n in order:
        count = parts[n]
        groups = split_words(words_of[n], count, seen, known)
        sizes = [len(grammar_of[n]) // count + (1 if i < len(grammar_of[n]) % count else 0) for i in range(count)]
        start = 0
        for index, group in enumerate(groups):
            fresh = []
            for w in group:
                for c in _kanji_chars(w, known):
                    if c not in seen:
                        seen.add(c)
                        fresh.append(c)
            plan.append({"kind": "lesson", "lesson": n, "part": index + 1, "parts": count, "words": group, "kanji": fresh,
                         "grammar": grammar_of[n][start:start + sizes[index]]})
            start += sizes[index]
        since += count
        if since >= interval and n != order[-1]:
            plan.append({"kind": "review", "from": review_from, "to": n})
            since, review_from = 0, n + 1
    plan.append({"kind": "review", "from": review_from, "to": order[-1]})
    final_old = list(range(TOTAL_DAYS - FINAL_DAYS + 1, TOTAL_DAYS + 1))
    for old in final_old:
        plan.append({"kind": "final", "old": old})
    assert len(plan) == TOTAL_DAYS, f"lộ trình có {len(plan)} ngày, cần {TOTAL_DAYS}"

    # ── 4. Gán ngày ──
    final_first = next(i for i, e in enumerate(plan, 1) if e["kind"] == "final")
    orphan = [k for k in kanji_list if k["character"] not in seen]
    for day, e in enumerate(plan, 1):
        if e["kind"] == "radical":
            for r in radicals:
                if r["day"] == e["old"]:
                    r["day"] = day
        elif e["kind"] == "lesson":
            for w in e["words"]:
                w["day"] = day
            for g in e["grammar"]:
                g["day"] = day
            for c in e["kanji"]:
                kanji_by_char[c]["day"] = day
    for k in orphan:
        k["day"] = final_first

    # ── 5. Dựng journeyDays + dayTasks ──
    lessons = {_lesson_no("BÀI " + re.search(r"\d+", l["id"]).group()): l for l in data["lessons"]}
    old_lesson_days = defaultdict(list)
    for d, row in old_rows.items():
        m = re.match(r"Bài (\d+) \(", row["minna"])
        if m:
            old_lesson_days[int(m.group(1))].append(d)
    words_with = lambda char, words: [w for w in words if char in (w.get("kanji") or "")]
    journey, tasks = [], []
    kana_vocab_seen = []
    for day, e in enumerate(plan, 1):
        kind = e["kind"]
        row = {"day": day, "week": math.ceil(day / 7), "kanjiSummary": "—", "radicalSummary": "—", "grammarSummary": "—", "vocabSummary": "—"}
        day_tasks = []
        if kind == "kana":
            gday, first, last, rows = e["group"]
            kt = e["katakana"]
            script = "Katakana" if kt else "Hiragana"
            template_old = {1: 1, 2: 1, 3: 1, 4: 6, 5: 7}[gday] + (7 if kt else 0)
            src = [dict(t) for t in old_tasks[template_old] if "Từ vựng" not in t["label"]]
            kanas = [kana_by_id[i] for i in range(first, last + 1)]
            today_words = [w for w in kana_words if w["day"] == day]
            if gday <= 3:
                for t in src:
                    if "Học chữ mới" in t["label"]:
                        t["body"], t["minutes"] = learn_body(kanas, rows, kt), LEARN_MINUTES["learn"]
                    elif "Viết tay" in t["label"]:
                        t["minutes"] = LEARN_MINUTES["write"]
                    elif "Tự kiểm tra" in t["label"]:
                        t["minutes"] = LEARN_MINUTES["check"]
                row["title"] = f"{script}: hàng {rows} ({len(kanas)} âm)"
            else:
                row["title"] = old_rows[template_old]["title"]
            if today_words:
                kana_vocab_seen += today_words
                body = f"Học {len(today_words)} từ mới: {words_listing(today_words)}"
                if not kt and gday < 5:
                    body += "\n(Từ viết bằng Hiragana — bạn đã đọc được hết các chữ trong từ.)"
                vt = {"day": day, "orderNo": 0, "label": "語  Từ vựng", "minutes": 6 + 5 * len(today_words), "body": body}
                src.insert(len(src) - 1, vt)
            if gday == 5 and kana_vocab_seen:
                src.insert(len(src) - 1, {"day": day, "orderNo": 0, "label": "語  Từ vựng", "minutes": 15,
                                          "body": f"Ôn lại {len(kana_vocab_seen)} từ đã học: {words_listing(kana_vocab_seen)}"})
            day_tasks = src
            row.update({"stage": "Kana", "minna": "—", "skill": "Nghe",
                        "vocabSummary": f"{len(today_words)} từ" if today_words else "—"})
        elif kind == "radical":
            old = old_rows[e["old"]]
            row.update({k: old[k] for k in ("stage", "minna", "title", "kanjiSummary", "radicalSummary", "grammarSummary", "vocabSummary", "skill")})
            day_tasks = [dict(t) for t in old_tasks[e["old"]]]
        elif kind == "lesson":
            n = e["lesson"]
            lesson = lessons[n]
            title = re.sub(r"^BÀI\s*\d+\s*·\s*", "", lesson["name"]).strip()
            row.update({"stage": "Minna", "minna": f"Bài {n} ({e['part']}/{e['parts']})", "title": title,
                        "kanjiSummary": "、".join(e["kanji"]) or "—",
                        "grammarSummary": f"{len(e['grammar'])} mẫu" if e["grammar"] else "—",
                        "vocabSummary": f"{len(e['words'])} từ"})
            first_lesson_day = plan[day - 2]["kind"] == "radical"
            day_tasks.append(_task(day, "◐  Khởi động", MINUTES["warmup"],
                                   "Ôn nhanh 45 bộ thủ: nhìn bộ nói nghĩa, không nhìn đáp án." if first_lesson_day else LESSON_WARMUP))
            day_tasks.append(_task(day, "語  Từ vựng", MINUTES["word"] * len(e["words"]) + 3,
                                   f"Từ mới Minna bài {n}:\n" + "\n".join(f"• {w['kana']}" + (f"（{w['kanji']}）" if w["kanji"] else "") + f" = {w['meaning']}" for w in e["words"])))
            if e["kanji"]:
                body = [f"Học {len(e['kanji'])} chữ Kanji ngay trong từ của hôm nay — nhớ cách đọc trong từ trước, chưa cần thuộc mọi âm đọc."]
                body += [_kanji_line(kanji_by_char[c], words_with(c, e["words"])) for c in e["kanji"]]
                day_tasks.append(_task(day, "漢  Kanji", MINUTES["kanji"] * len(e["kanji"]), "\n".join(body)))
            if e["grammar"]:
                body = [f"Minna bài {n} ({e['part']}/{e['parts']}) — {title}"]
                for g in e["grammar"]:
                    body.append(f"• {g['pattern']}  ({g['usage']})")
                    if g.get("exampleJp"):
                        body.append(f"   Ví dụ: {g['exampleJp']}  = {g['exampleVi']}")
                day_tasks.append(_task(day, "文  Ngữ pháp", MINUTES["pattern"] * len(e["grammar"]), "\n".join(body)))
            olds = sorted(old_lesson_days[n])
            mine = [olds[i] for i in range(len(olds)) if i * e["parts"] // len(olds) == e["part"] - 1]
            skill = ""
            for old in mine:
                skill = skill or old_rows[old]["skill"]
                for t in old_tasks[old]:
                    if t["label"].strip().startswith(SELF_TASK_GLYPHS):
                        day_tasks.append(dict(t))
            row["skill"] = skill or old_rows[olds[-1]]["skill"]
        elif kind == "review":
            span = f"bài {e['from']}–{e['to']}" if e["from"] != e["to"] else f"bài {e['from']}"
            row.update({"stage": "Minna", "minna": f"Ôn {span}", "title": f"Ôn tập — Minna {span}", "skill": "Nghe + Đọc"})
            review_kanji = [k for k in kanji_list if k["character"] in {c for x in plan if x["kind"] == "lesson" and e["from"] <= x["lesson"] <= e["to"] for c in x["kanji"]}]
            m = MINUTES["review"]
            day_tasks.append(_task(day, "部  Bộ thủ", m["部"], "Ôn bộ thủ: nhìn bộ nói nghĩa, kể 1 Kanji chứa bộ đó."))
            if review_kanji:
                day_tasks.append(_task(day, "漢  Kanji", m["漢"], f"Ôn {len(review_kanji)} chữ Kanji của Minna {span} qua từ chứa nó: che nghĩa → đọc từ, che từ → nhớ chữ. Trong app, đánh dấu chữ còn mờ.\n"
                                       + " ・ ".join(k["character"] for k in review_kanji)))
            day_tasks.append(_task(day, "文  Ngữ pháp", m["文"], f"Làm phần 練習B và 練習C trong Minna {span}. Sau đó tự đặt 5 câu mới."))
            day_tasks.append(_task(day, "語  Từ vựng", m["語"], f"Ôn lại toàn bộ từ vựng Minna {span}. Từ nào quên đánh dấu 'Đang học'."))
            day_tasks.append(_task(day, "耳読  Nghe + Đọc", m["耳読"], f"Làm phần 問題 (nghe + đọc) cuối mỗi bài trong Minna {span}. Ghi lỗi sai vào cột Ghi chú."))
        else:
            old = old_rows[e["old"]]
            row.update({k: old[k] for k in ("stage", "minna", "title", "kanjiSummary", "radicalSummary", "grammarSummary", "vocabSummary", "skill")})
            day_tasks = [dict(t) for t in old_tasks[e["old"]]]
            for t in day_tasks:
                t["body"] = re.sub(r"không làm hết \d+ chữ", f"không làm hết {len(kanji_list)} chữ", t["body"])
            if day == final_first:
                day_tasks = [t for t in day_tasks if not t["body"].startswith("Học ") or "Kanji" not in t["label"]]
                if orphan:
                    body = [f"Học {len(orphan)} chữ Kanji chưa gặp trong từ vựng giáo trình — qua các từ ví dụ của chính chữ đó."]
                    body += [_kanji_line(k, []) for k in orphan]
                    day_tasks.insert(0, _task(day, "漢  Kanji", MINUTES["review_kanji"] * len(orphan), "\n".join(body)))
                row["kanjiSummary"] = "、".join(k["character"] for k in orphan) or "—"
                if not orphan:
                    row["title"] = "Tổng ôn Kanji N5"
        for i, t in enumerate(day_tasks, 1):
            t["day"], t["orderNo"] = day, i
        row["minutes"] = sum(t["minutes"] for t in day_tasks)
        journey.append(row)
        tasks.extend(day_tasks)
    data["journeyDays"], data["dayTasks"] = journey, tasks

    # ── 6. Bảng bài ──
    for n, lesson in lessons.items():
        days = [d for d, e in enumerate(plan, 1) if e["kind"] == "lesson" and e["lesson"] == n]
        lesson["dayRange"] = f"Ngày {days[0]}–{days[-1]}" if len(days) > 1 else f"Ngày {days[0]}"
        lesson["dayCount"] = len(days)
        lesson["vocabCount"] = f"{sum(1 for w in vocab if w['lesson'] == vocab_label[n])} từ"
        lesson["grammarCount"] = f"{sum(1 for g in grammar if g['lesson'] == grammar_label[n])} mẫu"

    # ── 7. Bài đọc: nằm ở ngày cuối của bài ──
    last_day = {n: max(d for d, e in enumerate(plan, 1) if e["kind"] == "lesson" and e["lesson"] == n) for n in range(1, 26)}
    if os.path.exists(PASSAGES):
        passages = json.load(open(PASSAGES, encoding="utf-8"))
        for p in passages["passages"]:
            p["day"] = last_day[_lesson_no("BÀI " + re.search(r"\d+", p["lesson"]).group())]
        json.dump(passages, open(PASSAGES, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
        open(PASSAGES, "a", encoding="utf-8").write("\n")

    # ── 8. Ánh xạ ngày cũ → mới (tiến độ người học) ──
    day_map = {}
    old_kana = {1: 1, 2: 1, 3: 2, 4: 3, 5: 3, 6: 4, 7: 5}
    for old, new in old_kana.items():
        day_map[old], day_map[old + 7] = new, new + KATAKANA_OFFSET
    for old, new in zip(OLD_RADICAL_DAYS, RADICAL_DAYS):
        day_map[old] = new
    first_new = {n: min(d for d, e in enumerate(plan, 1) if e["kind"] == "lesson" and e["lesson"] == n) for n in range(1, 26)}
    for old, row in old_rows.items():
        m = re.match(r"Bài (\d+) \(", row["minna"])
        r = re.match(r"Ôn bài (\d+)(?:–(\d+))?", row["minna"])
        if m:
            day_map[old] = first_new[int(m.group(1))]
        elif r:
            to = int(r.group(2) or r.group(1))
            covering = [d for d, e in enumerate(plan, 1) if e["kind"] == "review" and e["from"] <= to <= e["to"]]
            day_map[old] = covering[0] if covering and plan[covering[0] - 1]["to"] == to else first_new.get(to + 1, final_first)
    for i, old in enumerate(final_old):
        day_map[old] = final_first + i
    assert sorted(day_map) == list(range(1, TOTAL_DAYS + 1))
    json.dump({"_note": "ngày cũ → ngày mới (nekoneko-v3), dùng cho migration chuyển tiến độ", "map": day_map},
              open(DAY_MAP, "w", encoding="utf-8"), ensure_ascii=False, indent=1)

    applied.append(NAME)
    json.dump(data, open(CONTENT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    lesson_days = sum(parts.values())
    print(f"Xong: {len(vocab)} từ ({sum(1 for w in vocab if _lesson_no(w['lesson']))} từ thuộc bài 1–25), {len(kanji_list)} Kanji, "
          f"{len(grammar)} mẫu câu; chữ cái 1–{KANA_DAYS}, bộ thủ {RADICAL_DAYS[0]}–{RADICAL_DAYS[-1]}, "
          f"{lesson_days} ngày học bài + {review_count(parts, order, interval)} ngày ôn (ôn sau mỗi ~{interval} ngày), "
          f"tổng ôn {final_first}–{TOTAL_DAYS}; {len(orphan)} Kanji học ở ngày {final_first}: {''.join(k['character'] for k in orphan) or '—'}")
    print("Số ngày mỗi bài:", " ".join(f"B{n}:{parts[n]}" for n in order))


if __name__ == "__main__":
    main()
