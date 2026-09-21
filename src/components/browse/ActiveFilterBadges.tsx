"use client";

import { useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { X, RotateCcw, Calendar, MapPin, Tag, Sparkles } from "lucide-react";

interface ActiveFilterBadgesProps {
  categoryName?: string;
  gender?: string;
  minPrice?: string;
  maxPrice?: string;
  size?: string;
  location?: string;
  eventDate?: string;
  query?: string;
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
}: ActiveFilterBadgesProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const removeParam = (keys: string[]) => {
    const params = new URLSearchParams(searchParams.toString());
    keys.forEach((key) => params.delete(key));
    params.delete("page");
    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname);
    });
  };

  const removeSingleSize = (sizeToRemove: string) => {
    if (!size) return;
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
      router.push(qs ? `${pathname}?${qs}` : pathname);
    });
  };

  const clearAll = () => {
    startTransition(() => {
      router.push(pathname);
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
      onRemove: () => removeParam(["q"]),
    });
  }

  if (categoryName) {
    badges.push({
      id: "category",
      label: "Category",
      value: categoryName,
      icon: <Tag size={11} className="text-rose-700" />,
      onRemove: () => removeParam(["category"]),
    });
  }

  if (gender && gender !== "all") {
    badges.push({
      id: "gender",
      label: "Wearer",
      value: gender === "bride" ? "Bride" : "Groom",
      icon: <Sparkles size={11} className="text-amber-600" />,
      onRemove: () => removeParam(["gender"]),
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
      onRemove: () => removeParam(["minPrice", "maxPrice"]),
    });
  }

  if (size) {
    const sizeList = size
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    sizeList.forEach((sz) => {
      badges.push({
        id: `size-${sz}`,
        label: "Size",
        value: sz,
        onRemove: () => removeSingleSize(sz),
      });
    });
  }

  if (location) {
    badges.push({
      id: "location",
      label: "City",
      value: location,
      icon: <MapPin size={11} className="text-rose-700" />,
      onRemove: () => removeParam(["location"]),
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
      onRemove: () => removeParam(["eventDate"]),
    });
  }

  if (badges.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 pt-1 pb-3">
      <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 mr-1">
        Active Filters:
      </span>

      {badges.map((badge) => (
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
        <RotateCcw size={11} />
        <span>Clear all</span>
      </button>
    </div>
  );
}
