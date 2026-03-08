"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import { forwardRef } from "react";

type ButtonVariant = "primary" | "sim" | "nao" | "coin" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface Button3DProps extends Omit<HTMLMotionProps<"button">, "children"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-primary text-white shadow-btn-primary hover:bg-primary-dark",
  sim: "bg-sim text-white shadow-btn-sim hover:bg-sim-dark",
  nao: "bg-nao text-white shadow-btn-nao hover:bg-nao-dark",
  coin: "bg-coin text-white shadow-btn-coin hover:bg-coin-dark",
  ghost: "bg-white text-primary border-2 border-primary shadow-none",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-sm rounded-2xl",
  md: "px-6 py-3 text-base rounded-3xl",
  lg: "px-8 py-4 text-lg rounded-3xl",
};

const Spinner = () => (
  <svg
    className="animate-spin h-5 w-5"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
    />
  </svg>
);

const Button3D = forwardRef<HTMLButtonElement, Button3DProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      disabled = false,
      children,
      className = "",
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <motion.button
        ref={ref}
        whileTap={
          isDisabled
            ? {}
            : { y: 6, boxShadow: "0 0 0 transparent" }
        }
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        disabled={isDisabled}
        className={[
          "font-bold transition-colors duration-150 select-none inline-flex items-center justify-center gap-2",
          variantStyles[variant],
          sizeStyles[size],
          isDisabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer",
          className,
        ].join(" ")}
        {...props}
      >
        {loading ? <Spinner /> : children}
      </motion.button>
    );
  }
);

Button3D.displayName = "Button3D";

export default Button3D;
