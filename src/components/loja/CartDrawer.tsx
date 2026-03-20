"use client";

import Link from "next/link";
import { useCartStore } from "@/lib/stores/cartStore";
import { formatBRL } from "@/lib/types/loja";

export default function CartDrawer() {
  const items = useCartStore((s) => s.items);
  const isOpen = useCartStore((s) => s.isOpen);
  const setCartOpen = useCartStore((s) => s.setCartOpen);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const totalPrice = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-[60] transition-opacity"
        onClick={() => setCartOpen(false)}
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white z-[70] animate-slide-from-right flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="font-display font-bold text-lg text-secondary-500">
            Meu Carrinho ({items.length})
          </h2>
          <button
            onClick={() => setCartOpen(false)}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-5xl block mb-4">🛒</span>
              <p className="font-display font-bold text-secondary-500">
                Carrinho vazio
              </p>
              <p className="font-body text-sm text-gray-500 mt-1">
                Adicione produtos para começar
              </p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.product.id}
                className="flex gap-3 p-3 bg-gray-50 rounded-[12px]"
              >
                <div
                  className="w-16 h-16 rounded-[8px] flex items-center justify-center flex-shrink-0 text-2xl"
                  style={{ backgroundColor: item.product.imageBg }}
                >
                  {item.product.image}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-body font-semibold text-sm text-secondary-500 truncate">
                    {item.product.name}
                  </p>
                  <p className="font-display font-bold text-primary-500 text-sm mt-0.5">
                    {formatBRL(item.product.price)}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() =>
                        updateQuantity(item.product.id, item.quantity - 1)
                      }
                      className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-300 transition-colors font-bold text-sm"
                    >
                      −
                    </button>
                    <span className="font-body font-semibold text-sm text-secondary-500 w-6 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        updateQuantity(item.product.id, item.quantity + 1)
                      }
                      className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-300 transition-colors font-bold text-sm"
                    >
                      +
                    </button>
                    <button
                      onClick={() => removeItem(item.product.id)}
                      className="ml-auto text-gray-400 hover:text-error transition-colors"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-gray-200 p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-body text-sm text-gray-500">Total</span>
              <span className="font-display font-black text-xl text-secondary-500">
                {formatBRL(totalPrice)}
              </span>
            </div>
            <Link
              href="/checkout"
              onClick={() => setCartOpen(false)}
              className="block w-full py-3.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-display font-bold text-center rounded-full shadow-btn-primary hover:from-primary-600 hover:to-primary-700 transition-all"
            >
              Finalizar Compra
            </Link>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slide-from-right {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slide-from-right {
          animation: slide-from-right 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
