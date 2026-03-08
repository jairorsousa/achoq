"use client";

import CoinBadge from "@/components/ui/CoinBadge";
import StreakCounter from "@/components/ui/StreakCounter";
import LevelBadge from "@/components/ui/LevelBadge";
import { UserLevel } from "@/lib/types";

interface HeaderProps {
  title?: string;
  // These would come from a user store in production
  coins?: number;
  streak?: number;
  level?: UserLevel;
}

export default function Header({
  title,
  coins = 0,
  streak = 0,
  level = 1,
}: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="flex items-center justify-between h-14 max-w-lg mx-auto px-4">
        {/* Logo / Title */}
        <div className="flex items-center gap-2">
          {title ? (
            <h1 className="text-lg font-extrabold text-gray-900">{title}</h1>
          ) : (
            <span className="text-xl font-extrabold text-primary tracking-tight">
              achoQ
            </span>
          )}
        </div>
        {/* Gamification badges */}
        <div className="flex items-center gap-2">
          <CoinBadge amount={coins} size="sm" />
          <StreakCounter streak={streak} size="sm" />
          <LevelBadge level={level} size="sm" />
        </div>
      </div>
    </header>
  );
}
