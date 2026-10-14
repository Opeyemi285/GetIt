"use client";

import { useState } from "react";

export function Field({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  autoComplete,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  autoComplete?: string;
}) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";

  return (
    <label className="block">
      <span className="mb-2 block text-base text-[#0f1a12]">{label}</span>
      <div className="relative">
        <input
          type={isPassword && show ? "text" : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="h-[52px] w-full rounded-xl border-2 border-[#e3e3e3] bg-transparent px-4 pr-12 text-base text-[#0f1a12] outline-none transition placeholder:text-[#8a948d] focus:border-[#4bd381]"
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Hide password" : "Show password"}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8a948d] hover:text-[#0f1a12]"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {show ? (
                <>
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </>
              ) : (
                <>
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </>
              )}
            </svg>
          </button>
        )}
      </div>
    </label>
  );
}

export function PrimaryButton({
  children,
  loading,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className="h-[52px] w-full rounded-xl bg-[#4bd381] text-base font-bold text-[#0f1a12] shadow-md transition hover:brightness-105 active:scale-[0.99] disabled:opacity-60"
    >
      {loading ? "Please wait..." : children}
    </button>
  );
}

export function ErrorText({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return <p className="text-sm text-red-500">{children}</p>;
}