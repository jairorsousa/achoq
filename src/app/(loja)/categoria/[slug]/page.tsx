"use client";

import { use, useState } from "react";
import Link from "next/link";
import ProductCard from "@/components/loja/ProductCard";
import TrustBar from "@/components/loja/TrustBar";
import {
  getProductsByCategory,
  getCategoryBySlug,
  categories,
} from "@/lib/data/products";

type SortMode = "relevancia" | "menor-preco" | "maior-desconto";

export default function CategoriaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [sort, setSort] = useState<SortMode>("relevancia");
  const category = getCategoryBySlug(slug);
  const allProducts = getProductsByCategory(slug);

  const products = [...allProducts].sort((a, b) => {
    if (sort === "menor-preco") return a.price - b.price;
    if (sort === "maior-desconto") {
      const discA = (a.originalPrice - a.price) / a.originalPrice;
      const discB = (b.originalPrice - b.price) / b.originalPrice;
      return discB - discA;
    }
    return b.reviewCount - a.reviewCount;
  });

  return (
    <div className="pb-8">
      {/* Category Hero */}
      <div
        className="px-4 py-8 flex items-center gap-4"
        style={{ backgroundColor: category?.color || "#F0F0F0" }}
      >
        <span className="text-5xl">{category?.icon || "📦"}</span>
        <div>
          <h1 className="font-display font-extrabold text-2xl text-secondary-500">
            {category?.name || "Categoria"}
          </h1>
          <p className="font-body text-sm text-gray-600 mt-1">
            {products.length} produto{products.length !== 1 ? "s" : ""}{" "}
            encontrado{products.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="px-4 mt-4 flex overflow-x-auto scrollbar-hide gap-2">
        {categories.map((cat) => (
          <Link
            key={cat.slug}
            href={`/categoria/${cat.slug}`}
            className={`px-4 py-2 rounded-full font-display font-bold text-sm whitespace-nowrap transition-all ${
              cat.slug === slug
                ? "bg-primary-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {cat.icon} {cat.name}
          </Link>
        ))}
      </div>

      {/* Sort */}
      <div className="px-4 mt-4 flex items-center gap-2">
        <span className="font-body text-sm text-gray-500">Ordenar:</span>
        {(
          [
            { key: "relevancia", label: "Relevância" },
            { key: "menor-preco", label: "Menor Preço" },
            { key: "maior-desconto", label: "Maior Desconto" },
          ] as const
        ).map((option) => (
          <button
            key={option.key}
            onClick={() => setSort(option.key)}
            className={`px-3 py-1.5 rounded-full font-body text-xs font-medium transition-all ${
              sort === option.key
                ? "bg-secondary-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Trust Bar */}
      <div className="mt-4">
        <TrustBar />
      </div>

      {/* Products Grid */}
      <div className="px-4 mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {/* Empty state */}
      {products.length === 0 && (
        <div className="text-center py-16 px-4">
          <span className="text-5xl block mb-4">🔍</span>
          <p className="font-display font-bold text-lg text-secondary-500">
            Nenhum produto encontrado
          </p>
          <p className="font-body text-sm text-gray-500 mt-1">
            Tente outra categoria
          </p>
        </div>
      )}
    </div>
  );
}
