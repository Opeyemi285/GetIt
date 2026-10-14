import Image from "next/image";

const points = [
  "Fast, secure, stress-free delivery",
  "Verified and background-checked runners",
  "Order from any store, or send a rider",
];

export default function AuthShell({
  title,
  highlight,
  subtitle,
  onBack,
  children,
}: {
  title: string;
  highlight: string;
  subtitle?: React.ReactNode;
  onBack: () => void;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-dvh bg-[#fafaf9] lg:grid lg:grid-cols-2 lg:bg-white">
      {/* Brand panel (desktop only) */}
      <aside className="relative hidden overflow-hidden bg-[#2b543c] lg:flex lg:flex-col lg:justify-between lg:p-14 xl:p-20">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-[#4bd381]/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-[#4bd381]/10 blur-3xl" />

        <Image src="/logo.png" alt="GetIt" width={72} height={72} className="relative" />

        <div className="relative">
          <h2 className="max-w-md text-4xl font-extrabold leading-tight text-white xl:text-5xl">
            Get anything delivered, right to your doorstep.
          </h2>
          <ul className="mt-10 space-y-4">
            {points.map((p) => (
              <li key={p} className="flex items-center gap-3 text-lg text-white/90">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#4bd381]">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0f1a12" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </span>
                {p}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-sm text-white/60">&copy; GetIt</p>
      </aside>

      {/* Form panel */}
      <section className="flex justify-center px-6 py-8 lg:items-center lg:px-12 xl:px-20">
        <div className="w-full max-w-md lg:max-w-lg">
          <button
            onClick={onBack}
            aria-label="Go back"
            className="-ml-2 flex h-11 w-11 items-center justify-center rounded-full transition hover:bg-black/5"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0f1a12" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>

          <h1 className="mt-10 text-3xl font-extrabold text-[#0f1a12] lg:text-4xl">
            {title} <span className="text-[#4bd381]">{highlight}</span>
          </h1>
          {subtitle && (
            <p className="mt-3 text-base leading-7 text-[#6b7a70] lg:text-lg">{subtitle}</p>
          )}

          <div className="mt-10">{children}</div>
        </div>
      </section>
    </main>
  );
}