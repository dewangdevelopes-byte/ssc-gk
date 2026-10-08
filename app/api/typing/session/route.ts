import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { net_wpm, accuracy, key_depressions } = body;

    if (
      typeof net_wpm !== 'number' ||
      typeof accuracy !== 'number' ||
      typeof key_depressions !== 'number'
    ) {
      return NextResponse.json(
        { error: 'Invalid payload: net_wpm, accuracy, and key_depressions must be numbers' },
        { status: 400 }
      );
    }

    const payload = {
      net_wpm: Math.max(0, Math.round(net_wpm)),
      accuracy: Math.min(100, Math.max(0, parseFloat(accuracy.toFixed(2)))),
      key_depressions: Math.max(0, Math.round(key_depressions)),
      created_at: new Date().toISOString(),
    };

    // Try server client first, fallback to admin client if service key is configured
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from('typing_sessions')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.warn('Server client insert failed, attempting supabaseAdmin:', error.message);
      const { data: adminData, error: adminError } = await supabaseAdmin
        .from('typing_sessions')
        .insert(payload)
        .select()
        .single();

      if (adminError) {
        throw adminError;
      }

      return NextResponse.json({ success: true, session: adminData });
    }

    return NextResponse.json({ success: true, session: data });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error saving typing session:', msg);
    return NextResponse.json(
      { error: 'Failed to record typing session', details: msg },
      { status: 500 }
    );
  }
}
