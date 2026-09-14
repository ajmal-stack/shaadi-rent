"use client";

import { useState, useMemo, useCallback, useTransition } from "react";
import {
  Users,
  Mail,
  Phone,
  MapPin,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  UserCog,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { AdminSearch } from "./AdminSearch";
import { AdminFilterTabs } from "./AdminFilterTabs";
import { AdminBadge } from "./AdminBadge";
import { AdminEmptyState } from "./AdminEmptyState";
import { updateUserRole } from "@/app/(admin)/admin/users/actions";
import type { Profile, UserRole } from "@/types/database";

interface UsersClientProps {
  initialUsers: Profile[];
}

type RoleFilter = "all" | "customer" | "owner" | "admin";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
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

function AvatarChip({ name, role }: { name: string | null; role: UserRole }) {
  const colorMap: Record<UserRole, string> = {
    admin: "bg-rose-100 text-rose-800",
    owner: "bg-amber-100 text-amber-800",
    customer: "bg-stone-100 text-stone-700",
  };
  return (
    <div
      className={`h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${colorMap[role] ?? colorMap.customer}`}
    >
      {getInitials(name)}
    </div>
  );
}

// ---- Inline Toast ----
type ToastState = { type: "success" | "error"; message: string } | null;
function AdminToast({ toast }: { toast: ToastState }) {
  if (!toast) return null;
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-2xl px-4 py-3 text-sm font-medium shadow-2xl border pointer-events-none animate-in slide-in-from-bottom-4 duration-300 ${
        toast.type === "success"
          ? "bg-stone-900 border-stone-700 text-white"
          : "bg-rose-900 border-rose-700 text-white"
      }`}
    >
      {toast.type === "success" ? (
        <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
      ) : (
        <AlertCircle size={15} className="text-rose-300 shrink-0" />
      )}
      {toast.message}
    </div>
  );
}

export function UsersClient({ initialUsers }: UsersClientProps) {
  const [users, setUsers] = useState<Profile[]>(initialUsers);
  const [filter, setFilter] = useState<RoleFilter>("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmRoleChange, setConfirmRoleChange] = useState<{
    userId: string;
    newRole: "customer" | "owner";
  } | null>(null);
  const [toast, setToast] = useState<ToastState>(null);
  const [isPending, startTransition] = useTransition();

  const showToast = useCallback((type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const counts = useMemo(
    () => ({
      all: users.length,
      customer: users.filter((u) => u.role === "customer").length,
      owner: users.filter((u) => u.role === "owner").length,
      admin: users.filter((u) => u.role === "admin").length,
    }),
    [users]
  );

  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (filter !== "all" && u.role !== filter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          u.full_name?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q) ||
          u.phone?.includes(q)
        );
      }
      return true;
    });
  }, [users, filter, search]);

  async function handleRoleChange(userId: string, newRole: "customer" | "owner") {
    startTransition(async () => {
      const result = await updateUserRole(userId, newRole);
      if (result.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
        );
        showToast("success", `Role updated to ${newRole} successfully.`);
      } else {
        showToast("error", result.error ?? "Failed to update role.");
      }
      setConfirmRoleChange(null);
    });
  }

  const tabs = [
    { value: "all", label: "All Users", count: counts.all },
    { value: "customer", label: "Customers", count: counts.customer },
    { value: "owner", label: "Owners", count: counts.owner },
    { value: "admin", label: "Admins", count: counts.admin },
  ];

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <AdminFilterTabs
          tabs={tabs}
          active={filter}
          onChange={(v) => setFilter(v as RoleFilter)}
        />
        <AdminSearch
          value={search}
          onChange={setSearch}
          placeholder="Search by name, email, phone…"
          className="sm:w-72"
        />
      </div>

      {/* Table */}
      <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-xs">
        {filtered.length === 0 ? (
          <AdminEmptyState
            icon={Users}
            title="No users found"
            description="Try adjusting your search or filter."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-stone-100">
              <thead>
                <tr className="bg-stone-50">
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-stone-500 uppercase tracking-wide">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-stone-500 uppercase tracking-wide hidden sm:table-cell">
                    Contact
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-stone-500 uppercase tracking-wide">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-stone-500 uppercase tracking-wide hidden md:table-cell">
                    Location
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-stone-500 uppercase tracking-wide hidden lg:table-cell">
                    Joined
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-stone-500 uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filtered.map((user) => {
                  const isExpanded = expandedId === user.id;
                  const isConfirming = confirmRoleChange?.userId === user.id;
                  return (
                    <>
                      <tr
                        key={user.id}
                        className="hover:bg-stone-50/60 transition-colors"
                      >
                        {/* Name */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <AvatarChip name={user.full_name} role={user.role} />
                            <div>
                              <p className="text-sm font-semibold text-stone-900 leading-none">
                                {user.full_name ?? "—"}
                              </p>
                              <p className="text-xs text-stone-400 mt-0.5 sm:hidden">
                                {user.email ?? user.phone ?? "—"}
                              </p>
                            </div>
                          </div>
                        </td>
                        {/* Contact */}
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <div className="space-y-0.5">
                            {user.email && (
                              <div className="flex items-center gap-1.5 text-xs text-stone-600">
                                <Mail size={11} className="text-stone-400 shrink-0" />
                                <span className="truncate max-w-[180px]">
                                  {user.email}
                                </span>
                              </div>
                            )}
                            {user.phone && (
                              <div className="flex items-center gap-1.5 text-xs text-stone-500">
                                <Phone size={11} className="text-stone-400 shrink-0" />
                                {user.phone}
                              </div>
                            )}
                          </div>
                        </td>
                        {/* Role */}
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1.5">
                            <AdminBadge status={user.role} />
                            {user.role !== "admin" && (
                              <AdminBadge
                                status={user.verification_status}
                                size="xs"
                              />
                            )}
                          </div>
                        </td>
                        {/* Location */}
                        <td className="px-4 py-3 hidden md:table-cell">
                          {user.city || user.state ? (
                            <div className="flex items-center gap-1 text-xs text-stone-500">
                              <MapPin size={11} className="text-stone-400 shrink-0" />
                              {[user.city, user.state].filter(Boolean).join(", ")}
                            </div>
                          ) : (
                            <span className="text-xs text-stone-300">—</span>
                          )}
                        </td>
                        {/* Joined */}
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <span className="text-xs text-stone-500">
                            {formatDate(user.created_at)}
                          </span>
                        </td>
                        {/* Actions */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {user.role !== "admin" && !isConfirming && (
                              <button
                                type="button"
                                onClick={() =>
                                  setConfirmRoleChange({
                                    userId: user.id,
                                    newRole:
                                      user.role === "owner"
                                        ? "customer"
                                        : "owner",
                                  })
                                }
                                className="flex items-center gap-1 text-xs font-medium text-stone-500 hover:text-stone-900 hover:bg-stone-100 px-2.5 py-1.5 rounded-lg transition-colors"
                              >
                                <UserCog size={13} />
                                <span className="hidden sm:inline">Role</span>
                              </button>
                            )}
                            {isConfirming && confirmRoleChange && (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[11px] text-stone-500">
                                  → {confirmRoleChange.newRole}?
                                </span>
                                <button
                                  type="button"
                                  disabled={isPending}
                                  onClick={() =>
                                    handleRoleChange(
                                      user.id,
                                      confirmRoleChange.newRole
                                    )
                                  }
                                  className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 disabled:opacity-50"
                                >
                                  Confirm
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmRoleChange(null)}
                                  className="text-[11px] text-stone-400 hover:text-stone-700"
                                >
                                  Cancel
                                </button>
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedId(isExpanded ? null : user.id)
                              }
                              className="text-stone-400 hover:text-stone-700 p-1.5 hover:bg-stone-100 rounded-lg transition-colors"
                            >
                              {isExpanded ? (
                                <ChevronUp size={14} />
                              ) : (
                                <ChevronDown size={14} />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                      {/* Expanded detail row */}
                      {isExpanded && (
                        <tr key={`${user.id}-expanded`} className="bg-stone-50/60">
                          <td colSpan={6} className="px-4 py-4">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                              <div>
                                <p className="text-stone-400 font-semibold mb-0.5">
                                  User ID
                                </p>
                                <p className="text-stone-600 font-mono text-[10px] break-all">
                                  {user.id}
                                </p>
                              </div>
                              <div>
                                <p className="text-stone-400 font-semibold mb-0.5">
                                  Email
                                </p>
                                <p className="text-stone-700">{user.email ?? "—"}</p>
                              </div>
                              <div>
                                <p className="text-stone-400 font-semibold mb-0.5">
                                  Phone
                                </p>
                                <p className="text-stone-700">{user.phone ?? "—"}</p>
                              </div>
                              <div>
                                <p className="text-stone-400 font-semibold mb-0.5">
                                  Full Location
                                </p>
                                <p className="text-stone-700">
                                  {[user.city, user.district, user.state]
                                    .filter(Boolean)
                                    .join(", ") || "—"}
                                </p>
                              </div>
                              <div>
                                <p className="text-stone-400 font-semibold mb-0.5">
                                  Verification
                                </p>
                                <AdminBadge
                                  status={user.verification_status}
                                  size="xs"
                                />
                              </div>
                              <div>
                                <p className="text-stone-400 font-semibold mb-0.5">
                                  Last Updated
                                </p>
                                <p className="text-stone-700">
                                  {formatDate(user.updated_at)}
                                </p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer count */}
      {filtered.length > 0 && (
        <p className="text-xs text-stone-400 text-right">
          Showing {filtered.length} of {users.length} users
        </p>
      )}

      <AdminToast toast={toast} />
    </div>
  );
}
