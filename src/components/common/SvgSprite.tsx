import { SPRITE_MARKUP } from './sprite-markup';

/** Chèn bộ hình vẽ một lần ở layout gốc để mọi nơi dùng lại qua <use href="#…">. */
export function SvgSprite() {
  return (
    <svg
      width="0"
      height="0"
      style={{ position: 'absolute' }}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: SPRITE_MARKUP }}
    />
  );
}
