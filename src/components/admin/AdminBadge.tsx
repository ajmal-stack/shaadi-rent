const VARIANT_STYLES: Record<string, string> = {
  // Generic
  default: "bg-stone-100 text-stone-700 border-stone-200",
  success: "bg-emerald-50 text-emerald-700 border-emerald-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  error: "bg-rose-50 text-rose-700 border-rose-200",
  info: "bg-sky-50 text-sky-700 border-sky-200",
  neutral: "bg-stone-100 text-stone-500 border-stone-200",

  // Roles
  admin: "bg-rose-50 text-rose-800 border-rose-200",
  owner: "bg-amber-50 text-amber-800 border-amber-200",
  customer: "bg-stone-50 text-stone-600 border-stone-200",

  // Booking statuses
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  confirmed: "bg-sky-50 text-sky-700 border-sky-200",
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  completed: "bg-stone-100 text-stone-600 border-stone-200",
  cancelled: "bg-rose-50 text-rose-700 border-rose-200",
  disputed: "bg-red-50 text-red-700 border-red-200",
  pickup_scheduled: "bg-indigo-50 text-indigo-700 border-indigo-200",
  out_for_delivery: "bg-violet-50 text-violet-700 border-violet-200",
  delivered: "bg-teal-50 text-teal-700 border-teal-200",
  return_scheduled: "bg-orange-50 text-orange-700 border-orange-200",
  returned: "bg-teal-50 text-teal-700 border-teal-200",
  inspection: "bg-purple-50 text-purple-700 border-purple-200",

  // Payment statuses
  paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
  successful: "bg-emerald-50 text-emerald-700 border-emerald-200",
  partially_refunded: "bg-orange-50 text-orange-700 border-orange-200",
  refunded: "bg-sky-50 text-sky-700 border-sky-200",
  failed: "bg-rose-50 text-rose-700 border-rose-200",
  created: "bg-stone-100 text-stone-500 border-stone-200",

  // Dispute statuses
  open: "bg-rose-50 text-rose-700 border-rose-200",
  under_review: "bg-amber-50 text-amber-700 border-amber-200",
  resolved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-stone-100 text-stone-500 border-stone-200",

  // Outfit statuses
  draft: "bg-stone-100 text-stone-500 border-stone-200",
  pending_review: "bg-amber-50 text-amber-700 border-amber-200",
  published: "bg-emerald-50 text-emerald-700 border-emerald-200",
  paused: "bg-orange-50 text-orange-700 border-orange-200",
  rented: "bg-indigo-50 text-indigo-700 border-indigo-200",
  archived: "bg-stone-100 text-stone-400 border-stone-200",

  // Verification / application statuses
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  verified: "bg-emerald-50 text-emerald-700 border-emerald-200",
  changes_requested: "bg-orange-50 text-orange-700 border-orange-200",

  // Condition statuses
  good: "bg-emerald-50 text-emerald-700 border-emerald-200",
  like_new: "bg-teal-50 text-teal-700 border-teal-200",
  excellent: "bg-emerald-50 text-emerald-700 border-emerald-200",
  minor_damage: "bg-amber-50 text-amber-700 border-amber-200",
  major_damage: "bg-rose-50 text-rose-700 border-rose-200",
  missing_item: "bg-red-50 text-red-700 border-red-200",

  // Boolean-like
  true: "bg-emerald-50 text-emerald-700 border-emerald-200",
  false: "bg-stone-100 text-stone-500 border-stone-200",
  active_bool: "bg-emerald-50 text-emerald-700 border-emerald-200",
  inactive_bool: "bg-stone-100 text-stone-500 border-stone-200",
};

function formatLabel(value: string): string {
  return value
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function AdminBadge({
  status,
  label,
  size = "sm",
}: {
  status: string;
  label?: string;
  size?: "xs" | "sm";
}) {
  const style = VARIANT_STYLES[status] ?? VARIANT_STYLES.default;
  const sizeClass =
    size === "xs"
      ? "px-2 py-0 text-[10px]"
      : "px-2.5 py-0.5 text-[11px]";

  return (
    <span
      className={`inline-flex items-center rounded-full border font-semibold whitespace-nowrap ${style} ${sizeClass}`}
    >
      {label ?? formatLabel(status)}
    </span>
  );
}
