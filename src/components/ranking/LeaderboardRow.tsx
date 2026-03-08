"use client";

import Avatar from "@/components/ui/Avatar";
import type { RankingEntry } from "@/lib/types";
import { formatCoins } from "@/lib/utils/format";

interface LeaderboardRowProps {
  entry: RankingEntry;
  isCurrentUser?: boolean;
}

export default function LeaderboardRow({ entry, isCurrentUser }: LeaderboardRowProps) {
  return (
    <div
      className={[
        "flex items-center gap-3 p-3 rounded-2xl",
        isCurrentUser ? "bg-primary/10 border-2 border-primary/30" : "bg-white shadow-sm",
      ].join(" ")}
    >
      <span
        className={[
          "w-7 text-center font-extrabold text-sm flex-shrink-0",
          entry.rank <= 3 ? "text-coin-dark" : "text-gray-400",
        ].join(" ")}
      >
        {entry.rank}
      </span>

      <Avatar username={entry.username} level={entry.level} size="sm" />

      <div className="flex-1 min-w-0">
        <p className={["font-bold text-sm truncate", isCurrentUser ? "text-primary" : "text-gray-900"].join(" ")}>
          @{entry.username}
          {isCurrentUser && " (você)"}
        </p>
        <p className="text-xs text-gray-400">{entry.xp} XP</p>
      </div>

      <div className="text-right flex-shrink-0">
        <p className="font-extrabold text-coin-dark text-sm">
          🪙 {formatCoins(entry.coins)}
        </p>
        <p className="text-xs text-gray-400">{entry.winRate}% acertos</p>
      </div>
    </div>
  );
}
