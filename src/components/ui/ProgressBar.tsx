"use client";

import { motion } from "framer-motion";

interface ProgressBarProps {
  simPercent: number;
  naoPercent: number;
  animated?: boolean;
  className?: string;
}

export default function ProgressBar({
  simPercent,
  naoPercent,
  animated = true,
  className = "",
}: ProgressBarProps) {
  const sim = Math.max(0, Math.min(100, simPercent));
  const nao = Math.max(0, Math.min(100, naoPercent));

  return (
    <div className={["w-full", className].join(" ")}>
      {/* Labels */}
      <div className="flex justify-between mb-1 text-sm font-bold">
        <span className="text-sim">{sim}% SIM</span>
        <span className="text-nao">NÃO {nao}%</span>
      </div>
      {/* Bar */}
      <div className="flex h-4 rounded-full overflow-hidden bg-gray-100">
        <motion.div
          className="bg-sim h-full"
          layout={animated}
          initial={{ width: 0 }}
          animate={{ width: `${sim}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
        <motion.div
          className="bg-nao h-full flex-1"
          layout={animated}
        />
      </div>
    </div>
  );
}
