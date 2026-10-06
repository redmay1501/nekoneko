import { getLearnerContext } from '@/features/learning/learner-context';
import { buildAchievements } from '@/features/progress/progress-summary';
import { EmojiIcon } from '@/components/common/EmojiIcon';

const LOCKED_OPACITY = 0.45;

/** SC-36 · Thành tích — cột mốc nhỏ, không phải bảng xếp hạng. */
export async function AchievementsPanel() {
  const { catalog, memoryViews, journey, streak } = await getLearnerContext();
  return (
    <>
      <p className="soft sm" style={{ margin: '4px 0 14px' }}>Những cột mốc nhỏ trên đường đi.</p>
      <div className="grid two">
        {buildAchievements(catalog, memoryViews, journey, streak.longestStreak).map((achievement) => (
          <div key={achievement.title} className="card tight" style={{ opacity: achievement.isUnlocked ? 1 : LOCKED_OPACITY }}>
            <div className="row">
              <EmojiIcon emoji={achievement.icon} size={achievement.icon.startsWith('neko:') ? 48 : 36} />
              <div>
                <b className="sm">{achievement.title}</b>
                <div className="tiny muted">{achievement.description}</div>
                <span className="sr-only">{achievement.isUnlocked ? 'Đã đạt' : 'Chưa đạt'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
