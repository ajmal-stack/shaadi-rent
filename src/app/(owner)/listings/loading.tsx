export default function LoadingListings() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50/30 via-amber-50/10 to-white pb-24">
      {/* Sticky header skeleton */}
      <div className="border-b border-rose-100/70 bg-white/95 sticky top-0 z-10 shadow-xs">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-stone-200 animate-pulse" />
            <div className="space-y-1.5">
              <div className="h-4 w-28 rounded-md bg-stone-200 animate-pulse" />
              <div className="h-3 w-16 rounded-md bg-stone-100 animate-pulse" />
            </div>
          </div>
          <div className="h-9 w-32 rounded-xl bg-stone-200 animate-pulse" />
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-8 space-y-8">
        {/* Summary pills skeleton */}
        <div className="flex flex-wrap gap-2">
          {[80, 90, 70, 80, 65, 80].map((w, i) => (
            <div
              key={i}
              className="h-7 rounded-full bg-stone-100 animate-pulse"
              style={{ width: `${w}px` }}
            />
          ))}
        </div>

        {/* Cards grid skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-stone-100 bg-white shadow-sm overflow-hidden"
            >
              {/* Image skeleton */}
              <div className="aspect-[4/3] bg-stone-100 animate-pulse" />
              {/* Content skeleton */}
              <div className="p-4 space-y-3">
                <div className="h-3 w-20 rounded bg-amber-100 animate-pulse" />
                <div className="h-4 w-4/5 rounded bg-stone-200 animate-pulse" />
                <div className="h-4 w-2/5 rounded bg-stone-200 animate-pulse" />
                <div className="flex justify-between">
                  <div className="h-3 w-24 rounded bg-stone-100 animate-pulse" />
                  <div className="h-3 w-16 rounded bg-stone-100 animate-pulse" />
                </div>
                <div className="pt-2 border-t border-stone-100">
                  <div className="h-9 w-full rounded-lg bg-stone-100 animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
