import { OutfitCardSkeleton } from "@/components/browse/OutfitCardSkeleton";

export default function BrowseLoading() {
  return (
    <div className="min-h-screen bg-stone-50/50 pb-24 overflow-x-hidden">
      {/* ── Top Header Skeleton ── */}
      <div className="border-b border-stone-200/70 bg-gradient-to-b from-rose-50/40 via-white to-transparent pt-6 pb-8 sm:pt-8 sm:pb-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb Skeleton */}
          <div className="h-3 w-36 rounded-md bg-stone-200 animate-pulse mb-4 sm:mb-6" />

          {/* Heading + Subtitle Skeleton */}
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <div className="h-8 sm:h-10 w-3/4 mx-auto rounded-xl bg-stone-200 animate-pulse" />
            <div className="h-4 w-1/2 mx-auto rounded-md bg-stone-100 animate-pulse" />
            <div className="h-3 w-28 mx-auto rounded-md bg-stone-100 animate-pulse" />
          </div>

          {/* Search Bar Skeleton */}
          <div className="mt-6 sm:mt-8 max-w-2xl mx-auto">
            <div className="h-12 sm:h-13 rounded-2xl bg-stone-200/80 animate-pulse" />
          </div>

          {/* Category Chips Skeleton */}
          <div className="mt-6 sm:mt-8 flex gap-2 overflow-x-auto pb-1">
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className="h-8 sm:h-9 w-24 shrink-0 rounded-full bg-stone-200 animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Main Content Area Skeleton ── */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Sidebar Skeleton (Desktop) */}
          <div className="hidden lg:block w-64 shrink-0 rounded-3xl border border-stone-200/60 bg-white p-6 h-[460px] animate-pulse" />

          {/* Main Feed Skeleton */}
          <div className="flex-1 w-full space-y-6">
            {/* Toolbar Skeleton */}
            <div className="h-12 rounded-2xl border border-stone-200/60 bg-white animate-pulse" />

            {/* Outfit Cards Grid Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <OutfitCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
