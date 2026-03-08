"use client";

import BottomNav from "@/components/layout/BottomNav";
import Header from "@/components/layout/Header";
import ToastContainer from "@/components/ui/Toast";
import PWAInstallPrompt from "@/components/ui/PWAInstallPrompt";
import { useUserStore } from "@/lib/stores/userStore";
import { useUser } from "@/lib/hooks/useUser";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useUser(); // Subscribe to user document in realtime
  const profile = useUserStore((s) => s.profile);

  return (
    <>
      <Header
        coins={profile?.coins}
        streak={profile?.streak}
        level={profile?.level}
      />
      <ToastContainer />
      <main className="min-h-screen pt-14 pb-20 max-w-lg mx-auto px-4">
        {children}
      </main>
      <BottomNav />
      <PWAInstallPrompt />
    </>
  );
}
