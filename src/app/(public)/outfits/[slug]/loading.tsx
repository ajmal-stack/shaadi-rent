export default function OutfitDetailLoading() {
  return (
    <div className="min-h-screen bg-stone-50/50 py-10 sm:py-14 pb-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Skeleton */}
        <div className="h-4 w-48 bg-stone-200 rounded-md animate-pulse mb-8" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          {/* Gallery Skeleton */}
          <div className="lg:col-span-7 space-y-4">
            <div className="aspect-[3/4] w-full rounded-3xl bg-stone-200/80 animate-pulse" />
            <div className="flex gap-3">
              <div className="h-24 w-20 rounded-2xl bg-stone-200/80 animate-pulse" />
              <div className="h-24 w-20 rounded-2xl bg-stone-200/80 animate-pulse" />
              <div className="h-24 w-20 rounded-2xl bg-stone-200/80 animate-pulse" />
            </div>
          </div>

          {/* Action Card Skeleton */}
          <div className="lg:col-span-5 space-y-6">
            <div className="h-96 rounded-3xl bg-white border border-stone-100 p-6 space-y-4 animate-pulse">
              <div className="h-4 w-24 bg-stone-200 rounded-md" />
              <div className="h-8 w-3/4 bg-stone-200 rounded-md" />
              <div className="h-24 w-full bg-stone-100 rounded-2xl" />
              <div className="h-12 w-full bg-stone-200 rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
