import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/types';

// Admin client uses the service role key to bypass RLS during cron ingestion
export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key',
  {
    auth: { persistSession: false },
  }
);
