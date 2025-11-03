import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Database } from "@/integrations/supabase/types";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

const selectProfile = async (userId: string, email: string | undefined, name?: string | null) => {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (data) {
    return data;
  }

  const { data: inserted, error: insertError } = await supabase
    .from("profiles")
    .insert({
      id: userId,
      email,
      name: name ?? email ?? "Pengguna",
    })
    .select("*")
    .single();

  if (insertError) {
    throw insertError;
  }

  return inserted;
};

export const useProfile = () => {
  const { user } = useAuth();

  return useQuery<ProfileRow, Error>({
    enabled: Boolean(user?.id),
    queryKey: ["profile", user?.id],
    queryFn: () => selectProfile(user!.id, user!.email, user?.user_metadata?.name),
    staleTime: 5 * 60 * 1000,
  });
};
