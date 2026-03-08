"use client";

import { motion } from "framer-motion";

type StreakSize = "sm" | "md";

interface StreakCounterProps {
  streak: number;
  size?: StreakSize;
  className?: string;
}

const sizeStyles: Record<StreakSize, { text: string; icon: string; wrapper: string }> = {
  sm: { text: "text-sm", icon: "text-base", wrapper: "gap-1 px-2 py-1" },
  md: { text: "text-base", icon: "text-xl", wrapper: "gap-1.5 px-3 py-1.5" },
};

export default function StreakCounter({
  streak,
  size = "md",
  className = "",
}: StreakCounterProps) {
  const styles = sizeStyles[size];
  const hasStreak = streak > 0;

  return (
    <div
      className={[
        "inline-flex items-center rounded-full font-bold",
        hasStreak
          ? "bg-orange-50 text-orange-600"
          : "bg-gray-100 text-gray-400",
        styles.wrapper,
        className,
      ].join(" ")}
    >
      <motion.span
        className={styles.icon}
        animate={hasStreak ? { scale: [1, 1.2, 1] } : {}}
        transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 2 }}
      >
        🔥
      </motion.span>
      <span className={[styles.text, "tabular-nums"].join(" ")}>{streak}</span>
    </div>
  );
}
