"use client";

import React, { useEffect, useRef, useState } from "react";
import { Card, CardBody } from "@nextui-org/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";

interface ShowCaseItem {
  name: string;
  description: string;
  imageUrl: string;
}

export default function ShowCase({ data }: { data: ShowCaseItem[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [nextIndex, setNextIndex] = useState<number | null>(null);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const [animating, setAnimating] = useState(false);
  const [showControls, setShowControls] = useState(false);

  const ANIMATION_DURATION = 500; // ms
  const AUTO_SLIDE_INTERVAL = 5000; // ms
  const timerRef = useRef<number | null>(null);

  // ===== Auto slide =====
  useEffect(() => {
    if (!data || data.length === 0) return;
    resetAutoSlide();
    return stopAutoSlide;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, data]);

  const resetAutoSlide = () => {
    stopAutoSlide();
    timerRef.current = window.setTimeout(() => {
      handleNext();
    }, AUTO_SLIDE_INTERVAL);
  };

  const stopAutoSlide = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  if (!data || data.length === 0) {
    return <p className="p-4">Tidak ada data untuk ditampilkan</p>;
  }

  // ===== Transisi antar slide =====
  const startTransition = (newIndex: number, dir: "next" | "prev") => {
    if (animating || newIndex === currentIndex) return;

    setDirection(dir);
    setNextIndex(newIndex);
    setAnimating(true);

    window.setTimeout(() => {
      setCurrentIndex(newIndex);
      setNextIndex(null);
      setAnimating(false);
    }, ANIMATION_DURATION);
  };

  const handleNext = () => {
    const newIndex = (currentIndex + 1) % data.length;
    startTransition(newIndex, "next");
  };

  const handlePrev = () => {
    const newIndex = (currentIndex - 1 + data.length) % data.length;
    startTransition(newIndex, "prev");
  };

  const goToSlide = (index: number) => {
    if (index === currentIndex) return;
    startTransition(index, index > currentIndex ? "next" : "prev");
  };

  // ===== Style transform =====
  const getCurrentTransform = () => {
    if (nextIndex === null) return "translateX(0%)";
    if (direction === "next") {
      return animating ? "translateX(-100%)" : "translateX(0%)";
    } else {
      return animating ? "translateX(100%)" : "translateX(0%)";
    }
  };

  const getNextTransform = () => {
    if (nextIndex === null) return "translateX(100%)";
    if (direction === "next") {
      return animating ? "translateX(0%)" : "translateX(100%)";
    } else {
      return animating ? "translateX(0%)" : "translateX(-100%)";
    }
  };

  const transitionStyle = {
    transition: animating
      ? `transform ${ANIMATION_DURATION}ms ease-in-out`
      : "none",
  } as React.CSSProperties;

  return (
    <div
      className="relative flex justify-center w-full overflow-hidden mt-20"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
      onTouchStart={() => setShowControls(true)}
    >
      {/* Tinggi responsif */}
      <Card
        shadow="sm"
        className="w-full max-w-none overflow-hidden 
                   aspect-[16/9] sm:aspect-auto sm:h-[60vh] lg:h-[90vh]"
      >
        <CardBody className="p-0 relative h-full group overflow-hidden">
          {/* Caption */}
          <div
            className="absolute bottom-4 sm:bottom-8 left-4 sm:left-8 z-30 
                       bg-black/50 text-white p-3 sm:p-4 rounded-md 
                       max-w-[90%] sm:max-w-sm md:max-w-md"
            style={{
              transition: animating
                ? `transform ${ANIMATION_DURATION}ms ease-in-out, opacity ${ANIMATION_DURATION}ms ease-in-out`
                : "none",
              transform:
                nextIndex !== null
                  ? direction === "next"
                    ? animating
                      ? "translateX(-100%)"
                      : "translateX(0%)"
                    : animating
                      ? "translateX(100%)"
                      : "translateX(0%)"
                  : "translateX(0%)",
              opacity: animating ? 0 : 1,
            }}
          >
            <h2 className="text-lg sm:text-2xl md:text-3xl font-bold">
              {data[currentIndex].name}
            </h2>
            <p className="text-xs sm:text-base md:text-lg mt-1">
              {data[currentIndex].description}
            </p>
          </div>

          {/* Gambar aktif */}
          <Image
            alt={`Showcase ${currentIndex + 1}`}
            src={data[currentIndex].imageUrl}
            fill
            className="absolute top-0 left-0 object-cover pointer-events-none z-10"
            style={{ ...transitionStyle, transform: getCurrentTransform() }}
            draggable={false}
          />

          {/* Gambar baru */}
          {nextIndex !== null && (
            <Image
              alt={`Showcase ${nextIndex + 1}`}
              src={data[nextIndex].imageUrl}
              fill
              className="absolute top-0 left-0 object-cover pointer-events-none z-10"
              style={{ ...transitionStyle, transform: getNextTransform() }}
              draggable={false}
            />
          )}

          {/* Tombol Prev */}
          <button
            type="button"
            className={`absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 
                        bg-black/50 hover:bg-black/70 text-white 
                        rounded-full w-10 h-10 sm:w-12 sm:h-12 
                        flex items-center justify-center
                        transition-opacity shadow-md z-40
                        ${showControls ? "opacity-100" : "opacity-0"}`}
            onClick={() => {
              stopAutoSlide();
              handlePrev();
            }}
            aria-label="Previous"
          >
            <ChevronLeft className="w-6 h-6 sm:w-7 sm:h-7" />
          </button>

          {/* Tombol Next */}
          <button
            type="button"
            className={`absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 
                        bg-black/50 hover:bg-black/70 text-white 
                        rounded-full w-10 h-10 sm:w-12 sm:h-12 
                        flex items-center justify-center
                        transition-opacity shadow-md z-40
                        ${showControls ? "opacity-100" : "opacity-0"}`}
            onClick={() => {
              stopAutoSlide();
              handleNext();
            }}
            aria-label="Next"
          >
            <ChevronRight className="w-6 h-6 sm:w-7 sm:h-7" />
          </button>

          {/* Dots Indicator */}
          <div className="absolute bottom-3 sm:bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-40">
            {data.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  stopAutoSlide();
                  goToSlide(idx);
                }}
                className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full transition-all ${
                  idx === currentIndex
                    ? "bg-white scale-110"
                    : "bg-white/50 hover:bg-white/80"
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
