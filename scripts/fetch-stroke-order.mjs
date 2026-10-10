/**
 * Tải dữ liệu thứ tự nét từ KanjiVG (https://kanjivg.tagaini.net) cho mọi chữ kana và Kanji trong nội dung N5.
 *
 * KanjiVG © Ulrich Apel — Creative Commons Attribution-Share Alike 3.0. Dữ liệu chuyển đổi (public/strokes/*.json)
 * giữ cùng giấy phép; ghi nguồn ở public/strokes/LICENSE.txt và ngay dưới hình động thứ tự nét.
 *
 * Mỗi chữ → public/strokes/<mã hex>.json: { c, strokes: [đường SVG theo đúng thứ tự], labels: [[x, y] vị trí số nét] }.
 * Mục lục content/seed/stroke-order.json: chữ nào CÓ dữ liệu và bao nhiêu nét — giao diện chỉ hiện nút
 * thứ tự nét cho chữ có trong mục lục (không đoán cho chữ thiếu).
 *
 * Chạy: node scripts/fetch-stroke-order.mjs
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const SOURCE = 'https://raw.githubusercontent.com/KanjiVG/kanjivg/master/kanji';
const OUT_DIR = 'public/strokes';
const INDEX_FILE = 'content/seed/stroke-order.json';

const content = JSON.parse(await readFile('content/seed/n5-content.json', 'utf8'));
const characters = new Set();
for (const kana of content.kana) for (const character of `${kana.hiragana}${kana.katakana}`) characters.add(character);
for (const kanji of content.kanji) characters.add(kanji.character);

const hexOf = (character) => character.codePointAt(0).toString(16).padStart(5, '0');

function parseKanjiVg(svg) {
  const strokes = [...svg.matchAll(/<path id="kvg:[0-9a-f]+-s(\d+)"[^>]*\sd="([^"]+)"/g)]
    .sort((a, b) => Number(a[1]) - Number(b[1]))
    .map((match) => match[2]);
  const labels = [...svg.matchAll(/<text transform="matrix\(1 0 0 1 ([\d.]+) ([\d.]+)\)">(\d+)<\/text>/g)]
    .sort((a, b) => Number(a[3]) - Number(b[3]))
    .map((match) => [Number(match[1]), Number(match[2])]);
  return { strokes, labels };
}

await mkdir(OUT_DIR, { recursive: true });
const index = {};
const missing = [];
for (const character of [...characters].sort()) {
  const response = await fetch(`${SOURCE}/${hexOf(character)}.svg`);
  if (!response.ok) { missing.push(character); continue; }
  const { strokes, labels } = parseKanjiVg(await response.text());
  if (!strokes.length || strokes.length !== labels.length) { missing.push(character); continue; }
  await writeFile(`${OUT_DIR}/${hexOf(character)}.json`, JSON.stringify({ c: character, strokes, labels }));
  index[character] = strokes.length;
}

await writeFile(INDEX_FILE, `${JSON.stringify({
  source: 'KanjiVG — https://kanjivg.tagaini.net',
  license: 'CC BY-SA 3.0 — https://creativecommons.org/licenses/by-sa/3.0/',
  copyright: 'Copyright (C) 2009–2025 Ulrich Apel',
  retrieved: new Date().toISOString().slice(0, 10),
  strokeCounts: index,
}, null, 2)}\n`);
console.log(`Đã lưu ${Object.keys(index).length} chữ · thiếu ${missing.length}: ${missing.join('')}`);
