"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Store,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
} from "lucide-react";
import { AdminSearch } from "./AdminSearch";
import { AdminFilterTabs } from "./AdminFilterTabs";
import { AdminBadge } from "./AdminBadge";
import { AdminEmptyState } from "./AdminEmptyState";
import type { Profile } from "@/types/database";

interface OwnerWithApp extends Pick<Profile, "id" | "full_name" | "email" | "phone" | "city" | "state" | "verification_status" | "created_at"> {
  application?: {
    id: string;
    status: string;
    submitted_at: string | null;
  };
  outfit_count: number;
}

interface OwnersClientProps {
  owners: OwnerWithApp[];
}

type VerFilter = "all" | "verified" | "pending" | "rejected";

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function OwnersClient({ owners }: OwnersClientProps) {
  const [filter, setFilter] = useState<VerFilter>("all");
  const [search, setSearch] = useState("");

  const counts = useMemo(
    () => ({
      all: owners.length,
      verified: owners.filter((o) => o.verification_status === "verified").length,
      pending: owners.filter((o) => o.verification_status === "pending").length,
      rejected: owners.filter((o) => o.verification_status === "rejected").length,
    }),
    [owners]
  );

  const filtered = useMemo(() => {
    return owners.filter((o) => {
      if (filter !== "all" && o.verification_status !== filter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          o.full_name?.toLowerCase().includes(q) ||
          o.email?.toLowerCase().includes(q) ||
          o.phone?.includes(q) ||
          o.city?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [owners, filter, search]);

  const tabs = [
    { value: "all", label: "All Owners", count: counts.all },
    { value: "verified", label: "Verified", count: counts.verified },
    { value: "pending", label: "Pending", count: counts.pending },
    { value: "rejected", label: "Rejected", count: counts.rejected },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <AdminFilterTabs
          tabs={tabs}
          active={filter}
          onChange={(v) => setFilter(v as VerFilter)}
        />
        <AdminSearch
          value={search}
          onChange={setSearch}
          placeholder="Search owners…"
          className="sm:w-72"
        />
      </div>

      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden shadow-xs">
        {filtered.length === 0 ? (
          <AdminEmptyState
            icon={Store}
            title="No owners found"
            description="No verified owners match your current filter."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-stone-100 dark:divide-stone-800">
              <thead>
                <tr className="bg-stone-50 dark:bg-stone-900/90 border-b border-stone-100 dark:border-stone-800">
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                    Owner
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide hidden sm:table-cell">
                    Contact
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide hidden md:table-cell">
                    Location
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide hidden lg:table-cell">
                    Outfits
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide hidden lg:table-cell">
                    Joined
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                    Application
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {filtered.map((owner) => (
                  <tr
                    key={owner.id}
                    className="hover:bg-stone-50/60 dark:hover:bg-stone-800/50 transition-colors"
                  >
                    {/* Owner name */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 flex items-center justify-center text-xs font-bold shrink-0">
                          {(owner.full_name ?? "?")
                            .split(" ")
                            .slice(0, 2)
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                            {owner.full_name ?? "—"}
                          </p>
                          <p className="text-xs text-stone-400 dark:text-stone-500 sm:hidden">
                            {owner.email ?? "—"}
                          </p>
                        </div>
                      </div>
                    </td>
                    {/* Contact */}
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <div className="space-y-0.5">
                        {owner.email && (
                          <div className="flex items-center gap-1.5 text-xs text-stone-600 dark:text-stone-300">
                            <Mail size={11} className="text-stone-400 dark:text-stone-500 shrink-0" />
                            <span className="truncate max-w-[180px]">
                              {owner.email}
                            </span>
                          </div>
                        )}
                        {owner.phone && (
                          <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400">
                            <Phone size={11} className="text-stone-400 dark:text-stone-500 shrink-0" />
                            {owner.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    {/* Location */}
                    <td className="px-4 py-3 hidden md:table-cell">
                      {owner.city || owner.state ? (
                        <div className="flex items-center gap-1 text-xs text-stone-500 dark:text-stone-400">
                          <MapPin size={11} className="text-stone-400 dark:text-stone-500 shrink-0" />
                          {[owner.city, owner.state].filter(Boolean).join(", ")}
                        </div>
                      ) : (
                        <span className="text-xs text-stone-300 dark:text-stone-600">—</span>
                      )}
                    </td>
                    {/* Status */}
                    <td className="px-4 py-3">
                      <AdminBadge status={owner.verification_status} />
                    </td>
                    {/* Outfits count */}
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-sm font-semibold text-stone-700 dark:text-stone-300">
                        {owner.outfit_count}
                      </span>
                    </td>
                    {/* Joined */}
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-xs text-stone-500 dark:text-stone-400">
                        {formatDate(owner.created_at)}
                      </span>
                    </td>
                    {/* Application link */}
                    <td className="px-4 py-3">
                      <Link
                        href="/admin/applications"
                        className="inline-flex items-center gap-1 text-xs font-medium text-rose-700 dark:text-rose-400 hover:text-rose-900 dark:hover:text-rose-300 transition-colors"
                      >
                        <ExternalLink size={12} />
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {filtered.length > 0 && (
        <p className="text-xs text-stone-400 dark:text-stone-500 text-right">
          Showing {filtered.length} of {owners.length} owners
        </p>
      )}
    </div>
  );
}
