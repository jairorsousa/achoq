"use client";

import { motion } from "framer-motion";
import type { EventCategory } from "@/lib/types";

type CategoryFilter = EventCategory | "all";

const CATEGORIES: { id: CategoryFilter; label: string; icon: string }[] = [
  { id: "all", label: "Todos", icon: "🔥" },
  { id: "esportes", label: "Esporte", icon: "⚽" },
  { id: "entretenimento", label: "Entretenimento", icon: "📺" },
  { id: "politica", label: "Política", icon: "🏛️" },
];

interface CategoryFilterProps {
  active: CategoryFilter;
  onChange: (cat: CategoryFilter) => void;
}

export default function CategoryFilter({ active, onChange }: CategoryFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4">
      {CATEGORIES.map((cat) => {
        const isActive = active === cat.id;
        return (
          <button
            key={cat.id}
            onClick={() => onChange(cat.id)}
            className="flex-shrink-0 relative"
          >
            <span
              className={[
                "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap",
                isActive
                  ? "bg-primary text-white shadow-btn-primary"
                  : "bg-white text-gray-500 border border-gray-200",
              ].join(" ")}
            >
              {cat.icon} {cat.label}
            </span>
            {isActive && (
              <motion.span
                layoutId="category-indicator"
                className="absolute inset-0 rounded-full bg-primary -z-10"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
