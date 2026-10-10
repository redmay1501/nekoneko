import { postJson } from '@/lib/api/api-client';
import type { SessionMode } from './session-modes';
import type { SessionSummary, StartedSession, StepAnswerFeedback } from './session-types';

export function startSession(mode: SessionMode, contentKeys?: readonly string[]): Promise<StartedSession> {
  return postJson('/api/session/start', contentKeys?.length ? { mode, contentKeys } : { mode });
}

export function answerSessionStep(sessionId: string, stepIndex: number, answer: string): Promise<StepAnswerFeedback> {
  return postJson('/api/session/answer', { sessionId, stepIndex, answer });
}

export function finishSession(sessionId: string): Promise<{ summary: SessionSummary }> {
  return postJson('/api/session/finish', { sessionId });
}
