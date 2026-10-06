"""
Điều chỉnh lộ trình Excel theo quyết định của chủ sản phẩm — áp dụng SAU khi đọc Excel.

    python3 scripts/roadmap_adjustments.py      # áp dụng trực tiếp lên content/seed/n5-content.json

convert-roadmap.py gọi apply() mỗi lần chuyển lại từ Excel, nên điều chỉnh không bị mất.
Chạy nhiều lần cũng được: điều chỉnh đã áp dụng thì bỏ qua (ghi dấu trong meta.adjustments).

── KANA_FIRST_VOCABULARY (2026-10-04) ──────────────────────────────
Chưa thuộc bảng chữ cái thì chưa học từ. File Excel cho học 2 từ chào hỏi mỗi ngày từ ngày 1, khi người học
mới biết vài chữ. Nay: ngày 1–5 chỉ học 46 chữ Hiragana cơ bản; từ vựng bắt đầu từ ngày 6. Mười từ chào hỏi của
ngày 1–5 chuyển sang ngày 8–12 (lúc đã đọc được toàn bộ Hiragana), mỗi ngày thêm 2 từ cạnh 2 từ Katakana sẵn có.

── KANA_BY_ROW (2026-10-06) — xem chú thích ở hàm _apply_kana_by_row.
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


# ── KANA_BY_ROW (2026-10-06) ─────────────────────────────────────────
# Excel chia Hiragana 10/9/9/9/9 cắt ngang hàng âm (ngày 2 = さ→て, ngày 3 = と→ふ) và dồn 58 âm vào ngày 6
# (25 âm đục/bán đục + 33 âm ghép). Nay: mỗi ngày trọn hàng âm — 10/10/10/8/8 —, ngày 6 chỉ âm đục & bán đục
# (kèm bảng so sánh + mẹo nhớ), ngày 7 âm ghép + ôn. Katakana = ngày Hiragana + 7 nên ngày 8–14 đổi theo.
KANA_BY_ROW = "kana-by-row"
KANA_ROW_DAYS = [  # (ngày, id kana từ…tới, tên các hàng)
    (1, 1, 10, "あ・か"), (2, 11, 20, "さ・た"), (3, 21, 30, "な・は"), (4, 31, 38, "ま・や"), (5, 39, 46, "ら・わ・ん"),
    (6, 47, 71, None), (7, 72, 104, None),
]
KATAKANA_OFFSET = 7
# Mẹo âm đục — đã kiểm tra ngoại lệ (じ/ぢ = ji, づ = zu, ふ → ぶ bu / ぷ pu).
DAKUTEN_TIPS = {
    "g": "Thêm dấu ゛ vào hàng か → hàng が: K → G. Mẹo: \"con gái\" — c (âm k) đổi thành g.",
    "z": "Thêm dấu ゛ vào hàng さ → hàng ざ: S → Z. Mẹo: \"sống zai\" — s đổi thành z.",
    "d": "Thêm dấu ゛ vào hàng た → hàng だ: T → D. Mẹo: \"tự do\" — t đổi thành d.",
    "b": "Thêm dấu ゛ vào hàng は → hàng ば: H → B. Mẹo: \"hòa bình\" — h đổi thành b.",
    "p": "Thêm vòng tròn nhỏ ゜ vào hàng は → hàng ぱ: H → P. Mẹo: \"hạnh phúc\" — h đổi thành p.",
}
DAKUTEN_EXCEPTIONS = {
    "ji": "Ngoại lệ: し (shi) → じ đọc là \"ji\", không phải \"zi\".",
    "di": "Ngoại lệ: ち (chi) → ぢ cũng đọc \"ji\" — rất hiếm, thường viết じ.",
    "du": "Ngoại lệ: つ (tsu) → づ đọc \"zu\" — rất hiếm, thường viết ず.",
    "bu": "Lưu ý: ふ đọc \"fu\" nhưng ぶ đọc \"bu\".",
    "pu": "Lưu ý: ふ đọc \"fu\" nhưng ぷ đọc \"pu\".",
}
SMALL_YOUON = {"ゃ": "や", "ゅ": "ゆ", "ょ": "よ"}


def _dakuten_tip(kana):
    romaji = kana["romaji"].lower()
    key = "ji" if kana["hiragana"] == "じ" else "di" if kana["hiragana"] == "ぢ" else "du" if kana["hiragana"] == "づ" else romaji
    tip = DAKUTEN_TIPS[romaji[0] if romaji[0] in DAKUTEN_TIPS else "z" if kana["hiragana"] == "じ" else "d"]
    tip = f"{tip} {DAKUTEN_EXCEPTIONS[key]}" if key in DAKUTEN_EXCEPTIONS else tip
    return f"{tip} Katakana cũng vậy: {kana['katakana']}."


def _youon_tip(kana):
    base, small = kana["hiragana"][0], kana["hiragana"][1]
    kata_base, kata_small = kana["katakana"][0], kana["katakana"][1]
    return (f"{base} + {small} (viết nhỏ) → {kana['hiragana']} ({kana['romaji']}): đọc liền thành MỘT âm, "
            f"không phải hai âm \"{base}・{SMALL_YOUON[small]}\". Katakana: {kata_base} + {kata_small} → {kana['katakana']}.")


def _learn_task_body(kanas, rows, katakana):
    face = "katakana" if katakana else "hiragana"
    listing = "  ".join(f"{k[face]} ({k['romaji']})" for k in kanas)
    return f"Học {len(kanas)} âm — trọn hàng {rows}: {listing}. Xem thứ tự nét trước khi viết."


def _apply_kana_by_row(data):
    kana_by_id = {k["id"]: k for k in data["kana"]}
    journey = {d["day"]: d for d in data["journeyDays"]}
    tasks = data["dayTasks"]
    for day, first, last, _ in KANA_ROW_DAYS:
        for kana_id in range(first, last + 1):
            kana_by_id[kana_id]["day"] = day
    for kana_id in range(47, 72):
        kana_by_id[kana_id]["tip"] = _dakuten_tip(kana_by_id[kana_id])
    for kana_id in range(72, 105):
        kana_by_id[kana_id]["tip"] = _youon_tip(kana_by_id[kana_id])

    def day_tasks(day):
        return sorted((t for t in tasks if t["day"] == day), key=lambda t: t["orderNo"])

    for katakana in (False, True):
        offset = KATAKANA_OFFSET if katakana else 0
        script = "Katakana" if katakana else "Hiragana"
        # Ngày 1–5 / 8–12: trọn hàng âm.
        for day, first, last, rows in KANA_ROW_DAYS[:5]:
            kanas = [kana_by_id[i] for i in range(first, last + 1)]
            journey[day + offset]["title"] = f"{script}: hàng {rows} ({len(kanas)} âm)"
            learn = next(t for t in day_tasks(day + offset) if "Học chữ mới" in t["label"])
            learn["body"] = _learn_task_body(kanas, rows, katakana)
        # Ngày 6 / 13: chỉ âm đục & bán đục.  Ngày 7 / 14: âm ghép + ôn.
        dakuten_day, youon_day = 6 + offset, 7 + offset
        six, seven = day_tasks(dakuten_day), day_tasks(youon_day)
        youon_task = next(t for t in six if "Âm ghép" in t["label"])
        dakuten_task = next(t for t in six if "Âm đục" in t["label"])
        dakuten_task["body"] = ("Học 25 âm đục & bán đục. Dấu ゛ (2 chấm): K→G, S→Z, T→D, H→B. Dấu ゜ (vòng tròn): H→P. "
                                "Xem bảng so sánh âm gốc ↔ âm đục và mẹo nhớ trong thẻ học.")
        dakuten_task["minutes"] += 5
        if katakana:
            dakuten_task["body"] += " Ví dụ: カ→ガ, サ→ザ, タ→ダ, ハ→バ, ハ→パ."
            youon_task["body"] = "Học 33 âm ghép Katakana. Quy tắc: chữ hàng イ + ャ/ュ/ョ viết nhỏ (キ+ャ = キャ). Đọc liền thành một âm."
        else:
            youon_task["body"] = "Học 33 âm ghép. Quy tắc: chữ hàng い + ゃ/ゅ/ょ viết nhỏ (き+ゃ = きゃ). Đọc liền thành một âm."
            dakuten_task["body"] += " Ví dụ: か→が, さ→ざ, た→だ, は→ば, は→ぱ."

        journey[dakuten_day]["title"] = f"{script}: âm đục & bán đục (゛ ゜)"
        # Ngày 7 / 14: âm ghép đứng đầu, bỏ bài đọc nhanh để giữ thời lượng.
        speed = next((t for t in seven if "Tốc độ" in t["label"]), None)
        if speed:
            tasks.remove(speed)
        youon_task["day"], youon_task["orderNo"] = youon_day, 0
        journey[youon_day]["title"] = f"{script}: âm ghép (きゃ・しゅ・ちょ…) & ôn tập"
        for day in (dakuten_day, youon_day):
            ordered = day_tasks(day)
            for order, task in enumerate(ordered, start=1):
                task["orderNo"] = order
            journey[day]["minutes"] = sum(t["minutes"] for t in ordered)


# ── N5_VOCABULARY_SUPPLEMENT (2026-10-06) ─────────────────────────────
# Lộ trình Excel có 350 từ (14 từ × 25 bài) — phủ khoảng 1/3 danh sách N5 tham khảo. Bổ sung:
#  1. 25 từ của giai đoạn chữ cái (はい, テレビ, コーヒー…) — trước chỉ nằm trong VĂN BẢN đầu việc, không phải mục từ
#     vựng thật nên không bao giờ được học / ôn trong app. Nay thành mục từ vựng, đúng ngày 6–13.
#  2. Từ N5 còn thiếu: content/source/n5-vocabulary-supplement.tsv (nguồn + giấy phép + phần cần duyệt ghi ở đầu file),
#     xếp vào bài Minna theo chủ đề, chia đều các ngày của bài đó.
N5_VOCABULARY_SUPPLEMENT = "n5-vocabulary-supplement"
SUPPLEMENT_TSV = os.path.join(ROOT, "content", "source", "n5-vocabulary-supplement.tsv")
KANA_PERIOD_LESSON = "Chào hỏi & từ Katakana (giai đoạn chữ cái)"
KANA_PERIOD_WORD = re.compile(r"\s*([^・()（）]+?)\s*\(([^)]*)\)")
SUPPLEMENT_TIP = ""  # nghĩa do Neko Neko soạn — trạng thái duyệt ghi ở docs/N5_CONTENT_AUDIT.md, không hiện cho người học
MINUTES_PER_SUPPLEMENT_WORD = 1


def _lesson_label(data, number):
    return next(w["lesson"] for w in data["vocabulary"] if re.match(rf"^BÀI {number}\b", w["lesson"]))


def _apply_n5_vocabulary_supplement(data):
    vocabulary, tasks = data["vocabulary"], data["dayTasks"]
    journey = {d["day"]: d for d in data["journeyDays"]}
    next_id = max(w["id"] for w in vocabulary) + 1

    # 1. Từ của giai đoạn chữ cái: lấy đúng từ văn bản đầu việc "Học N từ mới: テレビ (ti vi) ・ …".
    for task in sorted((t for t in tasks if "Từ vựng" in t["label"] and t["body"].startswith("Học ")), key=lambda t: t["day"]):
        if task["day"] > 14:
            continue
        listing = WORDS_PREFIX.sub("", task["body"].split("\n")[0])
        for face, meaning in KANA_PERIOD_WORD.findall(listing):
            existing = next((w for w in vocabulary if (w["kanji"] or w["kana"]) == face.strip()), None)
            if existing:  # はじめまして, テレビ, ラジオ đã có ở bài Minna → dời về đúng ngày lộ trình dạy, không tạo bản sao
                existing["day"] = min(existing["day"], task["day"])
                continue
            vocabulary.append({"id": next_id, "kana": face.strip(), "kanji": "", "meaning": meaning.strip().capitalize(),
                               "tip": "", "lesson": KANA_PERIOD_LESSON, "day": task["day"]})
            next_id += 1

    # 2. Từ N5 bổ sung theo bài Minna.
    rows = [line.rstrip("\n").split("|") for line in open(SUPPLEMENT_TSV, encoding="utf-8") if line.strip() and not line.startswith("#")]
    by_lesson = {}
    for word, reading, meaning, lesson in rows:
        by_lesson.setdefault(int(lesson), []).append((word, reading, meaning))
    added_by_day = {}
    for number, words in sorted(by_lesson.items()):
        label = _lesson_label(data, number)
        days = sorted({w["day"] for w in vocabulary if w["lesson"] == label and w["day"]})
        for index, (word, reading, meaning) in enumerate(words):
            day = days[index * len(days) // len(words)]  # chia đều, giữ thứ tự chủ đề
            is_kana_only = word == reading
            vocabulary.append({"id": next_id, "kana": reading, "kanji": "" if is_kana_only else word, "meaning": meaning,
                               "tip": SUPPLEMENT_TIP, "lesson": label, "day": day})
            next_id += 1
            added_by_day.setdefault(day, []).append(f"{word}（{reading}）" if not is_kana_only else word)

    # Lộ trình nói đúng điều phiên học dạy: thêm dòng từ bổ sung vào việc "Từ vựng" của ngày, cộng thời lượng.
    for day, faces in added_by_day.items():
        task = _vocab_task(tasks, day)
        extra = MINUTES_PER_SUPPLEMENT_WORD * len(faces)
        if task:
            task["body"] += f"\n+ Từ N5 bổ sung ({len(faces)}): " + " ・ ".join(faces)
            task["minutes"] += extra
        journey[day]["minutes"] += extra
        count = sum(1 for w in vocabulary if w["day"] == day)
        journey[day]["vocabSummary"] = f"{count} từ"


# ── VOCABULARY_DEDUPE (2026-10-06) ───────────────────────────────────
# Excel lặp lại 7 từ ở hai bài (cùng chữ, cùng cách đọc, cùng nghĩa) → giữ lần xuất hiện ĐẦU, bỏ lần sau.
# かけます (gọi điện, bài 7) và かけます (đeo kính, bài 22) là hai từ đồng âm khác nghĩa → giữ cả hai.
VOCABULARY_DEDUPE = "vocabulary-dedupe"
DUPLICATE_VOCABULARY = {231: 72, 307: 98, 310: 215, 314: 217, 318: 224, 319: 223, 330: 269}  # id bỏ → id giữ
MERGED_MEANINGS = {72: "Uống (nước; cả thuốc)"}


def _apply_vocabulary_dedupe(data):
    by_id = {w["id"]: w for w in data["vocabulary"]}
    for dropped, kept in DUPLICATE_VOCABULARY.items():
        a, b = by_id[dropped], by_id[kept]
        assert (a["kanji"], a["kana"]) == (b["kanji"], b["kana"]), f"không còn là bản trùng: {dropped} / {kept}"
    data["vocabulary"] = [w for w in data["vocabulary"] if w["id"] not in DUPLICATE_VOCABULARY]
    for word_id, meaning in MERGED_MEANINGS.items():
        by_id[word_id]["meaning"] = meaning


ADJUSTMENTS = [
    (KANA_FIRST_VOCABULARY, _apply_kana_first_vocabulary),
    (KANA_BY_ROW, _apply_kana_by_row),
    (VOCABULARY_DEDUPE, _apply_vocabulary_dedupe),
    (N5_VOCABULARY_SUPPLEMENT, _apply_n5_vocabulary_supplement),
]


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
