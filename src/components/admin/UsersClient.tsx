"use client";

import {
  useState,
  useMemo,
  useTransition,
  useRef,
  useEffect,
} from "react";
import {
  Users,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  UserCog,
  Search,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  X,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  RotateCcw,
  User,
  Store,
  ShieldAlert,
  Copy,
  ExternalLink,
  Calendar,
  Clock,
  Filter,
  ChevronLeft,
  ChevronRight,
  Loader2,
  BadgeCheck,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import {
  updateUserRole,
  updateUserVerification,
} from "@/app/(admin)/admin/users/actions";
import type { Profile, UserRole } from "@/types/database";

/* ── Constants ──────────────────────────────────────────────── */
const PAGE_SIZE = 10;

type RoleFilter = "all" | "customer" | "owner" | "admin";
type SortKey = "full_name" | "email" | "role" | "created_at" | "verification_status";
type SortDir = "asc" | "desc";

/* ── Utilities ───────────────────────────────────────────────── */
function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatRelative(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

function getInitials(name: string | null) {
  if (!name) return "?";
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

function copyToClipboard(text: string, label: string) {
  navigator.clipboard.writeText(text).then(() => toast.success(`${label} copied`));
}

/* ── Sub-components ──────────────────────────────────────────── */

// ── Avatar ──
function Avatar({ name, role, size = "md" }: { name: string | null; role: UserRole; size?: "sm" | "md" | "lg" }) {
  const colorMap: Record<UserRole, string> = {
    admin: "bg-gradient-to-br from-rose-500 to-rose-700 text-white",
    owner: "bg-gradient-to-br from-amber-400 to-amber-600 text-white",
    customer: "bg-gradient-to-br from-stone-400 to-stone-600 text-white",
  };
  const sizeMap = { sm: "h-8 w-8 text-[11px]", md: "h-10 w-10 text-xs", lg: "h-14 w-14 text-base" };
  return (
    <div className={`${sizeMap[size]} rounded-full flex items-center justify-center font-bold shrink-0 shadow-sm ${colorMap[role] ?? colorMap.customer}`}>
      {getInitials(name)}
    </div>
  );
}

// ── Role Badge ──
function RoleBadge({ role }: { role: UserRole }) {
  const map: Record<UserRole, { label: string; cls: string; Icon: typeof ShieldCheck }> = {
    admin: { label: "Admin", cls: "bg-rose-50 text-rose-800 ring-1 ring-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:ring-rose-800/60", Icon: ShieldAlert },
    owner: { label: "Owner", cls: "bg-amber-50 text-amber-800 ring-1 ring-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:ring-amber-800/60", Icon: Store },
    customer: { label: "Customer", cls: "bg-stone-50 text-stone-700 ring-1 ring-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:ring-stone-700", Icon: User },
  };
  const { label, cls, Icon } = map[role] ?? map.customer;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${cls}`}>
      <Icon size={10} />
      {label}
    </span>
  );
}

// ── Verification Badge ──
function VerifBadge({ status }: { status: string | null }) {
  const map: Record<string, { label: string; cls: string; Icon: typeof CheckCircle2 }> = {
    verified: { label: "Verified", cls: "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:ring-emerald-800/60", Icon: BadgeCheck },
    pending: { label: "Pending", cls: "bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:ring-amber-800/60", Icon: Clock },
    rejected: { label: "Rejected", cls: "bg-rose-50 text-rose-800 ring-1 ring-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:ring-rose-800/60", Icon: XCircle },
  };
  const s = status ?? "pending";
  const { label, cls, Icon } = map[s] ?? map.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${cls}`}>
      <Icon size={10} />
      {label}
    </span>
  );
}

// ── Column Sort Header ──
function SortTh({
  col, label, current, dir, onSort,
}: {
  col: SortKey; label: string; current: SortKey; dir: SortDir; onSort: (c: SortKey) => void;
}) {
  const active = current === col;
  return (
    <th
      className="px-4 py-3 text-left text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide cursor-pointer select-none hover:text-stone-900 dark:hover:text-stone-200 group"
      onClick={() => onSort(col)}
    >
      <div className="flex items-center gap-1">
        {label}
        <span className={`transition-colors ${active ? "text-rose-600 dark:text-rose-400" : "text-stone-300 dark:text-stone-600 group-hover:text-stone-400 dark:group-hover:text-stone-500"}`}>
          {active ? (dir === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />) : <ChevronsUpDown size={12} />}
        </span>
      </div>
    </th>
  );
}

// ── Action Dropdown ──
function ActionMenu({
  user,
  onRoleChange,
  onVerifChange,
  isPending,
}: {
  user: Profile;
  onRoleChange: (userId: string, role: "customer" | "owner") => void;
  onVerifChange: (userId: string, status: "pending" | "verified" | "rejected") => void;
  isPending: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        disabled={isPending}
        className="flex items-center justify-center h-8 w-8 rounded-lg text-stone-400 hover:text-stone-800 hover:bg-stone-100 dark:text-stone-500 dark:hover:text-stone-200 dark:hover:bg-stone-800 transition-colors disabled:opacity-40"
        aria-label="Row actions"
      >
        {isPending ? <Loader2 size={15} className="animate-spin" /> : <MoreHorizontal size={15} />}
      </button>

      {open && (
        <div className="absolute right-0 top-9 z-50 w-52 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-xl shadow-stone-200/60 dark:shadow-stone-950/60 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          {/* View drawer trigger */}
          <button
            type="button"
            onClick={() => { setOpen(false); }}
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
          >
            <Eye size={13} className="text-stone-400 dark:text-stone-500" />
            View Profile
          </button>

          {user.role !== "admin" && (
            <>
              <div className="border-t border-stone-100 dark:border-stone-800 mx-3" />
              <p className="px-4 pt-2 pb-1 text-[10px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider">Change Role</p>
              {user.role !== "owner" && (
                <button
                  type="button"
                  onClick={() => { onRoleChange(user.id, "owner"); setOpen(false); }}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
                >
                  <Store size={13} />
                  Promote to Owner
                </button>
              )}
              {user.role !== "customer" && (
                <button
                  type="button"
                  onClick={() => { onRoleChange(user.id, "customer"); setOpen(false); }}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
                >
                  <User size={13} />
                  Demote to Customer
                </button>
              )}

              <div className="border-t border-stone-100 dark:border-stone-800 mx-3" />
              <p className="px-4 pt-2 pb-1 text-[10px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider">Verification</p>
              {user.verification_status !== "verified" && (
                <button
                  type="button"
                  onClick={() => { onVerifChange(user.id, "verified"); setOpen(false); }}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                >
                  <CheckCircle2 size={13} />
                  Mark Verified
                </button>
              )}
              {user.verification_status !== "rejected" && (
                <button
                  type="button"
                  onClick={() => { onVerifChange(user.id, "rejected"); setOpen(false); }}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                >
                  <XCircle size={13} />
                  Reject KYC
                </button>
              )}
              {user.verification_status !== "pending" && (
                <button
                  type="button"
                  onClick={() => { onVerifChange(user.id, "pending"); setOpen(false); }}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
                >
                  <RotateCcw size={13} />
                  Reset to Pending
                </button>
              )}
            </>
          )}

          <div className="border-t border-stone-100 dark:border-stone-800 mx-3" />
          <button
            type="button"
            onClick={() => { copyToClipboard(user.id, "User ID"); setOpen(false); }}
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors mb-1"
          >
            <Copy size={13} />
            Copy User ID
          </button>
        </div>
      )}
    </div>
  );
}

// ── Detail Drawer ──
function UserDrawer({
  user,
  onClose,
  onRoleChange,
  onVerifChange,
  isPending,
}: {
  user: Profile;
  onClose: () => void;
  onRoleChange: (userId: string, role: "customer" | "owner") => void;
  onVerifChange: (userId: string, status: "pending" | "verified" | "rejected") => void;
  isPending: boolean;
}) {
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-stone-950/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />
      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-white dark:bg-stone-900 border-l border-stone-200 dark:border-stone-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-250 ease-out">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 dark:border-stone-800">
          <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">User Profile</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-stone-400 hover:text-stone-900 hover:bg-stone-100 dark:text-stone-500 dark:hover:text-stone-200 dark:hover:bg-stone-800 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Identity */}
          <div className="flex flex-col items-center text-center gap-3 pb-5 border-b border-stone-100 dark:border-stone-800">
            <Avatar name={user.full_name} role={user.role} size="lg" />
            <div>
              <h3 className="text-base font-bold text-stone-950 dark:text-stone-100">{user.full_name ?? "—"}</h3>
              <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">ID: <span className="font-mono">{user.id.slice(0, 8)}…</span></p>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <RoleBadge role={user.role} />
              {user.role !== "admin" && <VerifBadge status={user.verification_status} />}
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 dark:text-stone-500">Contact</p>
            {user.email && (
              <div className="flex items-center gap-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-100 dark:border-stone-800 px-3.5 py-3">
                <Mail size={14} className="text-stone-400 dark:text-stone-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-stone-400 dark:text-stone-500 font-semibold">Email</p>
                  <p className="text-xs text-stone-800 dark:text-stone-200 truncate">{user.email}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => copyToClipboard(user.email!, "Email")} className="p-1 rounded text-stone-300 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300"><Copy size={12} /></button>
                  <a href={`mailto:${user.email}`} className="p-1 rounded text-stone-300 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300"><ExternalLink size={12} /></a>
                </div>
              </div>
            )}
            {user.phone && (
              <div className="flex items-center gap-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-100 dark:border-stone-800 px-3.5 py-3">
                <Phone size={14} className="text-stone-400 dark:text-stone-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-stone-400 dark:text-stone-500 font-semibold">Phone</p>
                  <p className="text-xs text-stone-800 dark:text-stone-200">{user.phone}</p>
                </div>
                <button type="button" onClick={() => copyToClipboard(user.phone!, "Phone")} className="p-1 rounded text-stone-300 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300"><Copy size={12} /></button>
              </div>
            )}
          </div>

          {/* Location */}
          {(user.city || user.state) && (
            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 dark:text-stone-500">Location</p>
              <div className="flex items-center gap-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-100 dark:border-stone-800 px-3.5 py-3">
                <MapPin size={14} className="text-stone-400 dark:text-stone-500 shrink-0" />
                <p className="text-xs text-stone-800 dark:text-stone-200">
                  {[user.city, user.district, user.state].filter(Boolean).join(", ")}
                </p>
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 dark:text-stone-500">Timeline</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-100 dark:border-stone-800 px-3.5 py-3">
                <div className="flex items-center gap-1.5 text-stone-400 dark:text-stone-500 mb-1"><Calendar size={11} /><p className="text-[10px] font-semibold">Joined</p></div>
                <p className="text-xs text-stone-800 dark:text-stone-200 font-semibold">{formatDate(user.created_at)}</p>
                <p className="text-[10px] text-stone-400 dark:text-stone-500">{formatRelative(user.created_at)}</p>
              </div>
              <div className="rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-100 dark:border-stone-800 px-3.5 py-3">
                <div className="flex items-center gap-1.5 text-stone-400 dark:text-stone-500 mb-1"><Clock size={11} /><p className="text-[10px] font-semibold">Updated</p></div>
                <p className="text-xs text-stone-800 dark:text-stone-200 font-semibold">{formatDate(user.updated_at)}</p>
                <p className="text-[10px] text-stone-400 dark:text-stone-500">{formatRelative(user.updated_at)}</p>
              </div>
            </div>
          </div>

          {/* Full User ID */}
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 dark:text-stone-500">User ID</p>
            <div className="flex items-center gap-2 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-100 dark:border-stone-800 px-3.5 py-3">
              <p className="text-[10px] font-mono text-stone-600 dark:text-stone-400 flex-1 break-all">{user.id}</p>
              <button type="button" onClick={() => copyToClipboard(user.id, "User ID")} className="shrink-0 p-1 rounded text-stone-300 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300"><Copy size={12} /></button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        {user.role !== "admin" && (
          <div className="shrink-0 border-t border-stone-100 dark:border-stone-800 px-6 py-4 space-y-2.5 bg-stone-50/60 dark:bg-stone-900/90">
            <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-2">Quick Actions</p>

            {/* Role toggle */}
            <button
              type="button"
              disabled={isPending}
              onClick={() => onRoleChange(user.id, user.role === "owner" ? "customer" : "owner")}
              className="flex w-full items-center gap-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 px-4 py-2.5 text-xs font-semibold text-stone-700 dark:text-stone-200 hover:border-amber-300 dark:hover:border-amber-600/50 hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-amber-800 dark:hover:text-amber-300 transition-all shadow-2xs disabled:opacity-50"
            >
              <UserCog size={14} />
              {user.role === "owner" ? "Demote to Customer" : "Promote to Owner"}
            </button>

            {/* Verification actions */}
            <div className="flex gap-2">
              {user.verification_status !== "verified" && (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => onVerifChange(user.id, "verified")}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors shadow-xs disabled:opacity-50"
                >
                  <CheckCircle2 size={13} />
                  Verify
                </button>
              )}
              {user.verification_status !== "rejected" && (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => onVerifChange(user.id, "rejected")}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 px-3 py-2.5 text-xs font-semibold text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors shadow-xs disabled:opacity-50"
                >
                  <XCircle size={13} />
                  Reject
                </button>
              )}
              {user.verification_status !== "pending" && (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => onVerifChange(user.id, "pending")}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 px-3 py-2.5 text-xs font-semibold text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors shadow-xs disabled:opacity-50"
                >
                  <RotateCcw size={13} />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

/* ── Stats Bar ───────────────────────────────────────────────── */
function StatsBar({ users }: { users: Profile[] }) {
  const stats = [
    { label: "Total Users", value: users.length, color: "text-stone-900 dark:text-stone-100", bg: "bg-stone-50 border-stone-200 dark:bg-stone-900 dark:border-stone-800" },
    { label: "Customers", value: users.filter((u) => u.role === "customer").length, color: "text-stone-700 dark:text-stone-200", bg: "bg-stone-50 border-stone-200 dark:bg-stone-900 dark:border-stone-800" },
    { label: "Owners", value: users.filter((u) => u.role === "owner").length, color: "text-amber-700 dark:text-amber-400", bg: "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900/50" },
    { label: "Verified", value: users.filter((u) => u.verification_status === "verified").length, color: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900/50" },
    { label: "Pending KYC", value: users.filter((u) => u.verification_status === "pending" && u.role !== "admin").length, color: "text-amber-700 dark:text-amber-400", bg: "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900/50" },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
      {stats.map((s) => (
        <div key={s.label} className={`rounded-2xl border px-4 py-3.5 ${s.bg}`}>
          <p className={`text-xl font-bold leading-none ${s.color}`}>{s.value}</p>
          <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">{s.label}</p>
        </div>
      ))}
    </div>
  );
}

/* ── Main Component ──────────────────────────────────────────── */
export function UsersClient({ initialUsers }: { initialUsers: Profile[] }) {
  const [users, setUsers] = useState<Profile[]>(initialUsers);
  const [filter, setFilter] = useState<RoleFilter>("all");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);
  const [drawerUser, setDrawerUser] = useState<Profile | null>(null);
  const [isPending, startTransition] = useTransition();

  const roleTabs: { value: RoleFilter; label: string; count: number }[] = [
    { value: "all", label: "All", count: users.length },
    { value: "customer", label: "Customers", count: users.filter((u) => u.role === "customer").length },
    { value: "owner", label: "Owners", count: users.filter((u) => u.role === "owner").length },
    { value: "admin", label: "Admins", count: users.filter((u) => u.role === "admin").length },
  ];

  /* ── Sort ── */
  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
    setPage(1);
  }

  /* ── Filter + Sort + Paginate ── */
  const processed = useMemo(() => {
    let list = [...users];
    if (filter !== "all") list = list.filter((u) => u.role === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (u) =>
          u.full_name?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q) ||
          u.phone?.includes(q) ||
          u.city?.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      const av = (a[sortKey] ?? "") as string;
      const bv = (b[sortKey] ?? "") as string;
      return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    });
    return list;
  }, [users, filter, search, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(processed.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = processed.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  /* ── Actions ── */
  function handleRoleChange(userId: string, newRole: "customer" | "owner") {
    startTransition(async () => {
      const res = await updateUserRole(userId, newRole);
      if (res.success) {
        setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
        if (drawerUser?.id === userId) setDrawerUser((p) => p ? { ...p, role: newRole } : p);
        toast.success(`Role updated to ${newRole}.`);
      } else toast.error(res.error ?? "Failed to update role.");
    });
  }

  function handleVerifChange(userId: string, status: "pending" | "verified" | "rejected") {
    startTransition(async () => {
      const res = await updateUserVerification(userId, status);
      if (res.success) {
        setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, verification_status: status } : u)));
        if (drawerUser?.id === userId) setDrawerUser((p) => p ? { ...p, verification_status: status } : p);
        toast.success(`Verification set to ${status}.`);
      } else toast.error(res.error ?? "Failed to update verification.");
    });
  }

  return (
    <div className="space-y-5">
      {/* Stats */}
      <StatsBar users={users} />

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Role tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 w-fit">
          {roleTabs.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => { setFilter(t.value); setPage(1); }}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                filter === t.value
                  ? "bg-white dark:bg-stone-800 shadow-xs ring-1 ring-stone-200 dark:ring-stone-700 text-stone-900 dark:text-stone-100"
                  : "text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200"
              }`}
            >
              <Filter size={11} />
              {t.label}
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${filter === t.value ? "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300" : "bg-stone-200 dark:bg-stone-800 text-stone-500 dark:text-stone-400"}`}>
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative sm:ml-auto sm:w-72">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name, email, phone, city…"
            className="w-full rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 pl-8 pr-8 py-2 text-xs text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500/60 shadow-2xs"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-300 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden shadow-xs">
        {processed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100 dark:bg-stone-800 mb-3">
              <Users size={24} className="text-stone-400" />
            </div>
            <p className="text-sm font-semibold text-stone-700 dark:text-stone-300">No users found</p>
            <p className="text-xs text-stone-400 mt-1">Try adjusting your search or filter criteria.</p>
            {(search || filter !== "all") && (
              <button
                type="button"
                onClick={() => { setSearch(""); setFilter("all"); }}
                className="mt-3 text-xs text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 font-semibold"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-stone-100 dark:border-stone-800 bg-stone-50/80 dark:bg-stone-900/90">
                  <SortTh col="full_name" label="User" current={sortKey} dir={sortDir} onSort={handleSort} />
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide hidden sm:table-cell">Contact</th>
                  <SortTh col="role" label="Role" current={sortKey} dir={sortDir} onSort={handleSort} />
                  <SortTh col="verification_status" label="KYC" current={sortKey} dir={sortDir} onSort={handleSort} />
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide hidden md:table-cell">Location</th>
                  <SortTh col="created_at" label="Joined" current={sortKey} dir={sortDir} onSort={handleSort} />
                  <th className="px-4 py-3 w-12" />
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {pageRows.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-stone-50/70 dark:hover:bg-stone-800/50 transition-colors group"
                  >
                    {/* User cell */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <button type="button" onClick={() => setDrawerUser(user)}>
                          <Avatar name={user.full_name} role={user.role} size="sm" />
                        </button>
                        <div>
                          <button
                            type="button"
                            onClick={() => setDrawerUser(user)}
                            className="text-sm font-semibold text-stone-900 dark:text-stone-100 hover:text-rose-700 dark:hover:text-rose-400 transition-colors leading-none text-left"
                          >
                            {user.full_name ?? "—"}
                          </button>
                          <p className="text-[10px] text-stone-400 mt-0.5 font-mono">{user.id.slice(0, 8)}…</p>
                        </div>
                      </div>
                    </td>
                    {/* Contact */}
                    <td className="px-4 py-3.5 hidden sm:table-cell">
                      <div className="space-y-1">
                        {user.email && (
                          <div className="flex items-center gap-1.5 text-xs text-stone-600 dark:text-stone-300">
                            <Mail size={11} className="text-stone-400 dark:text-stone-500 shrink-0" />
                            <span className="truncate max-w-[160px]">{user.email}</span>
                          </div>
                        )}
                        {user.phone && (
                          <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400">
                            <Phone size={11} className="text-stone-400 dark:text-stone-500 shrink-0" />
                            {user.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    {/* Role */}
                    <td className="px-4 py-3.5">
                      <RoleBadge role={user.role} />
                    </td>
                    {/* KYC */}
                    <td className="px-4 py-3.5">
                      {user.role !== "admin" ? (
                        <VerifBadge status={user.verification_status} />
                      ) : (
                        <span className="text-xs text-stone-300 dark:text-stone-600">—</span>
                      )}
                    </td>
                    {/* Location */}
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      {user.city || user.state ? (
                        <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400">
                          <MapPin size={11} className="text-stone-400 dark:text-stone-500 shrink-0" />
                          {[user.city, user.state].filter(Boolean).join(", ")}
                        </div>
                      ) : (
                        <span className="text-xs text-stone-300 dark:text-stone-600">—</span>
                      )}
                    </td>
                    {/* Joined */}
                    <td className="px-4 py-3.5">
                      <div>
                        <p className="text-xs text-stone-700 dark:text-stone-300 font-medium">{formatRelative(user.created_at)}</p>
                        <p className="text-[10px] text-stone-400 dark:text-stone-500">{formatDate(user.created_at)}</p>
                      </div>
                    </td>
                    {/* Actions */}
                    <td className="px-3 py-3.5">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setDrawerUser(user)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-300 dark:text-stone-600 hover:text-stone-700 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors opacity-0 group-hover:opacity-100"
                          aria-label="View user"
                        >
                          <Eye size={14} />
                        </button>
                        <ActionMenu
                          user={user}
                          onRoleChange={handleRoleChange}
                          onVerifChange={handleVerifChange}
                          isPending={isPending}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination footer */}
        {processed.length > 0 && (
          <div className="flex items-center justify-between border-t border-stone-100 dark:border-stone-800 px-4 py-3 bg-stone-50/60 dark:bg-stone-900/60">
            <p className="text-xs text-stone-400 dark:text-stone-500">
              Showing{" "}
              <strong className="text-stone-700 dark:text-stone-300">
                {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, processed.length)}
              </strong>{" "}
              of <strong className="text-stone-700 dark:text-stone-300">{processed.length}</strong> users
            </p>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setPage((p) => p - 1)}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-800 text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 hover:border-stone-300 dark:hover:border-stone-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-xs shadow-2xs"
              >
                <ChevronLeft size={13} />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let p = i + 1;
                if (totalPages > 5) {
                  if (currentPage <= 3) p = i + 1;
                  else if (currentPage >= totalPages - 2) p = totalPages - 4 + i;
                  else p = currentPage - 2 + i;
                }
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPage(p)}
                    className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-semibold transition-colors ${
                      p === currentPage
                        ? "bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-xs"
                        : "border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:border-stone-300 dark:hover:border-stone-700 hover:text-stone-900 dark:hover:text-stone-200 shadow-2xs"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-800 text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 hover:border-stone-300 dark:hover:border-stone-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-xs shadow-2xs"
              >
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Drawer */}
      {drawerUser && (
        <UserDrawer
          user={drawerUser}
          onClose={() => setDrawerUser(null)}
          onRoleChange={handleRoleChange}
          onVerifChange={handleVerifChange}
          isPending={isPending}
        />
      )}
    </div>
  );
}
