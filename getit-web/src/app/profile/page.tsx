"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import GlassNav from "@/components/GlassNav";
import { api, ApiError } from "@/lib/api";
import { AUTH_ENTRY, logout, setNext } from "@/lib/session";
import { useRequireAuth } from "@/lib/useRequireAuth";

type Profile = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  is_verified?: boolean;
  created_at?: string;
};

const svg = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const rows = [
  {
    href: "/orders",
    label: "My Orders",
    hint: "Track and review your orders",
    icon: (
      <svg {...svg}>
        <rect x="5" y="3" width="14" height="18" rx="2" />
        <path d="M9 8h6M9 12h6M9 16h4" />
      </svg>
    ),
  },
  {
    href: "/messages",
    label: "Messages",
    hint: "Chat with stores and riders",
    icon: (
      <svg {...svg}>
        <path d="M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-5.4A8 8 0 1 1 21 12z" />
      </svg>
    ),
  },
  {
    href: "/cart",
    label: "My Cart",
    hint: "Items waiting for checkout",
    icon: (
      <svg {...svg}>
        <circle cx="9" cy="20" r="1.5" />
        <circle cx="18" cy="20" r="1.5" />
        <path d="M2 3h3l2.7 12.4a1 1 0 0 0 1 .8h8.9a1 1 0 0 0 1-.8L20 7H6" />
      </svg>
    ),
  },
  {
    href: "/become",
    label: "Become a seller or rider",
    hint: "Start earning on GetIt",
    icon: (
      <svg {...svg}>
        <path d="M3 9l1-5h16l1 5M3 9v11h18V9M3 9h18M9 20v-6h6v6" />
      </svg>
    ),
  },
];

export default function ProfilePage() {
  const router = useRouter();
  const ready = useRequireAuth(); // guests go to /login and come back here afterwards
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    setError("");
    api<Profile>("/auth/profile")
      .then((p) => !cancelled && setProfile(p))
      .catch((e) => {
        if (cancelled) return;
        if (e instanceof ApiError && e.status === 401) {
          setNext("/profile");
          router.replace(AUTH_ENTRY);
        } else {
          setError("Could not load your profile.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [ready, attempt, router]);

  function handleLogout() {
    logout();
    router.replace("/home");
  }

  if (!ready) return null;

  const fullName = profile ? `${profile.first_name} ${profile.last_name}`.trim() : "";
  const initials = profile
    ? `${profile.first_name?.[0] ?? ""}${profile.last_name?.[0] ?? ""}`.toUpperCase() ||
      profile.email[0].toUpperCase()
    : "";
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="min-h-dvh bg-[#fafaf9]">
      <main className="mx-auto w-full max-w-5xl px-5 pb-40 pt-8 lg:px-10 lg:pt-12">
        <h1 className="text-2xl font-extrabold text-[#0f1a12] lg:text-4xl">Profile</h1>

        {error && (
          <div className="mt-6 rounded-2xl bg-red-50 p-5 text-red-600">
            <p>{error}</p>
            <button onClick={() => setAttempt((a) => a + 1)} className="mt-2 font-semibold underline">
              Retry
            </button>
          </div>
        )}

        <div className="mt-8 grid items-start gap-6 lg:grid-cols-[320px_1fr] lg:gap-8">
          {/* Profile card */}
          <section className="rounded-3xl bg-white p-6 text-center shadow-sm ring-1 ring-black/5 lg:sticky lg:top-8 lg:p-8">
            {profile ? (
              <>
                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-[#4bd381] text-3xl font-extrabold text-[#0f1a12]">
                  {initials}
                </div>
                <p className="mt-5 text-xl font-bold text-[#0f1a12]">{fullName}</p>
                <p className="mt-1 break-all text-[#0f1a12]/60">{profile.email}</p>

                <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                  {profile.is_verified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#d9f3e3] px-3 py-1 text-xs font-bold text-[#1a9a52]">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                      Verified
                    </span>
                  )}
                  {memberSince && (
                    <span className="rounded-full bg-[#f1f1f0] px-3 py-1 text-xs font-medium text-[#0f1a12]/60">
                      Member since {memberSince}
                    </span>
                  )}
                </div>
              </>
            ) : (
              !error && (
                <div className="flex flex-col items-center">
                  <div className="h-24 w-24 animate-pulse rounded-full bg-black/10" />
                  <div className="mt-5 h-5 w-40 animate-pulse rounded bg-black/10" />
                  <div className="mt-3 h-4 w-48 animate-pulse rounded bg-black/5" />
                </div>
              )
            )}
          </section>

          {/* Menu */}
          <section>
            <ul className="divide-y divide-black/5 overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-black/5">
              {rows.map((r) => (
                <li key={r.href}>
                  <Link
                    href={r.href}
                    className="flex items-center gap-4 px-5 py-4 transition hover:bg-black/[0.03] lg:px-6 lg:py-5"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#eef8f2] text-[#1a9a52]">
                      {r.icon}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-[#0f1a12]">{r.label}</span>
                      <span className="block text-sm text-[#0f1a12]/50">{r.hint}</span>
                    </span>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-[#0f1a12]/30">
                      <path d="M9 6l6 6-6 6" />
                    </svg>
                  </Link>
                </li>
              ))}
            </ul>

            <button
              onClick={handleLogout}
              className="mt-6 flex w-full items-center gap-4 rounded-3xl bg-white px-5 py-4 text-left font-semibold text-red-600 shadow-sm ring-1 ring-black/5 transition hover:bg-red-50 lg:px-6 lg:py-5"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-50">
                <svg {...svg}>
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                </svg>
              </span>
              Log out
            </button>
          </section>
        </div>
      </main>

      <GlassNav />
    </div>
  );
}