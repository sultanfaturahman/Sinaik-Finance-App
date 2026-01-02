import { appEnv } from '@/env';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

let clientPromise: Promise<SupabaseClient<Database>> | null = null;

const createSupabaseClient = async () => {
  const { createClient } = await import('@supabase/supabase-js');

  return createClient<Database>(appEnv.supabaseUrl, appEnv.supabaseAnonKey, {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    },
  });
};

export const getSupabaseClient = async () => {
  if (!clientPromise) {
    clientPromise = createSupabaseClient();
  }

  return clientPromise;
};
