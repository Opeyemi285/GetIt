"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import PngIcon from "@/components/PngIcon";

const tabs = [
  { href: "/home", label: "Home", icon: "/tab-icons/home.png" },
  { href: "/orders", label: "Orders", icon: "/tab-icons/orders.png" },
  { href: "/messages", label: "Message", icon: "/tab-icons/message.png" },
  { href: "/profile", label: "Profile", icon: "/tab-icons/profile.png" },
];

const ACTIVE = "#1a9a52";
const INACTIVE = "rgba(0,0,0,0.65)";

export default function GlassNav({ unreadMessages = false }: { unreadMessages?: boolean }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main"
      className="fixed bottom-[max(0.625rem,env(safe-area-inset-bottom))] left-1/2 z-40 w-[calc(100%-5rem)] max-w-xs -translate-x-1/2 rounded-3xl border border-white/55 bg-white/25 p-1 shadow-[0_6px_24px_rgba(15,26,18,0.15)] backdrop-blur-xl backdrop-saturate-150"
    >
      <ul className="flex items-center justify-between">
        {tabs.map((t) => {
          const active = pathname.startsWith(t.href);
          const color = active ? ACTIVE : INACTIVE;
          return (
            <li key={t.href} className="flex-1">
              <Link
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={`relative flex flex-col items-center gap-0.5 rounded-[20px] py-[5px] text-[10px] transition ${
                  active ? "bg-white/60" : "hover:bg-white/30"
                }`}
                style={{ color }}
              >
                <PngIcon src={t.icon} size={20} color={color} />
                {t.label}
                {t.label === "Message" && unreadMessages && (
                  <span className="absolute right-[30%] top-1 h-2 w-2 rounded-full bg-red-500" />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}