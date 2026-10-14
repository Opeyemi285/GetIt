"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthShell from "@/components/auth/AuthShell";
import SocialButtons from "@/components/auth/SocialButtons";
import { ErrorText, Field, PrimaryButton } from "@/components/auth/ui";
import Link from "next/link";
import { api } from "@/lib/api";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Enter a valid email address.");
    if (!password) return setError("Enter your password.");

    setLoading(true);
    try {
      // change the path and field names to match your FastAPI login route
      const data = await api<{ access_token: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem("token", data.access_token);
      router.push("/home"); // TODO: change to your buyer home page
    } catch (err) {
      setError((err as Error).message || "Login failed. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Welcome back," highlight="Login" onBack={() => router.push("/onboarding")}>
      <form onSubmit={handleSubmit} className="step-in space-y-6" noValidate>
        <Field label="Email Address" type="email" value={email} onChange={setEmail} placeholder="Enter Email Address" autoComplete="email" />
        <Field label="Password" type="password" value={password} onChange={setPassword} placeholder="Enter your password" autoComplete="current-password" />

        <ErrorText>{error}</ErrorText>

        <PrimaryButton type="submit" loading={loading}>
          Login
        </PrimaryButton>

        <p className="text-center text-[#0f1a12]">or</p>
        <SocialButtons verb="Login" />

        <p className="pt-4 text-center text-[#0f1a12]">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-medium text-[#4bd381] hover:underline">
            Register
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}