import { ReactNode, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";

import { getSupabaseClient } from "@/integrations/supabase/client";
import { AuthContext } from "@/hooks/useAuth";

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let unsubscribed = false;
    let subscription: { unsubscribe: () => void } | null = null;

    const initializeSession = async () => {
      const supabase = await getSupabaseClient();

      const { data } = supabase.auth.onAuthStateChange((_event, sessionData) => {
        setSession(sessionData);
        setUser(sessionData?.user ?? null);
        setLoading(false);
      });

      subscription = data.subscription;

      const {
        data: { session: sessionData },
      } = await supabase.auth.getSession();

      if (!unsubscribed) {
        setSession(sessionData);
        setUser(sessionData?.user ?? null);
        setLoading(false);
      }
    };

    void initializeSession();

    return () => {
      unsubscribed = true;
      subscription?.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    const supabase = await getSupabaseClient();
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
