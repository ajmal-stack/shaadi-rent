export default function Loading() {
  return (
    <div className="min-h-screen bg-stone-50/50 flex items-center justify-center">
      <div className="w-full max-w-sm space-y-4 px-4 text-center">
        <div className="h-16 w-16 rounded-full bg-stone-200 animate-pulse mx-auto" />
        <div className="h-6 w-48 bg-stone-200 rounded-lg animate-pulse mx-auto" />
        <div className="h-4 w-64 bg-stone-100 rounded animate-pulse mx-auto" />
        <div className="h-32 w-full bg-white rounded-2xl border border-stone-100 animate-pulse" />
      </div>
    </div>
  );
}
