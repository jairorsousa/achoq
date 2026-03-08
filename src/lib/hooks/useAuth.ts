"use client";

import { useEffect } from "react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/config";
import { useAuthStore } from "@/lib/stores/authStore";
import { useUserStore } from "@/lib/stores/userStore";

const SESSION_COOKIE = "achoq_session";

function setCookie(value: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${SESSION_COOKIE}=${value}; path=/; max-age=604800; SameSite=Lax`;
}

function clearCookie() {
  if (typeof document === "undefined") return;
  document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0`;
}

export function useAuth() {
  const { setFirebaseUser, setIsLoading, setHasProfile } = useAuthStore();
  const { setProfile } = useUserStore();

  useEffect(() => {
    const applyUser = (user: SupabaseUser | null) => {
      if (user) {
        const hasProfile =
          typeof user.user_metadata?.username === "string" &&
          user.user_metadata.username.trim().length > 0;

        setCookie("1");
        setFirebaseUser({
          uid: user.id,
          email: user.email ?? null,
          isAdmin: user.app_metadata?.role === "admin",
        });
        setHasProfile(hasProfile);
      } else {
        clearCookie();
        setFirebaseUser(null);
        setProfile(null);
        setHasProfile(null);
      }
      setIsLoading(false);
    };

    const syncSession = async () => {
      const { data } = await supabase.auth.getSession();
      applyUser(data.session?.user ?? null);
    };

    void syncSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      applyUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [setFirebaseUser, setIsLoading, setHasProfile, setProfile]);
}
