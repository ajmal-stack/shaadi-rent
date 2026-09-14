"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getOutfitImageUrl } from "@/lib/utils/image";

export interface OutfitImageItem {
  id: string;
  storage_path: string;
  image_type: string;
  sort_order: number;
}

interface OutfitGalleryProps {
  images?: OutfitImageItem[] | null;
  outfitTitle: string;
}

export function OutfitGallery({ images, outfitTitle }: OutfitGalleryProps) {
  const sortedImages =
    images && images.length > 0
      ? [...images].sort((a, b) => a.sort_order - b.sort_order)
      : [];

  const [activeIndex, setActiveIndex] = useState(0);
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});
  const touchStartX = useRef<number | null>(null);

  const formatAngleLabel = (type: string) => {
    switch (type) {
      case "front":
        return "Front View";
      case "back":
        return "Back View";
      case "detail":
        return "Embroidery Detail";
      case "side":
        return "Side Profile";
      case "label":
        return "Designer Label";
      default:
        return "Couture View";
    }
  };

  // If no images exist, show fallback
  if (sortedImages.length === 0) {
    const fallbackUrl = getOutfitImageUrl(null);
    return (
      <div className="relative aspect-[3/4] w-full rounded-3xl overflow-hidden bg-stone-100 border border-rose-100 shadow-sm">
        <Image
          src={fallbackUrl}
          alt={outfitTitle}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover object-top"
        />
      </div>
    );
  }

  const handlePrev = () => {
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : sortedImages.length - 1));
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev < sortedImages.length - 1 ? prev + 1 : 0));
  };

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    const threshold = 40; // minimum px swipe distance

    if (diff > threshold) {
      handleNext();
    } else if (diff < -threshold) {
      handlePrev();
    }
    touchStartX.current = null;
  };

  const activeImage = sortedImages[activeIndex] ?? sortedImages[0];
  const hasError = imageErrors[activeIndex];
  const activeUrl = hasError
    ? getOutfitImageUrl(null)
    : getOutfitImageUrl(activeImage.storage_path);

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* ── Main Stage Image (3:4 Aspect Ratio) ── */}
      <div
        className="group relative aspect-[3/4] w-full select-none rounded-3xl overflow-hidden bg-stone-100 border border-rose-100/80 shadow-md touch-pan-y"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <Image
          src={activeUrl}
          alt={`${outfitTitle} - ${formatAngleLabel(activeImage.image_type)}`}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 55vw"
          className="object-cover object-top transition-all duration-300"
          onError={() => setImageErrors((prev) => ({ ...prev, [activeIndex]: true }))}
        />

        {/* Top Badges */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
          <span className="rounded-full bg-stone-950/80 px-3 py-1 text-[11px] font-bold text-white shadow-xs backdrop-blur-md">
            {formatAngleLabel(activeImage.image_type)}
          </span>

          <span className="rounded-full bg-white/85 px-2.5 py-1 text-[11px] font-semibold text-stone-800 shadow-xs backdrop-blur-md">
            {activeIndex + 1} / {sortedImages.length}
          </span>
        </div>

        {/* Previous & Next Navigation Arrows */}
        {sortedImages.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-white/85 text-stone-800 shadow-md backdrop-blur-md transition-all hover:bg-white hover:scale-105 active:scale-95 z-10 opacity-90 sm:opacity-0 sm:group-hover:opacity-100"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              aria-label="Next image"
              className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-white/85 text-stone-800 shadow-md backdrop-blur-md transition-all hover:bg-white hover:scale-105 active:scale-95 z-10 opacity-90 sm:opacity-0 sm:group-hover:opacity-100"
            >
              <ChevronRight size={18} />
            </button>
          </>
        )}
      </div>

      {/* ── Thumbnail Strip ── */}
      {sortedImages.length > 1 && (
        <div className="flex gap-2.5 sm:gap-3 overflow-x-auto pb-2 pt-0.5 no-scrollbar">
          {sortedImages.map((img, idx) => {
            const isSelected = activeIndex === idx;
            const thumbUrl = imageErrors[idx]
              ? getOutfitImageUrl(null)
              : getOutfitImageUrl(img.storage_path);

            return (
              <button
                key={img.id}
                type="button"
                onClick={() => setActiveIndex(idx)}
                aria-label={`View image ${idx + 1}`}
                className={`relative aspect-[3/4] h-20 sm:h-24 md:h-28 shrink-0 rounded-2xl overflow-hidden border-2 transition-all cursor-pointer ${
                  isSelected
                    ? "border-rose-700 ring-2 ring-rose-200 scale-102"
                    : "border-stone-200/80 opacity-70 hover:opacity-100 hover:border-stone-300"
                }`}
              >
                <Image
                  src={thumbUrl}
                  alt={`Thumbnail ${idx + 1}`}
                  fill
                  sizes="120px"
                  className="object-cover object-top"
                  onError={() => setImageErrors((prev) => ({ ...prev, [idx]: true }))}
                />
                <span className="absolute bottom-1 right-1 rounded bg-stone-950/80 px-1 py-0.5 text-[8px] font-bold text-white capitalize">
                  {img.image_type}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
