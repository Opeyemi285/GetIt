import { Suspense } from "react";
import StoreClient from "./StoreClient";

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-[#fafaf9]" />}>
      <StoreClient />
    </Suspense>
  );
}