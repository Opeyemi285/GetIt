const BASE = process.env.NEXT_PUBLIC_API_URL!;

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        let detail = err.detail;
        if (Array.isArray(detail)) {
        const first = detail[0];
        const field = first?.loc?.slice(1).join(".");
        detail = field ? `${field}: ${first.msg}` : first?.msg;
        }
        if (res.status === 401 && token) localStorage.removeItem("token"); // <-- add this
        throw new ApiError(detail ?? `Request failed (${res.status})`, res.status);
    }
  return res.json();
}