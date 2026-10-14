export function isLoggedIn() {
  return typeof window !== "undefined" && !!localStorage.getItem("token");
}

export function logout() {
  localStorage.removeItem("token");
}

// remember where the user was trying to go, so login can send them back
export function setNext(path: string) {
  sessionStorage.setItem("next", path);
}

export function takeNext(fallback = "/home") {
  const n = sessionStorage.getItem("next");
  sessionStorage.removeItem("next");
  return n && n.startsWith("/") && !n.startsWith("//") ? n : fallback;
}