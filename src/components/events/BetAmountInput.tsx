"use client";

import { formatCoins } from "@/lib/utils/format";

interface BetAmountInputProps {
  value: number;
  min?: number;
  max: number;
  onChange: (val: number) => void;
  disabled?: boolean;
}

export default function BetAmountInput({
  value,
  min = 10,
  max,
  onChange,
  disabled = false,
}: BetAmountInputProps) {
  const percent = max > 0 ? ((value - min) / (max - min)) * 100 : 0;

  function clamp(v: number) {
    return Math.max(min, Math.min(max, v));
  }

  return (
    <div className="space-y-3">
      {/* Display */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-gray-500">Valor da aposta</span>
        <div className="flex items-center gap-2 bg-coin/10 rounded-2xl px-4 py-2">
          <span className="text-lg">🪙</span>
          <span className="text-xl font-extrabold text-coin-dark tabular-nums">
            {formatCoins(value)}
          </span>
        </div>
      </div>

      {/* Slider */}
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          disabled={disabled || max <= min}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-3 rounded-full appearance-none cursor-pointer disabled:opacity-50"
          style={{
            background: `linear-gradient(to right, #7C3AED ${percent}%, #E5E7EB ${percent}%)`,
          }}
        />
      </div>

      {/* Quick presets */}
      <div className="flex gap-2">
        {[0.25, 0.5, 0.75, 1].map((fraction) => {
          const amount = clamp(Math.round(max * fraction));
          const label = fraction === 1 ? "Tudo" : `${fraction * 100}%`;
          return (
            <button
              key={fraction}
              type="button"
              disabled={disabled}
              onClick={() => onChange(amount)}
              className={[
                "flex-1 py-2 rounded-2xl text-sm font-bold transition-colors border",
                value === amount
                  ? "bg-primary text-white border-primary"
                  : "bg-white text-gray-500 border-gray-200 hover:border-primary",
              ].join(" ")}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Min/Max labels */}
      <div className="flex justify-between text-xs text-gray-400">
        <span>Min: {formatCoins(min)} Q$</span>
        <span>Saldo: {formatCoins(max)} Q$</span>
      </div>
    </div>
  );
}
