"use client";

import { useEffect } from "react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/config";
import { useAuthStore } from "@/lib/stores/authStore";
import { useUserStore } from "@/lib/stores/userStore";

const SESSION_COOKIE = "achoq_session";
const ROLE_COOKIE = "achoq_role";

function setCookie(value: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${SESSION_COOKIE}=${value}; path=/; max-age=604800; SameSite=Lax`;
}

function setRoleCookie(value: "user" | "admin") {
  if (typeof document === "undefined") return;
  document.cookie = `${ROLE_COOKIE}=${value}; path=/; max-age=604800; SameSite=Lax`;
}

function clearCookie() {
  if (typeof document === "undefined") return;
  document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0`;
  document.cookie = `${ROLE_COOKIE}=; path=/; max-age=0`;
}

export function useAuth() {
  const { setUser, setIsLoading, setHasProfile } = useAuthStore();
  const { setProfile } = useUserStore();

  useEffect(() => {
    const applyUser = (user: SupabaseUser | null) => {
      if (user) {
        const isAdmin = user.app_metadata?.role === "admin";
        const hasProfile =
          typeof user.user_metadata?.username === "string" &&
          user.user_metadata.username.trim().length > 0;

        setCookie("1");
        setRoleCookie(isAdmin ? "admin" : "user");
        setUser({
          uid: user.id,
          email: user.email ?? null,
          permissionLevel: isAdmin ? "admin" : "user",
          isAdmin,
        });
        setHasProfile(hasProfile);
      } else {
        clearCookie();
        setUser(null);
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
  }, [setUser, setIsLoading, setHasProfile, setProfile]);
}
