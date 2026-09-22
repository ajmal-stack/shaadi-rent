"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { X, RotateCcw, Calendar, MapPin, Tag, Sparkles, Loader2, User } from "lucide-react";

interface ActiveFilterBadgesProps {
  categoryName?: string;
  gender?: string;
  minPrice?: string;
  maxPrice?: string;
  size?: string;
  location?: string;
  eventDate?: string;
  query?: string;
  ownerId?: string;
  ownerName?: string;
}

export function ActiveFilterBadges({
  categoryName,
  gender,
  minPrice,
  maxPrice,
  size,
  location,
  eventDate,
  query,
  ownerId,
  ownerName,
}: ActiveFilterBadgesProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [removedBadgeIds, setRemovedBadgeIds] = useState<Set<string>>(new Set());

  const isMounted = useRef(false);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Reset optimistically removed badges when URL search params or props update
  useEffect(() => {
    setRemovedBadgeIds(new Set());
  }, [categoryName, gender, minPrice, maxPrice, size, location, eventDate, query, ownerId, ownerName]);

  const removeParam = (keys: string[], badgeId: string) => {
    if (!isMounted.current) return;
    setRemovedBadgeIds((prev) => new Set(prev).add(badgeId)); // INSTANT UI removal

    const params = new URLSearchParams(searchParams.toString());
    keys.forEach((key) => params.delete(key));
    params.delete("page");
    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  };

  const removeSingleSize = (sizeToRemove: string, badgeId: string) => {
    if (!isMounted.current) return;
    if (!size) return;
    setRemovedBadgeIds((prev) => new Set(prev).add(badgeId)); // INSTANT UI removal

    const currentSizes = size
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const updated = currentSizes.filter((s) => s !== sizeToRemove);
    const params = new URLSearchParams(searchParams.toString());
    if (updated.length > 0) {
      params.set("size", updated.join(","));
    } else {
      params.delete("size");
    }
    params.delete("page");
    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  };

  const clearAll = () => {
    if (!isMounted.current) return;
    startTransition(() => {
      router.push(pathname, { scroll: false });
    });
  };

  // Build filter list
  const badges: Array<{
    id: string;
    label: string;
    value: string;
    icon?: React.ReactNode;
    onRemove: () => void;
  }> = [];

  if (query) {
    badges.push({
      id: "search",
      label: "Search",
      value: `"${query}"`,
      onRemove: () => removeParam(["q"], "search"),
    });
  }

  if (ownerName || ownerId) {
    badges.push({
      id: "owner",
      label: "Owner",
      value: ownerName || "Selected Wardrobe",
      icon: <User size={11} className="text-rose-700" />,
      onRemove: () => removeParam(["ownerId", "ownerName"], "owner"),
    });
  }

  if (categoryName) {
    badges.push({
      id: "category",
      label: "Category",
      value: categoryName,
      icon: <Tag size={11} className="text-rose-700" />,
      onRemove: () => removeParam(["category"], "category"),
    });
  }

  if (gender && gender !== "all") {
    badges.push({
      id: "gender",
      label: "Wearer",
      value: gender === "bride" ? "Bride" : "Groom",
      icon: <Sparkles size={11} className="text-amber-600" />,
      onRemove: () => removeParam(["gender"], "gender"),
    });
  }

  if (minPrice || maxPrice) {
    let priceLabel = "";
    if (minPrice && maxPrice) {
      priceLabel = `₹${Number(minPrice).toLocaleString("en-IN")} – ₹${Number(maxPrice).toLocaleString("en-IN")}`;
    } else if (minPrice) {
      priceLabel = `Above ₹${Number(minPrice).toLocaleString("en-IN")}`;
    } else if (maxPrice) {
      priceLabel = `Under ₹${Number(maxPrice).toLocaleString("en-IN")}`;
    }

    badges.push({
      id: "price",
      label: "Price",
      value: priceLabel,
      onRemove: () => removeParam(["minPrice", "maxPrice"], "price"),
    });
  }

  if (size) {
    const sizeList = size
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    sizeList.forEach((sz) => {
      const badgeId = `size-${sz}`;
      badges.push({
        id: badgeId,
        label: "Size",
        value: sz,
        onRemove: () => removeSingleSize(sz, badgeId),
      });
    });
  }

  if (location) {
    badges.push({
      id: "location",
      label: "City",
      value: location,
      icon: <MapPin size={11} className="text-rose-700" />,
      onRemove: () => removeParam(["location"], "location"),
    });
  }

  if (eventDate) {
    let dateDisplay = eventDate;
    try {
      const parts = eventDate.split("-");
      if (parts.length === 3) {
        const d = new Date(
          parseInt(parts[0], 10),
          parseInt(parts[1], 10) - 1,
          parseInt(parts[2], 10)
        );
        dateDisplay = d.toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
      }
    } catch {
      dateDisplay = eventDate;
    }

    badges.push({
      id: "eventDate",
      label: "Event Date",
      value: dateDisplay,
      icon: <Calendar size={11} className="text-rose-700" />,
      onRemove: () => removeParam(["eventDate"], "eventDate"),
    });
  }

  const visibleBadges = badges.filter((b) => !removedBadgeIds.has(b.id));
  if (visibleBadges.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 pt-1 pb-3">
      <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 mr-1">
        Active Filters:
      </span>

      {visibleBadges.map((badge) => (
        <span
          key={badge.id}
          className="inline-flex items-center gap-1.5 rounded-full border border-rose-200/90 bg-rose-50/80 px-2.5 py-1 text-xs font-medium text-rose-950 shadow-2xs transition-all hover:bg-rose-100"
        >
          {badge.icon}
          <span className="text-stone-500 font-normal">{badge.label}:</span>
          <span className="font-semibold">{badge.value}</span>
          <button
            type="button"
            onClick={badge.onRemove}
            className="ml-0.5 -mr-0.5 rounded-full p-0.5 text-stone-400 hover:bg-rose-200 hover:text-stone-900 transition-colors cursor-pointer"
            aria-label={`Remove filter for ${badge.label} ${badge.value}`}
          >
            <X size={12} />
          </button>
        </span>
      ))}

      <button
        type="button"
        onClick={clearAll}
        className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-rose-900 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
      >
        {isPending ? (
          <Loader2 size={11} className="animate-spin text-rose-700" />
        ) : (
          <RotateCcw size={11} />
        )}
        <span>Clear all</span>
      </button>
    </div>
  );
}
