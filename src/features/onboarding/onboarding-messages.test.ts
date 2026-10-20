import { describe, expect, it } from 'vitest';
import { buildOnboardingSrc, parseOnboardingMessage } from './onboarding-messages';

describe('buildOnboardingSrc', () => {
  it('gắn embed và mục tiêu hiện tại', () => {
    expect(buildOnboardingSrc({ dailyMinutes: 15 })).toBe('/onboarding-3d/index.html?embed=1&phut=15');
  });

  it('mục tiêu lạ thì dùng 8 phút; mode=replay khi xem lại', () => {
    expect(buildOnboardingSrc({ dailyMinutes: 42, replay: true })).toBe('/onboarding-3d/index.html?embed=1&phut=8&mode=replay');
  });
});

describe('parseOnboardingMessage', () => {
  it('bỏ qua tin không phải của trang 3D', () => {
    expect(parseOnboardingMessage(null)).toBeNull();
    expect(parseOnboardingMessage('ready')).toBeNull();
    expect(parseOnboardingMessage({ source: 'other', type: 'ready' })).toBeNull();
    expect(parseOnboardingMessage({ source: 'nekoneko-onboarding', type: 'hack' })).toBeNull();
    expect(parseOnboardingMessage({ source: 'nekoneko-onboarding', type: 'done', action: 'delete' })).toBeNull();
  });

  it('đọc ready / close', () => {
    expect(parseOnboardingMessage({ source: 'nekoneko-onboarding', type: 'ready', mode: '2d' })).toEqual({ type: 'ready', mode: '2d' });
    expect(parseOnboardingMessage({ source: 'nekoneko-onboarding', type: 'close' })).toEqual({ type: 'close' });
  });

  it('done: chỉ nhận số phút hợp lệ, bỏ qua thì không đổi mục tiêu', () => {
    expect(parseOnboardingMessage({ source: 'nekoneko-onboarding', type: 'done', action: 'learn', dailyMinutes: 15 }))
      .toEqual({ type: 'done', action: 'learn', dailyMinutes: 15 });
    expect(parseOnboardingMessage({ source: 'nekoneko-onboarding', type: 'done', action: 'home', dailyMinutes: 0 }))
      .toEqual({ type: 'done', action: 'home', dailyMinutes: 0 });
    expect(parseOnboardingMessage({ source: 'nekoneko-onboarding', type: 'done', action: 'home', dailyMinutes: 999 }))
      .toEqual({ type: 'done', action: 'home', dailyMinutes: null });
    expect(parseOnboardingMessage({ source: 'nekoneko-onboarding', type: 'done', action: 'skip', dailyMinutes: 15 }))
      .toEqual({ type: 'done', action: 'skip', dailyMinutes: null });
  });
});
