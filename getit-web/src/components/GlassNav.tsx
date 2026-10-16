"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import PngIcon from "@/components/PngIcon";
import { AUTH_ENTRY, isLoggedIn, setNext } from "@/lib/session";

const tabs = [
  { href: "/home", label: "Home", icon: "/tab-icons/home.png", protected: false },
  { href: "/orders", label: "Orders", icon: "/tab-icons/orders.png", protected: true },
  { href: "/messages", label: "Message", icon: "/tab-icons/message.png", protected: true },
  { href: "/profile", label: "Profile", icon: "/tab-icons/profile.png", protected: true },
];

const ACTIVE = "#1a9a52";
const INACTIVE = "#4B5563";
const DRAG_THRESHOLD = 8; // px of sideways movement before a press becomes a drag

export default function GlassNav({ unreadMessages = false }: { unreadMessages?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();

  const listRef = useRef<HTMLUListElement>(null);
  const drag = useRef({ down: false, moved: false, startX: 0 });
  const lastDragEnd = useRef(0);
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<number | null>(null);

  // a preview only lives until the route changes (or the page is shown again)
  useEffect(() => {
    setPreview(null);
    setDragging(false);
  }, [pathname]);

  const activeIndex = tabs.findIndex((t) => pathname.startsWith(t.href));
  const highlight = preview ?? activeIndex;

  function indexAt(x: number) {
    const rect = listRef.current!.getBoundingClientRect();
    const i = Math.floor(((x - rect.left) / rect.width) * tabs.length);
    return Math.min(tabs.length - 1, Math.max(0, i));
  }

  function onPointerDown(e: React.PointerEvent) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    drag.current = { down: true, moved: false, startX: e.clientX };
  }

  function onPointerMove(e: React.PointerEvent<HTMLElement>) {
    const d = drag.current;
    if (!d.down) return;
    if (!d.moved) {
      if (Math.abs(e.clientX - d.startX) < DRAG_THRESHOLD) return;
      d.moved = true;
      e.currentTarget.setPointerCapture(e.pointerId); // keep tracking even outside the bar
      setDragging(true);
    }
    setPreview(indexAt(e.clientX));
  }

  function onPointerUp(e: React.PointerEvent) {
    const d = drag.current;
    drag.current = { down: false, moved: false, startX: 0 };
    if (!d.moved) return; // plain tap: the link handles it

    lastDragEnd.current = Date.now();
    setDragging(false);

    const target = indexAt(e.clientX);
    const t = tabs[target];

    // released on the page we're already on
    if (target === activeIndex) {
      setPreview(null);
      return;
    }

    // guests can't open protected tabs: reset the highlight, then send them to onboarding
    if (t.protected && !isLoggedIn()) {
      setPreview(null);
      setNext(t.href);
      router.push(AUTH_ENTRY);
      return;
    }

    setPreview(target); // stays until the route changes, then the effect above clears it
    router.push(t.href);
  }

  function onPointerCancel() {
    drag.current = { down: false, moved: false, startX: 0 };
    setDragging(false);
    setPreview(null);
  }

  return (
    <nav
      aria-label="Main"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onDragStart={(e) => e.preventDefault()}
      className={`fixed bottom-[max(0.625rem,env(safe-area-inset-bottom))] left-1/2 z-40 w-[calc(100%-5rem)] max-w-xs -translate-x-1/2 touch-none select-none rounded-3xl border border-[#f3f0ea]/70 bg-[#f3f0ea]/30 p-1 shadow-[0_6px_24px_rgba(15,26,18,0.15)] backdrop-blur-xl backdrop-saturate-150 transition-transform duration-200 ${
        dragging ? "scale-105" : ""
      }`}
    >
      <ul ref={listRef} className="relative flex items-center justify-between">
        {/* sliding glass highlight */}
        <li
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 rounded-[20px] bg-[#f3f0ea]/70 transition-[transform,opacity] duration-200 ease-out"
          style={{
            width: `${100 / tabs.length}%`,
            transform: `translateX(${Math.max(highlight, 0) * 100}%)`,
            opacity: highlight < 0 ? 0 : 1,
          }}
        />

        {tabs.map((t, i) => {
          const active = pathname.startsWith(t.href);
          const color = i === highlight ? ACTIVE : INACTIVE;
          return (
            <li key={t.href} className="relative z-10 flex-1">
              <Link
                href={t.href}
                draggable={false}
                onClick={(e) => {
                  // the click that follows a drag is already handled in onPointerUp
                  if (Date.now() - lastDragEnd.current < 400) {
                    e.preventDefault();
                    return;
                  }
                  if (t.protected && !isLoggedIn()) {
                    e.preventDefault();
                    setPreview(null);
                    setNext(t.href);
                    router.push(AUTH_ENTRY);
                  }
                }}
                aria-current={active ? "page" : undefined}
                className="relative flex flex-col items-center gap-0.5 rounded-[20px] py-[5px] text-[10px] transition-colors hover:bg-[#f3f0ea]/40"
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