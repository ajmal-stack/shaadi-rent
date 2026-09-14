export function OutfitCardSkeleton() {
  return (
    <div className="flex flex-col rounded-3xl border border-rose-100/70 bg-white overflow-hidden shadow-xs animate-pulse">
      {/* 3:4 Image Skeleton */}
      <div className="relative aspect-[3/4] w-full bg-stone-200/70" />

      {/* Content Skeleton */}
      <div className="p-5 space-y-3">
        <div className="h-3 w-20 bg-stone-200 rounded-md" />
        <div className="h-5 w-3/4 bg-stone-200 rounded-md" />
        <div className="flex items-center justify-between pt-3 border-t border-stone-100">
          <div className="space-y-1.5">
            <div className="h-4 w-16 bg-stone-200 rounded-md" />
            <div className="h-3 w-12 bg-stone-200 rounded-md" />
          </div>
          <div className="h-8 w-18 bg-stone-200 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
