"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Splash() {
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => router.replace("/home"), 3800);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <main className="splash">
      <div className="splash-logo">
        <Image src="/logo.png" alt="GetIt" width={240} height={240} priority />
      </div>

      <Link href="/home" className="splash-btn">
        Get Started
      </Link>
    </main>
  );
}