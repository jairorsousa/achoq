"use client";

import dynamic from "next/dynamic";

// AuthProvider is client-only (reads browser session/cookies)
const AuthProvider = dynamic(() => import("./AuthProvider"), { ssr: false });

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthProvider>{children}</AuthProvider>;
}
