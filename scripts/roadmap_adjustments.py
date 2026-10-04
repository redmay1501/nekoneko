"""
Điều chỉnh lộ trình Excel theo quyết định của chủ sản phẩm — áp dụng SAU khi đọc Excel.

    python3 scripts/roadmap_adjustments.py      # áp dụng trực tiếp lên content/seed/n5-content.json

convert-roadmap.py gọi apply() mỗi lần chuyển lại từ Excel, nên điều chỉnh không bị mất.
Chạy nhiều lần cũng được: điều chỉnh đã áp dụng thì bỏ qua (ghi dấu trong meta.adjustments).

── KANA_FIRST_VOCABULARY (2026-10-04) ──────────────────────────────
Chưa thuộc bảng chữ cái thì chưa học từ. File Excel cho học 2 từ chào hỏi mỗi ngày từ ngày 1, khi người học
mới biết vài chữ. Nay: ngày 1–5 chỉ học 46 chữ Hiragana cơ bản; từ vựng bắt đầu từ ngày 6. Mười từ chào hỏi của
ngày 1–5 chuyển sang ngày 8–12 (lúc đã đọc được toàn bộ Hiragana), mỗi ngày thêm 2 từ cạnh 2 từ Katakana sẵn có.
"""
import json, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONTENT = os.path.join(ROOT, "content", "seed", "n5-content.json")

KANA_FIRST_VOCABULARY = "kana-first-vocabulary"
BASIC_HIRAGANA_LAST_DAY = 5          # ngày học xong chữ thứ 46 (ん)
GREETINGS_MOVE_TO = {1: 8, 2: 9, 3: 10, 4: 11, 5: 12}
VOCAB_LABEL = "Từ vựng"
WORDS_PREFIX = re.compile(r"^Học \d+ từ mới:\s*")
MINUTES_PER_EXTRA_WORDS = 5


def _vocab_task(day_tasks, day):
    return next((t for t in day_tasks if t["day"] == day and VOCAB_LABEL in t["label"]), None)


def _apply_kana_first_vocabulary(data):
    tasks, journey = data["dayTasks"], {d["day"]: d for d in data["journeyDays"]}
    for from_day, to_day in GREETINGS_MOVE_TO.items():
        source, target = _vocab_task(tasks, from_day), _vocab_task(tasks, to_day)
        moved = WORDS_PREFIX.sub("", source["body"])
        existing = WORDS_PREFIX.sub("", target["body"])
        target["body"] = f"Học 4 từ mới: {existing} ・ {moved}\n(Từ chào hỏi viết bằng Hiragana — giờ bạn đã đọc được hết.)"
        target["minutes"] += MINUTES_PER_EXTRA_WORDS
        journey[to_day]["vocabSummary"] = "4 từ"
        journey[to_day]["minutes"] += MINUTES_PER_EXTRA_WORDS
        # Bỏ việc học từ ở ngày Hiragana; trả thời gian đó về cho ngày học.
        tasks.remove(source)
        journey[from_day]["vocabSummary"] = "—"
        journey[from_day]["minutes"] -= source["minutes"]

    # Đánh số lại thứ tự việc trong ngày cho liên tục (1, 2, 3…).
    for day in GREETINGS_MOVE_TO:
        for order, task in enumerate(sorted((t for t in tasks if t["day"] == day), key=lambda t: t["orderNo"]), start=1):
            task["orderNo"] = order

    # Excel ghi "Học 2 từ mới" cho ngày 6 nhưng liệt kê 3 từ.
    _vocab_task(tasks, 6)["body"] = WORDS_PREFIX.sub("Học 3 từ mới: ", _vocab_task(tasks, 6)["body"])
    journey[6]["vocabSummary"] = "3 từ"

    # Ngày ôn tập: nói đúng số từ đã học tới lúc đó.
    _vocab_task(tasks, 7)["body"] = "Ôn lại 3 từ đã học: はい ・ いいえ ・ わかりました."
    _vocab_task(tasks, 14)["body"] = "Ôn lại toàn bộ 25 từ đã học trong hai tuần (chào hỏi + từ Katakana)."


ADJUSTMENTS = [(KANA_FIRST_VOCABULARY, _apply_kana_first_vocabulary)]


def apply(data):
    """Áp dụng các điều chỉnh chưa áp dụng. Trả về danh sách điều chỉnh vừa áp dụng."""
    applied = data.setdefault("meta", {}).setdefault("adjustments", [])
    newly = []
    for name, adjust in ADJUSTMENTS:
        if name in applied:
            continue
        adjust(data)
        applied.append(name)
        newly.append(name)
    return newly


if __name__ == "__main__":
    content = json.load(open(CONTENT, encoding="utf-8"))
    newly = apply(content)
    json.dump(content, open(CONTENT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print("Đã áp dụng:", newly or "không có gì mới")
