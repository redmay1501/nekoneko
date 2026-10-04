"""
Chuyển file lộ trình Excel (nguồn sự thật về nội dung) thành JSON seed.

    python3 scripts/convert-roadmap.py

Vào : content/source/Lo_trinh_JLPT_N5_90_ngay_Minna.xlsx
Ra  : content/seed/n5-content.json

Chỉ cần chạy lại khi file Excel thay đổi. Kết quả JSON được commit vào repo để
cả chế độ demo lẫn script seed Supabase dùng chung một nguồn.

QUAN TRỌNG: script này KHÔNG được tự đổi thứ tự, ngày học hay số lượng.
Nó chỉ đổi tên cột sang tiếng Anh cho khớp schema database. Mọi điều chỉnh có chủ đích của chủ sản phẩm
nằm riêng ở scripts/roadmap_adjustments.py (có ghi ngày và lý do).

Yêu cầu: pip install openpyxl
"""
import json, re, os, sys
import openpyxl

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "content", "source", "Lo_trinh_JLPT_N5_90_ngay_Minna.xlsx")
OUT = os.path.join(ROOT, "content", "seed", "n5-content.json")
SUPPLEMENT = os.path.join(ROOT, "content", "seed", "supplement.json")

wb = openpyxl.load_workbook(SRC, data_only=True)
text = lambda v: "" if v is None else str(v).strip()
num = lambda v: int(float(v)) if text(v) and re.match(r"^-?\d+(\.\d+)?$", text(v)) else None
rows = lambda name: [[text(c) for c in r] for r in wb[name].iter_rows(values_only=True)]

journey = []
for r in rows("2. Lộ trình tổng quan")[2:]:
    if not r[0].isdigit():
        continue
    journey.append({
        "day": int(r[0]), "week": num(r[2]), "stage": r[3], "minna": r[4], "title": r[5],
        "kanjiSummary": r[6], "radicalSummary": r[7], "grammarSummary": r[8],
        "vocabSummary": r[9], "skill": r[10], "minutes": num(r[11]) or 0,
    })

day_tasks = []
for sheet in ["3. Chi tiết N1-14", "4. Chi tiết N15-45", "5. Chi tiết N46-77", "6. Chi tiết N78-90"]:
    current, order = None, 0
    for r in rows(sheet):
        m = re.match(r"^NGÀY\s+(\d+)", r[0])
        if m:
            current, order = int(m.group(1)), 0
            continue
        if current and r[0] and r[1]:
            order += 1
            day_tasks.append({"day": current, "orderNo": order, "label": r[0], "body": r[1], "minutes": num(r[2]) or 0})

kana = [{"id": int(r[0]), "hiragana": r[1], "katakana": r[2], "romaji": r[3], "day": num(r[4]), "tip": r[6]}
        for r in rows("7. Bảng chữ cái")[2:] if r[0].isdigit()]

radicals = [{"id": int(r[0]), "radical": r[1], "nameJp": r[2], "meaning": r[3], "kanjiList": r[4],
             "tip": r[5], "day": num(r[6])} for r in rows("8. Bộ thủ 45")[3:] if r[0].isdigit()]

kanji = [{"id": int(r[0]), "character": r[1], "hanViet": r[2], "meaning": r[3], "onReading": r[4],
          "kunReading": r[5], "strokes": num(r[6]), "words": r[7], "tip": r[8], "day": num(r[9])}
         for r in rows("9. Kanji 103")[2:] if r[0].isdigit()]

grammar, lesson = [], ""
for r in rows("10. Ngữ pháp Minna")[2:]:
    if r[0].startswith("▌"):
        lesson = r[0].replace("▌", "").strip(); continue
    if r[0].isdigit():
        grammar.append({"id": int(r[0]), "pattern": r[1], "usage": r[2], "exampleJp": r[3],
                        "exampleVi": r[4], "day": num(r[5]), "lesson": lesson})

vocabulary, lesson = [], ""
for r in rows("11. Từ vựng 350")[3:]:
    if r[0].startswith("▌"):
        lesson = r[0].replace("▌", "").strip(); continue
    if r[0].isdigit():
        vocabulary.append({"id": int(r[0]), "kana": r[1], "kanji": r[2], "meaning": r[3],
                           "tip": r[4], "day": num(r[5]), "lesson": lesson})

lessons = [{"id": r[0], "name": r[1], "dayRange": r[2], "dayCount": num(r[3]), "grammarCount": r[4],
            "vocabCount": r[5], "note": r[6]} for r in rows("12. Lịch Minna")[2:] if r[0].startswith("Bài")]

jlpt = [{"id": int(r[0]), "pattern": r[1], "usage": r[2]} for r in rows("13. Ngữ pháp JLPT 94")[3:] if r[0].isdigit()]

resources = [{"id": int(r[0]), "source": r[1], "usedFor": r[2], "howTo": r[3]}
             for r in rows("14. Nghe & Đọc")[2:] if r[0].isdigit()]

# Nội dung Neko Neko tự soạn (không lấy từ sách) — đoạn đọc hiểu và mẫu câu luyện tập.
supplement = json.load(open(SUPPLEMENT, encoding="utf-8"))

data = {
    "meta": {"source": os.path.basename(SRC), "level": "N5", "totalDays": 90},
    "journeyDays": journey, "dayTasks": day_tasks, "kana": kana, "radicals": radicals,
    "kanji": kanji, "grammar": grammar, "vocabulary": vocabulary, "lessons": lessons,
    "jlptGrammar": jlpt, "studyResources": resources,
    "readingPassages": supplement["readingPassages"],
    "practiceTemplates": supplement["practiceTemplates"],
}

EXPECTED = {"journeyDays": 90, "kana": 104, "radicals": 45, "kanji": 103, "grammar": 112,
            "vocabulary": 350, "lessons": 25, "jlptGrammar": 94}
for key, count in EXPECTED.items():
    if len(data[key]) != count:
        sys.exit(f"Sai số lượng {key}: có {len(data[key])}, cần {count}. Dừng lại, không ghi file.")
if len(day_tasks) != 491:
    sys.exit(f"Sai số đầu việc: có {len(day_tasks)}, cần 491.")

# Điều chỉnh của chủ sản phẩm (sau khi đã kiểm số lượng của Excel gốc) — xem scripts/roadmap_adjustments.py.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import roadmap_adjustments
roadmap_adjustments.apply(data)

json.dump(data, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("Đã ghi", OUT, {k: len(v) for k, v in data.items() if isinstance(v, list)})
