"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const banners = [
  {
    title: "Crediário aprovado em 2 min!",
    subtitle: "Compre agora, pague depois. Sem burocracia.",
    cta: "Simular Parcelas",
    href: "/categoria/eletrodomesticos",
    gradient: "from-accent-500 to-accent-600",
    emoji: "✅",
  },
  {
    title: "Smartphones a partir de",
    subtitle: "48x de R$ 18,75 sem juros",
    cta: "Ver Celulares",
    href: "/categoria/celulares",
    gradient: "from-primary-500 to-primary-600",
    emoji: "📱",
  },
  {
    title: "Frete Grátis",
    subtitle: "Em compras acima de R$ 199. Entrega rápida!",
    cta: "Aproveitar",
    href: "/categoria/eletronicos",
    gradient: "from-secondary-500 to-secondary-600",
    emoji: "🚚",
  },
];

export default function HeroBanner() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const banner = banners[current];

  return (
    <div className="relative mx-4 mt-4">
      <Link href={banner.href}>
        <div
          className={`bg-gradient-to-r ${banner.gradient} rounded-[16px] p-6 md:p-8 flex items-center justify-between min-h-[160px] transition-all duration-500`}
        >
          <div className="flex-1">
            <p className="font-display font-extrabold text-xl md:text-2xl text-white leading-tight">
              {banner.title}
            </p>
            <p className="font-body text-sm md:text-base text-white/90 mt-1">
              {banner.subtitle}
            </p>
            <span className="inline-block mt-4 px-6 py-2.5 bg-white text-secondary-500 font-display font-bold text-sm rounded-full hover:bg-gray-50 transition-colors">
              {banner.cta}
            </span>
          </div>
          <span className="text-6xl md:text-7xl ml-4 flex-shrink-0 opacity-90">
            {banner.emoji}
          </span>
        </div>
      </Link>

      {/* Dots */}
      <div className="flex justify-center gap-2 mt-3">
        {banners.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              i === current
                ? "bg-primary-500 w-6"
                : "bg-gray-300 hover:bg-gray-400"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
