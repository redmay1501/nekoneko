import { SettingsForm } from '@/components/common/SettingsForm';
import { getLearnerContext } from '@/features/learning/learner-context';

/** SC-38 · Cài đặt. */
export default async function SettingsPage() {
  const { settings, learner } = await getLearnerContext();
  return (
    <>
      <h1>Cài đặt</h1>
      <SettingsForm initialSettings={settings} />
      {learner.isDemo ? null : (
        <form action="/auth/dang-xuat" method="post" className="mt-4">
          <button type="submit" className="btn quiet block">Đăng xuất</button>
        </form>
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
