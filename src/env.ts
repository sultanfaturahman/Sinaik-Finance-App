const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl) {
  throw new Error("Environment variable VITE_SUPABASE_URL wajib diisi");
}

if (!supabaseAnonKey) {
  throw new Error("VITE_SUPABASE_ANON_KEY atau VITE_SUPABASE_PUBLISHABLE_KEY wajib diisi");
}

export const appEnv = {
  supabaseUrl,
  supabaseAnonKey,
} as const;
