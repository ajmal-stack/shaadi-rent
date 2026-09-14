import { PackageOpen, type LucideIcon } from "lucide-react";

export function AdminEmptyState({
  icon: Icon = PackageOpen,
  title = "No records found",
  description = "Nothing to display yet.",
  action,
}: {
  icon?: LucideIcon;
  title?: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100 text-stone-400 mb-4 shadow-inner">
        <Icon size={26} />
      </div>
      <p className="text-sm font-semibold text-stone-700">{title}</p>
      <p className="text-xs text-stone-400 mt-1 max-w-xs leading-relaxed">
        {description}
      </p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
