"use client";

import { useRef, KeyboardEvent, ClipboardEvent } from "react";

interface OTPInputProps {
  value: string;
  onChange: (val: string) => void;
  length?: number;
  disabled?: boolean;
}

export default function OTPInput({
  value,
  onChange,
  length = 6,
  disabled = false,
}: OTPInputProps) {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const digits = value.split("").slice(0, length);
  while (digits.length < length) digits.push("");

  function focus(index: number) {
    inputs.current[index]?.focus();
  }

  function handleChange(index: number, char: string) {
    const digit = char.replace(/\D/g, "").slice(-1);
    const newDigits = [...digits];
    newDigits[index] = digit;
    onChange(newDigits.join(""));
    if (digit && index < length - 1) focus(index + 1);
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      if (digits[index]) {
        const newDigits = [...digits];
        newDigits[index] = "";
        onChange(newDigits.join(""));
      } else if (index > 0) {
        focus(index - 1);
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      focus(index - 1);
    } else if (e.key === "ArrowRight" && index < length - 1) {
      focus(index + 1);
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    onChange(pasted.padEnd(length, "").slice(0, length));
    const nextIndex = Math.min(pasted.length, length - 1);
    focus(nextIndex);
  }

  return (
    <div className="flex gap-3 justify-center">
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => { inputs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          disabled={disabled}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          className={[
            "w-12 h-14 text-center text-2xl font-extrabold rounded-2xl border-2 transition-all outline-none",
            digit
              ? "border-primary bg-primary/5 text-primary"
              : "border-gray-200 bg-white text-gray-900",
            "focus:border-primary focus:bg-primary/5",
            disabled ? "opacity-60" : "",
          ].join(" ")}
        />
      ))}
    </div>
  );
}
