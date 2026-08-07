import { NextRequest, NextResponse } from 'next/server';
import type { AppState } from '@/types';
import { isAdminRequest } from '@/lib/adminAuth';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: 'Session administrateur requise.' }, { status: 401 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Supabase serveur n’est pas configuré.' }, { status: 503 });
  const state = (await request.json().catch(() => null)) as AppState | null;
  if (!state || !Array.isArray(state.coaches) || !Array.isArray(state.bookings) || !Array.isArray(state.purchases)) {
    return NextResponse.json({ error: 'État invalide.' }, { status: 400 });
  }
  const { error } = await supabase.from('app_state').upsert({ id: 'singleton-v2', data: state, updated_at: new Date().toISOString() });
  if (error) return NextResponse.json({ error: error.message }, { status: 502 });
  return NextResponse.json({ saved: true });
}
