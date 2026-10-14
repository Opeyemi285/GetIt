"use client";

import { useRouter } from "next/navigation"
import { AUTH_ENTRY, isLoggedIn, setNext } from "./session";

export function useRequireLogin() {
  const router = useRouter();

  return function requireLogin(action: () => void, returnTo?: string) {
    if (isLoggedIn()) {
      action();
      return;
    }
    setNext(returnTo ?? window.location.pathname + window.location.search);
    router.push(AUTH_ENTRY);
  };
}