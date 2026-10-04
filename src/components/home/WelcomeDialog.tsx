'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { BrandLogo } from '@/components/common/BrandLogo';
import { SpriteIcon } from '@/components/common/SpriteIcon';
import { updateSettings, type SettingsPatch } from '@/features/progress/settings-api';
import { DAILY_GOAL_OPTIONS } from '@/features/progress/settings-options';
import { startNavigation } from '@/stores/navigation-progress-store';
import { EmojiIcon } from '@/components/common/EmojiIcon';

const DAILY_HABITS = [
  { icon: '🌱', background: 'var(--mint)', title: 'Học', description: 'Vài kiến thức mới mỗi ngày, theo lộ trình 90 ngày.' },
  { icon: '🧠', background: '#FFEFF2', title: 'Gặp lại', description: 'Noko đưa chúng quay lại đúng lúc bạn sắp quên.' },
  { icon: '🌸', background: 'var(--lav)', title: 'Ở lại', description: 'Mỗi thứ bạn nhớ được thành một cây trong vườn.' },
] as const;

const STEP_COUNT = 3;

interface WelcomeDialogProps {
  displayName: string;
  journeyDay: number;
  initialDailyMinutes: number;
}

/**
 * Lời chào lần đầu (SC-01 + SC-03 gộp lại): Noko giới thiệu → cách Neko Neko hoạt động → chọn mục tiêu mỗi ngày.
 * Chỉ hiện khi user_settings.welcomed_at còn trống; đi hết hay bấm "Bỏ qua" đều ghi lại để không chào lần hai.
 */
export function WelcomeDialog({ displayName, journeyDay, initialDailyMinutes }: WelcomeDialogProps) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(true);
  const [step, setStep] = useState(0);
  const [dailyMinutes, setDailyMinutes] = useState(initialDailyMinutes);
  const [nextAction, setNextAction] = useState<'learn' | 'explore' | 'skip' | null>(null);

  const mutation = useMutation({
    mutationFn: (patch: SettingsPatch) => updateSettings({ ...patch, welcomed: true }),
  });

  async function finish(action: 'learn' | 'explore' | 'skip') {
    setNextAction(action);
    const patch = action === 'skip' ? {} : { dailyMinutes };
    try {
      await mutation.mutateAsync(patch);
    } catch {
      // Bỏ qua mà lưu hỏng thì vẫn đóng — lần sau chào lại cũng không sao. Hai nút còn lại: hiện lỗi để thử lại.
      if (action !== 'skip') return;
    }
    setIsOpen(false);
    if (action === 'learn') {
      startNavigation();
      router.push('/hoc/daily');
    } else {
      // Mục tiêu mới đổi → Trang chủ và thanh trên hiện đúng số phút.
      router.refresh();
    }
  }

  useEffect(() => {
    if (!isOpen) return;
    dialogRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const isBusy = mutation.isPending;
  const isLastStep = step === STEP_COUNT - 1;

  return (
    <>
      <div className="scrim on" aria-hidden="true" />
      <div ref={dialogRef} className="welcome" role="dialog" aria-modal="true" aria-labelledby="welcome-title" tabIndex={-1}
        onKeyDown={(event) => { if (event.key === 'Escape' && !isBusy) void finish('skip'); }}>
        <div className="between welcome-top">
          <div className="welcome-dots" aria-label={`Bước ${step + 1} trên ${STEP_COUNT}`}>
            {Array.from({ length: STEP_COUNT }, (_, index) => <i key={index} className={index <= step ? 'on' : ''} />)}
          </div>
          <button type="button" className="link" onClick={() => finish('skip')} disabled={isBusy}
            aria-busy={isBusy && nextAction === 'skip'}>Bỏ qua</button>
        </div>

        <div key={step} className="pop">
          {step === 0 ? (
            <>
              <BrandLogo width={300} className="mx-auto welcome-logo" />
              <h2 id="welcome-title" className="mt-4">Chào {displayName}! Mình là Noko 🌸</h2>
              <p className="soft mt-2">
                <b className="jp">猫</b> (neko) là <b>“con mèo”</b> trong tiếng Nhật. Trong 90 ngày tới, mình sẽ cùng bạn đi tới kỳ thi
                JLPT N5 — và giữ những gì bạn học ở lại thật lâu.
              </p>
              <p className="sm muted mt-2">Bạn không cần nhớ tất cả hôm nay. Mình sẽ nhắc đúng lúc bạn sắp quên.</p>
            </>
          ) : null}

          {step === 1 ? (
            <>
              <div className="center"><SpriteIcon name="noko" size={84} className="mx-auto" /></div>
              <h2 id="welcome-title" className="center mt-2">Mỗi ngày, ba việc nhỏ</h2>
              <div className="steps">
                {DAILY_HABITS.map((habit) => (
                  <div key={habit.title} className="step">
                    <span className="step-ic" style={{ background: habit.background }} aria-hidden="true"><EmojiIcon emoji={habit.icon} size={24} /></span>
                    <span className="step-l"><b>{habit.title}</b><span>{habit.description}</span></span>
                  </div>
                ))}
              </div>
              <p className="sm soft">Bạn không phải tự lên lịch ôn — Neko Neko theo dõi từng chữ, từng từ cho bạn.</p>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <div className="center"><SpriteIcon name="noko" size={84} className="mx-auto" /></div>
              <h2 id="welcome-title" className="center mt-2">Mỗi ngày bạn muốn dành bao lâu?</h2>
              <p className="sm soft center mt-1.5">Ít mà đều thì ở lại lâu hơn. Đổi lại lúc nào cũng được trong Cài đặt.</p>
              <div className="welcome-goals mt-4" role="radiogroup" aria-label="Mục tiêu mỗi ngày">
                {DAILY_GOAL_OPTIONS.map((option) => {
                  const isSelected = dailyMinutes === option.minutes;
                  return (
                    <button key={option.minutes} type="button" role="radio" aria-checked={isSelected} disabled={isBusy}
                      className={`welcome-goal ${isSelected ? 'on' : ''}`} onClick={() => setDailyMinutes(option.minutes)}>
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </>
          ) : null}
        </div>

        {mutation.isError && nextAction !== 'skip' ? (
          <p className="sm mt-3" role="alert">Chưa lưu được. Bạn thử lại nhé.</p>
        ) : null}

        <div className="mt-5">
          {isLastStep ? (
            <>
              <button type="button" className="btn block" onClick={() => finish('learn')} disabled={isBusy}
                aria-busy={isBusy && nextAction === 'learn'}>
                🌸 Bắt đầu ngày {journeyDay}
              </button>
              <button type="button" className="btn quiet block mt-2" onClick={() => finish('explore')} disabled={isBusy}
                aria-busy={isBusy && nextAction === 'explore'}>
                Để mình xem quanh trước
              </button>
            </>
          ) : (
            <div className="row" style={{ gap: 8 }}>
              {step > 0 ? <button type="button" className="btn quiet" onClick={() => setStep(step - 1)}>Quay lại</button> : null}
              <button type="button" className="btn" style={{ flex: 1 }} onClick={() => setStep(step + 1)}>
                {step === 0 ? 'Mình bắt đầu nhé' : 'Tiếp tục'}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
