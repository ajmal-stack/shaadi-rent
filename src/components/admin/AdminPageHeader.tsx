import Link from "next/link";
import { ChevronRight, type LucideIcon } from "lucide-react";

interface Crumb {
  label: string;
  href?: string;
}

interface AdminPageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  breadcrumb?: Crumb[];
  actions?: React.ReactNode;
  metaLine?: React.ReactNode;
}

export function AdminPageHeader({
  title,
  subtitle,
  icon: Icon,
  breadcrumb = [],
  actions,
  metaLine,
}: AdminPageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
      <div className="space-y-1 min-w-0">
        {/* Breadcrumb */}
        {breadcrumb.length > 0 && (
          <nav className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400 flex-wrap mb-0.5">
            <Link
              href="/admin"
              className="hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
            >
              Admin Console
            </Link>
            {breadcrumb.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1.5">
                <ChevronRight size={12} className="shrink-0 text-stone-400 dark:text-stone-600" />
                {crumb.href ? (
                  <Link
                    href={crumb.href}
                    className="hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-stone-900 dark:text-stone-200 font-medium">
                    {crumb.label}
                  </span>
                )}
              </span>
            ))}
          </nav>
        )}

        {/* Title */}
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2.5 leading-tight">
          {Icon && (
            <Icon size={26} className="text-rose-800 dark:text-rose-400 shrink-0" />
          )}
          {title}
        </h1>

        {subtitle && (
          <p className="text-sm text-stone-500 dark:text-stone-400 max-w-xl leading-relaxed">
            {subtitle}
          </p>
        )}

        {metaLine && (
          <div className="flex items-center gap-3 flex-wrap pt-0.5">
            {metaLine}
          </div>
        )}
      </div>

      {/* Right-side actions */}
      {actions && (
        <div className="shrink-0 flex items-center gap-2 flex-wrap">
          {actions}
        </div>
      )}
    </div>

  );
}
