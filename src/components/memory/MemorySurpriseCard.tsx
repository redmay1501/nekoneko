'use client';

import Link from 'next/link';
import { AudioButton } from '@/components/common/AudioButton';
import { EmptyState } from '@/components/common/StateViews';
import { SELF_REPORT_ANSWERS } from '@/features/learning/session-types';
import { useMemorySurprise } from '@/features/memory/hooks/useMemorySurprise';
import type { SurpriseCardData } from '@/features/memory/memory-overview';
import { useSheetStore } from '@/stores/sheet-store';
import { EmojiIcon } from '@/components/common/EmojiIcon';

/**
 * "Gặp lại kiến thức" — khoảnh khắc chữ ký của Neko Neko.
 * Đúng → "Bạn vẫn nhớ!"; Sai → không phạt, hẹn gặp lại sớm hơn.
 */
export function MemorySurpriseCard({ initialCard }: { initialCard: SurpriseCardData | null }) {
  const { state, answer, showAnother, isBusy, isLoadingAnother, error } = useMemorySurprise(initialCard);
  const openKnowledge = useSheetStore((store) => store.openKnowledge);

  if (state.status === 'empty') return <EmptyState message="Hiện tại chưa có gì cần gặp lại 🌸" />;

  const { card } = state;
  const isRevealed = state.status === 'revealed';
  return (
    <section className="surprise" aria-live="polite">
      <span className="chip pink"><EmojiIcon emoji="🌸" size={16} /> Gặp lại kiến thức</span>
      <p className="sm soft mt-3">Bạn còn nhớ cái này không?</p>
      <div className="face">{card.face}</div>
      <div className="yn">
        <button type="button" className="btn" disabled={isRevealed || isBusy} style={isRevealed ? { opacity: 0.45 } : undefined}
          onClick={() => answer(SELF_REPORT_ANSWERS.REMEMBERED)}>Tôi nhớ</button>
        <button type="button" className="btn ghost" disabled={isRevealed || isBusy} style={isRevealed ? { opacity: 0.45 } : undefined}
          onClick={() => answer(SELF_REPORT_ANSWERS.FORGOT)}>Chưa nhớ</button>
      </div>
      {error ? <p className="sm mt-3" role="alert">{error.message}</p> : null}
      {state.status === 'revealed' ? (
        <div className={`reveal ${state.wasRemembered ? 'ok' : 'no'}`}>
          <div className="row" style={{ gap: 12, alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <p className="jp" style={{ fontSize: 19 }}>{card.reading}</p>
              <b>{card.meaning}</b>
              <p className="sm mt-2">
                {state.wasRemembered
                  ? `✨ Bạn vẫn nhớ! Bạn đã gặp nó ${card.lastEncounterText}.`
                  : 'Không sao. Neko Neko sẽ đưa nó quay lại sớm hơn'}
                {state.wasRemembered ? null : '.'}
              </p>
            </div>
            <AudioButton text={card.audioText} />
          </div>
          <div className="row mt-3" style={{ gap: 8 }}>
            <button type="button" className="btn sm" onClick={() => openKnowledge(card.contentKey)}>Xem kỹ hơn</button>
            {state.wasRemembered ? (
              <button type="button" className="btn quiet sm" onClick={showAnother} disabled={isBusy} aria-busy={isLoadingAnother}>Gặp thứ khác</button>
            ) : (
              <Link className="btn quiet sm" href={`/tri-nho/cuu/${card.contentKey}`}>Cứu nó ngay</Link>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
