#!/usr/bin/env python3
"""
Chuyển thư viện "Kanji Story" (HTML) → content/seed/kanji-stories.json.

    python3 -I scripts/import-kanji-stories.py docs/nekoneko-kanji-story-library-103-story-rewrite-v9.html

Nguyên tắc (docs/kanji-stories.md):
  - Giữ NGUYÊN văn câu chuyện, mẹo nhớ, từ ứng dụng, URL ảnh, nguồn ảnh, giấy phép — không viết lại, không rút gọn.
    Chỉ bỏ phần trang trí của bản HTML ("✦ ", nhãn "Mẹo nhớ:", dấu "|" thừa ở ô giấy phép / độ phân giải).
  - Ghép với kanji có sẵn bằng MẶT CHỮ (content/seed/n5-content.json) — không tạo kanji mới, không đổi nghĩa / âm đọc của app.
    Nghĩa / âm On / âm Kun của bản HTML được giữ trong `source` để đối chiếu, giao diện vẫn dùng dữ liệu kanji của app.
  - Có URL nguồn KHÔNG có nghĩa là giấy phép đã được xác minh → licenseStatus luôn là "unverified" khi import.
  - Dừng với lỗi (exit 1) nếu thiếu thẻ, trùng chữ, chữ không có trong app hoặc thiếu trường bắt buộc.
"""
from __future__ import annotations

import hashlib
import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SEED_CONTENT = ROOT / 'content' / 'seed' / 'n5-content.json'
OUTPUT = ROOT / 'content' / 'seed' / 'kanji-stories.json'
EXPECTED_COUNT = 103
LOCALE = 'vi'


class Node:
    def __init__(self, tag: str, attrs: dict[str, str], parent: 'Node | None'):
        self.tag, self.attrs, self.parent = tag, attrs, parent
        self.children: list['Node | str'] = []

    @property
    def classes(self) -> set[str]:
        return set(self.attrs.get('class', '').split())

    def text(self) -> str:
        return ''.join(child if isinstance(child, str) else child.text() for child in self.children)

    def find_all(self, predicate) -> list['Node']:
        found = []
        for child in self.children:
            if isinstance(child, Node):
                if predicate(child):
                    found.append(child)
                found.extend(child.find_all(predicate))
        return found

    def by_class(self, name: str) -> list['Node']:
        return self.find_all(lambda node: name in node.classes)

    def one(self, name: str) -> 'Node':
        nodes = self.by_class(name)
        if len(nodes) != 1:
            raise ValueError(f'cần đúng 1 phần tử .{name}, có {len(nodes)}')
        return nodes[0]


VOID = {'img', 'br', 'meta', 'link', 'input', 'hr', 'source'}


