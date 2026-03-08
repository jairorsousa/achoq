import { UserLevel } from "@/lib/types";

type BadgeSize = "sm" | "md" | "lg";

interface LevelBadgeProps {
  level: UserLevel;
  showName?: boolean;
  size?: BadgeSize;
  className?: string;
}

const levelData: Record<
  UserLevel,
  { icon: string; name: string; gradient: string; text: string }
> = {
  1: {
    icon: "🐣",
    name: "Palpiteiro",
    gradient: "from-gray-300 to-gray-400",
    text: "text-gray-700",
  },
  2: {
    icon: "🤔",
    name: "Entendido",
    gradient: "from-blue-300 to-blue-500",
    text: "text-blue-900",
  },
  3: {
    icon: "🏆",
    name: "Craque",
    gradient: "from-green-400 to-emerald-600",
    text: "text-white",
  },
  4: {
    icon: "🔮",
    name: "Oráculo",
    gradient: "from-purple-500 to-primary-dark",
    text: "text-white",
  },
  5: {
    icon: "🧙",
    name: "Mãe Diná",
    gradient: "from-yellow-400 to-coin-dark",
    text: "text-white",
  },
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: "text-xs px-2 py-0.5 gap-1",
  md: "text-sm px-3 py-1 gap-1.5",
  lg: "text-base px-4 py-1.5 gap-2",
};

export default function LevelBadge({
  level,
  showName = false,
  size = "md",
  className = "",
}: LevelBadgeProps) {
  const data = levelData[level];

  return (
    <div
      className={[
        `inline-flex items-center font-bold rounded-full bg-gradient-to-r ${data.gradient} ${data.text}`,
        sizeStyles[size],
        className,
      ].join(" ")}
    >
      <span>{data.icon}</span>
      {showName && <span>{data.name}</span>}
    </div>
  );
}
