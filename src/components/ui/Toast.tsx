"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useToastStore, ToastVariant } from "@/lib/stores/toastStore";

const variantConfig: Record<
  ToastVariant,
  { icon: string; bg: string; text: string }
> = {
  success: { icon: "✅", bg: "bg-green-50 border-green-200", text: "text-green-800" },
  error: { icon: "🔴", bg: "bg-red-50 border-red-200", text: "text-red-800" },
  info: { icon: "ℹ️", bg: "bg-blue-50 border-blue-200", text: "text-blue-800" },
  warning: { icon: "⚠️", bg: "bg-yellow-50 border-yellow-200", text: "text-yellow-800" },
};

export default function ToastContainer() {
  const { toasts, dismiss } = useToastStore();

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-full max-w-sm px-4 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          const config = variantConfig[toast.variant];
          return (
            <motion.div
              key={toast.id}
              initial={{ y: -40, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -40, opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className={[
                "flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-card pointer-events-auto",
                config.bg,
                config.text,
              ].join(" ")}
              onClick={() => dismiss(toast.id)}
            >
              <span className="text-xl flex-shrink-0">{config.icon}</span>
              <p className="text-sm font-semibold flex-1">{toast.message}</p>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
