"use client";

import { useState } from "react";
import { formatPhoneBR } from "@/lib/utils/format";

interface PhoneInputProps {
  value: string;
  onChange: (raw: string, formatted: string) => void;
  disabled?: boolean;
}

export default function PhoneInput({ value, onChange, disabled }: PhoneInputProps) {
  const [focused, setFocused] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const formatted = formatPhoneBR(e.target.value);
    const raw = formatted.replace(/\D/g, "");
    onChange(raw, formatted);
  }

  return (
    <div
      className={[
        "flex items-center gap-3 bg-white rounded-3xl px-5 py-4 border-2 transition-colors",
        focused ? "border-primary" : "border-gray-200",
        disabled ? "opacity-60" : "",
      ].join(" ")}
    >
      {/* Country code */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <span className="text-xl">🇧🇷</span>
        <span className="font-bold text-gray-500 text-base">+55</span>
      </div>
      <div className="w-px h-6 bg-gray-200 flex-shrink-0" />
      <input
        type="tel"
        inputMode="numeric"
        placeholder="(11) 99999-9999"
        value={value}
        onChange={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        disabled={disabled}
        maxLength={15}
        className="flex-1 text-base font-semibold text-gray-900 placeholder:text-gray-400 bg-transparent outline-none"
      />
    </div>
  );
}
