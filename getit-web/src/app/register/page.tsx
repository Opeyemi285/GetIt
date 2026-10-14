"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthShell from "@/components/auth/AuthShell";
import SocialButtons from "@/components/auth/SocialButtons";
import OtpInput from "@/components/auth/OtpInput";
import { ErrorText, Field, PrimaryButton } from "@/components/auth/ui";
import { registerStart, registerVerify, registerComplete } from "@/lib/auth";

type Step = "name" | "email" | "code" | "password";
const ORDER: Step[] = ["name", "email", "code", "password"];

function maskEmail(email: string) {
  const [name, domain] = email.split("@");
  return `${name.slice(0, 2)}***@${domain}`;
}

export default function Register() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("name");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState<string[]>(Array(6).fill(""));
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  function goBack() {
    setError("");
    setInfo("");
    const i = ORDER.indexOf(step);
    if (i === 0) router.push("/onboarding");
    else setStep(ORDER[i - 1]);
  }

  async function handleResend() {
    setError("");
    setInfo("");
    try {
      await registerStart({ firstName, lastName, email });
      setCode(Array(6).fill(""));
      setInfo("A new code has been sent.");
    } catch (err) {
      setError((err as Error).message || "Could not resend the code. Try again.");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");

    try {
      if (step === "name") {
        if (!firstName.trim()) return setError("Please enter your first name.");
        if (!lastName.trim()) return setError("Please enter your last name.");
        setStep("email");
      } else if (step === "email") {
        if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Enter a valid email address.");
        setLoading(true);
        await registerStart({ firstName, lastName, email });
        setStep("code");
      } else if (step === "code") {
        if (code.join("").length < 6) return setError("Enter the 6-digit code.");
        setLoading(true);
        await registerVerify(email, code.join(""));
        setStep("password");
      } else {
        if (password.length < 8) return setError("Password must be at least 8 characters.");
        if (password !== confirm) return setError("Passwords do not match.");
        setLoading(true);
        await registerComplete({ firstName, lastName, email, password });
        router.push("/home"); // TODO: change to your buyer home page
      }
    } catch (err) {
      setError((err as Error).message || "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  const titles = {
    name: { title: "Let's Get", highlight: "Started!", subtitle: undefined },
    email: {
      title: "What's your",
      highlight: "Email?",
      subtitle: "We'll send a confirmation code to verify it's you.",
    },
    code: {
      title: "Check your",
      highlight: "Email",
      subtitle: (
        <>
          We sent a 6-digit code to{" "}
          <span className="text-[#0f1a12]">{maskEmail(email || "you@mail.com")}</span>. Enter it
          below to continue.
        </>
      ),
    },
    password: {
      title: "Create a",
      highlight: "Password",
      subtitle: "Choose a strong password to keep your account secure.",
    },
  }[step];

  const buttonLabel = {
    name: "Continue",
    email: "Continue",
    code: "Confirm",
    password: "Create Account",
  }[step];

  return (
    <AuthShell {...titles} onBack={goBack}>
      <form key={step} onSubmit={handleSubmit} className="step-in space-y-6" noValidate>
        {step === "name" && (
          <>
            <Field label="First Name" value={firstName} onChange={setFirstName} placeholder="Enter your First Name" autoComplete="given-name" />
            <Field label="Last Name" value={lastName} onChange={setLastName} placeholder="Enter your Last Name" autoComplete="family-name" />
          </>
        )}

        {step === "email" && (
          <Field label="Email Address" type="email" value={email} onChange={setEmail} placeholder="Enter your email address" autoComplete="email" />
        )}

        {step === "code" && <OtpInput value={code} onChange={setCode} />}

        {step === "password" && (
          <>
            <Field label="Password" type="password" value={password} onChange={setPassword} placeholder="Enter your password" autoComplete="new-password" />
            <Field label="Confirm Password" type="password" value={confirm} onChange={setConfirm} placeholder="Re-enter your password" autoComplete="new-password" />
          </>
        )}

        <ErrorText>{error}</ErrorText>
        {info && <p className="text-sm text-[#2e9e5b]">{info}</p>}

        <PrimaryButton type="submit" loading={loading}>
          {buttonLabel}
        </PrimaryButton>

        {step === "code" && (
          <p className="text-center text-[#6b7a70]">
            Didn&apos;t receive a code?{" "}
            <button type="button" onClick={handleResend} className="font-medium text-[#4bd381] hover:underline">
              Resend
            </button>
          </p>
        )}

        {step === "name" && (
          <>
            <p className="text-center text-[#0f1a12]">or</p>
            <SocialButtons verb="Register" />
            <p className="pt-4 text-center text-[#0f1a12]">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-[#4bd381] hover:underline">
                Login
              </Link>
            </p>
          </>
        )}
      </form>
    </AuthShell>
  );
}