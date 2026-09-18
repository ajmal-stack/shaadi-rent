import Link from "next/link";
import { ArrowLeft, ShieldCheck, Sparkles, type LucideIcon } from "lucide-react";

interface AdminSectionPlaceholderProps {
  title: string;
  subtitle: string;
  category: string;
  icon: LucideIcon;
  badgeText?: string;
  stats?: Array<{ label: string; value: string; helper: string }>;
}

export function AdminSectionPlaceholder({
  title,
  subtitle,
  category,
  icon: Icon,
  badgeText = "Feature Preview",
  stats = [
    { label: "Status", value: "Configured", helper: "Ready for operations" },
    { label: "Access Level", value: "Super Admin", helper: "Strict role enforcement" },
    { label: "Audit Logging", value: "Enabled", helper: "Changes tracked in DB" },
  ],
}: AdminSectionPlaceholderProps) {
  return (
    <div className="py-8 sm:py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 px-3 py-1 rounded-full border border-rose-200 dark:border-rose-800/60 mb-2">
              <Sparkles size={12} />
              <span>{category}</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-stone-900 dark:bg-stone-800 text-white shadow-sm inline-flex items-center justify-center">
                <Icon size={22} className="text-amber-400" />
              </span>
              <span>{title}</span>
            </h1>
            <p className="mt-1 text-sm text-stone-500 dark:text-stone-400 max-w-2xl">{subtitle}</p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 text-xs font-semibold text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 px-3.5 py-2.5 rounded-xl shadow-2xs transition-all hover:bg-stone-50 dark:hover:bg-stone-700"
            >
              <ArrowLeft size={14} />
              <span>Dashboard</span>
            </Link>

            <Link
              href="/admin/applications"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-800 to-rose-950 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-rose-950/20 hover:from-rose-900 hover:to-black transition-all"
            >
              <ShieldCheck size={15} className="text-rose-300" />
              <span>Applications Queue</span>
            </Link>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 shadow-2xs"
            >
              <span className="text-xs font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider">
                {stat.label}
              </span>
              <p className="font-display text-2xl font-bold text-stone-900 dark:text-stone-100 mt-1">
                {stat.value}
              </p>
              <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-1">{stat.helper}</p>
            </div>
          ))}
        </div>

        {/* Informational Hero Card */}
        <div className="rounded-3xl border border-dashed border-stone-300 dark:border-stone-700 bg-white/70 dark:bg-stone-900/60 p-8 text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-50 to-amber-50 dark:from-rose-950/40 dark:to-amber-950/40 text-rose-800 dark:text-rose-400 ring-1 ring-rose-200 dark:ring-rose-800/60 shadow-inner">
            <Icon size={28} />
          </div>

          <div className="max-w-md mx-auto space-y-1.5">
            <span className="inline-block rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-900 dark:text-amber-300 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 border border-amber-200 dark:border-amber-800/60">
              {badgeText}
            </span>
            <h3 className="font-display text-lg font-bold text-stone-900 dark:text-stone-100">
              {title} Module Connected
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
              This operational module is wired into the ShaadiRent administration
              system. Real-time data telemetry and administrative controls are
              being expanded.
            </p>
          </div>

          <div className="pt-2 flex justify-center items-center gap-3">
            <Link
              href="/admin/applications"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-800 dark:text-rose-400 hover:text-rose-950 dark:hover:text-rose-200 underline underline-offset-4"
            >
              Go to Owner Verification Queue →
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
