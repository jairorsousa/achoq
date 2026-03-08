"use client";

import { motion } from "framer-motion";

interface XPBarProps {
  current: number;
  max: number;
  label?: string;
  color?: string;
  className?: string;
}

export default function XPBar({
  current,
  max,
  label,
  color = "#7C3AED",
  className = "",
}: XPBarProps) {
  const percent = Math.min(100, (current / max) * 100);

  return (
    <div className={["w-full", className].join(" ")}>
      <div className="flex justify-between mb-1 text-xs font-semibold text-gray-500">
        <span>{label ?? "XP"}</span>
        <span>
          {current}/{max}
        </span>
      </div>
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
