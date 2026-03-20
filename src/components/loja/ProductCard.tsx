"use client";

import Link from "next/link";
import type { Product } from "@/lib/types/loja";
import { formatBRL, calcInstallment } from "@/lib/types/loja";
import { useCartStore } from "@/lib/stores/cartStore";

function BadgeChip({ badge }: { badge: Product["badges"][number] }) {
  const styles: Record<string, string> = {
    promo: "bg-yellow-100 text-yellow-800",
    novo: "bg-accent-100 text-accent-600",
    hot: "bg-primary-100 text-primary-700",
    frete: "bg-secondary-50 text-secondary-500",
    desconto: "bg-primary-500 text-white",
    parcela: "bg-accent-500 text-white",
  };
  return (
    <span
      className={`inline-block px-3 py-1 rounded-full text-xs font-bold font-display ${styles[badge.type] || ""}`}
    >
      {badge.label}
    </span>
  );
}

export default function ProductCard({ product }: { product: Product }) {
  const addItem = useCartStore((s) => s.addItem);
  const installment = calcInstallment(product.price, product.maxInstallments);

  return (
    <div className="group bg-white rounded-[16px] border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-card-hover hover:-translate-y-[3px] flex flex-col">
      {/* Image */}
      <Link href={`/produto/${product.id}`}>
        <div
          className="relative h-[180px] flex items-center justify-center"
          style={{ backgroundColor: product.imageBg }}
        >
          <span className="text-6xl">{product.image}</span>
          {/* Badges */}
          {product.badges.length > 0 && (
            <div className="absolute top-3 left-3 flex flex-wrap gap-1">
              {product.badges.slice(0, 2).map((badge, i) => (
                <BadgeChip key={i} badge={badge} />
              ))}
            </div>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <Link href={`/produto/${product.id}`}>
          <h3 className="font-body font-semibold text-sm text-secondary-500 line-clamp-2 min-h-[40px] leading-tight">
            {product.name}
          </h3>
        </Link>

        {/* Old price */}
        <p className="text-xs text-gray-400 line-through mt-2">
          {formatBRL(product.originalPrice)}
        </p>

        {/* Current price */}
        <p className="font-display font-black text-[22px] text-primary-500 leading-tight">
          {formatBRL(product.price)}
        </p>

        {/* Installments */}
        <p className="font-body font-semibold text-[13px] text-accent-600 mt-1">
          ou {product.maxInstallments}x de{" "}
          <span className="font-bold">{formatBRL(installment)}</span>
        </p>

        {/* Spacer */}
        <div className="flex-1" />

        {/* CTA */}
        <button
          onClick={(e) => {
            e.preventDefault();
            addItem(product);
          }}
          className="mt-3 w-full py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-display font-bold text-[15px] rounded-full shadow-btn-primary hover:from-primary-600 hover:to-primary-700 active:scale-[0.97] transition-all duration-200 cursor-pointer"
        >
          Comprar Agora
        </button>
      </div>
    </div>
  );
}
