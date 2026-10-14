import Link from 'next/link';
import { GAMES } from '@/features/games/game-catalog';

/** Trò chơi — chọn một trò để ôn kiến thức cho vui. Danh sách ở features/games/game-catalog.ts. */
export default function GamesPage() {
  return (
    <>
      <h1>🎮 Trò chơi</h1>
      <p className="soft sm" style={{ margin: '4px 0 14px' }}>Chọn một trò để ôn — chơi không ảnh hưởng điểm trí nhớ, cứ thoải mái phá kỷ lục.</p>
      <div className="game-list">
        {GAMES.map((game) => (
          <Link key={game.id} href={game.href} className="card game-card">
            <span className="game-card-icon" aria-hidden="true">{game.icon}</span>
            <span className="game-card-body">
              <b>{game.title}</b>
              <span className="sm soft">{game.description}</span>
              <span className="tiny muted">{game.kinds}</span>
            </span>
            <span className="btn sm game-card-play">Chơi</span>
          </Link>
        ))}
        <div className="card game-card is-soon" aria-label="Trò chơi mới sắp có">
          <span className="game-card-icon" aria-hidden="true">✨</span>
          <span className="game-card-body"><b>Sắp có thêm trò mới</b><span className="sm soft">Neko đang chuẩn bị thêm trò chơi để bạn chọn.</span></span>
        </div>
      </div>
    </>
  );
}
