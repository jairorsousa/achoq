"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/authStore";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { firebaseUser, isLoading } = useAuthStore();

  useEffect(() => {
    if (isLoading) return;
    if (!firebaseUser) {
      router.replace("/login");
      return;
    }
    if (!firebaseUser.isAdmin) {
      router.replace("/home");
    }
  }, [firebaseUser, isLoading, router]);

  if (isLoading || !firebaseUser || !firebaseUser.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3 animate-spin">⚙️</div>
          <p className="text-gray-500 font-semibold">Verificando acesso...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Header */}
      <header className="bg-primary text-white px-4 py-3 flex items-center gap-3">
        <span className="text-2xl">⚙️</span>
        <h1 className="text-lg font-extrabold">achoQ Admin</h1>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
