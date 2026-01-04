export {};

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
  export * from "@supabase/supabase-js";
}

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};
