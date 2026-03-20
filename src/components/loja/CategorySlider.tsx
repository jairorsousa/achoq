"use client";

import Link from "next/link";
import { categories } from "@/lib/data/products";

export default function CategorySlider() {
  return (
    <div className="px-4 mt-6">
      <div className="flex overflow-x-auto scrollbar-hide gap-3">
        {categories.map((cat) => (
          <Link
            key={cat.slug}
            href={`/categoria/${cat.slug}`}
            className="flex flex-col items-center gap-2 min-w-[80px]"
          >
            <div
              className="w-16 h-16 rounded-[16px] flex items-center justify-center text-2xl transition-transform hover:scale-105"
              style={{ backgroundColor: cat.color }}
            >
              {cat.icon}
            </div>
            <span className="font-body font-medium text-xs text-secondary-500 text-center whitespace-nowrap">
              {cat.name}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
