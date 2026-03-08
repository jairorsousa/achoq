import { forwardRef } from "react";

type CardVariant = "default" | "featured" | "flat";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = "default", className = "", children, ...props }, ref) => {
    if (variant === "featured") {
      return (
        <div
          ref={ref}
          className={["p-[2px] rounded-3xl bg-gradient-to-br from-primary to-sim", className].join(" ")}
          {...props}
        >
          <div className="bg-white rounded-[calc(1.5rem-2px)] p-5 h-full">
            {children}
          </div>
        </div>
      );
    }

    const variantClass =
      variant === "flat"
        ? "bg-white/60 backdrop-blur-sm rounded-3xl p-5"
        : "bg-white shadow-card rounded-3xl p-5";

    return (
      <div
        ref={ref}
        className={[variantClass, className].join(" ")}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

export default Card;
