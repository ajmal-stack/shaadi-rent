"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ShieldCheck, MapPin, Heart } from "lucide-react";
import { toast } from "sonner";
import { getOutfitImageUrl } from "@/lib/utils/image";
import { toggleWishlist } from "@/app/actions/wishlist";
import { triggerWishlistFlyEffect } from "@/lib/utils/wishlistFlyAnimation";

export interface OutfitCardData {
  id: string;
  title: string;
  slug: string;
  brand: string | null;
  rental_price: number;
  security_deposit: number;
  purchase_price?: number | null;
  size: string | null;
  condition: string;
  city: string | null;
  state: string | null;
  district: string | null;
  verification_status: string;
  category?: {
    id: string;
    name: string;
    slug: string;
    gender_type: string;
  } | null;
  images?: Array<{
    id: string;
    storage_path: string;
    image_type: string;
    sort_order: number;
  }> | null;
}

interface OutfitCardProps {
  outfit: OutfitCardData;
  initialWishlisted?: boolean;
  onWishlistChange?: (outfitId: string, isSaved: boolean) => void;
}

export function OutfitCard({
  outfit,
  initialWishlisted = false,
  onWishlistChange,
}: OutfitCardProps) {
  const router = useRouter();
  const [isWishlisted, setIsWishlisted] = useState(initialWishlisted);
  const [isPending, setIsPending] = useState(false);

  // Sort images by sort_order and pick the first one as primary
  const sortedImages = outfit.images
    ? [...outfit.images].sort((a, b) => a.sort_order - b.sort_order)
    : [];
  const primaryImagePath = sortedImages[0]?.storage_path;
  const imageUrl = getOutfitImageUrl(primaryImagePath);

  const formattedDeposit = outfit.security_deposit
    ? `+ ₹${outfit.security_deposit.toLocaleString("en-IN")} deposit`
    : "Zero deposit";

  const savingsPercent =
    outfit.purchase_price && outfit.purchase_price > outfit.rental_price
      ? Math.round(
          ((outfit.purchase_price - outfit.rental_price) /
            outfit.purchase_price) *
            100
        )
      : 0;

  const locationText = [outfit.city, outfit.state].filter(Boolean).join(", ");

  const handleWishlistToggle = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (isPending) return;

    const nextState = !isWishlisted;
    const buttonEl = e.currentTarget;

    // Optimistic UI update
    setIsWishlisted(nextState);
    onWishlistChange?.(outfit.id, nextState);
    setIsPending(true);

    // Launch glowing heart flight animation to navbar when wishlisting
    if (nextState && buttonEl) {
      triggerWishlistFlyEffect(buttonEl);
    }

    try {
      const res = await toggleWishlist(outfit.id);
      if (!res.success) {
        // Revert optimistic update
        setIsWishlisted(!nextState);
        onWishlistChange?.(outfit.id, !nextState);

        if (res.requireAuth) {
          toast.info("Please sign in to save outfits to your wishlist.", {
            action: {
              label: "Sign in",
              onClick: () =>
                router.push(
                  `/auth/login?next=${encodeURIComponent(`/outfits/${outfit.slug}`)}`
                ),
            },
          });
        } else {
          toast.error(res.error || "Failed to update wishlist.");
        }
        return;
      }
    } catch {
      setIsWishlisted(!nextState);
      onWishlistChange?.(outfit.id, !nextState);
      toast.error("Could not update wishlist. Please try again.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Link
      href={`/outfits/${outfit.slug}`}
      className="group flex flex-col rounded-2xl sm:rounded-3xl border border-rose-100/80 bg-white overflow-hidden shadow-2xs transition-all duration-300 hover:shadow-xl hover:-translate-y-1 focus:outline-none"
    >
      {/* 3:4 Aspect Ratio Image */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-stone-100">
        <Image
          src={imageUrl}
          alt={outfit.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
        />

        {/* Top Floating Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 sm:top-3 sm:left-3 sm:right-3 flex items-center justify-between pointer-events-none">
          {/* Verified / Approved Indicator or Savings Badge */}
          <div className="flex items-center gap-1.5">
            {outfit.verification_status === "approved" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-800/90 px-2.5 py-0.5 sm:py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-xs backdrop-blur-sm">
                <ShieldCheck size={12} className="text-emerald-300" />
                Verified
              </span>
            )}
            {savingsPercent > 0 && (
              <span className="rounded-full bg-rose-700/90 px-2 py-0.5 sm:py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-xs backdrop-blur-sm">
                Save {savingsPercent}%
              </span>
            )}
          </div>

          {/* Wishlist Heart Button */}
          <button
            type="button"
            onClick={handleWishlistToggle}
            aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
            className="pointer-events-auto flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-white/90 text-stone-700 backdrop-blur-sm shadow-xs transition-transform active:scale-90 hover:scale-110 hover:text-rose-700 cursor-pointer"
          >
            <Heart
              size={16}
              className={isWishlisted ? "fill-rose-600 text-rose-600" : "text-stone-700"}
            />
          </button>
        </div>

        {/* Bottom Metadata Pills on Image */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 sm:bottom-3 sm:left-3 sm:right-3 flex items-center justify-between gap-1 pointer-events-none">
          {/* Location Tag */}
          {locationText ? (
            <span className="inline-flex items-center gap-1 rounded-lg bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-stone-700 backdrop-blur-sm shadow-xs truncate max-w-[65%]">
              <MapPin size={11} className="text-rose-700 shrink-0" />
              <span className="truncate">{locationText}</span>
            </span>
          ) : <span />}

          {/* Size Pill */}
          {outfit.size && (
            <span className="rounded-lg bg-stone-900/80 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs backdrop-blur-sm">
              Size {outfit.size}
            </span>
          )}
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between space-y-3">
        <div>
          <div className="flex items-center justify-between text-[11px] text-amber-800 font-bold uppercase tracking-wider">
            <span className="truncate">{outfit.category?.name ?? "Wedding Couture"}</span>
            {outfit.brand && (
              <span className="text-stone-500 font-medium lowercase shrink-0 ml-1">
                {outfit.brand}
              </span>
            )}
          </div>

          <h3 className="mt-1 font-display text-sm sm:text-base font-bold text-stone-900 line-clamp-1 group-hover:text-rose-800 transition-colors">
            {outfit.title}
          </h3>
        </div>

        {/* Pricing & CTA */}
        <div className="border-t border-stone-100 pt-3 flex items-center justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base sm:text-lg font-extrabold text-stone-950">
                ₹{outfit.rental_price.toLocaleString("en-IN")}
              </span>
              {outfit.purchase_price && outfit.purchase_price > outfit.rental_price ? (
                <span className="text-xs text-stone-400 line-through">
                  ₹{outfit.purchase_price.toLocaleString("en-IN")}
                </span>
              ) : (
                <span className="text-[11px] text-stone-500 font-medium">
                  per rental
                </span>
              )}
            </div>
            <p className="text-[10px] text-stone-400 font-medium mt-0.5">
              {formattedDeposit}
            </p>
          </div>

          <span className="rounded-xl bg-rose-50 border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-800 transition-all group-hover:bg-rose-900 group-hover:text-white shrink-0">
            View Outfit
          </span>
        </div>
      </div>
    </Link>
  );
}
