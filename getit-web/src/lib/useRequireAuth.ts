"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AUTH_ENTRY, isLoggedIn, setNext } from "./session";

export function useRequireAuth() {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (isLoggedIn()) {
      setReady(true);
    } else {
      setNext(pathname); // remember the page so login can send them back
      router.replace(AUTH_ENTRY);
    }
  }, [pathname, router]);

  return ready;
}