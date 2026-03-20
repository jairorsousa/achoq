"use client";

import { useState } from "react";
import Link from "next/link";
import { useCartStore } from "@/lib/stores/cartStore";

export default function LojaHeader() {
  const [searchOpen, setSearchOpen] = useState(false);
  const items = useCartStore((s) => s.items);
  const toggleCart = useCartStore((s) => s.toggleCart);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-header">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-1.5 flex-shrink-0">
          <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-[8px] flex items-center justify-center">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="1" y="4" width="22" height="16" rx="3" />
              <path d="M1 10h22" />
              <path d="M6 15h4" />
            </svg>
          </div>
          <span className="font-display font-black text-lg text-secondary-500">
            Parcelin<span className="text-primary-500">has</span>
          </span>
        </Link>

        {/* Search */}
        <div
          className={`flex-1 transition-all duration-300 ${searchOpen ? "opacity-100" : "opacity-100"}`}
        >
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar produtos..."
              className="w-full h-10 pl-10 pr-4 bg-gray-100 rounded-full font-body text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white border-2 border-transparent focus:border-primary-500 transition-all"
              onFocus={() => setSearchOpen(true)}
              onBlur={() => setSearchOpen(false)}
            />
            <svg
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </div>
        </div>

        {/* Cart */}
        <button
          onClick={toggleCart}
          className="relative p-2 text-secondary-500 hover:text-primary-500 transition-colors"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 01-8 0" />
          </svg>
          {totalItems > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-primary-500 text-white text-[11px] font-display font-bold rounded-full flex items-center justify-center">
              {totalItems > 9 ? "9+" : totalItems}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
