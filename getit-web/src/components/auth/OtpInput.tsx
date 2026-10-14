"use client";

import { useRef } from "react";

export default function OtpInput({
  value,
  onChange,
}: {
  value: string[]; // always 6 items
  onChange: (v: string[]) => void;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  function handleChange(i: number, raw: string) {
    const d = raw.replace(/\D/g, "").slice(-1);
    const next = [...value];
    next[i] = d;
    onChange(next);
    if (d && i < 5) refs.current[i + 1]?.focus();
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !value[i] && i > 0) refs.current[i - 1]?.focus();
  }

  function handlePaste(e: React.ClipboardEvent) {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!text) return;
    e.preventDefault();
    const next = Array.from({ length: 6 }, (_, i) => text[i] ?? "");
    onChange(next);
    refs.current[Math.min(text.length, 5)]?.focus();
  }

  return (
    <div className="flex justify-between gap-2 sm:gap-3" onPaste={handlePaste}>
      {value.map((digit, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          value={digit}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={1}
          aria-label={`Digit ${i + 1}`}
          className="h-14 w-full min-w-0 rounded-xl border-2 border-[#e3e3e3] bg-transparent text-center text-xl font-bold text-[#0f1a12] outline-none transition focus:border-[#4bd381] sm:h-16"
        />
      ))}
    </div>
  );
}