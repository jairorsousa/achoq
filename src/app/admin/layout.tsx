"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/authStore";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { firebaseUser, isLoading } = useAuthStore();
  const isAdmin =
    firebaseUser?.permissionLevel === "admin" || Boolean(firebaseUser?.isAdmin);

  useEffect(() => {
    if (isLoading) return;
    if (!firebaseUser) {
      router.replace("/login");
      return;
    }
    if (!isAdmin) {
      router.replace("/home");
    }
  }, [firebaseUser, isAdmin, isLoading, router]);

  if (isLoading || !firebaseUser || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3 animate-spin">ADM</div>
          <p className="text-gray-500 font-semibold">Verificando acesso...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-white px-4 py-3 flex items-center gap-3">
        <span className="text-2xl font-black">ADM</span>
        <h1 className="text-lg font-extrabold">achoQ Admin</h1>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
