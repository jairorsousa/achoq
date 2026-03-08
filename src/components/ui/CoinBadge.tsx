"use client";

import { useEffect, useRef } from "react";
import { useMotionValue, animate } from "framer-motion";

type CoinBadgeSize = "sm" | "md" | "lg";

interface CoinBadgeProps {
  amount: number;
  size?: CoinBadgeSize;
  animated?: boolean;
  className?: string;
}

const sizeStyles: Record<CoinBadgeSize, { text: string; icon: string; wrapper: string }> = {
  sm: { text: "text-sm", icon: "text-base", wrapper: "gap-1 px-2 py-1" },
  md: { text: "text-base", icon: "text-xl", wrapper: "gap-1.5 px-3 py-1.5" },
  lg: { text: "text-xl", icon: "text-2xl", wrapper: "gap-2 px-4 py-2" },
};

function formatAmount(n: number) {
  return n.toLocaleString("pt-BR");
}

export default function CoinBadge({
  amount,
  size = "md",
  animated = false,
  className = "",
}: CoinBadgeProps) {
  const styles = sizeStyles[size];
  const motionValue = useMotionValue(animated ? 0 : amount);
  const displayRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!animated) return;
    const controls = animate(motionValue, amount, {
      duration: 1,
      ease: "easeOut",
      onUpdate: (v) => {
        if (displayRef.current) {
          displayRef.current.textContent = formatAmount(Math.round(v));
        }
      },
    });
    return controls.stop;
  }, [amount, animated, motionValue]);

  return (
    <div
      className={[
        "inline-flex items-center bg-coin/10 rounded-full font-bold text-coin-dark",
        styles.wrapper,
        className,
      ].join(" ")}
    >
      <span className={styles.icon}>🪙</span>
      <span ref={displayRef} className={[styles.text, "tabular-nums"].join(" ")}>
        {formatAmount(amount)}
      </span>
    </div>
  );
}
