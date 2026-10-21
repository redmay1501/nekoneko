"""
Áp dữ liệu NekoNeko v2 vào content/seed/n5-content.json ĐANG DÙNG (không chạy lại convert-roadmap.py).

Vì sao không chạy lại convert-roadmap.py: file n5-content.json hiện tại đã được sửa tay sau lần sinh cuối
(mẹo từ vựng, ngày của vài từ, bỏ 4 từ id 108–111…). Sinh lại sẽ mất các sửa đó.

Script này:
  • KHÔNG đổi ngày của bất kỳ mục cũ nào (từ / Kanji / mẫu câu / ngày lộ trình) → không cần migration chuyển tiến độ.
  • Thêm 16 mẫu ngữ pháp (id 113–128) vào đúng ngày đã xếp sẵn (≤ 3 mẫu/ngày, trong khoảng ngày của bài).
  • Thêm từ N5 mới: xếp vào ngày của đúng bài còn chỗ (≤ 20 từ/ngày), giữ luật Kanji của lộ trình:
      – Kanji đã có ngày học (< 82): từ mới chứa chữ đó không được đứng TRƯỚC ngày học chữ.
      – Kanji "mồ côi" (đang ở ngày 82): nếu từ mới chứa nó, chuyển chữ đó về ngày của từ (khi ngày đó còn < 6 Kanji).
    Từ không xếp được → in ra và ghi vào content/source/nekoneko-v2-unscheduled.json.
  • Viết lại đầu việc (dayTasks) & tóm tắt ngày (journeyDays) & số từ/mẫu của bài (lessons) cho các ngày bị ảnh hưởng.
  • Ghi "nekoneko-v2" vào meta.adjustments → chạy lại lần 2 không làm gì.

Chạy:  python3 scripts/apply-nekoneko-v2.py   (đặt cạnh roadmap_adjustments.py)
"""
import json, os, re, sys
from collections import Counter

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from roadmap_adjustments import MINUTES, _kanji_line, _lesson_no  # dùng đúng định dạng đầu việc của lộ trình

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONTENT = os.path.join(ROOT, "content", "seed", "n5-content.json")
EXTRA = os.path.join(ROOT, "content", "source", "nekoneko-v2-additions.json")
UNSCHEDULED = os.path.join(ROOT, "content", "source", "nekoneko-v2-unscheduled.json")
NAME = "nekoneko-v2"
# MAX_WORDS: số từ tối đa mỗi ngày (test lộ trình kiểm cùng giới hạn này). Có thể thử mức khác: NEKO_MAX_WORDS=22 python3 …
MAX_WORDS, MAX_KANJI, FINAL_FIRST_DAY = int(os.environ.get("NEKO_MAX_WORDS", "26")), 6, 82
LABEL_VOCAB, LABEL_KANJI, LABEL_GRAMMAR = "語  Từ vựng", "漢  Kanji", "文  Ngữ pháp"


