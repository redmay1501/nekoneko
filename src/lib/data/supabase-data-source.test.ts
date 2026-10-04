import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, expect, it } from 'vitest';
import { createInitialMemoryRecord } from '@/features/memory/memory-engine';
import { SupabaseDataSource } from './supabase-data-source';

const MIGRATIONS_DIR = path.resolve(__dirname, '../../../supabase/migrations');
const MIGRATION = readdirSync(MIGRATIONS_DIR).filter((name) => name.endsWith('.sql')).sort()
  .map((name) => readFileSync(path.join(MIGRATIONS_DIR, name), 'utf8')).join('\n');

function sqlParameterNames(functionName: string): string[] {
  const signature = new RegExp(`create or replace function public\\.${functionName}\\(([\\s\\S]*?)\\)\\s*returns`).exec(MIGRATION);
  if (!signature) throw new Error(`Không thấy hàm ${functionName} trong migration`);
  return signature[1].split(',').map((parameter) => parameter.trim().split(/\s+/)[0]).filter(Boolean);
}

describe('SupabaseDataSource ⇄ migration', () => {
  it('applyMemoryUpdate gửi đúng và đủ tham số của hàm SQL apply_memory_update', async () => {
    let sentName = '';
    let sentArgs: Record<string, unknown> = {};
    const fakeAdmin = {
      rpc: async (name: string, args: Record<string, unknown>) => {
        sentName = name;
        sentArgs = args;
        return { data: { duplicate: false }, error: null };
      },
    } as unknown as SupabaseClient;
    const source = new SupabaseDataSource({} as SupabaseClient, () => fakeAdmin);

    await source.applyMemoryUpdate({
      userId: 'u', requestId: 'r-1', contentType: 'kanji', contentId: 1, eventType: 'recall', answer: 'ひ',
      isCorrect: true, scoreBefore: 50, scoreAfter: 64, nextRecord: createInitialMemoryRecord('kanji', 1, new Date()), session: null,
    });

    expect(sentName).toBe('apply_memory_update');
    expect(Object.keys(sentArgs).sort()).toEqual(sqlParameterNames('apply_memory_update').sort());
  });

  it('advanceJourneyDay gửi đúng và đủ tham số của hàm SQL advance_journey_day', async () => {
    let sentName = '';
    let sentArgs: Record<string, unknown> = {};
    const fakeAdmin = {
      rpc: async (name: string, args: Record<string, unknown>) => {
        sentName = name;
        sentArgs = args;
        return { data: { advanced: true, current_day: 2, journey_completed: false }, error: null };
      },
    } as unknown as SupabaseClient;
    const source = new SupabaseDataSource({} as SupabaseClient, () => fakeAdmin);

    expect(await source.advanceJourneyDay('u', 1, 'manual')).toEqual({ hasAdvanced: true, currentDay: 2, isJourneyComplete: false });
    expect(sentName).toBe('advance_journey_day');
    expect(Object.keys(sentArgs).sort()).toEqual(sqlParameterNames('advance_journey_day').sort());
  });

  it('mọi bảng mà data source ghi/đọc đều tồn tại trong migration', () => {
    for (const table of ['profiles', 'user_settings', 'memory_items', 'review_events', 'learning_sessions', 'session_items']) {
      expect(MIGRATION).toContain(`create table public.${table} (`);
    }
  });
});
