"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  gender_type: string;
}

interface CategoryChipsProps {
  categories: CategoryItem[];
  selectedCategory?: string;
}

export function CategoryChips({
  categories,
  selectedCategory = "",
}: CategoryChipsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [optimisticCategory, setOptimisticCategory] = useState(selectedCategory);

  const isMounted = useRef(false);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Sync optimistic state when parent URL changes
  useEffect(() => {
    setOptimisticCategory(selectedCategory);
  }, [selectedCategory]);

  const handleCategoryClick = (categorySlug: string) => {
    if (!isMounted.current) return;
    setOptimisticCategory(categorySlug); // INSTANT 0ms visual feedback

    const params = new URLSearchParams(searchParams.toString());
    if (categorySlug) {
      params.set("category", categorySlug);
    } else {
      params.delete("category");
    }
    params.delete("page"); // reset pagination on category switch
    const qs = params.toString();

    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  };

  return (
    <div className="w-full">
      {/* Horizontal scroll on mobile with no scrollbar, flex-wrap on desktop */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 sm:flex-wrap no-scrollbar scroll-smooth">
        {/* "All" Category Pill */}
        <button
          type="button"
          onClick={() => handleCategoryClick("")}
          className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs sm:text-sm font-semibold transition-all duration-150 border cursor-pointer ${
            !optimisticCategory
              ? "bg-rose-900 text-white border-rose-900 shadow-xs"
              : "bg-white text-stone-700 border-stone-200 hover:border-rose-300 hover:bg-rose-50/50"
          }`}
        >
          {isPending && !optimisticCategory && (
            <Loader2 size={13} className="animate-spin text-white" />
          )}
          <span>All Outfits</span>
        </button>

        {/* Dynamic Categories from Supabase */}
        {categories.map((cat) => {
          const isSelected = optimisticCategory === cat.slug;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleCategoryClick(cat.slug)}
              className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs sm:text-sm font-semibold transition-all duration-150 border cursor-pointer ${
                isSelected
                  ? "bg-rose-900 text-white border-rose-900 shadow-xs"
                  : "bg-white text-stone-700 border-stone-200 hover:border-rose-300 hover:bg-rose-50/50"
              }`}
            >
              {isPending && isSelected && (
                <Loader2 size={13} className="animate-spin text-white" />
              )}
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
