"use client";

import Link from "next/link";
import Image from "next/image";
import { Trophy, TrendingUp, CalendarCheck, Sparkles, ArrowUpRight } from "lucide-react";

export interface TopOutfitItem {
  id: string;
  title: string;
  slug: string;
  brand?: string | null;
  category_name?: string | null;
  image_url: string;
  bookings_count: number;
  total_revenue: number;
}

interface TopOutfitsWidgetProps {
  outfits: TopOutfitItem[];
  rangeLabel?: string;
}

function formatINR(v: number): string {
  return "₹" + v.toLocaleString("en-IN");
}

const RANK_STYLES: Record<
  number,
  { badgeBg: string; textColor: string; borderColor: string; label: string }
> = {
  1: {
    badgeBg: "bg-gradient-to-br from-amber-400 to-amber-600 shadow-amber-500/20",
    textColor: "text-white",
    borderColor: "border-amber-300 dark:border-amber-500/40",
    label: "🥇 #1",
  },
  2: {
    badgeBg: "bg-gradient-to-br from-stone-300 to-stone-500 shadow-stone-500/20",
    textColor: "text-white",
    borderColor: "border-stone-300 dark:border-stone-600",
    label: "🥈 #2",
  },
  3: {
    badgeBg: "bg-gradient-to-br from-amber-700 to-amber-900 shadow-amber-900/20",
    textColor: "text-white",
    borderColor: "border-amber-700/60 dark:border-amber-800",
    label: "🥉 #3",
  },
};

export function TopOutfitsWidget({
  outfits,
  rangeLabel = "Selected Period",
}: TopOutfitsWidgetProps) {
  return (
    <div className="rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 shadow-sm flex flex-col justify-between space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-stone-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-200/80 dark:border-amber-800/60 flex items-center justify-center text-amber-700 dark:text-amber-400 shadow-xs">
              <Trophy size={15} />
            </div>
            <h2 className="font-display text-base font-bold text-stone-900 dark:text-stone-100">
              Top Performing Outfits
            </h2>
          </div>
          <p className="text-xs text-stone-400 dark:text-stone-500">
            Highest rental demand & revenue · {rangeLabel}
          </p>
        </div>

        <Link
          href="/browse"
          className="text-xs font-semibold text-rose-800 dark:text-rose-400 hover:text-rose-950 dark:hover:text-rose-300 inline-flex items-center gap-1"
        >
          <span>Catalog</span>
          <ArrowUpRight size={13} />
        </Link>
      </div>

      {/* Outfits Leaderboard List */}
      {!outfits || outfits.length === 0 ? (
        <div className="py-10 text-center space-y-2">
          <Sparkles size={24} className="mx-auto text-stone-300 dark:text-stone-600" />
          <p className="text-xs font-medium text-stone-500 dark:text-stone-400">
            No booking activity recorded for this period yet.
          </p>
          <p className="text-[11px] text-stone-400 dark:text-stone-500">
            Rankings update automatically as renters complete orders.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-stone-100 dark:divide-stone-800/80">
          {outfits.map((item, idx) => {
            const rank = idx + 1;
            const rankStyle = RANK_STYLES[rank] ?? {
              badgeBg: "bg-stone-100 dark:bg-stone-800",
              textColor: "text-stone-600 dark:text-stone-400",
              borderColor: "border-stone-200 dark:border-stone-700",
              label: `#${rank}`,
            };

            return (
              <Link
                key={item.id}
                href={`/outfits/${item.slug}`}
                target="_blank"
                className="group py-3.5 flex items-center justify-between gap-3 hover:bg-stone-50/60 dark:hover:bg-stone-800/30 px-2.5 -mx-2.5 rounded-2xl transition-all"
              >
                {/* Left: Rank + Image + Title */}
                <div className="flex items-center gap-3 min-w-0">
                  {/* Rank Badge */}
                  <span
                    className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-[11px] font-bold shadow-xs border ${rankStyle.badgeBg} ${rankStyle.textColor} ${rankStyle.borderColor}`}
                  >
                    {rank <= 3 ? rankStyle.label.split(" ")[0] : rankStyle.label}
                  </span>

                  {/* Thumbnail */}
                  <div className="relative w-12 h-14 rounded-xl overflow-hidden bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700/60 shrink-0">
                    <Image
                      src={item.image_url}
                      alt={item.title}
                      fill
                      sizes="48px"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  {/* Title & Metadata */}
                  <div className="min-w-0 space-y-1">
                    <p className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate group-hover:text-rose-800 dark:group-hover:text-rose-400 transition-colors">
                      {item.title}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-stone-400 dark:text-stone-500">
                      {item.brand && <span className="font-medium text-stone-600 dark:text-stone-400">{item.brand}</span>}
                      {item.brand && item.category_name && <span>·</span>}
                      {item.category_name && <span>{item.category_name}</span>}
                    </div>
                  </div>
                </div>

                {/* Right: Bookings Count & Revenue */}
                <div className="flex flex-col items-end shrink-0 space-y-1 text-right">
                  <div className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800/50">
                    <TrendingUp size={12} />
                    <span>{formatINR(item.total_revenue)}</span>
                  </div>

                  <div className="inline-flex items-center gap-1 text-[10px] font-medium text-stone-500 dark:text-stone-400">
                    <CalendarCheck size={11} />
                    <span>
                      {item.bookings_count} {item.bookings_count === 1 ? "booking" : "bookings"}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
