"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase/config";
import { mapUserRow } from "@/lib/supabase/mappers";
import { useAuthStore } from "@/lib/stores/authStore";
import { useUserStore } from "@/lib/stores/userStore";

export function useUser() {
  const authUser = useAuthStore((s) => s.user);
  const setProfile = useUserStore((s) => s.setProfile);

  useEffect(() => {
    if (!authUser) {
      setProfile(null);
      return;
    }

    let mounted = true;

    const loadProfile = async () => {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", authUser.uid)
        .single();

      if (!mounted) return;
      if (error || !data) {
        setProfile(null);
        return;
      }

      setProfile(
        mapUserRow(
          data as Parameters<typeof mapUserRow>[0],
          authUser.email
        )
      );
    };

    void loadProfile();

    const channel = supabase
      .channel(`user_profile_${authUser.uid}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "users",
          filter: `id=eq.${authUser.uid}`,
        },
        (payload) => {
          if (payload.eventType === "DELETE") {
            setProfile(null);
            return;
          }

          const row = payload.new as Parameters<typeof mapUserRow>[0] | undefined;
          if (!row) return;
          setProfile(mapUserRow(row, authUser.email));
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      void supabase.removeChannel(channel);
    };
  }, [authUser, setProfile]);
}
