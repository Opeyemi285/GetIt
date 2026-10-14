"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

const slides = [
  {
    title: "Fast, Secure, and\nStress-Free Delivery",
    description:
      "Get anything you need delivered from local stores and markets, right to your doorstep.",
    image: "/onboarding/delivery.png",
  },
  {
    title: "Verified Runners",
    description:
      "Our runners are thoroughly vetted and background-checked, ensuring safe and reliable delivery experience every time.",
    image: "/onboarding/people.png",
  },
  {
    title: "Order from Any\nStore",
    description:
      "Get anything you need delivered from local stores and markets, right to your doorstep.",
    image: "/onboarding/bags.png",
  },
];

export default function Onboarding() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  const isLast = index === slides.length - 1;
  const slide = slides[index];

  function changeSlide(next: number) {
    if (!visible || next === index) return;
    setVisible(false); // fade out
    setTimeout(() => {
      setIndex(next); // swap content
      setVisible(true); // fade in
    }, 200);
  }

  function handleBack() {
    if (index === 0) router.push("/home");
    else changeSlide(index - 1);
  }

  function handleNext() {
    if (isLast) router.push("/register");
    else changeSlide(index + 1);
  }

  const fade = `transition-opacity duration-200 ${
    visible ? "opacity-100" : "opacity-0"
  }`;

  return (
    <main className="flex min-h-dvh w-full flex-col bg-white">
      {/* Top bar */}
      <header className="mx-auto w-full max-w-6xl px-6 pt-8 lg:px-12 lg:pt-10">
        <button
          onClick={handleBack}
          aria-label="Go back"
          className="flex h-11 w-11 items-center justify-center rounded-full transition hover:bg-black/5"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0f1a12" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
      </header>

      {/* Content */}
      <section className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-8 px-6 pb-10 pt-4 lg:grid-cols-2 lg:gap-16 lg:px-12">
        {/* Illustration */}
        <div className={`flex justify-center ${fade}`}>
          <div className="relative aspect-square w-full max-w-[280px] sm:max-w-[340px] lg:max-w-[520px]">
            <Image
              src={slide.image}
              alt=""
              fill
              sizes="(min-width: 1024px) 520px, 340px"
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* Text, dots, buttons */}
        <div className="mx-auto flex w-full max-w-md flex-col items-center text-center lg:mx-0 lg:max-w-xl lg:items-start lg:text-left">
          <div className={fade}>
            <h1 className="whitespace-pre-line text-[28px] font-extrabold leading-tight text-[#0f1a12] sm:text-[34px] lg:text-5xl">
              {slide.title}
            </h1>
            <p className="mt-4 max-w-[320px] text-[15px] leading-6 text-[#5b5b5b] sm:max-w-md lg:mt-6 lg:max-w-lg lg:text-lg lg:leading-8">
              {slide.description}
            </p>
          </div>

          {/* Dots */}
          <div className="my-8 flex items-center gap-1.5 lg:my-10">
            {slides.map((_, i) => (
              <span
                key={i}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === index ? "w-6 bg-[#4bd381]" : "w-2 bg-[#bfeccf]"
                }`}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex w-full flex-col gap-3 lg:max-w-md lg:flex-row">
            <button
              onClick={handleNext}
              className="h-[52px] w-full rounded-[10px] bg-[#4bd381] text-base font-bold text-[#0f1a12] shadow-md transition hover:brightness-105 active:scale-[0.99]"
            >
              {isLast ? "Get Started" : "Next"}
            </button>

            {!isLast && (
              <button
                onClick={() => router.push("/register")}
                className="h-[52px] w-full rounded-[10px] bg-[#e5e5e5] text-[15px] font-medium text-[#5b5b5b] transition hover:bg-[#dcdcdc]"
              >
                Skip
              </button>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}