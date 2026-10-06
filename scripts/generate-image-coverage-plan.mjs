import { readFileSync, writeFileSync } from 'node:fs';

const vocabulary = JSON.parse(readFileSync('content/seed/n5-content.json', 'utf8')).vocabulary;
const manifest = JSON.parse(readFileSync('content/seed/vocabulary-images.json', 'utf8')).assets;
const registered = new Set(manifest.map((asset) => asset.id));
const approvedCount = manifest.filter((asset) => asset.imageStatus === 'approved').length;
const reviewCount = manifest.filter((asset) => asset.imageStatus === 'needs_review').length;
const noImage = /^(?:tôi(?=$|[\s,;(])|bạn, anh\/chị|anh\/chị(?=$|[\s,;(])|bạn(?=$|[\s,;(])|ông(?=$|[\s,;(])|bà(?=$|[\s,;(])|họ(?=$|[\s,;(])|ai(?=$|[\s,;(])|là(?=$|[\s,;(])|cái này|cái đó|cái kia|này(?=$|[\s,;(])|đó(?=$|[\s,;(])|kia(?=$|[\s,;(])|ở đây|ở đó|đâu(?=$|[\s,;(])|nào(?=$|[\s,;(])|cái gì|bao nhiêu|mấy(?=$|[\s,;(])|mỗi(?=$|[\s,;(])|[~〜]|hậu tố|trợ từ|tiểu từ|liên từ|cách đếm|đơn vị|giờ(?=$|[\s,;(])|phút(?=$|[\s,;(])|hôm nay|ngày mai|hôm qua|thường xuyên|rất(?=$|[\s,;(])|quá(?=$|[\s,;(])|cũng(?=$|[\s,;(])|và(?=$|[\s,;(])|nhưng(?=$|[\s,;(])|hoặc(?=$|[\s,;(])|vì(?=$|[\s,;(])|nếu(?=$|[\s,;(])|xin(?=$|[\s,;(])|cảm ơn|chào(?=$|[\s,;(])|tạm biệt|mong được|rất hân hạnh|có thể(?=$|[\s,;(])|không thể(?=$|[\s,;(])|không(?=$|[\s,;(])|đừng(?=$|[\s,;(])|hãy(?=$|[\s,;(])|nên(?=$|[\s,;(])|phải(?=$|[\s,;(])|được(?=$|[\s,;(])|bao giờ|khi nào)/i;
const action = /^(?:mất(?:\s|$)|ra, rời khỏi|sao chép|cắt(?=$|[\s,;(])|đi ra|đi vào|thức dậy|đi ngủ|ngủ(?=$|[\s,;(])|làm việc|nghỉ ngơi|học(?=$|[\s,;(])|kết thúc|đi(?=$|[\s,;(])|đến(?=$|[\s,;(])|về(?=$|[\s,;(])|đi bộ|ăn(?=$|[\s,;(])|uống(?=$|[\s,;(])|hút(?=$|[\s,;(])|xem(?=$|[\s,;(])|nhìn(?=$|[\s,;(])|nghe(?=$|[\s,;(])|hỏi(?=$|[\s,;(])|đọc(?=$|[\s,;(])|viết(?=$|[\s,;(])|vẽ(?=$|[\s,;(])|mua(?=$|[\s,;(])|gặp(?=$|[\s,;(])|cho(?=$|[\s,;(])|tặng(?=$|[\s,;(])|nhận(?=$|[\s,;(])|mượn(?=$|[\s,;(])|dạy(?=$|[\s,;(])|gọi(?=$|[\s,;(])|đứng(?=$|[\s,;(])|ngồi(?=$|[\s,;(])|đợi(?=$|[\s,;(])|nói(?=$|[\s,;(])|chạy(?=$|[\s,;(])|lái(?=$|[\s,;(])|mở(?=$|[\s,;(])|đóng(?=$|[\s,;(])|rửa(?=$|[\s,;(])|nấu(?=$|[\s,;(])|bán(?=$|[\s,;(])|sống(?=$|[\s,;(])|biết(?=$|[\s,;(])|hiểu(?=$|[\s,;(])|thích(?=$|[\s,;(])|ghét(?=$|[\s,;(])|muốn(?=$|[\s,;(])|to(?=$|[\s,;(])|nhỏ(?=$|[\s,;(])|mới(?=$|[\s,;(])|cũ(?=$|[\s,;(])|nóng(?=$|[\s,;(])|lạnh(?=$|[\s,;(])|dài(?=$|[\s,;(])|ngắn(?=$|[\s,;(])|cao(?=$|[\s,;(])|thấp(?=$|[\s,;(])|nhiều(?=$|[\s,;(])|ít(?=$|[\s,;(])|nặng(?=$|[\s,;(])|nhẹ(?=$|[\s,;(])|nhanh(?=$|[\s,;(])|chậm(?=$|[\s,;(])|tốt(?=$|[\s,;(])|xấu(?=$|[\s,;(])|đẹp(?=$|[\s,;(])|vui(?=$|[\s,;(])|buồn(?=$|[\s,;(])|mệt(?=$|[\s,;(])|khỏe(?=$|[\s,;(])|gần(?=$|[\s,;(])|xa(?=$|[\s,;(])|dễ(?=$|[\s,;(])|khó(?=$|[\s,;(])|ngon(?=$|[\s,;(])|đắt(?=$|[\s,;(])|rẻ(?=$|[\s,;(])|sáng(?=$|[\s,;(])|tối(?=$|[\s,;(])|trẻ(?=$|[\s,;(])|già(?=$|[\s,;(])|bận(?=$|[\s,;(]))/i;
const functionFace = /^(これ|それ|あれ|どれ|この|その|あの|どの|ここ|そこ|あそこ|どこ|だれ|どなた|なに|なん|です|ます|から|まで|の|は|が|を|に|へ|で|と|も|ね|よ|か)$/;

function classify(item) {
  const meaning = item.meaning.trim();
  const face = item.kanji || item.kana;
  if (/^bạn bè/i.test(meaning)) return { group: 'B', needed: 'Yes', visual: 'Neko spending time with a friend — context illustration', source: 'NekoNeko original set', status: 'Pending' };
  if ((noImage.test(meaning) && !/^bạn bè/i.test(meaning)) || functionFace.test(face) || /^(?:〜|～)/.test(face) || /^(?:します|やります)$/.test(face)) return { group: 'C', needed: 'No', visual: '—', source: '—', status: 'Not needed' };
  if (action.test(meaning)) return { group: 'B', needed: 'Yes', visual: `Neko ${meaning.split(/[（(]/)[0].toLowerCase()} — context illustration`, source: 'NekoNeko original set', status: 'Pending' };
  return { group: 'A', needed: 'Yes', visual: `${meaning.split(/[（(]/)[0]} — direct illustration`, source: 'NekoNeko original set; consider approved/open-license assets', status: 'Pending' };
}
function cell(value) { return value.replaceAll('|', '\\|').replaceAll('\n', ' '); }

const missing = vocabulary.filter((item) => !registered.has(item.id));
const categories = missing.map(classify);
const lines = missing.map((item, index) => {
  const visual = categories[index];
  return `| ${cell(item.kanji || item.kana)} | ${cell(item.meaning)} | ${visual.group} | ${visual.needed} | ${cell(visual.visual)} | ${cell(visual.source)} | ${visual.status} |`;
});
const noCount = categories.filter((item) => item.needed === 'No').length;
const yesCount = missing.length - noCount;
const header = [
  '# Vocabulary Image Coverage Plan', '',
  'Generated from the vocabulary seed and image manifest by `npm run images:coverage`. This is an audit queue; it does not download or publish images.', '',
  `- Vocabulary entries: ${vocabulary.length}`,
  `- Entries with approved image assets: ${approvedCount}`,
  `- Existing mappings requiring quality review: ${reviewCount}`,
  `- Entries with no image mapping: ${missing.length}`,
  `- Candidate visuals: ${yesCount}`,
  `- No image needed: ${noCount}`, '',
  '## Classification', '',
  '- **A — direct visual:** a recognizable object, person, food, animal, or place.',
  '- **B — context:** an action or state best shown in a scene, preferably with Neko.',
  '- **C — no image needed:** function words, pronouns, counters, abstract expressions, and words that do not benefit from a standalone image.',
  '- Existing images marked needs_review are listed in docs/IMAGE_QUALITY_AUDIT.md and are not duplicated in this no-image queue.',
  '- This first pass uses meaning heuristics and needs editorial review. A/B suggestions are not final assignments.',
  '- Every pending asset needs a source, license, credit, and style review before approval. Only `approved` assets render in production.', '',
  '| Vocabulary | Meaning | Class | Image needed? | Suggested visual | Source candidate | Status |',
  '| --- | --- | --- | --- | --- | --- | --- |',
].join('\n');
writeFileSync('docs/IMAGE_COVERAGE_PLAN.md', `${header}\n${lines.join('\n')}\n`);
console.log(`Wrote coverage plan: ${missing.length} missing, ${yesCount} candidates, ${noCount} not needed.`);
