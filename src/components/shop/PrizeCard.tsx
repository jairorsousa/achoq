"use client";

import { motion } from "framer-motion";
import type { ShopItem } from "@/lib/types";
import { formatCoins } from "@/lib/utils/format";

interface PrizeCardProps {
  item: ShopItem;
  userCoins: number;
  userGold?: number;
  onRedeem: (item: ShopItem) => void;
}

export default function PrizeCard({ item, userCoins, userGold = 0, onRedeem }: PrizeCardProps) {
  const displayPrice = item.goldOnly ? item.goldPrice ?? 0 : item.price;
  const canAfford = item.goldOnly ? userGold >= displayPrice : userCoins >= item.price;
  const outOfStock = item.stock !== undefined && item.stock <= 0;
  const disabled = !item.available || outOfStock || !canAfford;

  return (
    <motion.div
      whileTap={disabled ? {} : { scale: 0.97 }}
      className="bg-white rounded-3xl p-4 shadow-card flex flex-col gap-3"
    >
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-3xl flex-shrink-0">
          {item.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-extrabold text-gray-900 text-sm leading-tight">{item.name}</p>
          <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{item.description}</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="font-extrabold text-coin-dark text-base">
            {item.goldOnly ? `Q$G ${formatCoins(displayPrice)}` : `${formatCoins(displayPrice)} Q$`}
          </p>
          {item.sponsoredEventId && (
            <p className="text-[11px] font-bold text-primary">Exclusivo de evento patrocinado</p>
          )}
          {item.stock !== undefined && (
            <p className="text-xs text-gray-400">{outOfStock ? "Esgotado" : `${item.stock} disponiveis`}</p>
          )}
        </div>

        <button
          disabled={disabled}
          onClick={() => onRedeem(item)}
          aria-label={`Resgatar ${item.name} por ${formatCoins(displayPrice)}`}
          className={[
            "px-4 py-2 rounded-2xl text-sm font-bold transition-colors",
            disabled
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-primary text-white shadow-btn-primary active:translate-y-[3px] active:shadow-none",
          ].join(" ")}
        >
          {outOfStock ? "Esgotado" : !canAfford ? "Sem Q$" : "Resgatar"}
        </button>
      </div>
    </motion.div>
  );
}
