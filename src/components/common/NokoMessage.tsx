import { NOKO_MESSAGES, type NokoState } from './noko-messages';
import { SpriteIcon } from './SpriteIcon';

interface NokoMessageProps {
  state: NokoState;
  /** Thay câu mặc định khi cần nói cụ thể hơn (vẫn đúng giọng Noko). */
  text?: string;
  className?: string;
}

export function NokoMessage({ state, text, className }: NokoMessageProps) {
  return (
    <div className={`noko-bubble ${className ?? ''}`} role="status">
      <SpriteIcon name="noko" size={46} />
      <div>
        <b>Noko</b>
        <p>{text ?? NOKO_MESSAGES[state]}</p>
      </div>
    </div>
  );
}
