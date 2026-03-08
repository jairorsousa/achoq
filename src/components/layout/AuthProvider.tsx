"use client";

import { useAuth } from "@/lib/hooks/useAuth";

// Mounts auth listener globally
export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useAuth();
  return <>{children}</>;
}
