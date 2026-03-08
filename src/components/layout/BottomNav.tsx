"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

const NAV_ITEMS = [
  { href: "/home", icon: "🏠", label: "Home" },
  { href: "/explorar", icon: "🔍", label: "Explorar" },
  { href: "/ranking", icon: "🏆", label: "Ranking" },
  { href: "/lojinha", icon: "🛍️", label: "Lojinha" },
  { href: "/perfil", icon: "👤", label: "Perfil" },
] as const;

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] pb-safe">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center justify-center flex-1 h-full gap-0.5 group"
            >
              <motion.span
                className="text-2xl"
                animate={isActive ? { scale: 1.15 } : { scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                {item.icon}
              </motion.span>
              <span
                className={[
                  "text-[10px] font-semibold transition-colors",
                  isActive ? "text-primary" : "text-gray-400",
                ].join(" ")}
              >
                {item.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="bottom-nav-dot"
                  className="absolute bottom-1 w-1 h-1 rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
