const DEFAULT = process.env.NEXT_PUBLIC_DEFAULT_CURRENCY ?? "NGN";

export function formatPrice(amount: number, currency?: string) {
  const code = (currency ?? DEFAULT).toUpperCase();
  const locale = typeof navigator !== "undefined" ? navigator.language : "en-NG";
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: code,
      currencyDisplay: "narrowSymbol", // gives ₦ instead of "NGN"
      maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    }).format(amount);
  } catch {
    return `${code} ${amount}`;
  }
}