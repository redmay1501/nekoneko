import { USER_MESSAGES } from '@/lib/constants/messages';
import { SpriteIcon } from './SpriteIcon';

/**
 * Ba trạng thái phải có của mọi khối bất đồng bộ: đang tải · rỗng · lỗi (Coding Standards §18).
 * Trạng thái đang tải dùng khung xương ở Skeleton.tsx / PageSkeletons.tsx.
 */

export function EmptyState({ message, hint }: { message: string; hint?: string }) {
  return (
    <div className="card center">
      <p className="soft">{message}</p>
      {hint ? <p className="tiny muted mt-1.5">{hint}</p> : null}
    </div>
  );
}

export function ErrorState({ message = USER_MESSAGES.GENERIC_ERROR, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="card center" role="alert">
      <SpriteIcon name="noko" size={64} className="mx-auto" />
      <p className="soft mt-2">{message}</p>
      {onRetry ? (
        <button type="button" className="btn ghost sm mt-3" onClick={onRetry}>
          Thử lại
        </button>
      ) : null}
    </div>
  );
}
