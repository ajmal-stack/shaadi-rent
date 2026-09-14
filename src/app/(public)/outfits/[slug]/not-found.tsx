import Link from "next/link";
import { Sparkles, ArrowLeft, Search } from "lucide-react";

export default function OutfitNotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 sm:py-24 bg-stone-50/50">
      <div className="max-w-md w-full text-center space-y-6 rounded-3xl border border-rose-100/80 bg-white p-8 sm:p-10 shadow-xl shadow-rose-950/5">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-100/70 text-rose-800">
          <Sparkles size={28} />
        </div>

        <div className="space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 block">
            404 &bull; Item Unavailable
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-stone-900">
            Outfit Not Found
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 leading-relaxed">
            The wedding outfit you are looking for may have been archived, unlisted, or reserved for exclusive boutique curation.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <Link
            href="/browse"
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-700 via-rose-800 to-stone-900 py-3 text-xs sm:text-sm font-semibold text-white shadow-md hover:from-rose-800 hover:to-black transition-all"
          >
            <Search size={15} />
            <span>Browse Outfits</span>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-5 py-3 text-xs sm:text-sm font-semibold text-stone-700 hover:bg-stone-50 transition-colors"
          >
            <ArrowLeft size={15} />
            <span>Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
