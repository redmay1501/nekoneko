"""Tự host font: Nunito (latin + tiếng Việt), một Mali 700, Zen Maru Gothic (kana + kanji có trong bài).

Chạy lại khi thêm chữ Hán mới vào nội dung:

    python3 scripts/host-fonts.py

Ra: public/fonts/*.woff2 và src/app/fonts.css. File TTF tải về chỉ nằm trong thư mục tạm.
"""
from __future__ import annotations

import re
import subprocess
import tempfile
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FONT_DIR = ROOT / 'public' / 'fonts'
CSS_PATH = ROOT / 'src' / 'app' / 'fonts.css'
UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'

# Nunito 400–700 và Mali 700. Bỏ Nunito 800, Mali 500, Mali 600.
CSS_URL = (
    'https://fonts.googleapis.com/css2?family=Mali:wght@700'
    '&family=Nunito:wght@400;500;600;700&display=swap'
)
KEEP_SUBSETS = {'latin', 'vietnamese'}

ZEN_MARU = {
    500: 'https://github.com/google/fonts/raw/main/ofl/zenmarugothic/ZenMaruGothic-Medium.ttf',
    700: 'https://github.com/google/fonts/raw/main/ofl/zenmarugothic/ZenMaruGothic-Bold.ttf',
}
OFL = {
    'OFL-Nunito.txt': 'https://github.com/google/fonts/raw/main/ofl/nunito/OFL.txt',
    'OFL-Mali.txt': 'https://github.com/google/fonts/raw/main/ofl/mali/OFL.txt',
    'OFL-ZenMaruGothic.txt': 'https://github.com/google/fonts/raw/main/ofl/zenmarugothic/OFL.txt',
}


def fetch(url: str) -> bytes:
    request = urllib.request.Request(url, headers={'User-Agent': UA})
    with urllib.request.urlopen(request, timeout=60) as response:
        return response.read()


def google_faces() -> list[str]:
    css = fetch(CSS_URL).decode()
    blocks = re.findall(r'/\* ([^*]+) \*/\s*(@font-face \{[^}]+\})', css)
    faces: list[str] = []
    for subset, block in blocks:
        if subset.strip() not in KEEP_SUBSETS:
            continue
        family = re.search(r"font-family:\s*'([^']+)'", block).group(1)
        weight = re.search(r'font-weight:\s*(\d+)', block).group(1)
        url = re.search(r'url\(([^)]+)\)', block).group(1)
        unicode_range = re.search(r'unicode-range:\s*([^;]+);', block).group(1).strip()
        slug = f"{family.lower().replace(' ', '-')}-{weight}-{subset.strip()}"
        file_name = f'{slug}.woff2'
        (FONT_DIR / file_name).write_bytes(fetch(url))
        faces.append(
            '@font-face {\n'
            f"  font-family: '{family}';\n"
            '  font-style: normal;\n'
            f'  font-weight: {weight};\n'
            '  font-display: swap;\n'
            f"  src: url('/fonts/{file_name}') format('woff2');\n"
            f'  unicode-range: {unicode_range};\n'
            '}\n'
        )
        print(f'✓ {file_name} ({(FONT_DIR / file_name).stat().st_size // 1024} KB)')
    return faces


def characters_in_app() -> str:
    """Kana đủ bộ, cộng mọi chữ Hán / dấu câu đang có trong bài và giao diện."""
    needed: set[str] = set()
    for start, end in ((0x3000, 0x303F), (0x3040, 0x309F), (0x30A0, 0x30FF)):
        needed.update(chr(code) for code in range(start, end + 1))
    roots = [ROOT / 'content' / 'seed', ROOT / 'src']
    for root in roots:
        for path in root.rglob('*'):
            if path.suffix not in {'.json', '.ts', '.tsx', '.css'}:
                continue
            if 'node_modules' in path.parts:
                continue
            text = path.read_text(encoding='utf-8', errors='ignore')
            for char in text:
                code = ord(char)
                if (0x4E00 <= code <= 0x9FFF) or (0xFF00 <= code <= 0xFFEF) or (0x2000 <= code <= 0x206F):
                    needed.add(char)
    return ''.join(sorted(needed))


def zen_maru_faces(work: Path) -> list[str]:
    text_file = work / 'chars.txt'
    text_file.write_text(characters_in_app(), encoding='utf-8')
    faces: list[str] = []
    for weight, url in ZEN_MARU.items():
        source = work / f'zen-{weight}.ttf'
        source.write_bytes(fetch(url))
        out = FONT_DIR / f'zen-maru-gothic-{weight}.woff2'
        subprocess.run(
            [
                'pyftsubset', str(source),
                f'--output-file={out}',
                '--flavor=woff2',
                f'--text-file={text_file}',
                '--layout-features=*',
                '--recommended-glyphs',
                '--glyph-names',
                '--symbol-cmap',
                '--legacy-cmap',
                '--notdef-glyph',
                '--notdef-outline',
            ],
            check=True,
        )
        faces.append(
            '@font-face {\n'
            "  font-family: 'Zen Maru Gothic';\n"
            '  font-style: normal;\n'
            f'  font-weight: {weight};\n'
            '  font-display: swap;\n'
            f"  src: url('/fonts/zen-maru-gothic-{weight}.woff2') format('woff2');\n"
            '}\n'
        )
        print(f'✓ zen-maru-gothic-{weight}.woff2 ({out.stat().st_size // 1024} KB, {len(text_file.read_text(encoding="utf-8"))} ký tự)')
    return faces


def main() -> None:
    FONT_DIR.mkdir(parents=True, exist_ok=True)
    for name, url in OFL.items():
        (FONT_DIR / name).write_bytes(fetch(url))
    faces = google_faces()
    with tempfile.TemporaryDirectory() as temp:
        faces.extend(zen_maru_faces(Path(temp)))
    CSS_PATH.write_text(
        '/* Nunito, Mali, Zen Maru Gothic — SIL Open Font License. Giấy phép: /fonts/OFL-*.txt */\n'
        + '\n'.join(faces),
        encoding='utf-8',
    )
    print(f'✓ {CSS_PATH.relative_to(ROOT)}')


if __name__ == '__main__':
    main()
