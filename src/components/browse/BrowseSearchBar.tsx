"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, X, Loader2 } from "lucide-react";

interface BrowseSearchBarProps {
  initialQuery?: string;
}

export function BrowseSearchBar({ initialQuery = "" }: BrowseSearchBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery);
  const [prevInitialQuery, setPrevInitialQuery] = useState(initialQuery);
  const [isPending, startTransition] = useTransition();

  // Adjust state during render when prop changes (React recommended pattern)
  if (initialQuery !== prevInitialQuery) {
    setPrevInitialQuery(initialQuery);
    setQuery(initialQuery);
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    const trimmed = query.trim();
    if (trimmed) {
      params.set("q", trimmed);
    } else {
      params.delete("q");
    }
    params.delete("page"); // Reset to page 1 on new search
    const qs = params.toString();

    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname);
    });
  };

  const handleClear = () => {
    setQuery("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("q");
    params.delete("page");
    const qs = params.toString();

    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-2xl mx-auto">
      <div className="relative flex items-center">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search lehenga, sherwani, saree..."
          className="w-full h-12 sm:h-13 rounded-2xl border border-stone-200/90 bg-white pl-11 pr-24 text-sm sm:text-base text-stone-900 placeholder:text-stone-400 shadow-xs transition-all focus:border-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-700/20"
          aria-label="Search wedding outfits"
        />

        {/* Search Icon */}
        <div className="absolute left-3.5 sm:left-4 text-stone-400 pointer-events-none">
          {isPending ? (
            <Loader2 size={18} className="animate-spin text-rose-700" />
          ) : (
            <Search size={18} className="text-stone-400" />
          )}
        </div>

        {/* Clear and Submit buttons inside input */}
        <div className="absolute right-2 flex items-center gap-1.5">
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="flex h-8 w-8 items-center justify-center rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
              aria-label="Clear search"
            >
              <X size={15} />
            </button>
          )}

          <button
            type="submit"
            className="rounded-xl bg-rose-900 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-rose-950 transition-colors"
          >
            Search
          </button>
        </div>
      </div>
    </form>
  );
}
