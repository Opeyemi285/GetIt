export const AUTH_ENTRY = "/onboarding";

function tokenExpired(token: string) {
  try {
    const payload = JSON.parse(
      atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
    );
    return typeof payload.exp === "number" && payload.exp * 1000 < Date.now();
  } catch {
    return true; // unreadable token counts as logged out
  }
}

export function isLoggedIn() {
  if (typeof window === "undefined") return false;
  const token = localStorage.getItem("token");
  if (!token) return false;
  if (tokenExpired(token)) {
    localStorage.removeItem("token");
    return false;
  }
  return true;
}

export function logout() {
  localStorage.removeItem("token");
}

export function setNext(path: string) {
  sessionStorage.setItem("next", path);
}

export function takeNext(fallback = "/home") {
  const n = sessionStorage.getItem("next");
  sessionStorage.removeItem("next");
  return n && n.startsWith("/") && !n.startsWith("//") ? n : fallback;
}