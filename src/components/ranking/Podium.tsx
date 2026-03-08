"use client";

import { motion } from "framer-motion";
import Avatar from "@/components/ui/Avatar";
import type { RankingEntry } from "@/lib/types";
import { formatCoins } from "@/lib/utils/format";

interface PodiumProps {
  top3: RankingEntry[];
}

const MEDALS = ["🥇", "🥈", "🥉"];
const HEIGHTS = ["h-28", "h-20", "h-16"];
const ORDER = [1, 0, 2]; // display order: 2nd, 1st, 3rd

export default function Podium({ top3 }: PodiumProps) {
  if (top3.length === 0) return null;

  return (
    <div className="flex items-end justify-center gap-3 py-4">
      {ORDER.map((idx) => {
        const entry = top3[idx];
        if (!entry) return <div key={idx} className="flex-1" />;

        return (
          <motion.div
            key={entry.userId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.15 }}
            className="flex-1 flex flex-col items-center gap-2"
          >
            <span className="text-2xl">{MEDALS[idx]}</span>
            <Avatar
              username={entry.username}
              level={entry.level}
              size={idx === 0 ? "lg" : "md"}
            />
            <div className="text-center">
              <p className="font-extrabold text-gray-900 text-xs truncate max-w-[80px]">
                @{entry.username}
              </p>
              <p className="text-xs text-coin-dark font-bold">
                🪙 {formatCoins(entry.coins)}
              </p>
            </div>
            <div
              className={[
                "w-full rounded-t-2xl flex items-center justify-center",
                HEIGHTS[idx],
                idx === 0
                  ? "bg-coin text-white"
                  : idx === 1
                  ? "bg-gray-300 text-gray-700"
                  : "bg-amber-700/60 text-white",
              ].join(" ")}
            >
              <span className="font-extrabold text-lg">{idx + 1}</span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
