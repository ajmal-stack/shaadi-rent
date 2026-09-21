import { OutfitCardSkeleton } from "@/components/browse/OutfitCardSkeleton";

export default function WishlistLoading() {
  return (
    <div className="min-h-screen bg-stone-50/50 py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header Skeleton */}
        <div className="space-y-2 animate-pulse">
          <div className="h-8 w-48 bg-stone-200 rounded-xl" />
          <div className="h-4 w-80 bg-stone-100 rounded-md" />
        </div>

        {/* Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <OutfitCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
