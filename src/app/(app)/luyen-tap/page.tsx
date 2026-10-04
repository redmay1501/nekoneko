import Link from 'next/link';
import { SpriteIcon } from '@/components/common/SpriteIcon';
import { ModeGrid } from '@/components/learning/ModeGrid';
import { getLearnerContext } from '@/features/learning/learner-context';
import { SESSION_MODE_CONFIG } from '@/features/learning/session-modes';
import { displayedDailyMinutes } from '@/features/progress/settings-options';
import { EmojiIcon } from '@/components/common/EmojiIcon';

const SKILLS = [
  { href: '/luyen-tap/nghe', icon: 'neko:listening', label: 'Luyện nghe' },
  { href: '/luyen-tap/noi', icon: 'neko:speaking', label: 'Luyện nói' },
  { href: '/luyen-tap/doc', icon: 'neko:reading', label: 'Đọc hiểu' },
  { href: '/luyen-tap/viet', icon: 'neko:writing', label: 'Luyện viết' },
] as const;

/** Luyện tập — mọi kiểu học dùng chung một Session Engine. */
export default async function PracticeHubPage() {
  const { settings } = await getLearnerContext();
  const daily = SESSION_MODE_CONFIG.daily;
  return (
    <>
      <h1>Luyện tập</h1>
      <p className="soft sm" style={{ margin: '4px 0 16px' }}>
        Phần tối thiểu được dẫn dắt. Phần học thêm là không giới hạn — chọn kiểu phù hợp với tâm trạng hôm nay.
      </p>
      <Link href="/hoc/daily" className="card block" style={{ width: '100%', textAlign: 'left', background: 'linear-gradient(150deg,#FFEFF2,#FFF7F2)', borderColor: '#FBE3E8' }}>
        <div className="row">
          <SpriteIcon name="noko" size={54} />
          <div style={{ flex: 1 }}>
            <b><EmojiIcon emoji={daily.emoji} size={18} style={{ verticalAlign: '-3px' }} /> {daily.label} · {displayedDailyMinutes(settings.dailyMinutes, daily.targetMinutes)} phút</b>
            <div className="sm soft">{daily.description}</div>
          </div>
        </div>
        <span className="btn block sm mt-3">Bắt đầu</span>
      </Link>
      <div className="sec-h"><h2>Các kiểu học khác</h2></div>
      <ModeGrid />
      <div className="sec-h"><h2>Theo kỹ năng</h2></div>
      <div className="grid two">
        {SKILLS.map((skill) => (
          <Link key={skill.href} href={skill.href} className="card tight block" style={{ textAlign: 'left' }}>
            <div className="row"><EmojiIcon emoji={skill.icon} size={40} /><b>{skill.label}</b></div>
          </Link>
        ))}
      </div>
    </>
  );
}
