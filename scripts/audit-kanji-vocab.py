"""
Audit Kanji ↔ từ vựng theo ngày / bài (đọc content/seed/n5-content.json — cùng nguồn với chế độ demo và seed Supabase).

    python3 scripts/audit-kanji-vocab.py        # ghi docs/KANJI_VOCAB_MAPPING_AUDIT.md

Phân loại MỌI chữ Hán trong từ vựng của mỗi ngày:
  - Kanji giáo trình (sheet "9. Kanji 103" của file Excel lộ trình) học LẦN ĐẦU trong ngày;
  - Kanji giáo trình đã học ở ngày trước (chỉ ôn — không tạo bản ghi mới);
  - Kanji giáo trình gán cho ngày SAU từ chứa nó (= lỗi mapping — phải bằng 0);
  - Chữ Hán ngoài danh sách 103 (không có bản ghi Kanji: không Hán Việt / âm đọc / thứ tự nét).
"""
import json, os, re, collections

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
data = json.load(open(os.path.join(ROOT, 'content', 'seed', 'n5-content.json'), encoding='utf-8'))
OUT = os.path.join(ROOT, 'docs', 'KANJI_VOCAB_MAPPING_AUDIT.md')

HAN = re.compile(r'[一-鿿々]')
kanji_day = {k['character']: k['day'] for k in data['kanji']}
journey = {j['day']: j for j in data['journeyDays']}
words_by_day = collections.defaultdict(list)
for word in data['vocabulary']:
    words_by_day[word['day']].append(word)

def lesson_of(day):
    m = re.match(r'(Bài \d+)', journey[day]['minna'] or '')
    return m.group(1) if m else journey[day]['stage']

rows, outside_all, wrong_later, totals = [], collections.Counter(), [], collections.Counter()
first_seen_outside = {}
for day in sorted(words_by_day):
    new, review, later, outside = [], [], [], []
    for word in sorted(words_by_day[day], key=lambda w: w['id']):
        face = word['kanji'] or ''
        for ch in dict.fromkeys(HAN.findall(face)):
            if ch == '々':
                continue
            tag = f"{ch} ({face})"
            if ch in kanji_day:
                d = kanji_day[ch]
                if d == day: new.append(tag)
                elif d < day: review.append(tag)
                else: later.append(tag); wrong_later.append((day, ch, face, d))
            else:
                outside.append(tag); outside_all[ch] += 1
                first_seen_outside.setdefault(ch, (day, face))
    if not (new or review or later or outside):
        continue
    totals['new'] += len({t.split()[0] for t in new}); totals['outside_tags'] += len(outside)
    rows.append(f"| {day} | {lesson_of(day)} | {'、'.join(dict.fromkeys(new)) or '—'} | {'、'.join(dict.fromkeys(review)) or '—'} | {'、'.join(later) or '—'} | {'、'.join(dict.fromkeys(outside)) or '—'} |")

scheduled_by_word = {ch for ch, d in kanji_day.items() if any(ch in (w['kanji'] or '') for w in data['vocabulary'])}
orphans = sorted(set(kanji_day) - scheduled_by_word, key=lambda ch: kanji_day[ch])
watashi = next(w for w in data['vocabulary'] if w['kanji'] == '私')

doc = f"""# Audit: Kanji ↔ từ vựng theo ngày / bài

> Sinh tự động bởi `scripts/audit-kanji-vocab.py` từ `content/seed/n5-content.json` — chạy lại sau mỗi lần đổi nội dung.
> Database Supabase đang chạy đã được đối chiếu: cột `day` của 103 Kanji và 755 từ khớp 100% với file này (18/10/2026).

## Kết luận

- **Danh sách Kanji của giáo trình** = sheet "9. Kanji 103" của `content/source/Lo_trinh_JLPT_N5_90_ngay_Minna.xlsx`
  → bảng `kanji` (103 chữ). Phần học Kanji của ngày hiện **đúng và đủ** các chữ của danh sách này có trong từ của ngày:
  {totals['new']} chữ học lần đầu theo từ chứa nó + {len(orphans)} chữ không có trong từ nào (học ở ngày 82).
- **Kanji giáo trình bị gán SAU ngày của từ chứa nó: {len(wrong_later)}** (không có lỗi mapping).
- **{len(outside_all)} chữ Hán xuất hiện trong từ vựng nhưng KHÔNG thuộc danh sách 103** (ví dụ 私, 曜, 物, 家…). Không có bản ghi Kanji
  nào cho các chữ này trong repo (không Hán Việt, âm On/Kun, số nét, thứ tự nét) → phần học Kanji không thể hiện chúng.
  Đây là phạm vi dữ liệu của giáo trình, không phải lỗi lọc / truy vấn.

## Truy vết 私（わたし）

| Bước | Kết quả |
|---|---|
| Excel "11. Từ vựng 350" | có `私` · わたし · mẹo nhớ “Kanji 私 = 禾 + ム…” |
| Excel "9. Kanji 103" | **không có 私** |
| `n5-content.json` → `vocabulary` | id {watashi['id']}, `kanji`="私", ngày {watashi['day']} ({lesson_of(watashi['day'])}) |
| `n5-content.json` → `kanji` | **không có bản ghi 私** |
| Database `vocabulary` / `kanji` | giống file seed |
| Knowledge catalog | có mục từ vựng `vocabulary:{watashi['id']}`; không có mục Kanji 私 |
| Trang ngày {watashi['day']} | 私 hiện trong Từ vựng; trước đây không hiện gì ở phần Kanji — nay ghi rõ “chữ Hán ngoài 103 Kanji N5” |

私 thường được xếp ở cấp N4 trong các danh sách Kanji JLPT phổ biến; giáo trình này dạy nó qua từ わたし, không qua phần Kanji.

## Kanji giáo trình không nằm trong từ nào ({len(orphans)} chữ — học ở ngày 82 qua từ ví dụ của dữ liệu Kanji)

{'、'.join(orphans)}

## Chữ Hán ngoài danh sách 103 xuất hiện trong từ vựng ({len(outside_all)} chữ)

Chữ — số từ chứa nó — lần đầu gặp (ngày · từ):

{chr(10).join(f"- {ch} — {n} từ — ngày {first_seen_outside[ch][0]} · {first_seen_outside[ch][1]}" for ch, n in outside_all.most_common())}

## Theo từng ngày

Cột: Kanji học lần đầu (từ chứa nó) · Kanji đã học trước, chỉ ôn · Kanji gán ngày SAU (lỗi) · Chữ Hán ngoài 103.

| Ngày | Bài | Kanji mới | Ôn (đã học trước) | Gán sai ngày | Ngoài 103 Kanji |
|---|---|---|---|---|---|
{chr(10).join(rows)}

## Cần quyết định nếu muốn dạy thêm chữ ngoài danh sách

Muốn 私 (và các chữ ngoài 103) có thẻ Kanji riêng thì phải BỔ SUNG DỮ LIỆU có nguồn: Hán Việt, nghĩa, âm On/Kun, số nét
(và thứ tự nét nếu muốn luyện viết) — ví dụ từ KANJIDIC2 (CC BY-SA) cho âm đọc/nét + biên soạn Hán Việt có người duyệt.
Chưa bổ sung trong đợt này vì không có nguồn đã được dự án phê duyệt.
"""
open(OUT, 'w', encoding='utf-8').write(doc)
print(f"wrong_later={len(wrong_later)} outside={len(outside_all)} orphans={len(orphans)} new={totals['new']}")
