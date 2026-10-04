import { NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/config/env';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabaseClient();
    await supabase.auth.signOut();
  }
  return NextResponse.redirect(new URL('/dang-nhap', request.url), { status: 303 });
}
