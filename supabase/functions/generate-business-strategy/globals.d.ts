declare module "https://deno.land/std@0.168.0/http/server.ts" {
  export interface ServeHandlerInfo {
    remoteAddr: {
      hostname?: string;
      port?: number;
    };
  }

  export interface ServeInit {
    hostname?: string;
    port?: number;
    signal?: AbortSignal;
    onListen?: (params: { hostname: string; port: number }) => void;
  }

  export type ServeHandler = (
    request: Request,
    info: ServeHandlerInfo,
  ) => Response | Promise<Response>;

  export function serve(handler: ServeHandler, options?: ServeInit): void;
}

declare module "https://esm.sh/@supabase/supabase-js@2.39.3" {
  export interface SupabaseError {
    message: string;
    code?: string;
  }

  export interface SupabaseResponse<T> {
    data: T;
    error: SupabaseError | null;
    count?: number | null;
  }

  export type SupabaseQueryBuilder<T = unknown> = Promise<SupabaseResponse<T>> & {
    select: (...args: unknown[]) => SupabaseQueryBuilder<T>;
    upsert: (...args: unknown[]) => SupabaseQueryBuilder<T>;
    eq: (column: string, value: unknown) => SupabaseQueryBuilder<T>;
    gte: (column: string, value: unknown) => SupabaseQueryBuilder<T>;
    maybeSingle: <U>() => Promise<SupabaseResponse<U | null>>;
    single: <U>() => Promise<SupabaseResponse<U>>;
  };

  export interface SupabaseClient {
    auth: {
      getUser: (accessToken: string) => Promise<{
        data: { user: { id: string; email?: string | null } | null };
        error: SupabaseError | null;
      }>;
    };
    from: (table: string) => SupabaseQueryBuilder;
    rpc: (fn: string, args?: Record<string, unknown>) => Promise<SupabaseResponse<unknown>>;
  }

  export function createClient(
    supabaseUrl: string,
    supabaseKey: string,
    options?: Record<string, unknown>,
  ): SupabaseClient;
}

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};
