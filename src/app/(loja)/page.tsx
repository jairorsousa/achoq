"use client";

import HeroBanner from "@/components/loja/HeroBanner";
import CategorySlider from "@/components/loja/CategorySlider";
import TrustBar from "@/components/loja/TrustBar";
import ProductCard from "@/components/loja/ProductCard";
import { getOfertasDoDia, getMaisVendidos, getProductsByCategory } from "@/lib/data/products";
import Link from "next/link";

function SectionTitle({
  emoji,
  title,
  href,
}: {
  emoji: string;
  title: string;
  href?: string;
}) {
  return (
    <div className="flex items-center justify-between px-4 mb-4">
      <h2 className="font-display font-extrabold text-xl text-secondary-500">
        {emoji} {title}
      </h2>
      {href && (
        <Link
          href={href}
          className="font-body font-semibold text-sm text-primary-500 hover:text-primary-600 transition-colors"
        >
          Ver tudo →
        </Link>
      )}
    </div>
  );
}

function ProductGrid({ products }: { products: ReturnType<typeof getOfertasDoDia> }) {
  return (
    <div className="px-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

export default function HomePage() {
  const ofertas = getOfertasDoDia();
  const maisVendidos = getMaisVendidos();
  const celulares = getProductsByCategory("celulares").slice(0, 4);
  const eletrodomesticos = getProductsByCategory("eletrodomesticos").slice(0, 4);

  return (
    <div className="space-y-8 pb-8">
      {/* Hero Banner */}
      <HeroBanner />

      {/* Categories */}
      <CategorySlider />

      {/* Trust Bar */}
      <TrustBar />

      {/* Ofertas do Dia */}
      <section id="ofertas">
        <SectionTitle emoji="⚡" title="Ofertas do Dia" />
        <ProductGrid products={ofertas} />
      </section>

      {/* Crediário Banner */}
      <section className="px-4">
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-[16px] p-6 flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 rounded-[12px] flex items-center justify-center flex-shrink-0">
            <span className="text-3xl">💳</span>
          </div>
          <div className="flex-1">
            <p className="font-display font-black text-lg text-white leading-tight">
              Crediário Parcelinhas
            </p>
            <p className="font-body text-sm text-white/90 mt-0.5">
              Parcele em até 48x sem juros. Aprovação rápida!
            </p>
          </div>
          <Link
            href="/categoria/eletrodomesticos"
            className="px-5 py-2.5 bg-white text-primary-600 font-display font-bold text-sm rounded-full hover:bg-gray-50 transition-colors flex-shrink-0"
          >
            Simular
          </Link>
        </div>
      </section>

      {/* Mais Vendidos */}
      <section>
        <SectionTitle emoji="🔥" title="Mais Vendidos" />
        <ProductGrid products={maisVendidos} />
      </section>

      {/* Celulares */}
      <section>
        <SectionTitle
          emoji="📱"
          title="Celulares"
          href="/categoria/celulares"
        />
        <ProductGrid products={celulares} />
      </section>

      {/* Eletrodomésticos */}
      <section>
        <SectionTitle
          emoji="🏠"
          title="Eletrodomésticos"
          href="/categoria/eletrodomesticos"
        />
        <ProductGrid products={eletrodomesticos} />
      </section>

      {/* Footer */}
      <footer className="bg-secondary-700 text-white mt-8">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <p className="font-display font-black text-xl">
                Parcelin<span className="text-primary-400">has</span>
              </p>
              <p className="font-body text-sm text-secondary-200 mt-2">
                Tudo que você precisa, no seu bolso. Crediário facilitado para
                toda a família.
              </p>
            </div>
            <div>
              <p className="font-display font-bold text-sm mb-3">Categorias</p>
              <div className="space-y-2">
                {["Celulares", "Eletrodomésticos", "Móveis", "Eletrônicos", "Moda", "Beleza"].map(
                  (cat) => (
                    <p
                      key={cat}
                      className="font-body text-sm text-secondary-200 hover:text-white transition-colors cursor-pointer"
                    >
                      {cat}
                    </p>
                  )
                )}
              </div>
            </div>
            <div>
              <p className="font-display font-bold text-sm mb-3">
                Atendimento
              </p>
              <div className="space-y-2 font-body text-sm text-secondary-200">
                <p>📞 0800 123 4567</p>
                <p>💬 WhatsApp: (11) 99999-9999</p>
                <p>📧 contato@parcelinhas.com.br</p>
                <p>🕐 Seg a Sex, 8h às 20h</p>
              </div>
            </div>
          </div>
          <div className="border-t border-secondary-600 mt-8 pt-6 text-center">
            <p className="font-body text-xs text-secondary-300">
              © 2026 Parcelinhas. Todos os direitos reservados. CNPJ:
              00.000.000/0001-00
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
