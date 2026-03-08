import Image from "next/image";
import { UserLevel } from "@/lib/types";

type AvatarSize = "sm" | "md" | "lg" | "xl";

interface AvatarProps {
  src?: string;
  username: string;
  level?: UserLevel;
  size?: AvatarSize;
  className?: string;
}

const sizeMap: Record<AvatarSize, { px: number; text: string; ring: string }> = {
  sm: { px: 32, text: "text-sm", ring: "ring-2" },
  md: { px: 40, text: "text-base", ring: "ring-2" },
  lg: { px: 56, text: "text-xl", ring: "ring-[3px]" },
  xl: { px: 80, text: "text-3xl", ring: "ring-4" },
};

const levelRingColor: Record<UserLevel, string> = {
  1: "ring-gray-300",
  2: "ring-blue-400",
  3: "ring-green-400",
  4: "ring-primary",
  5: "ring-coin",
};

function getInitial(username: string) {
  return username.charAt(0).toUpperCase();
}

function getBgColor(username: string) {
  const colors = [
    "bg-purple-400",
    "bg-blue-400",
    "bg-green-400",
    "bg-pink-400",
    "bg-orange-400",
    "bg-teal-400",
  ];
  const index =
    username.charCodeAt(0) % colors.length;
  return colors[index];
}

export default function Avatar({
  src,
  username,
  level,
  size = "md",
  className = "",
}: AvatarProps) {
  const { px, text, ring } = sizeMap[size];
  const ringColor = level ? levelRingColor[level] : "ring-gray-200";

  const containerStyle = {
    width: px,
    height: px,
    minWidth: px,
  };

  return (
    <div
      className={[
        "relative rounded-full overflow-hidden flex-shrink-0",
        ring,
        ringColor,
        className,
      ].join(" ")}
      style={containerStyle}
    >
      {src ? (
        <Image
          src={src}
          alt={username}
          fill
          className="object-cover"
          sizes={`${px}px`}
        />
      ) : (
        <div
          className={[
            "w-full h-full flex items-center justify-center font-bold text-white",
            getBgColor(username),
            text,
          ].join(" ")}
        >
          {getInitial(username)}
        </div>
      )}
    </div>
  );
}
