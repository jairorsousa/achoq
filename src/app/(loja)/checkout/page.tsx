"use client";

import { useState } from "react";
import Link from "next/link";
import { useCartStore } from "@/lib/stores/cartStore";
import { formatBRL, calcInstallment } from "@/lib/types/loja";

type PaymentMethod = "crediario" | "cartao" | "pix" | "boleto";

function StepIndicator({ step }: { step: number }) {
  const steps = ["Carrinho", "Dados", "Pagamento"];
  return (
    <div className="flex items-center justify-center gap-2 px-4 py-4">
      {steps.map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center font-display font-bold text-xs transition-colors ${
              i + 1 <= step
                ? "bg-primary-500 text-white"
                : "bg-gray-200 text-gray-500"
            }`}
          >
            {i + 1}
          </div>
          <span
            className={`font-body text-xs font-medium ${
              i + 1 <= step ? "text-secondary-500" : "text-gray-400"
            }`}
          >
            {label}
          </span>
          {i < steps.length - 1 && (
            <div
              className={`w-8 h-0.5 ${
                i + 1 < step ? "bg-primary-500" : "bg-gray-200"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function InputField({
  label,
  placeholder,
  type = "text",
  className = "",
}: {
  label: string;
  placeholder: string;
  type?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="block font-body font-medium text-sm text-secondary-500 mb-1.5">
        {label}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        className="w-full h-12 px-4 bg-white border-2 border-gray-200 rounded-[12px] font-body text-[15px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-[3px] focus:ring-primary-100 transition-all"
      />
    </div>
  );
}

export default function CheckoutPage() {
  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const [payment, setPayment] = useState<PaymentMethod>("crediario");
  const [installments, setInstallments] = useState(48);
  const [orderPlaced, setOrderPlaced] = useState(false);

  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const frete = subtotal >= 199 ? 0 : 29.9;
  const pixDiscount = payment === "pix" ? subtotal * 0.05 : 0;
  const total = subtotal + frete - pixDiscount;
  const installmentValue = calcInstallment(total, installments);

  if (orderPlaced) {
    return (
      <div className="text-center py-20 px-4">
        <div className="w-20 h-20 bg-accent-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">✅</span>
        </div>
        <h1 className="font-display font-extrabold text-2xl text-secondary-500">
          Pedido Realizado!
        </h1>
        <p className="font-body text-gray-600 mt-2 max-w-sm mx-auto">
          Seu pedido foi recebido com sucesso. Você receberá um e-mail com os
          detalhes da compra.
        </p>
        <div className="bg-accent-50 rounded-[12px] p-4 mt-6 max-w-sm mx-auto border border-accent-200">
          <p className="font-display font-bold text-accent-600">
            Crediário aprovado!
          </p>
          <p className="font-body text-sm text-gray-600 mt-1">
            {installments}x de{" "}
            <span className="font-bold text-accent-600">
              {formatBRL(installmentValue)}
            </span>
          </p>
        </div>
        <Link
          href="/"
          className="inline-block mt-8 px-8 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-display font-bold rounded-full shadow-btn-primary"
        >
          Continuar Comprando
        </Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-20 px-4">
        <span className="text-5xl block mb-4">🛒</span>
        <p className="font-display font-bold text-xl text-secondary-500">
          Seu carrinho está vazio
        </p>
        <p className="font-body text-sm text-gray-500 mt-1">
          Adicione produtos para finalizar sua compra
        </p>
        <Link
          href="/"
          className="inline-block mt-6 px-8 py-3 bg-primary-500 text-white font-display font-bold rounded-full"
        >
          Ver Produtos
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-8">
      <h1 className="font-display font-extrabold text-2xl text-secondary-500 px-4 pt-4">
        Finalizar Compra
      </h1>

      <StepIndicator step={3} />

      {/* Cart Items */}
      <section className="px-4 mt-2">
        <h2 className="font-display font-bold text-lg text-secondary-500 mb-3">
          🛒 Itens do Carrinho
        </h2>
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.product.id}
              className="flex gap-3 p-3 bg-white rounded-[12px] border border-gray-200"
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
                <p className="font-display font-bold text-primary-500 text-sm">
                  {formatBRL(item.product.price)}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <button
                    onClick={() =>
                      updateQuantity(item.product.id, item.quantity - 1)
                    }
                    className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 text-xs font-bold hover:bg-gray-200"
                  >
                    −
                  </button>
                  <span className="font-body font-semibold text-xs">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() =>
                      updateQuantity(item.product.id, item.quantity + 1)
                    }
                    className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 text-xs font-bold hover:bg-gray-200"
                  >
                    +
                  </button>
                  <button
                    onClick={() => removeItem(item.product.id)}
                    className="ml-auto text-xs text-gray-400 hover:text-error font-body"
                  >
                    Remover
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Personal Data */}
      <section className="px-4 mt-8">
        <h2 className="font-display font-bold text-lg text-secondary-500 mb-4">
          👤 Dados Pessoais
        </h2>
        <div className="space-y-3">
          <InputField label="Nome completo" placeholder="Maria da Silva" />
          <div className="grid grid-cols-2 gap-3">
            <InputField label="CPF" placeholder="000.000.000-00" />
            <InputField label="Telefone" placeholder="(11) 99999-9999" />
          </div>
          <InputField
            label="E-mail"
            placeholder="maria@email.com"
            type="email"
          />
        </div>
      </section>

      {/* Address */}
      <section className="px-4 mt-8">
        <h2 className="font-display font-bold text-lg text-secondary-500 mb-4">
          📍 Endereço de Entrega
        </h2>
        <div className="space-y-3">
          <InputField label="CEP" placeholder="00000-000" className="max-w-[200px]" />
          <InputField label="Rua" placeholder="Rua das Flores" />
          <div className="grid grid-cols-3 gap-3">
            <InputField label="Número" placeholder="123" />
            <InputField
              label="Complemento"
              placeholder="Apto 4B"
              className="col-span-2"
            />
          </div>
          <InputField label="Bairro" placeholder="Centro" />
          <div className="grid grid-cols-3 gap-3">
            <InputField
              label="Cidade"
              placeholder="São Paulo"
              className="col-span-2"
            />
            <InputField label="Estado" placeholder="SP" />
          </div>
        </div>
      </section>

      {/* Payment Method */}
      <section className="px-4 mt-8">
        <h2 className="font-display font-bold text-lg text-secondary-500 mb-4">
          💳 Forma de Pagamento
        </h2>
        <div className="space-y-2">
          {(
            [
              {
                key: "crediario" as const,
                label: "Crediário Parcelinhas",
                desc: "Até 48x sem juros",
                icon: "✅",
                highlight: true,
              },
              {
                key: "cartao" as const,
                label: "Cartão de Crédito",
                desc: "Até 12x sem juros",
                icon: "💳",
                highlight: false,
              },
              {
                key: "pix" as const,
                label: "Pix",
                desc: "5% de desconto",
                icon: "💰",
                highlight: false,
              },
              {
                key: "boleto" as const,
                label: "Boleto Bancário",
                desc: "Vencimento em 3 dias",
                icon: "📄",
                highlight: false,
              },
            ]
          ).map((method) => (
            <button
              key={method.key}
              onClick={() => {
                setPayment(method.key);
                if (method.key === "cartao") setInstallments(12);
                else if (method.key === "crediario") setInstallments(48);
                else setInstallments(1);
              }}
              className={`w-full p-4 rounded-[12px] border-2 flex items-center gap-3 text-left transition-all ${
                payment === method.key
                  ? method.highlight
                    ? "border-accent-500 bg-accent-50"
                    : "border-primary-500 bg-primary-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <span className="text-2xl">{method.icon}</span>
              <div className="flex-1">
                <p className="font-display font-bold text-sm text-secondary-500">
                  {method.label}
                </p>
                <p className="font-body text-xs text-gray-500">
                  {method.desc}
                </p>
              </div>
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  payment === method.key
                    ? method.highlight
                      ? "border-accent-500"
                      : "border-primary-500"
                    : "border-gray-300"
                }`}
              >
                {payment === method.key && (
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${
                      method.highlight ? "bg-accent-500" : "bg-primary-500"
                    }`}
                  />
                )}
              </div>
              {method.highlight && (
                <span className="absolute top-0 right-0 -translate-y-1/2 px-2 py-0.5 bg-accent-500 text-white font-display font-bold text-[10px] rounded-full hidden first-letter:block">
                  Recomendado
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Installment Selector */}
        {(payment === "crediario" || payment === "cartao") && (
          <div className="mt-4 bg-white rounded-[12px] border border-gray-200 p-4">
            <p className="font-display font-bold text-sm text-secondary-500 mb-3">
              Escolha o parcelamento:
            </p>
            <div className="grid grid-cols-2 gap-2">
              {(payment === "crediario"
                ? [12, 24, 36, 48]
                : [3, 6, 10, 12]
              ).map((n) => {
                const value = calcInstallment(total, n);
                return (
                  <button
                    key={n}
                    onClick={() => setInstallments(n)}
                    className={`p-3 rounded-[8px] border-2 text-center transition-all ${
                      installments === n
                        ? "border-accent-500 bg-accent-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <p className="font-display font-bold text-sm text-secondary-500">
                      {n}x de{" "}
                      <span className="text-accent-600">
                        {formatBRL(value)}
                      </span>
                    </p>
                    <p className="font-body text-[10px] text-gray-500">
                      sem juros
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* Order Summary */}
      <section className="px-4 mt-8">
        <div className="bg-white rounded-[16px] border border-gray-200 p-5 space-y-3">
          <h2 className="font-display font-bold text-lg text-secondary-500">
            Resumo do Pedido
          </h2>

          <div className="flex justify-between font-body text-sm">
            <span className="text-gray-500">Subtotal</span>
            <span className="text-secondary-500">{formatBRL(subtotal)}</span>
          </div>
          <div className="flex justify-between font-body text-sm">
            <span className="text-gray-500">Frete</span>
            <span
              className={frete === 0 ? "text-accent-600 font-semibold" : "text-secondary-500"}
            >
              {frete === 0 ? "Grátis" : formatBRL(frete)}
            </span>
          </div>
          {pixDiscount > 0 && (
            <div className="flex justify-between font-body text-sm">
              <span className="text-gray-500">Desconto Pix (5%)</span>
              <span className="text-accent-600 font-semibold">
                -{formatBRL(pixDiscount)}
              </span>
            </div>
          )}

          <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
            <span className="font-display font-bold text-secondary-500">
              Total
            </span>
            <span className="font-display font-black text-2xl text-secondary-500">
              {formatBRL(total)}
            </span>
          </div>

          {(payment === "crediario" || payment === "cartao") && (
            <div className="bg-accent-50 px-4 py-3 rounded-[12px] border border-accent-200 text-center">
              <p className="font-display font-bold text-accent-600 text-lg">
                {installments}x de {formatBRL(installmentValue)}
              </p>
              <p className="font-body text-xs text-accent-500">
                sem juros no {payment === "crediario" ? "crediário" : "cartão"}
              </p>
            </div>
          )}

          <button
            onClick={() => setOrderPlaced(true)}
            className="w-full py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-display font-bold text-lg rounded-full shadow-btn-primary hover:from-primary-600 hover:to-primary-700 active:scale-[0.98] transition-all cursor-pointer"
          >
            Finalizar Compra
          </button>

          <p className="font-body text-[11px] text-gray-400 text-center">
            🔒 Pagamento 100% seguro. Seus dados estão protegidos.
          </p>
        </div>
      </section>
    </div>
  );
}
