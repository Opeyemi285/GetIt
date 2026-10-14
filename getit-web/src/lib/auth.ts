import { api } from "./api";

type TokenResponse = { access_token?: string };

export function registerStart(data: {
  firstName: string;
  lastName: string;
  email: string;
}) {
  return api("/auth/register/start", {
    method: "POST",
    body: JSON.stringify({
      first_name: data.firstName,
      last_name: data.lastName,
      email: data.email,
    }),
  });
}

export function registerVerify(email: string, code: string) {
  return api("/auth/register/verify", {
    method: "POST",
    body: JSON.stringify({ email, code }),
  });
}

export async function registerComplete(data: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}) {
  const res = await api<TokenResponse>("/auth/register/complete", {
    method: "POST",
    body: JSON.stringify({
      first_name: data.firstName,
      last_name: data.lastName,
      email: data.email,
      password: data.password,
    }),
  });
  if (res.access_token) localStorage.setItem("token", res.access_token);
  return res;
}