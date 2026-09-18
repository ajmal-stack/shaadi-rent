"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ShieldAlert,
  ShieldCheck,
  Phone,
  Mail,
  MapPin,
  X,
  Check,
  Loader2,
  AlertCircle,
  Eye,
} from "lucide-react";
import { adminReviewApplicationAction } from "@/app/(admin)/admin/applications/actions";
import { toast } from "sonner";
import type { OwnerApplication } from "@/types/database";

interface ApplicationReviewClientProps {
  initialApplications: OwnerApplication[];
}

export function ApplicationReviewClient({
  initialApplications,
}: ApplicationReviewClientProps) {
  const [applications, setApplications] = useState<OwnerApplication[]>(
    initialApplications
  );
  const [activeFilter, setActiveFilter] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedApp, setSelectedApp] = useState<OwnerApplication | null>(null);

  // Modal actions state
  const [isProcessing, setIsProcessing] = useState(false);
  const [rejectionNotes, setRejectionNotes] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Lightbox for zoomed document viewing
  const [zoomedImage, setZoomedImage] = useState<{
    url: string;
    label: string;
  } | null>(null);

  // Filter & search logic
  const filteredApps = applications.filter((app) => {
    // Filter by tab
    if (activeFilter !== "all" && app.status !== activeFilter) {
      return false;
    }
    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = app.full_name?.toLowerCase().includes(q);
      const matchEmail = app.email?.toLowerCase().includes(q);
      const matchPhone = app.phone?.includes(q);
      const matchCity = app.city?.toLowerCase().includes(q);
      return matchName || matchEmail || matchPhone || matchCity;
    }
    return true;
  });

  const counts = {
    all: applications.length,
    pending: applications.filter((a) => a.status === "pending").length,
    approved: applications.filter((a) => a.status === "approved").length,
    rejected: applications.filter((a) => a.status === "rejected").length,
  };

  async function handleReview(action: "approved" | "rejected") {
    if (!selectedApp) return;

    if (action === "rejected" && !rejectionNotes.trim()) {
      setActionError("Please enter the reason for rejection to guide the applicant.");
      return;
    }

    setIsProcessing(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await adminReviewApplicationAction(
        selectedApp.id,
        action,
        action === "rejected" ? rejectionNotes.trim() : undefined
      );

      if (res.error) {
        setActionError(res.error);
        toast.error(res.error);
      } else {
        const msg = `Application successfully ${action === "approved" ? "approved! User promoted to owner." : "rejected."}`;
        setActionSuccess(msg);
        toast.success(msg);

        // Update local list state
        const updatedList = applications.map((a) =>
          a.id === selectedApp.id
            ? {
                ...a,
                status: action,
                admin_notes: action === "rejected" ? rejectionNotes.trim() : null,
                reviewed_at: new Date().toISOString(),
              }
            : a
        );
        setApplications(updatedList);

        // Update current selected item
        setSelectedApp((prev) =>
          prev
            ? {
                ...prev,
                status: action,
                admin_notes: action === "rejected" ? rejectionNotes.trim() : null,
              }
            : null
        );

        setShowRejectForm(false);
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: "Total Applications",
            val: counts.all,
            color: "text-stone-900 dark:text-stone-100",
            bg: "bg-white dark:bg-stone-900",
            border: "border-stone-200 dark:border-stone-800",
          },
          {
            label: "Pending Review",
            val: counts.pending,
            color: "text-amber-700 dark:text-amber-400",
            bg: "bg-amber-50/60 dark:bg-amber-950/30",
            border: "border-amber-200 dark:border-amber-900/50",
          },
          {
            label: "Approved Owners",
            val: counts.approved,
            color: "text-emerald-700 dark:text-emerald-400",
            bg: "bg-emerald-50/60 dark:bg-emerald-950/30",
            border: "border-emerald-200 dark:border-emerald-900/50",
          },
          {
            label: "Rejected / Revision",
            val: counts.rejected,
            color: "text-rose-700 dark:text-rose-400",
            bg: "bg-rose-50/60 dark:bg-rose-950/30",
            border: "border-rose-200 dark:border-rose-900/50",
          },
        ].map((m) => (
          <div
            key={m.label}
            className={`p-4 rounded-2xl border ${m.border} ${m.bg} shadow-2xs`}
          >
            <p className="text-xs font-semibold text-stone-500 dark:text-stone-400">{m.label}</p>
            <p className={`mt-1 font-display text-2xl font-bold ${m.color}`}>
              {m.val}
            </p>
          </div>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
        {/* Tab Filters */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "all", label: "All", count: counts.all },
            { id: "pending", label: "Pending", count: counts.pending },
            { id: "approved", label: "Approved", count: counts.approved },
            { id: "rejected", label: "Rejected", count: counts.rejected },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() =>
                setActiveFilter(tab.id as "all" | "pending" | "approved" | "rejected")
              }
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                activeFilter === tab.id
                  ? "bg-rose-900 dark:bg-rose-800 text-white shadow-xs"
                  : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200/70 dark:hover:bg-stone-700"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  activeFilter === tab.id
                    ? "bg-white/20 text-white"
                    : "bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search by name, phone, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-rose-800/20"
          />
        </div>
      </div>

      {/* Applications Table / Cards */}
      {filteredApps.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-stone-300 dark:border-stone-800 bg-white dark:bg-stone-900 p-12 text-center">
          <Filter size={28} className="mx-auto text-stone-400 mb-3" />
          <p className="text-sm font-semibold text-stone-800 dark:text-stone-200">
            No applications found
          </p>
          <p className="text-xs text-stone-400 mt-1">
            Try adjusting your search query or filter criteria.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5">
          {filteredApps.map((app) => (
            <div
              key={app.id}
              className="rounded-2xl border border-stone-200/90 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 hover:border-stone-300 dark:hover:border-stone-700 hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="font-display text-base font-bold text-stone-900 dark:text-stone-100">
                    {app.full_name}
                  </h3>

                  {/* Status Badge */}
                  {app.status === "pending" && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-0.5 text-[11px] font-bold text-amber-800 dark:text-amber-300">
                      <Clock size={11} /> Pending Review
                    </span>
                  )}
                  {app.status === "approved" && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                      <CheckCircle2 size={11} /> Approved Owner
                    </span>
                  )}
                  {app.status === "rejected" && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-rose-300 dark:border-rose-800/60 bg-rose-50 dark:bg-rose-950/60 px-2.5 py-0.5 text-[11px] font-bold text-rose-800 dark:text-rose-300">
                      <ShieldAlert size={11} /> Rejected / Revision
                    </span>
                  )}

                  <span className="text-[11px] font-mono text-stone-400 dark:text-stone-500">
                    ID: #{app.id.slice(0, 8).toUpperCase()}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs text-stone-500 dark:text-stone-400 flex-wrap">
                  <span className="inline-flex items-center gap-1">
                    <Mail size={13} /> {app.email}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Phone size={13} /> +91 {app.phone}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin size={13} /> {app.city}, {app.state}
                  </span>
                  <span className="inline-flex items-center gap-1 uppercase font-semibold text-stone-700 dark:text-stone-300">
                    <ShieldCheck size={13} /> {app.id_type}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedApp(app);
                    setShowRejectForm(false);
                    setActionError(null);
                    setActionSuccess(null);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-950 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white text-xs font-semibold text-white shadow transition-all"
                >
                  <Eye size={13} />
                  <span>Review Application</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── DETAIL & DECISION MODAL ───────────────────────────────────── */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-3xl bg-white dark:bg-stone-900 p-6 sm:p-8 shadow-2xl border border-stone-200 dark:border-stone-800 my-8">
            {/* Close button */}
            <button
              type="button"
              onClick={() => setSelectedApp(null)}
              className="absolute right-5 top-5 p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 dark:text-stone-500 dark:hover:text-stone-200 dark:hover:bg-stone-800 transition-colors"
            >
              <X size={20} />
            </button>

            {/* Header */}
            <div className="pb-4 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-rose-800 dark:text-rose-400 uppercase tracking-wider">
                  Owner Verification Review
                </span>
                <span className="text-stone-300 dark:text-stone-700">•</span>
                <span className="text-xs text-stone-400 dark:text-stone-500 font-mono">
                  #{selectedApp.id}
                </span>
              </div>
              <h2 className="font-display text-2xl font-bold text-stone-900 dark:text-stone-100 mt-1">
                {selectedApp.full_name}
              </h2>
            </div>

            {/* Content Sections */}
            <div className="py-5 space-y-6 max-h-[65vh] overflow-y-auto pr-1 sleek-scrollbar">
              {/* Personal Details */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
                  1. Personal Details
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-stone-50 dark:bg-stone-800/60 p-3.5 rounded-xl border border-stone-200 dark:border-stone-800">
                  <div>
                    <span className="text-stone-400 dark:text-stone-500 block">Email Address</span>
                    <span className="font-semibold text-stone-900 dark:text-stone-100">{selectedApp.email}</span>
                  </div>
                  <div>
                    <span className="text-stone-400 dark:text-stone-500 block">Verified Mobile</span>
                    <span className="font-semibold text-stone-900 dark:text-stone-100 font-mono">
                      +91 {selectedApp.phone}
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-400 dark:text-stone-500 block">Date of Birth</span>
                    <span className="font-semibold text-stone-900 dark:text-stone-100">{selectedApp.dob}</span>
                  </div>
                  <div>
                    <span className="text-stone-400 dark:text-stone-500 block">Gender</span>
                    <span className="font-semibold text-stone-900 dark:text-stone-100 capitalize">
                      {selectedApp.gender}
                    </span>
                  </div>
                  {selectedApp.alt_phone && (
                    <div>
                      <span className="text-stone-400 dark:text-stone-500 block">Alternate Phone</span>
                      <span className="font-semibold text-stone-900 dark:text-stone-100">
                        {selectedApp.alt_phone}
                      </span>
                    </div>
                  )}
                  {selectedApp.bio && (
                    <div className="col-span-2 sm:col-span-3">
                      <span className="text-stone-400 dark:text-stone-500 block">Bio / Wardrobe Note</span>
                      <span className="text-stone-800 dark:text-stone-200">{selectedApp.bio}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Identity Proof Documents */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
                    2. Government ID Proof ({selectedApp.id_type?.toUpperCase()})
                  </h4>
                  <span className="text-xs font-mono font-bold text-stone-900 dark:text-stone-100 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded">
                    Number: {selectedApp.id_number}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Front Photo */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400">
                      Front Side
                    </span>
                    {selectedApp.id_front_url ? (
                      <div
                        onClick={() =>
                          setZoomedImage({
                            url: selectedApp.id_front_url!,
                            label: `Front ID - ${selectedApp.full_name}`,
                          })
                        }
                        className="relative group rounded-xl overflow-hidden border border-stone-200 dark:border-stone-800 bg-stone-100 dark:bg-stone-800 aspect-[16/10] cursor-pointer"
                      >
                        <Image
                          src={selectedApp.id_front_url}
                          alt="Front ID"
                          fill
                          className="object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1">
                          <Eye size={14} /> Click to zoom
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-rose-500">No front photo</p>
                    )}
                  </div>

                  {/* Back Photo */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400">
                      Back Side
                    </span>
                    {selectedApp.id_back_url ? (
                      <div
                        onClick={() =>
                          setZoomedImage({
                            url: selectedApp.id_back_url!,
                            label: `Back ID - ${selectedApp.full_name}`,
                          })
                        }
                        className="relative group rounded-xl overflow-hidden border border-stone-200 dark:border-stone-800 bg-stone-100 dark:bg-stone-800 aspect-[16/10] cursor-pointer"
                      >
                        <Image
                          src={selectedApp.id_back_url}
                          alt="Back ID"
                          fill
                          className="object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1">
                          <Eye size={14} /> Click to zoom
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-rose-500">No back photo</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Address Details */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
                  3. Residential & Pickup Address
                </h4>
                <div className="bg-stone-50 dark:bg-stone-800/60 p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 text-xs space-y-1">
                  <p className="font-semibold text-stone-900 dark:text-stone-100">
                    {selectedApp.address_line1}
                    {selectedApp.address_line2 ? `, ${selectedApp.address_line2}` : ""}
                  </p>
                  <p className="text-stone-600 dark:text-stone-300">
                    {selectedApp.city}, {selectedApp.district}, {selectedApp.state} —{" "}
                    <span className="font-mono font-bold text-stone-900 dark:text-stone-100">
                      {selectedApp.pincode}
                    </span>
                  </p>
                  {selectedApp.landmark && (
                    <p className="text-[11px] text-stone-400 dark:text-stone-500">
                      Landmark: {selectedApp.landmark}
                    </p>
                  )}
                </div>
              </div>

              {/* Declaration & Signature */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
                  4. Signature & Agreement
                </h4>
                <div className="bg-stone-50 dark:bg-stone-800/60 p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 text-xs flex items-center justify-between">
                  <div>
                    <span className="text-stone-400 dark:text-stone-500 block text-[11px]">
                      Digital Signature
                    </span>
                    <span className="font-serif italic text-sm font-bold text-stone-900 dark:text-stone-100">
                      {selectedApp.signature_name}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-stone-400 dark:text-stone-500 block text-[11px]">Submitted</span>
                    <span className="font-mono text-stone-700 dark:text-stone-300 text-[11px]">
                      {selectedApp.submitted_at
                        ? new Date(selectedApp.submitted_at).toLocaleDateString("en-IN")
                        : "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Feedback alert messages */}
              {actionError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{actionError}</span>
                </div>
              )}
              {actionSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 size={15} className="shrink-0" />
                  <span>{actionSuccess}</span>
                </div>
              )}

              {/* Rejection Note Form */}
              {showRejectForm && (
                <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/60 dark:bg-rose-950/30 space-y-3">
                  <label className="block text-xs font-bold text-rose-900 dark:text-rose-300">
                    Reason for Rejection / Revision Instructions:
                  </label>
                  <textarea
                    rows={3}
                    value={rejectionNotes}
                    onChange={(e) => setRejectionNotes(e.target.value)}
                    placeholder="e.g. Front Aadhaar photo is blurry. Please re-upload a clear high-resolution picture showing name and ID number."
                    className="w-full text-xs rounded-xl border border-rose-300 dark:border-rose-800 bg-white dark:bg-stone-900 p-2.5 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-rose-800/20"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowRejectForm(false)}
                      className="px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={isProcessing || !rejectionNotes.trim()}
                      onClick={() => handleReview("rejected")}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold disabled:opacity-50"
                    >
                      {isProcessing ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <ShieldAlert size={13} />
                      )}
                      <span>Confirm Rejection</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Decision Bar */}
            <div className="pt-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setSelectedApp(null)}
                className="px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-semibold text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                {!showRejectForm && (
                  <>
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => setShowRejectForm(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 text-xs font-semibold transition-colors"
                    >
                      <ShieldAlert size={14} />
                      <span>Reject / Request Revision</span>
                    </button>

                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => handleReview("approved")}
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white text-xs font-semibold shadow transition-all"
                    >
                      {isProcessing ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Check size={14} />
                      )}
                      <span>Approve as Verified Owner</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── IMAGE ZOOM LIGHTBOX ───────────────────────────────────────── */}
      {zoomedImage && (
        <div
          onClick={() => setZoomedImage(null)}
          className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4 cursor-zoom-out"
        >
          <div className="relative max-w-3xl max-h-[85vh] w-full h-full">
            <Image
              src={zoomedImage.url}
              alt={zoomedImage.label}
              fill
              className="object-contain"
            />
            <button
              type="button"
              onClick={() => setZoomedImage(null)}
              className="absolute top-2 right-2 p-2 rounded-full bg-black/60 text-white hover:bg-black"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
