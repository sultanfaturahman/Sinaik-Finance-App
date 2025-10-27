import { z } from "zod";

const envSchema = z.object({
  SUPABASE_URL: z.string().url({
    message: "VITE_SUPABASE_URL harus berupa URL yang valid",
  }),
  SUPABASE_ANON_KEY: z
    .string()
    .min(1, "VITE_SUPABASE_ANON_KEY atau VITE_SUPABASE_PUBLISHABLE_KEY wajib diisi"),
});

const parsed = envSchema.parse({
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  SUPABASE_ANON_KEY:
    import.meta.env.VITE_SUPABASE_ANON_KEY ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
});

export const appEnv = {
  supabaseUrl: parsed.SUPABASE_URL,
  supabaseAnonKey: parsed.SUPABASE_ANON_KEY,
} as const;