class TreeBuilder(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.root = Node('#root', {}, None)
        self.current = self.root

    def handle_starttag(self, tag, attrs):
        node = Node(tag, {key: value or '' for key, value in attrs}, self.current)
        self.current.children.append(node)
        if tag not in VOID:
            self.current = node

    def handle_startendtag(self, tag, attrs):
        self.current.children.append(Node(tag, {key: value or '' for key, value in attrs}, self.current))

    def handle_endtag(self, tag):
        node = self.current
        while node is not None and node.tag != tag:
            node = node.parent
        if node is not None and node.parent is not None:
            self.current = node.parent

    def handle_data(self, data):
        self.current.children.append(data)


def clean(text: str) -> str:
    return re.sub(r'\s+', ' ', text).strip()


def strip_pipes(text: str) -> list[str]:
    """'| Pixabay Content License | mô tả' → ['Pixabay Content License', 'mô tả'] (bản HTML có ô bị dính dấu | của bảng nguồn)."""
    return [part.strip() for part in text.split('|') if part.strip()]


def meta_span(meta: Node, label: str) -> Node | None:
    for span in meta.find_all(lambda node: node.tag == 'span'):
        bold = next((child for child in span.children if isinstance(child, Node) and child.tag == 'b'), None)
        if bold is not None and clean(bold.text()).rstrip(':') == label:
            return span
    return None


def span_value(span: Node) -> str:
    return clean(''.join(child if isinstance(child, str) else child.text() for child in span.children
                         if not (isinstance(child, Node) and child.tag == 'b')))


def parse_card(card: Node) -> dict:
    character = clean(card.one('char').text())
    readings = {}
    for span in card.one('reading').find_all(lambda node: node.tag == 'span'):
        label = clean(span.find_all(lambda node: node.tag == 'b')[0].text())
        readings[label] = span_value(span)

    image_tags = card.find_all(lambda node: node.tag == 'img')
    picture = card.one('picture-link')
    image_tag = image_tags[0] if image_tags else None

    meta = card.one('source-meta')
    source_span = meta_span(meta, 'Nguồn')
    source_link = source_span.find_all(lambda node: node.tag == 'a')[0] if source_span else None
    source_label = clean(source_link.text()) if source_link else ''
    label_parts = [part.strip() for part in source_label.split('·')]
    resolution_span = meta_span(meta, 'Độ phân giải gốc')
    resolution = ' '.join(strip_pipes(span_value(resolution_span))) if resolution_span else ''
    size = re.fullmatch(r'(\d+)\s*×\s*(\d+)', resolution)
    license_span = meta_span(meta, 'Giấy phép')
    license_link = license_span.find_all(lambda node: node.tag == 'a') if license_span else []
    license_parts = strip_pipes(span_value(license_span)) if license_span else []
    smalls = [clean(node.text()) for node in meta.find_all(lambda node: node.tag == 'small')]
    description, usage_note = (smalls + ['', ''])[:2]
    # Ô giấy phép có thể dính lại mô tả ảnh ("| License | mô tả") — phần dính phải trùng mô tả, nếu không là dữ liệu lạ → dừng.
    for extra in license_parts[1:]:
        if extra != description:
            raise ValueError(f'{character}: ô giấy phép có phần lạ "{extra}"')

    hook = card.one('memory-hook')
    hook_text = clean(''.join(child if isinstance(child, str) else child.text() for child in hook.children
                              if not (isinstance(child, Node) and child.tag == 'b')))
    example = card.one('example')
    example_words = [{'word': clean(card.one('example-word').text()),
                      'reading': clean(' '.join(node.text() for node in example.children if isinstance(node, Node) and node.tag == 'span'))}]

    return {
        'character': character,
        'sourceId': clean(card.one('id').text()),
        'category': card.attrs.get('data-category', ''),
        'categoryLabel': clean(card.one('category').text()),
        'title': re.sub(r'^[✦\s]+', '', clean(card.one('story-title').text())),
        'content': clean(card.one('story').text()),
        'memoryTip': hook_text,
        'exampleWords': example_words,
        'source': {'meaning': clean(card.find_all(lambda node: node.tag == 'h2')[0].text()),
                   'onyomi': readings.get('On', ''), 'kunyomi': readings.get('Kun', ''),
                   'imageStatus': card.attrs.get('data-status', '')},
        'image': None if image_tag is None else {
            'url': image_tag.attrs.get('src', ''),
            'alt': image_tag.attrs.get('alt', ''),
            'sourceUrl': picture.attrs.get('href', '') or (source_link.attrs.get('href', '') if source_link else ''),
            'sourceLabel': source_label,
            'provider': label_parts[0] if label_parts else '',
            'credit': ' · '.join(label_parts[1:]),
            'width': int(size.group(1)) if size else None,
            'height': int(size.group(2)) if size else None,
            # Nguyên văn ô "Độ phân giải gốc" (có thẻ chỉ ghi chú, không có số đo).
            'resolution': resolution,
            'license': license_parts[0] if license_parts else '',
            'licenseUrl': license_link[0].attrs.get('href', '') if license_link else '',
            # Có nguồn ≠ đã được cấp phép dùng thương mại. Chỉ người kiểm tra mới đổi sang "verified".
            'licenseStatus': 'unverified',
            'description': description,
            'usageNote': usage_note,
        },
    }


def main() -> int:
    if len(sys.argv) != 2:
        print(__doc__)
        return 2
    source_path = Path(sys.argv[1])
    raw = source_path.read_bytes()
    match = re.search(r'story-rewrite-v(\d+)', source_path.name)
    version = int(match.group(1)) if match else 1

    builder = TreeBuilder()
    builder.feed(raw.decode('utf-8'))
    cards = builder.root.find_all(lambda node: node.tag == 'article' and 'kanji-card' in node.classes)

    kanji = json.loads(SEED_CONTENT.read_text('utf-8'))['kanji']
    kanji_by_char = {entry['character']: entry for entry in kanji}

    errors: list[str] = []
    stories = []
    seen: set[str] = set()
    for card in cards:
        try:
            story = parse_card(card)
        except (ValueError, IndexError) as error:
            errors.append(str(error))
            continue
        character = story['character']
        if character in seen:
            errors.append(f'{character}: trùng chữ')
            continue
        seen.add(character)
        existing = kanji_by_char.get(character)
        if existing is None:
            errors.append(f'{character}: không có trong bảng kanji của app')
            continue
        for field in ('content', 'memoryTip', 'title'):
            if not story[field]:
                errors.append(f'{character}: thiếu {field}')
        image = story['image']
        if not image or not image['url'].startswith('https://') or not image['sourceUrl'].startswith('https://'):
            errors.append(f'{character}: thiếu URL ảnh / nguồn ảnh')
        stories.append({'kanjiId': existing['id'], 'locale': LOCALE, 'version': version, 'status': 'published', **story})

    if len(cards) != EXPECTED_COUNT:
        errors.append(f'cần {EXPECTED_COUNT} thẻ, file có {len(cards)}')
    if errors:
        print('✗ Không import được:\n  ' + '\n  '.join(errors))
        return 1

    stories.sort(key=lambda story: story['sourceId'])
    terms = lambda text: {term.strip().lower() for term in re.split(r'[,;()]', text) if term.strip()}
    # Chỉ báo những chữ mà nghĩa thư viện và nghĩa app KHÔNG có chung một nghĩa nào (khác cách ghi thì bỏ qua).
    differences = [
        f"{story['character']}: nghĩa app “{kanji_by_char[story['character']]['meaning']}” · thư viện “{story['source']['meaning']}”"
        for story in stories
        if not terms(story['source']['meaning']) & terms(kanji_by_char[story['character']]['meaning'])
    ]
    output = {
        '_note': ('Câu chuyện ghi nhớ Kanji (sinh bằng scripts/import-kanji-stories.py — KHÔNG sửa tay nội dung ở đây; '
                  'muốn đổi chuyện thì tăng version). Liên kết với kanji bằng kanjiId. Giao diện dùng nghĩa / âm đọc của bảng kanji; '
                  '`source` chỉ để đối chiếu. licenseStatus "unverified" = chưa có người kiểm tra giấy phép dùng thương mại.'),
        'source': {'file': f'docs/{source_path.name}', 'sha256': hashlib.sha256(raw).hexdigest(), 'cards': len(cards), 'version': version},
        'stories': stories,
    }
    OUTPUT.write_text(json.dumps(output, ensure_ascii=False, indent=2) + '\n', 'utf-8')
    print(f'✓ {len(stories)} câu chuyện (version {version}) → {OUTPUT.relative_to(ROOT)}')
    print(f'  {len(differences)} chữ có nghĩa ở thư viện không trùng nghĩa nào của app (giao diện giữ nghĩa của app — nên rà lại):')
    for line in differences:
        print(f'   · {line}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