def main():
    data = json.load(open(CONTENT, encoding="utf-8"))
    applied = data.setdefault("meta", {}).setdefault("adjustments", [])
    if NAME in applied:
        print("Đã áp dụng trước đó — không làm gì.")
        return
    extra = json.load(open(EXTRA, encoding="utf-8"))
    vocab, kanji_list, grammar, tasks = data["vocabulary"], data["kanji"], data["grammar"], data["dayTasks"]
    journey = {row["day"]: row for row in data["journeyDays"]}
    lessons = {_lesson_no("BÀI " + re.search(r"\d+", l["id"]).group()): l for l in data["lessons"]}
    label_of = {_lesson_no(w["lesson"]): w["lesson"] for w in vocab if _lesson_no(w["lesson"])}  # nhãn bài của từ vựng ("… (14 từ)")
    glabel_of = {_lesson_no(g["lesson"]): g["lesson"] for g in grammar}  # nhãn bài của ngữ pháp (không có "(14 từ)")
    days_of = {}
    for row in data["journeyDays"]:
        m = re.match(r"Bài (\d+) \(", row["minna"])
        if m:
            days_of.setdefault(int(m.group(1)), []).append(row["day"])

    words_on = Counter(w["day"] for w in vocab)
    kanji_on = Counter(k["day"] for k in kanji_list)
    kanji_by = {k["character"]: k for k in kanji_list}
    touched = set()

    # 1) Ngữ pháp
    ids = {g["id"] for g in grammar}
    for g in extra["grammar"]:
        assert g["id"] not in ids, f"trùng id ngữ pháp {g['id']}"
        assert g["day"] in days_of[g["lesson"]], f"mẫu {g['id']}: ngày {g['day']} không thuộc bài {g['lesson']}"
        grammar.append({"id": g["id"], "pattern": g["pattern"], "usage": g["usage"], "exampleJp": g["exampleJp"],
                        "exampleVi": g["exampleVi"], "day": g["day"], "lesson": glabel_of[g["lesson"]]})
        touched.add(g["day"])

    # 2) Từ vựng
    faces = {(w["kanji"] or w["kana"], w["kana"]) for w in vocab}
    next_id = max(w["id"] for w in vocab) + 1
    added, moved_kanji, unscheduled = [], [], []
    for w in extra["vocabulary"]:
        if (w["kanji"] or w["kana"], w["kana"]) in faces:
            continue
        chars = [c for c in dict.fromkeys(w["kanji"]) if c in kanji_by]
        def ok(day):
            if words_on[day] >= MAX_WORDS:
                return False
            moving = [c for c in chars if kanji_by[c]["day"] >= FINAL_FIRST_DAY or kanji_by[c]["day"] > day and c in moved_kanji]
            if any(kanji_by[c]["day"] > day for c in chars if c not in moving):
                return False  # chữ đã có ngày học sau ngày này → từ không được đứng trước
            return kanji_on[day] + len(moving) <= MAX_KANJI
        lesson = w["lesson"]
        candidates = [d for d in days_of.get(lesson, []) if ok(d)]
        if not candidates:
            # Từ chứa Kanji học MUỘN hơn các ngày của bài (vd. 一 bài 2, chữ 一 học ngày 28; 父母 học ngày 38):
            # học từ cùng ngày với chữ đó (hoặc ngày sau đó của cùng bài) → từ chuyển sang bài của ngày ấy.
            later = [kanji_by[c]["day"] for c in chars if kanji_by[c]["day"] < FINAL_FIRST_DAY]
            kanji_day = max(later) if later else None
            host = next((no for no, ds in days_of.items() if kanji_day in ds), None) if kanji_day else None
            if host is not None:
                candidates = [d for d in days_of[host] if d >= kanji_day and ok(d)]
                lesson = host
        if not candidates:
            unscheduled.append(w)
            continue
        day = min(candidates, key=lambda d: (words_on[d], d))
        for c in chars:
            k = kanji_by[c]
            if k["day"] >= FINAL_FIRST_DAY or (c in moved_kanji and k["day"] > day):
                kanji_on[k["day"]] -= 1
                touched.add(k["day"])
                k["day"] = day
                kanji_on[day] += 1
                if c not in moved_kanji:
                    moved_kanji.append(c)
        word = {"id": next_id, "kana": w["kana"], "kanji": w["kanji"], "meaning": w["meaning"], "tip": w["tip"],
                "lesson": label_of[lesson], "day": day}
        vocab.append(word)
        added.append(word)
        faces.add((w["kanji"] or w["kana"], w["kana"]))
        words_on[day] += 1
        touched.add(day)
        next_id += 1

    # 3) Viết lại đầu việc của các ngày bị ảnh hưởng
    new_ids = {w["id"] for w in added}
    new_gids = {g["id"] for g in extra["grammar"]}
    for day in sorted(touched):
        row, day_tasks = journey[day], sorted((t for t in tasks if t["day"] == day), key=lambda t: t["orderNo"])
        find = lambda label: next((t for t in day_tasks if t["label"] == label), None)
        new_words = [w for w in vocab if w["day"] == day and w["id"] in new_ids]
        if new_words:
            t = find(LABEL_VOCAB)
            t["body"] += f"\n+ Từ N5 bổ sung ({len(new_words)}):\n" + "\n".join(
                f"• {w['kana']}" + (f"（{w['kanji']}）" if w["kanji"] else "") + f" = {w['meaning']}" for w in new_words)
            t["minutes"] += MINUTES["word"] * len(new_words)
        # Kanji: dựng lại danh sách chữ của ngày (giữ thứ tự cũ, chữ chuyển về thêm vào cuối)
        day_kanji = [k for k in kanji_list if k["day"] == day]
        if day < FINAL_FIRST_DAY:
            old_order = row["kanjiSummary"].split("、") if row["kanjiSummary"] != "—" else []
            day_kanji.sort(key=lambda k: old_order.index(k["character"]) if k["character"] in old_order else 99)
            words_today = [w for w in vocab if w["day"] == day]
            t = find(LABEL_KANJI)
            if day_kanji:
                body = [f"Học {len(day_kanji)} chữ Kanji ngay trong từ của hôm nay — nhớ cách đọc trong từ trước, chưa cần thuộc mọi âm đọc."]
                body += [_kanji_line(k, [w for w in words_today if k["character"] in w["kanji"]]) for k in day_kanji]
                if t is None:
                    t = {"day": day, "orderNo": 0, "label": LABEL_KANJI, "minutes": 0, "body": ""}
                    at = day_tasks.index(find(LABEL_VOCAB)) + 1
                    day_tasks.insert(at, t)
                    tasks.append(t)
                t["body"], t["minutes"] = "\n".join(body), MINUTES["kanji"] * len(day_kanji)
            row["kanjiSummary"] = "、".join(k["character"] for k in day_kanji) or "—"
            row["vocabSummary"] = f"{sum(1 for w in vocab if w['day'] == day)} từ"
            day_grammar = [g for g in grammar if g["day"] == day]
            row["grammarSummary"] = f"{len(day_grammar)} mẫu" if day_grammar else "—"
            added_g = [g for g in day_grammar if g["id"] in new_gids]
            if added_g:
                t = find(LABEL_GRAMMAR)
                lines = []
                for g in added_g:
                    lines.append(f"• {g['pattern']}  ({g['usage']})")
                    lines.append(f"   Ví dụ: {g['exampleJp']}  = {g['exampleVi']}")
                if t is None:
                    number = _lesson_no(g["lesson"])
                    t = {"day": day, "orderNo": 0, "label": LABEL_GRAMMAR, "minutes": 0, "body": f"Minna bài {number} — " + re.sub(r"^BÀI\s*\d+\s*·\s*", "", g["lesson"])}
                    anchor = find(LABEL_KANJI) or find(LABEL_VOCAB)
                    day_tasks.insert(day_tasks.index(anchor) + 1, t)
                    tasks.append(t)
                t["body"] += "\n" + "\n".join(lines)
                t["minutes"] += MINUTES["pattern"] * len(added_g)
        else:  # ngày tổng ôn đầu tiên: bỏ các chữ đã chuyển về ngày học
            t = find(LABEL_KANJI)
            if day_kanji:
                body = [f"Học {len(day_kanji)} chữ Kanji N5 chưa gặp trong từ vựng giáo trình — qua các từ ví dụ của chính chữ đó."]
                body += [_kanji_line(k, []) for k in day_kanji]
                t["body"], t["minutes"] = "\n".join(body), MINUTES["review_kanji"] * len(day_kanji)
            else:
                # Không còn chữ "mồ côi": mọi chữ đã học cùng từ chứa nó → đầu việc này thành ôn lại các chữ đã dời lên sớm
                # (người học đã qua những ngày đó vẫn gặp lại chúng ở đây).
                moved = [kanji_by[c] for c in moved_kanji]
                body = [f"Ôn lại {len(moved)} chữ Kanji N5 nay học sớm cùng từ vựng (trước đây học ở ngày này): {'、'.join(k['character'] for k in moved)}.",
                        "Che nghĩa rồi đọc, che chữ rồi viết; chữ nào còn mờ thì đánh dấu trong app."]
                t["body"], t["minutes"] = "\n".join(body), 15
            row["kanjiSummary"] = "、".join(k["character"] for k in day_kanji) or "—"
        for order, t in enumerate(day_tasks, 1):
            t["orderNo"] = order
        row["minutes"] = sum(t["minutes"] for t in day_tasks)
    tasks.sort(key=lambda t: (t["day"], t["orderNo"]))

    for number, lesson in lessons.items():
        label = label_of.get(number)
        lesson["vocabCount"] = f"{sum(1 for w in vocab if w['lesson'] == label)} từ"
        lesson["grammarCount"] = f"{sum(1 for g in grammar if g['lesson'] == glabel_of.get(number))} mẫu"

    applied.append(NAME)
    json.dump(data, open(CONTENT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    json.dump({"_note": "Từ N5 chưa xếp được vào lộ trình 90 ngày (ngày của bài đã đủ 20 từ hoặc vướng luật Kanji).",
               "vocabulary": unscheduled}, open(UNSCHEDULED, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"Thêm {len(extra['grammar'])} mẫu câu, {len(added)} từ; chuyển {len(moved_kanji)} Kanji từ ngày tổng ôn về ngày học: "
          f"{''.join(moved_kanji) or '—'}; {len(unscheduled)} từ chưa xếp được → {os.path.relpath(UNSCHEDULED, ROOT)}")


if __name__ == "__main__":
    main()
