import { ProfileNameForm } from '@/components/common/ProfileNameForm';
import { SettingsForm } from '@/components/common/SettingsForm';
import { SpriteIcon } from '@/components/common/SpriteIcon';
import { getLearnerContext } from '@/features/learning/learner-context';
import { buildMemoryOverview } from '@/features/memory/memory-overview';

/** SC-37 + SC-38 · Cài đặt — gộp cả Hồ sơ: thông tin cá nhân, mục tiêu học, âm thanh, tài khoản. */
export default async function SettingsPage() {
  const { settings, learner, profile, journeyDay, streak, memoryViews } = await getLearnerContext();
  const overview = buildMemoryOverview(memoryViews);
  const stats = [
    { label: 'Ngày học', value: journeyDay },
    { label: 'Chuỗi ngày liên tiếp', value: streak.currentStreak },
    { label: 'Cây trong vườn', value: overview.learnedCount },
  ];
  return (
    <>
      <h1>Cài đặt</h1>

      <div className="sec-h"><h2>Thông tin cá nhân</h2></div>
      <div className="row" style={{ gap: 12, marginBottom: 10 }}>
        <SpriteIcon name="noko" size={64} />
        <div>
          <b>{profile.displayName}</b>
          <p className="tiny muted">Cấp {profile.level} · mục tiêu JLPT N5 trong 90 ngày</p>
        </div>
      </div>
      {learner.isDemo ? null : <ProfileNameForm initialName={profile.displayName} />}
      <div className="grid three mt-2.5" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        {stats.map((stat) => (
          <div key={stat.label} className="card tight center">
            <b style={{ fontSize: 20 }}>{stat.value}</b>
            <div className="tiny muted">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="sec-h"><h2>Mục tiêu học & âm thanh</h2></div>
      <SettingsForm initialSettings={settings} />

      {learner.isDemo ? null : (
        <>
          <div className="sec-h"><h2>Tài khoản</h2></div>
          <form action="/auth/dang-xuat" method="post">
            <button type="submit" className="btn quiet block">Đăng xuất</button>
          </form>
        </>
      )}
      <p className="tiny muted center mt-4">
        Neko Neko · dữ liệu học lấy từ lộ trình 90 ngày của bạn{learner.isDemo ? ' · đang chạy chế độ demo' : ''}
      </p>
      <p className="tiny muted center mt-1.5">
        Icon 3D: <a className="link" href="https://github.com/microsoft/fluentui-emoji" target="_blank" rel="noreferrer">Microsoft Fluent Emoji</a> (MIT)
        {' · '}Emoji động: <a className="link" href="https://googlefonts.github.io/noto-emoji-animation/" target="_blank" rel="noreferrer">Google Noto Animated Emoji</a>
        {' '}(<a className="link" href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a>)
      </p>
      <p className="tiny muted center mt-1.5">
        Câu ví dụ: <a className="link" href="https://tatoeba.org" target="_blank" rel="noreferrer">Tatoeba</a> và những người đóng góp
        {' '}(<a className="link" href="https://creativecommons.org/licenses/by/2.0/fr/" target="_blank" rel="noreferrer">CC BY 2.0 FR</a>)
      </p>
    </>
  );
}
