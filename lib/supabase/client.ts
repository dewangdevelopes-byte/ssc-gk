import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/types';

let client: ReturnType<typeof createClient<Database>> | null = null;

export const createClientSupabaseClient = () => {
  if (client) return client;

  client = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'
  );

  return client;
};
