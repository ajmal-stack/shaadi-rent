export default function OwnerEarningsLoading() {
  return (
    <div className="min-h-screen bg-stone-50/50 py-8 sm:py-10 animate-pulse">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 space-y-6">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="h-8 w-64 bg-stone-200 rounded-xl" />
            <div className="h-4 w-96 bg-stone-100 rounded-md" />
          </div>
          <div className="h-9 w-40 bg-stone-200 rounded-full" />
        </div>

        {/* 4 Summary Stat Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-stone-200/80 bg-white p-5 space-y-3 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <div className="h-3.5 w-24 bg-stone-200 rounded" />
                <div className="h-9 w-9 bg-stone-100 rounded-xl" />
              </div>
              <div className="h-7 w-32 bg-stone-200 rounded-lg" />
              <div className="h-3 w-40 bg-stone-100 rounded" />
            </div>
          ))}
        </div>

        {/* Commission Policy Banner Skeleton */}
        <div className="h-24 rounded-2xl bg-amber-50/60 border border-amber-100" />

        {/* Search & Tabs Skeleton */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="h-10 w-80 bg-stone-200 rounded-xl" />
          <div className="h-10 w-96 bg-stone-100 rounded-xl" />
        </div>

        {/* Table Skeleton */}
        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-xs space-y-3">
          <div className="h-10 bg-stone-100 rounded-xl" />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-stone-50 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
