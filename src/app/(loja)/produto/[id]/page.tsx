"use client";

import { use } from "react";
import Link from "next/link";
import { getProductById, getProductsByCategory } from "@/lib/data/products";
import { formatBRL, calcInstallment, calcDiscount } from "@/lib/types/loja";
import { useCartStore } from "@/lib/stores/cartStore";
import TrustBar from "@/components/loja/TrustBar";
import ProductCard from "@/components/loja/ProductCard";

function StarRating({ rating, count }: { rating: number; count: number }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            className={`text-sm ${
              i < full
                ? "text-yellow-500"
                : i === full && half
                  ? "text-yellow-400"
                  : "text-gray-300"
            }`}
          >
            ★
          </span>
        ))}
      </div>
      <span className="font-body text-sm font-semibold text-secondary-500">
        {rating}
      </span>
      <span className="font-body text-xs text-gray-500">
        ({count.toLocaleString("pt-BR")} avaliações)
      </span>
    </div>
  );
}

export default function ProdutoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const product = getProductById(id);
  const addItem = useCartStore((s) => s.addItem);

  if (!product) {
    return (
      <div className="text-center py-20 px-4">
        <span className="text-5xl block mb-4">😕</span>
        <p className="font-display font-bold text-xl text-secondary-500">
          Produto não encontrado
        </p>
        <Link
          href="/"
          className="inline-block mt-4 px-6 py-3 bg-primary-500 text-white font-display font-bold rounded-full"
        >
          Voltar ao Início
        </Link>
      </div>
    );
  }

  const discount = calcDiscount(product.originalPrice, product.price);
  const installment = calcInstallment(product.price, product.maxInstallments);
  const pixPrice = product.price * 0.95;
  const related = getProductsByCategory(product.category)
    .filter((p) => p.id !== product.id)
    .slice(0, 4);

  return (
    <div className="pb-24">
      {/* Breadcrumb */}
      <div className="px-4 py-3 flex items-center gap-2 text-xs font-body text-gray-500">
        <Link href="/" className="hover:text-primary-500 transition-colors">
          Início
        </Link>
        <span>/</span>
        <Link
          href={`/categoria/${product.category}`}
          className="hover:text-primary-500 transition-colors capitalize"
        >
          {product.category}
        </Link>
        <span>/</span>
        <span className="text-gray-700 truncate">{product.name}</span>
      </div>

      {/* Product Image */}
      <div
        className="mx-4 rounded-[16px] h-[280px] md:h-[380px] flex items-center justify-center relative"
        style={{ backgroundColor: product.imageBg }}
      >
        <span className="text-[100px] md:text-[140px]">{product.image}</span>
        {/* Badges */}
        <div className="absolute top-4 left-4 flex flex-wrap gap-2">
          {product.badges.map((badge, i) => {
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
                key={i}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold font-display ${styles[badge.type] || ""}`}
              >
                {badge.label}
              </span>
            );
          })}
        </div>
      </div>

      {/* Product Info */}
      <div className="px-4 mt-6 space-y-4">
        {/* Name */}
        <h1 className="font-display font-extrabold text-2xl text-secondary-500 leading-tight">
          {product.name}
        </h1>

        {/* Rating */}
        <StarRating rating={product.rating} count={product.reviewCount} />

        {/* Price Section */}
        <div className="bg-white p-5 rounded-[16px] border border-gray-200 space-y-2">
          <div className="flex items-center gap-3">
            <span className="font-body text-sm text-gray-400 line-through">
              {formatBRL(product.originalPrice)}
            </span>
            <span className="px-2.5 py-0.5 bg-primary-500 text-white font-display font-bold text-xs rounded-full">
              -{discount}%
            </span>
          </div>

          <p className="font-display font-black text-[32px] text-primary-500 leading-tight">
            {formatBRL(product.price)}
          </p>

          <div className="bg-accent-50 px-4 py-3 rounded-[12px] border border-accent-200">
            <p className="font-display font-bold text-lg text-accent-600">
              ou {product.maxInstallments}x de{" "}
              <span className="text-xl">{formatBRL(installment)}</span>
            </p>
            <p className="font-body text-xs text-accent-500 mt-0.5">
              no crediário sem juros
            </p>
          </div>

          <p className="font-body text-sm text-gray-600">
            💰 <span className="font-semibold">{formatBRL(pixPrice)}</span> no
            Pix{" "}
            <span className="text-accent-600 font-semibold">(5% off)</span>
          </p>
        </div>

        {/* Add to Cart Button (visible on desktop, hidden on mobile since we have sticky bar) */}
        <button
          onClick={() => addItem(product)}
          className="hidden md:block w-full py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-display font-bold text-lg rounded-full shadow-btn-primary hover:from-primary-600 hover:to-primary-700 active:scale-[0.98] transition-all cursor-pointer"
        >
          Adicionar ao Carrinho
        </button>
      </div>

      {/* Trust Bar */}
      <div className="mt-6">
        <TrustBar />
      </div>

      {/* Description */}
      <div className="px-4 mt-6">
        <h2 className="font-display font-bold text-lg text-secondary-500 mb-3">
          Descrição
        </h2>
        <p className="font-body text-sm text-gray-700 leading-relaxed">
          {product.description}
        </p>
      </div>

      {/* Specs */}
      <div className="px-4 mt-6">
        <h2 className="font-display font-bold text-lg text-secondary-500 mb-3">
          Especificações
        </h2>
        <div className="bg-white rounded-[12px] border border-gray-200 overflow-hidden">
          {product.specs.map((spec, i) => (
            <div
              key={i}
              className={`flex px-4 py-3 ${i % 2 === 0 ? "bg-gray-50" : "bg-white"}`}
            >
              <span className="font-body font-semibold text-sm text-gray-600 w-1/3">
                {spec.label}
              </span>
              <span className="font-body text-sm text-secondary-500 flex-1">
                {spec.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Related Products */}
      {related.length > 0 && (
        <div className="mt-8">
          <div className="px-4 mb-4">
            <h2 className="font-display font-extrabold text-xl text-secondary-500">
              Produtos Relacionados
            </h2>
          </div>
          <div className="px-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}

      {/* Sticky Bottom Bar (mobile) */}
      <div className="fixed bottom-16 left-0 right-0 z-40 bg-white border-t border-gray-200 p-3 flex items-center gap-3 md:hidden">
        <div className="flex-1">
          <p className="font-display font-black text-lg text-primary-500 leading-tight">
            {formatBRL(product.price)}
          </p>
          <p className="font-body text-xs text-accent-600 font-semibold">
            {product.maxInstallments}x {formatBRL(installment)}
          </p>
        </div>
        <button
          onClick={() => addItem(product)}
          className="px-8 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-display font-bold text-sm rounded-full shadow-btn-primary hover:from-primary-600 hover:to-primary-700 active:scale-[0.97] transition-all cursor-pointer"
        >
          Comprar Agora
        </button>
      </div>
    </div>
  );
}
