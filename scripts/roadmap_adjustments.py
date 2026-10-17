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

── VOCABULARY_TIP_CLEANUP (2026-10-12) ─────────────────────────────
"Mẹo nhớ" chỉ hiện khi thật sự giúp nhớ. Bỏ các mẹo lấp chỗ trống (không cho thêm cách nhớ nào): "học thuộc cả cụm",
"không cần mẹo", "đọc thẳng âm Hán Việt / từ tiếng Anh". Từ không còn mẹo thì giao diện ẩn hẳn mục Mẹo nhớ.

── ROADMAP_REPLAN_V2 (2026-10-18) — xem docs/ROADMAP_REPLAN.md và chú thích ở hàm _apply_roadmap_replan_v2.
Chữ cái (1–14) → bộ thủ gọn trong 3 ngày (15–17) → Minna bài 1–25 đúng thứ tự, mỗi bài 1–4 ngày (18–81, xen 7 ngày ôn)
→ tổng ôn & thi thử (82–90). Kanji học CÙNG NGÀY với từ đầu tiên chứa nó, không theo danh sách riêng.
"""
import json, math, os, re

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


VOCABULARY_TIP_CLEANUP = "vocabulary-tip-cleanup"
# Mẹo không giúp nhớ thêm gì — so khớp theo NỘI DUNG mẹo (không theo id), để chuyển lại từ Excel vẫn bắt được.
FILLER_TIP = re.compile(r"Học thuộc cả cụm|không cần mẹo|Đọc thẳng (âm Hán Việt|từ)", re.IGNORECASE)


def _apply_vocabulary_tip_cleanup(data):
    for word in data["vocabulary"]:
        if word.get("tip") and FILLER_TIP.search(word["tip"]):
            word["tip"] = ""


# ── ROADMAP_REPLAN_V2 (2026-10-18) ───────────────────────────────────
# Quyết định của chủ sản phẩm (docs/ROADMAP_REPLAN.md, đã duyệt):
#  1. Ngày 1–14 chữ cái: giữ nguyên.
#  2. 45 bộ thủ học gọn trong 3 ngày (15 bộ/ngày, giữ thứ tự cũ), mục tiêu nhận diện — không có ngày ôn bộ thủ riêng.
#  3. Minna bài 1 → 25 đúng thứ tự. Một bài kéo dài 1–4 ngày theo khối lượng THẬT:
#     số ngày = max(⌈từ/20⌉, ⌈Kanji mới/6⌉, ⌈mẫu câu/3⌉); ngày dư (do bộ thủ gọn lại) dành cho bài có tải/ngày nặng nhất.
#     Từ giữ thứ tự giáo trình, cắt thành nhóm liền nhau cho tải mỗi ngày (từ + 2 × Kanji mới) cân nhất.
#  4. Kanji KHÔNG theo danh sách riêng: mỗi Kanji học đúng ngày có từ ĐẦU TIÊN chứa nó. 14 Kanji N5 không có trong từ nào
#     của giáo trình học ở ngày đầu giai đoạn tổng ôn, qua chính các từ ví dụ trong dữ liệu Kanji.
#  5. Một ngày ôn sau khoảng 8 ngày học (đúng ranh giới bài) + một ngày ôn cuối giáo trình; tổng ôn & thi thử 9 ngày
#     (gộp các ngày ôn gần nhau của Excel, bỏ "Tổng duyệt trước đề 2").
# Việc của ngày: việc tự làm của bài (耳 nghe, 読 đọc…) đi theo phần tương ứng của bài; việc 部 / 漢 / 文 / 語 dựng lại từ
# dữ liệu (không viết nội dung mới); ngày ôn dùng đúng câu chữ của ngày ôn trong Excel; ngày tổng ôn gộp các ngày Excel cũ.
# Chỉ đổi cột day (cùng id) → trí nhớ người học (theo id) không bị đụng.
ROADMAP_REPLAN_V2 = "roadmap-replan-v2"
KANA_DAYS = 14
RADICAL_DAYS = 3
MAX_WORDS_PER_DAY, MAX_NEW_KANJI_PER_DAY, MAX_GRAMMAR_PER_DAY = 20, 6, 3
REVIEW_AFTER_STUDY_DAYS = 8
FINAL_STAGE = [  # (tiêu đề, các ngày Excel cũ được gộp vào)
    ("Kanji N5 còn lại & tổng ôn Kanji", [78]),
    ("Tổng ôn trợ từ, tính từ & so sánh", [79, 80]),
    (None, [81]),
    ("Luyện dạng đề: Chữ Hán – Từ vựng – Ngữ pháp – Đọc hiểu", [82, 83]),
    (None, [84]),
    ("Chữa đề số 1 + vá lỗ hổng phần yếu nhất", [85, 86]),
    (None, [88]),
    (None, [89]),
    (None, [90]),
]
SELF_TASK_GLYPHS = ("耳", "読", "✎", "?", "話", "📝")
LESSON_WARMUP = "Ôn nhanh nội dung hôm qua: đọc lại Kanji và mẫu ngữ pháp cũ, không nhìn đáp án."  # câu của Excel
MINUTES = {"warmup": 5, "word": 2, "kanji": 4, "review_kanji": 3, "pattern": 10, "radical": 3, "review": {"部": 10, "漢": 20, "文": 25, "語": 20, "耳読": 25}}


def _lesson_no(text):
    m = re.search(r"\d+", text or "")
    return int(m.group()) if m and (text or "").strip().upper().startswith("BÀI") else None


def _kanji_chars(word, known):
    return [c for c in dict.fromkeys(word.get("kanji") or "") if c in known]


def _split_words(words, parts, seen, known):
    """Cắt từ (giữ thứ tự) thành `parts` nhóm liền nhau, tải lớn nhất nhỏ nhất. Tải = từ + 2 × Kanji mới."""
    seen = set(seen)
    new_counts = []
    for word in words:
        fresh = [c for c in _kanji_chars(word, known) if c not in seen]
        seen.update(fresh)
        new_counts.append(len(fresh))

    def load(a, b):
        kanji = sum(new_counts[a:b])
        over = kanji > MAX_NEW_KANJI_PER_DAY or (b - a) > MAX_WORDS_PER_DAY + 4
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


def _task(day, label, minutes, body):
    return {"day": day, "orderNo": 0, "label": label, "minutes": minutes, "body": body}


def _kanji_line(kanji, words):
    reading = " / ".join(x for x in [f"On: {kanji['onReading']}" if kanji["onReading"] else "", f"Kun: {kanji['kunReading']}" if kanji["kunReading"] else ""] if x)
    lines = [f"• {kanji['character']} [{kanji['hanViet']}] {kanji['meaning']}" + (f" — {reading}" if reading else "")]
    if words:
        lines.append("   Trong từ hôm nay: " + " ・ ".join(f"{w['kanji']}（{w['kana']}）{w['meaning']}" for w in words))
    elif kanji.get("words"):
        lines.append(f"   Từ ví dụ: {kanji['words']}")
    if kanji.get("tip"):
        lines.append(f"   Mẹo: {kanji['tip']}")
    return "\n".join(lines)


def _apply_roadmap_replan_v2(data):
    vocabulary, kanji_list, radicals, grammar = data["vocabulary"], data["kanji"], data["radicals"], data["grammar"]
    old_days = {d["day"]: d for d in data["journeyDays"]}
    old_tasks = {}
    for task in sorted(data["dayTasks"], key=lambda t: (t["day"], t["orderNo"])):
        old_tasks.setdefault(task["day"], []).append(task)
    lessons = {_lesson_no(l["name"]) or index + 1: l for index, l in enumerate(data["lessons"])}
    known = {k["character"] for k in kanji_list}
    kanji_by_char = {k["character"]: k for k in kanji_list}
    assert len(old_days) == 90, "lộ trình Excel phải có đủ 90 ngày"

    # Ngày Excel cũ của từng bài (để mang việc tự làm theo phần của bài).
    old_lesson_days = {}
    for day in sorted(old_days):
        number = _lesson_no(old_days[day]["minna"])
        if number and day > KANA_DAYS:
            old_lesson_days.setdefault(number, []).append(day)

    plan = []  # mỗi phần tử: dict mô tả một ngày mới
    # 1. Chữ cái — giữ nguyên.
    for day in range(1, KANA_DAYS + 1):
        plan.append({"kind": "kana", "old": day})
    # 2. Bộ thủ — 3 ngày, thứ tự cũ.
    ordered_radicals = sorted((r for r in radicals if r["day"]), key=lambda r: (r["day"], r["id"]))
    per_day = math.ceil(len(ordered_radicals) / RADICAL_DAYS)
    for index in range(RADICAL_DAYS):
        plan.append({"kind": "radical", "part": index + 1, "radicals": ordered_radicals[index * per_day:(index + 1) * per_day]})

    # 3. Bài 1–25: số ngày mỗi bài.
    words_of, grammar_of, parts = {}, {}, {}
    seen = set()
    for number in sorted(old_lesson_days):
        words_of[number] = sorted((w for w in vocabulary if _lesson_no(w["lesson"]) == number and w["day"] and w["day"] > KANA_DAYS),
                                  key=lambda w: (w["day"], w["id"]))
        grammar_of[number] = sorted((g for g in grammar if _lesson_no(g["lesson"]) == number), key=lambda g: (g["day"] or 0, g["id"]))
        fresh = [c for w in words_of[number] for c in _kanji_chars(w, known) if c not in seen and not seen.add(c)]
        need = max(math.ceil(len(words_of[number]) / MAX_WORDS_PER_DAY), math.ceil(len(fresh) / MAX_NEW_KANJI_PER_DAY),
                   math.ceil(len(grammar_of[number]) / MAX_GRAMMAR_PER_DAY), 1)
        parts[number] = [need, len(words_of[number]) + 2 * len(fresh)]
    lesson_numbers = sorted(parts)
    reviews_estimate = 7
    spare = 90 - KANA_DAYS - RADICAL_DAYS - sum(n for n, _ in parts.values()) - reviews_estimate - len(FINAL_STAGE)
    for _ in range(max(0, spare)):
        heaviest = max(lesson_numbers, key=lambda n: parts[n][1] / parts[n][0])
        parts[heaviest][0] += 1

    seen = set()
    since_review, review_from = 0, lesson_numbers[0]
    for number in lesson_numbers:
        count = parts[number][0]
        groups = _split_words(words_of[number], count, seen, known)
        sizes = [len(grammar_of[number]) // count + (1 if i < len(grammar_of[number]) % count else 0) for i in range(count)]
        start = 0
        for index, group in enumerate(groups):
            fresh = []
            for word in group:
                for c in _kanji_chars(word, known):
                    if c not in seen:
                        seen.add(c)
                        fresh.append(c)
            plan.append({"kind": "lesson", "lesson": number, "part": index + 1, "parts": count, "words": group,
                         "kanji": fresh, "grammar": grammar_of[number][start:start + sizes[index]]})
            start += sizes[index]
        since_review += count
        if since_review >= REVIEW_AFTER_STUDY_DAYS and number != lesson_numbers[-1]:
            plan.append({"kind": "review", "from": review_from, "to": number})
            since_review, review_from = 0, number + 1
    plan.append({"kind": "review", "from": review_from, "to": lesson_numbers[-1]})
    # 4. Tổng ôn.
    for title, merged in FINAL_STAGE:
        plan.append({"kind": "final", "title": title, "merged": merged})
    assert len(plan) == 90, f"lộ trình mới có {len(plan)} ngày, cần đúng 90 — chỉnh REVIEW_AFTER_STUDY_DAYS / FINAL_STAGE"

    # ── Gán ngày cho kiến thức (cùng id, chỉ đổi cột day) ──
    orphan_kanji = [k for k in kanji_list if k["character"] not in seen]
    final_first_day = next(i for i, entry in enumerate(plan, 1) if entry["kind"] == "final")
    for day, entry in enumerate(plan, 1):
        if entry["kind"] == "radical":
            for radical in entry["radicals"]:
                radical["day"] = day
        elif entry["kind"] == "lesson":
            for word in entry["words"]:
                word["day"] = day
            for pattern in entry["grammar"]:
                pattern["day"] = day
            for char in entry["kanji"]:
                kanji_by_char[char]["day"] = day
    for kanji in orphan_kanji:
        kanji["day"] = final_first_day

    # ── Dựng lại journeyDays + dayTasks ──
    journey, tasks = [], []
    words_with = lambda char, words: [w for w in words if char in (w.get("kanji") or "")]
    for day, entry in enumerate(plan, 1):
        kind = entry["kind"]
        day_tasks = []
        row = {"day": day, "week": math.ceil(day / 7), "kanjiSummary": "—", "radicalSummary": "—", "grammarSummary": "—", "vocabSummary": "—"}
        if kind == "kana":
            old = old_days[entry["old"]]
            row.update({k: old[k] for k in ("stage", "minna", "title", "kanjiSummary", "radicalSummary", "grammarSummary", "vocabSummary", "skill")})
            day_tasks = [dict(t) for t in old_tasks.get(entry["old"], [])]
        elif kind == "radical":
            glyphs = [r["radical"].split(" / ")[0] for r in entry["radicals"]]
            row.update({"stage": "Bộ thủ", "minna": "—", "title": f"Bộ thủ ({entry['part']}/{RADICAL_DAYS}): " + "・".join(glyphs),
                        "radicalSummary": "、".join(r["radical"] for r in entry["radicals"]), "skill": "Nhận diện"})
            warmup = "Ôn hàng Katakana hôm qua." if entry["part"] == 1 else "Ôn nhanh bộ thủ hôm qua: nhìn bộ nói nghĩa, không nhìn đáp án."
            lines = [f"Học {len(entry['radicals'])} bộ thủ — nhớ mặt chữ, tên và nghĩa, tìm bộ trong Kanji. Không cần viết nhiều lần."]
            for r in entry["radicals"]:
                lines.append(f"• {r['radical']} ({r['nameJp']}) = {r['meaning']}" + (f" — có trong: {r['kanjiList']}" if r.get("kanjiList") else ""))
                if r.get("tip"):
                    lines.append(f"   Mẹo nhớ: {r['tip']}")
            day_tasks = [_task(day, "◐  Khởi động", MINUTES["warmup"], warmup),
                         _task(day, "部  Bộ thủ", MINUTES["radical"] * len(entry["radicals"]), "\n".join(lines))]
        elif kind == "lesson":
            number, lesson = entry["lesson"], lessons[entry["lesson"]]
            title = re.sub(r"^BÀI\s*\d+\s*·\s*", "", lesson["name"]).strip()
            row.update({"stage": "Minna", "minna": f"Bài {number} ({entry['part']}/{entry['parts']})", "title": title,
                        "kanjiSummary": "、".join(entry["kanji"]) or "—",
                        "grammarSummary": f"{len(entry['grammar'])} mẫu" if entry["grammar"] else "—",
                        "vocabSummary": f"{len(entry['words'])} từ"})
            first_lesson_day = plan[day - 2]["kind"] == "radical"
            day_tasks.append(_task(day, "◐  Khởi động", MINUTES["warmup"],
                                   "Ôn nhanh 45 bộ thủ: nhìn bộ nói nghĩa, không nhìn đáp án." if first_lesson_day else LESSON_WARMUP))
            day_tasks.append(_task(day, "語  Từ vựng", MINUTES["word"] * len(entry["words"]) + 3,
                                   f"Từ mới Minna bài {number}:\n" + "\n".join(f"• {w['kana']}" + (f"（{w['kanji']}）" if w["kanji"] else "") + f" = {w['meaning']}" for w in entry["words"])))
            if entry["kanji"]:
                body = [f"Học {len(entry['kanji'])} chữ Kanji ngay trong từ của hôm nay — nhớ cách đọc trong từ trước, chưa cần thuộc mọi âm đọc."]
                body += [_kanji_line(kanji_by_char[c], words_with(c, entry["words"])) for c in entry["kanji"]]
                day_tasks.append(_task(day, "漢  Kanji", MINUTES["kanji"] * len(entry["kanji"]), "\n".join(body)))
            if entry["grammar"]:
                body = [f"Minna bài {number} ({entry['part']}/{entry['parts']}) — {title}"]
                for g in entry["grammar"]:
                    body.append(f"• {g['pattern']}  ({g['usage']})")
                    if g.get("exampleJp"):
                        body.append(f"   Ví dụ: {g['exampleJp']}  = {g['exampleVi']}")
                day_tasks.append(_task(day, "文  Ngữ pháp", MINUTES["pattern"] * len(entry["grammar"]), "\n".join(body)))
            # Việc tự làm của bài (nghe, đọc…) theo phần tương ứng: ngày Excel thứ i của bài → phần ⌊i·n/m⌋.
            olds = old_lesson_days[number]
            mine = [olds[i] for i in range(len(olds)) if i * entry["parts"] // len(olds) == entry["part"] - 1]
            skill = ""
            for old in mine:
                skill = skill or old_days[old]["skill"]
                for t in old_tasks.get(old, []):
                    if t["label"].strip().startswith(SELF_TASK_GLYPHS):
                        day_tasks.append(dict(t))
            row["skill"] = skill or old_days[olds[-1]]["skill"]
        elif kind == "review":
            span = f"bài {entry['from']}–{entry['to']}" if entry["from"] != entry["to"] else f"bài {entry['from']}"
            row.update({"stage": "Minna", "minna": f"Ôn {span}", "title": f"Ôn tập — Minna {span}", "skill": "Nghe + Đọc"})
            review_kanji = [k for k in kanji_list if k["character"] in {c for e in plan if e["kind"] == "lesson" and entry["from"] <= e["lesson"] <= entry["to"] for c in e["kanji"]}]
            m = MINUTES["review"]
            day_tasks.append(_task(day, "部  Bộ thủ", m["部"], "Ôn bộ thủ: nhìn bộ nói nghĩa, kể 1 Kanji chứa bộ đó."))
            if review_kanji:
                day_tasks.append(_task(day, "漢  Kanji", m["漢"], f"Ôn {len(review_kanji)} chữ Kanji của Minna {span} qua từ chứa nó: che nghĩa → đọc từ, che từ → nhớ chữ. Trong app, đánh dấu chữ còn mờ.\n"
                                       + " ・ ".join(k["character"] for k in review_kanji)))
            day_tasks.append(_task(day, "文  Ngữ pháp", m["文"], f"Làm phần 練習B và 練習C trong Minna {span}. Sau đó tự đặt 5 câu mới."))
            day_tasks.append(_task(day, "語  Từ vựng", m["語"], f"Ôn lại toàn bộ từ vựng Minna {span}. Từ nào quên đánh dấu 'Đang học'."))
            day_tasks.append(_task(day, "耳読  Nghe + Đọc", m["耳読"], f"Làm phần 問題 (nghe + đọc) cuối mỗi bài trong Minna {span}. Ghi lỗi sai vào cột Ghi chú."))
        else:
            olds = [old_days[d] for d in entry["merged"]]
            row.update({"stage": olds[0]["stage"], "minna": olds[0]["minna"], "title": entry["title"] or olds[0]["title"], "skill": olds[0]["skill"]})
            merged = {}
            for old in entry["merged"]:
                for t in old_tasks.get(old, []):
                    if t["label"] in merged:
                        merged[t["label"]]["body"] += "\n" + t["body"]
                        merged[t["label"]]["minutes"] = max(merged[t["label"]]["minutes"], t["minutes"])
                    else:
                        merged[t["label"]] = dict(t)
            day_tasks = list(merged.values())
            if day == final_first_day and orphan_kanji:
                body = [f"Học {len(orphan_kanji)} chữ Kanji N5 chưa gặp trong từ vựng giáo trình — qua các từ ví dụ của chính chữ đó."]
                body += [_kanji_line(k, []) for k in orphan_kanji]
                day_tasks.insert(0, _task(day, "漢  Kanji", MINUTES["review_kanji"] * len(orphan_kanji), "\n".join(body)))
                row["kanjiSummary"] = "、".join(k["character"] for k in orphan_kanji)
        for order, task in enumerate(day_tasks, 1):
            task["day"], task["orderNo"] = day, order
        row["minutes"] = sum(t["minutes"] for t in day_tasks)
        journey.append(row)
        tasks.extend(day_tasks)
    data["journeyDays"], data["dayTasks"] = journey, tasks

    # Tài liệu nhắc đúng ngày thi thử mới (Excel: "Ngày 84 và 88").
    exam_days = [row["day"] for row in journey if "THI THỬ" in row["title"].upper()]
    for resource in data.get("studyResources", []):
        resource["howTo"] = re.sub(r"Ngày \d+ và \d+", f"Ngày {exam_days[0]} và {exam_days[1]}", resource["howTo"])

    # ── Bảng bài: khoảng ngày thật ──
    for number, lesson in lessons.items():
        days = [d for d, e in enumerate(plan, 1) if e["kind"] == "lesson" and e["lesson"] == number]
        if days:
            lesson["dayRange"] = f"Ngày {days[0]}–{days[-1]}" if len(days) > 1 else f"Ngày {days[0]}"
            lesson["dayCount"] = len(days)
            # Excel ghi "14 từ" cho mọi bài — ghi số thật (sau khi bổ sung từ N5 và bỏ từ trùng).
            lesson["vocabCount"] = f"{len(words_of[number])} từ"
            lesson["grammarCount"] = f"{len(grammar_of[number])} mẫu"


ADJUSTMENTS = [
    (KANA_FIRST_VOCABULARY, _apply_kana_first_vocabulary),
    (KANA_BY_ROW, _apply_kana_by_row),
    (VOCABULARY_DEDUPE, _apply_vocabulary_dedupe),
    (N5_VOCABULARY_SUPPLEMENT, _apply_n5_vocabulary_supplement),
    (VOCABULARY_TIP_CLEANUP, _apply_vocabulary_tip_cleanup),
    (ROADMAP_REPLAN_V2, _apply_roadmap_replan_v2),
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
