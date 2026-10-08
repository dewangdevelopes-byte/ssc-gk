import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/types';

export const createServerSupabaseClient = () => {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key',
    {
      auth: { persistSession: false },
    }
  );
};
