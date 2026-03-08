type SkeletonVariant = "text" | "card" | "circle" | "button";

interface SkeletonProps {
  variant?: SkeletonVariant;
  width?: string | number;
  height?: string | number;
  className?: string;
}

const variantDefaults: Record<SkeletonVariant, string> = {
  text: "h-4 rounded-lg w-full",
  card: "h-40 rounded-3xl w-full",
  circle: "rounded-full w-10 h-10",
  button: "h-12 rounded-3xl w-32",
};

export default function Skeleton({
  variant = "text",
  width,
  height,
  className = "",
}: SkeletonProps) {
  const style: React.CSSProperties = {};
  if (width) style.width = width;
  if (height) style.height = height;

  return (
    <div
      className={[
        "relative overflow-hidden bg-gray-200",
        variantDefaults[variant],
        className,
      ].join(" ")}
      style={style}
    >
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent" />
    </div>
  );
}
