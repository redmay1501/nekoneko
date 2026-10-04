import Link from 'next/link';
import { ProgressBar } from '@/components/common/ProgressBar';
import { getLearnerContext } from '@/features/learning/learner-context';
import { buildMemoryOverview } from '@/features/memory/memory-overview';
import type { ContentType } from '@/features/learning/knowledge-types';
import { percentOf } from '@/lib/utils/text';
import { EmojiIcon } from '@/components/common/EmojiIcon';

interface LearningModule {
  href: string;
  icon: string;
  title: string;
  description: string;
  background: string;
  contentType?: ContentType;
}

/** 10 kho kiến thức — giữ đúng thứ tự, biểu tượng, mô tả của prototype. */
const MODULES: LearningModule[] = [
  { href: '/hoc-tap/hiragana', icon: 'neko:hiragana', title: 'Hiragana', description: 'Học – Luyện viết – Nghe – Ghi nhớ', background: '#FFEFF2', contentType: 'hiragana' },
  { href: '/hoc-tap/katakana', icon: 'neko:katakana', title: 'Katakana', description: 'Học – Luyện viết – Nghe – Ghi nhớ', background: '#FFF3DE', contentType: 'katakana' },
  { href: '/hoc-tap/bo-thu', icon: 'neko:radical', title: 'Bộ thủ', description: 'Hiểu ý nghĩa – Liên kết Kanji', background: '#EAE4F7', contentType: 'radical' },
  { href: '/hoc-tap/kanji', icon: 'neko:kanji', title: 'Kanji', description: 'N5 – Ý nghĩa – Cách đọc – Ví dụ', background: '#DFF3E4', contentType: 'kanji' },
  { href: '/hoc-tap/tu-vung', icon: 'neko:vocabulary', title: 'Từ vựng', description: 'N5 – Ví dụ – Nghe – Ghi nhớ', background: '#E2F0F8', contentType: 'vocabulary' },
  { href: '/hoc-tap/ngu-phap', icon: '📐', title: 'Ngữ pháp', description: 'Giải thích – Ví dụ – Luyện tập', background: '#FFEFF2', contentType: 'grammar' },
  { href: '/luyen-tap/nghe', icon: 'neko:listening', title: 'Luyện nghe', description: 'Nghe – Nhận diện – Shadowing', background: '#FFF3DE' },
  { href: '/luyen-tap/noi', icon: 'neko:speaking', title: 'Luyện nói', description: 'Nói theo – Tự nói – Phản xạ', background: '#EAE4F7' },
  { href: '/luyen-tap/doc', icon: 'neko:reading', title: 'Đọc hiểu', description: 'Đoạn văn ngắn – Câu hỏi', background: '#DFF3E4' },
  { href: '/luyen-tap/viet', icon: 'neko:writing', title: 'Luyện viết', description: 'Thứ tự nét – Viết tay – Chép câu', background: '#E2F0F8' },
];

/** SC-13 · Học tập — cửa vào mọi kho kiến thức, không bắt buộc theo thứ tự. */
export default async function LearningHubPage() {
  const { memoryViews } = await getLearnerContext();
  const overview = buildMemoryOverview(memoryViews);

  return (
    <>
      <h1>Học tập</h1>
      <p className="soft sm" style={{ margin: '4px 0 16px' }}>Tất cả kiến thức N5 nằm ở đây. Bạn có thể vào bất cứ lúc nào, không bắt buộc theo thứ tự.</p>
      <div className="grid two">
        {MODULES.map((module) => {
          // Kỹ năng (nghe/nói/đọc/viết) chưa có cơ chế theo dõi riêng → không hiện con số.
          const summary = module.contentType ? overview.byType.find((entry) => entry.type === module.contentType) : undefined;
          return (
            <Link key={module.href} href={module.href} className="card tight block" style={{ textAlign: 'left' }}>
              <div className="row">
                <span className="jp" aria-hidden="true" style={{ width: 56, height: 56, borderRadius: 16, background: module.background,
                  display: 'grid', placeItems: 'center', fontSize: 20 }}><EmojiIcon emoji={module.icon} size={module.icon.startsWith('neko:') ? 52 : 30} /></span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <b>{module.title}</b>
                  <div className="tiny muted">{module.description}</div>
                </div>
                {summary ? <span className="tiny muted">{summary.learned}/{summary.total}</span> : null}
              </div>
              {summary ? (
                <ProgressBar percent={percentOf(summary.learned, summary.total)} variant="thin" label={`Đã học ${module.title}`} className="mt-2.5" />
              ) : null}
            </Link>
          );
        })}
      </div>
    </>
  );
}
