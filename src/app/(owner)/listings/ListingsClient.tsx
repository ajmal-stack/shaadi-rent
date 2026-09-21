"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import {
  Edit3,
  Pause,
  Play,
  Archive,
  Eye,
  CheckCircle2,
  Clock,
  XCircle,
  MoreVertical,
  X,
  Save,
  Star,
  AlertTriangle,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { pauseListing, unpauseListing, archiveListing, unarchiveListing, updateListing } from "./actions";
import type { UpdateListingInput } from "./actions";

// ── Status config ──────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; border: string; icon: React.ElementType }
> = {
  draft: { label: "Draft", color: "text-stone-600", bg: "bg-stone-100", border: "border-stone-200", icon: Edit3 },
  pending_review: { label: "In Review", color: "text-amber-800", bg: "bg-amber-50", border: "border-amber-200", icon: Clock },
  published: { label: "Published", color: "text-emerald-800", bg: "bg-emerald-50", border: "border-emerald-200", icon: CheckCircle2 },
  paused: { label: "Paused", color: "text-blue-800", bg: "bg-blue-50", border: "border-blue-200", icon: Eye },
  archived: { label: "Archived", color: "text-red-700", bg: "bg-red-50", border: "border-red-200", icon: XCircle },
};

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ListingItem {
  id: string;
  title: string;
  slug: string;
  status: string;
  verification_status: string;
  rental_price: number;
  security_deposit: number;
  condition: string;
  brand: string;
  color: string;
  description: string;
  city: string;
  state: string;
  created_at: string;
  imageUrl: string;
  category: string;
}

interface ListingsClientProps {
  outfits: ListingItem[];
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function ListingsClient({ outfits }: ListingsClientProps) {
  const [items, setItems] = useState<ListingItem[]>(outfits);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [archiveId, setArchiveId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<{ id: string; action: "pause" | "unpause" | "unarchive" } | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const menuRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown on outside click WITHOUT blocking any click events
  useEffect(() => {
    if (!openMenuId) return;
    function handleDocClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleDocClick);
    return () => document.removeEventListener("mousedown", handleDocClick);
  }, [openMenuId]);

  const editingOutfit = editingId ? items.find((o) => o.id === editingId) ?? null : null;
  const archivingOutfit = archiveId ? items.find((o) => o.id === archiveId) ?? null : null;

  // ── Helpers ─────────────────────────────────────────────────────────────────

  function updateItemStatus(id: string, newStatus: string) {
    setItems((prev) => prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o)));
  }

  // ── Pause ────────────────────────────────────────────────────────────────────

  async function handlePause(id: string) {
    setOpenMenuId(null);
    setActionLoading({ id, action: "pause" });
    try {
      const result = await pauseListing(id);
      if (result.error) {
        toast.error(result.error);
      } else {
        updateItemStatus(id, "paused");
        toast.success("Listing paused — it's no longer visible to renters.");
      }
    } catch {
      toast.error("Failed to pause listing.");
    } finally {
      setActionLoading(null);
    }
  }

  // ── Unpause ──────────────────────────────────────────────────────────────────

  async function handleUnpause(id: string) {
    setOpenMenuId(null);
    setActionLoading({ id, action: "unpause" });
    try {
      const result = await unpauseListing(id);
      if (result.error) {
        toast.error(result.error);
      } else {
        updateItemStatus(id, "published");
        toast.success("Listing is live again!");
      }
    } catch {
      toast.error("Failed to resume listing.");
    } finally {
      setActionLoading(null);
    }
  }

  // ── Unarchive / Restore ───────────────────────────────────────────────────────

  async function handleUnarchive(id: string) {
    setOpenMenuId(null);
    setActionLoading({ id, action: "unarchive" });
    try {
      const result = await unarchiveListing(id);
      if (result.error) {
        toast.error(result.error);
      } else {
        const newStatus = result.restoredStatus ?? "paused";
        updateItemStatus(id, newStatus);
        toast.success(
          newStatus === "paused"
            ? "Listing restored! It is currently paused — click Resume to publish."
            : "Listing restored to drafts."
        );
      }
    } catch {
      toast.error("Failed to restore listing.");
    } finally {
      setActionLoading(null);
    }
  }

  // ── Archive ──────────────────────────────────────────────────────────────────

  async function handleArchiveConfirm() {
    if (!archiveId) return;
    const id = archiveId;
    setIsArchiving(true);
    try {
      const result = await archiveListing(id);
      if (result.error) {
        toast.error(result.error);
      } else {
        updateItemStatus(id, "archived");
        toast.success("Listing archived successfully.");
        setArchiveId(null);
      }
    } catch {
      toast.error("Failed to archive listing.");
    } finally {
      setIsArchiving(false);
    }
  }

  // ── Edit Save ────────────────────────────────────────────────────────────────

  async function handleEditSave(id: string, input: UpdateListingInput) {
    setIsSavingEdit(true);
    try {
      const result = await updateListing(id, input);
      if (result.error) {
        toast.error(result.error);
      } else {
        setItems((prev) =>
          prev.map((o) =>
            o.id === id
              ? {
                ...o,
                title: input.title,
                description: input.description ?? "",
                brand: input.brand ?? "",
                color: input.color ?? "",
                rental_price: input.rental_price,
                security_deposit: input.security_deposit,
                condition: input.condition,
              }
              : o
          )
        );
        toast.success("Listing updated successfully!");
        setEditingId(null);
      }
    } catch {
      toast.error("Failed to update listing.");
    } finally {
      setIsSavingEdit(false);
    }
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {items.map((outfit) => {
          const status = STATUS_CONFIG[outfit.status] ?? STATUS_CONFIG.draft;
          const StatusIcon = status.icon;
          const location = [outfit.city, outfit.state].filter(Boolean).join(", ");
          const isArchived = outfit.status === "archived";

          return (
            <div
              key={outfit.id}
              className={`group relative rounded-2xl border bg-white shadow-sm hover:shadow-md transition-all duration-200 flex flex-col ${openMenuId === outfit.id ? "z-30" : "z-0"
                } ${isArchived ? "opacity-60 border-stone-100" : "border-stone-100"}`}
            >
              {/* Image & Header */}
              <div className="relative aspect-[4/3] bg-stone-100 rounded-t-2xl">
                {/* Image itself clipped */}
                <div className="absolute inset-0 overflow-hidden rounded-t-2xl">
                  <Image
                    src={outfit.imageUrl}
                    alt={outfit.title}
                    fill
                    className="object-cover object-top group-hover:scale-[1.03] transition-transform duration-300"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>

                {/* Status & Verified badges */}
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold backdrop-blur-sm shadow-xs ${status.bg} ${status.border} ${status.color}`}
                  >
                    <StatusIcon size={11} />
                    {status.label}
                  </span>
                  {outfit.verification_status === "approved" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-700/90 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm shadow-xs">
                      <Star size={9} className="fill-white" />
                      Verified
                    </span>
                  )}
                </div>

                {/* 3-dot menu */}
                <div
                  ref={openMenuId === outfit.id ? menuRef : null}
                  className="absolute top-2.5 right-2.5 z-20"
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(openMenuId === outfit.id ? null : outfit.id);
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 hover:bg-white text-stone-700 hover:text-stone-950 shadow-sm border border-stone-200 transition-colors cursor-pointer"
                    aria-label="Listing options"
                  >
                    <MoreVertical size={15} />
                  </button>

                  {/* Dropdown */}
                  {openMenuId === outfit.id && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute top-full right-0 mt-1.5 w-44 rounded-xl border border-stone-200 bg-white shadow-xl py-1 z-50 text-left animate-in fade-in zoom-in-95 duration-100"
                    >
                      {isArchived ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleUnarchive(outfit.id)}
                            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                          >
                            <RotateCcw size={14} className="text-emerald-600" />
                            Restore Listing
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuId(null);
                              setEditingId(outfit.id);
                            }}
                            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
                          >
                            <Edit3 size={14} className="text-stone-500" />
                            View Details
                          </button>
                        </>
                      ) : (
                        <>
                          {/* Edit */}
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuId(null);
                              setEditingId(outfit.id);
                            }}
                            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
                          >
                            <Edit3 size={14} className="text-stone-500" />
                            Edit Details
                          </button>

                          {/* Pause / Resume */}
                          {outfit.status === "published" && (
                            <button
                              type="button"
                              onClick={() => handlePause(outfit.id)}
                              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
                            >
                              <Pause size={14} className="text-blue-600" />
                              Pause Listing
                            </button>
                          )}
                          {outfit.status === "paused" && (
                            <button
                              type="button"
                              onClick={() => handleUnpause(outfit.id)}
                              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                            >
                              <Play size={14} className="text-emerald-600 fill-emerald-600" />
                              Resume Listing
                            </button>
                          )}

                          {/* View live (published only) */}
                          {outfit.status === "published" && (
                            <Link
                              href={`/outfits/${outfit.slug}`}
                              target="_blank"
                              onClick={() => setOpenMenuId(null)}
                              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
                            >
                              <Eye size={14} className="text-stone-500" />
                              View Live Page
                            </Link>
                          )}

                          {/* Archive */}
                          <div className="border-t border-stone-100 mt-1 pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuId(null);
                                setArchiveId(outfit.id);
                              }}
                              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            >
                              <Archive size={14} />
                              Archive Listing
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Details */}
              <div className="p-4 flex flex-col gap-2 flex-1">
                {outfit.category && (
                  <p className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                    {outfit.category}
                  </p>
                )}

                <h3 className="font-semibold text-stone-900 text-sm leading-snug line-clamp-2">
                  {outfit.title}
                </h3>

                <div className="flex items-baseline gap-2">
                  <span className="font-display text-lg font-bold text-rose-950">
                    ₹{outfit.rental_price.toLocaleString("en-IN")}
                  </span>
                  <span className="text-[11px] text-stone-400">/ rental</span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-stone-500">
                  <span>{location || "Location not set"}</span>
                  <span className="capitalize">{outfit.condition?.replace("_", " ")}</span>
                </div>

                {/* Status-specific notes */}
                {outfit.status === "pending_review" && (
                  <p className="text-[11px] text-amber-700 bg-amber-50 rounded-lg px-2.5 py-1.5">
                    Under review — usually within 24 hours
                  </p>
                )}
                {outfit.status === "paused" && (
                  <p className="text-[11px] text-blue-700 bg-blue-50 rounded-lg px-2.5 py-1.5">
                    Hidden from browse — ready to resume anytime
                  </p>
                )}
                {isArchived && (
                  <p className="text-[11px] text-red-700 bg-red-50 rounded-lg px-2.5 py-1.5">
                    Archived — hidden from renters
                  </p>
                )}

                {/* Direct Action Buttons at bottom of card */}
                {isArchived ? (
                  <div className="mt-auto pt-3 border-t border-stone-100 flex items-center gap-2">
                    <button
                      type="button"
                      disabled={actionLoading?.id === outfit.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUnarchive(outfit.id);
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/70 hover:bg-rose-100 text-rose-900 active:scale-[0.98] py-2.5 text-xs font-semibold shadow-xs transition-all disabled:opacity-60 cursor-pointer"
                    >
                      {actionLoading?.id === outfit.id && actionLoading.action === "unarchive" ? (
                        <>
                          <Loader2 size={13} className="animate-spin" />
                          Restoring…
                        </>
                      ) : (
                        <>
                          <RotateCcw size={13} />
                          Restore / Unarchive
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="mt-auto pt-3 border-t border-stone-100 flex items-center gap-2">
                    {outfit.status === "paused" && (
                      <>
                        <button
                          type="button"
                          disabled={actionLoading?.id === outfit.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUnpause(outfit.id);
                          }}
                          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] py-2.5 text-xs font-semibold text-white shadow-xs transition-all disabled:opacity-60 cursor-pointer"
                        >
                          {actionLoading?.id === outfit.id && actionLoading.action === "unpause" ? (
                            <>
                              <Loader2 size={13} className="animate-spin" />
                              Resuming…
                            </>
                          ) : (
                            <>
                              <Play size={13} className="fill-white" />
                              Resume Listing
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingId(outfit.id);
                          }}
                          className="px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
                          title="Edit Details"
                        >
                          <Edit3 size={13} />
                        </button>
                      </>
                    )}

                    {outfit.status === "published" && (
                      <>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingId(outfit.id);
                          }}
                          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 active:scale-[0.98] py-2.5 text-xs font-semibold text-stone-700 transition-all cursor-pointer"
                        >
                          <Edit3 size={14} />
                          Edit Details
                        </button>
                        <button
                          type="button"
                          disabled={actionLoading?.id === outfit.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePause(outfit.id);
                          }}
                          className="flex items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-blue-800 px-3.5 py-2.5 text-xs font-semibold transition-colors disabled:opacity-60 cursor-pointer"
                          title="Pause Listing"
                        >
                          {actionLoading?.id === outfit.id && actionLoading.action === "pause" ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <>
                              <Pause size={13} />
                              <span className="hidden sm:inline">Pause</span>
                            </>
                          )}
                        </button>
                      </>
                    )}

                    {outfit.status === "draft" && (
                      <Link
                        href="/list-your-outfit/details"
                        className="flex-1 block text-center rounded-xl bg-rose-700 hover:bg-rose-800 active:scale-[0.98] py-2.5 text-xs font-semibold text-white shadow-xs transition-all"
                      >
                        Continue Editing
                      </Link>
                    )}

                    {outfit.status === "pending_review" && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingId(outfit.id);
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 py-2.5 text-xs font-semibold text-stone-700 transition-colors cursor-pointer"
                      >
                        <Edit3 size={13} />
                        Edit Details
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Edit Modal ──────────────────────────────────────────────────────── */}
      {editingOutfit && (
        <EditModal
          outfit={editingOutfit}
          isSaving={isSavingEdit}
          onClose={() => setEditingId(null)}
          onSave={(input) => handleEditSave(editingOutfit.id, input)}
        />
      )}

      {/* ── Archive Confirm Modal ────────────────────────────────────────────── */}
      {archivingOutfit && (
        <ArchiveConfirmModal
          title={archivingOutfit.title}
          isArchiving={isArchiving}
          onClose={() => setArchiveId(null)}
          onConfirm={handleArchiveConfirm}
        />
      )}
    </>
  );
}

// ── EditModal ──────────────────────────────────────────────────────────────────

interface EditModalProps {
  outfit: ListingItem;
  isSaving: boolean;
  onClose: () => void;
  onSave: (input: UpdateListingInput) => void;
}

function EditModal({ outfit, isSaving, onClose, onSave }: EditModalProps) {
  const [title, setTitle] = useState(outfit.title);
  const [description, setDescription] = useState(outfit.description);
  const [brand, setBrand] = useState(outfit.brand);
  const [color, setColor] = useState(outfit.color);
  const [rentalPrice, setRentalPrice] = useState(outfit.rental_price);
  const [securityDeposit, setSecurityDeposit] = useState(outfit.security_deposit);
  const [condition, setCondition] = useState(outfit.condition as "like_new" | "excellent" | "good");

  const inputClass =
    "w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600 focus:bg-white transition-colors";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { toast.error("Title is required."); return; }
    if (rentalPrice <= 0) { toast.error("Rental price must be greater than 0."); return; }
    onSave({ title: title.trim(), description: description || null, brand: brand || null, color: color || null, rental_price: rentalPrice, security_deposit: securityDeposit, condition });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden />

      {/* Modal */}
      <div className="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
          <div>
            <h2 className="font-display text-base font-bold text-rose-950">Edit Listing</h2>
            <p className="text-xs text-stone-500 mt-0.5 line-clamp-1">{outfit.title}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-stone-100 transition-colors text-stone-500"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1">
          <div className="px-6 py-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wide mb-1.5">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={120}
                className={inputClass}
                placeholder="e.g. Royal Bridal Lehenga — Deep Red"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wide mb-1.5">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className={`${inputClass} resize-none`}
                placeholder="Describe fabric, embroidery, brand story, or condition details..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wide mb-1.5">Brand</label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className={inputClass}
                  placeholder="e.g. Sabyasachi"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wide mb-1.5">Color</label>
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className={inputClass}
                  placeholder="e.g. Deep Red"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wide mb-1.5">
                  Rental Price (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="100"
                  value={rentalPrice}
                  onChange={(e) => setRentalPrice(Number(e.target.value))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wide mb-1.5">
                  Security Deposit (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={securityDeposit}
                  onChange={(e) => setSecurityDeposit(Number(e.target.value))}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wide mb-1.5">
                Condition
              </label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as typeof condition)}
                className={inputClass}
              >
                <option value="like_new">Like New — Worn once or twice, immaculate</option>
                <option value="excellent">Excellent — Minor wear, looks pristine</option>
                <option value="good">Good — Visible wear but well maintained</option>
              </select>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 px-6 py-4 bg-white border-t border-stone-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-700 text-xs font-semibold text-white hover:bg-rose-800 transition-colors shadow-sm disabled:opacity-60 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Save size={14} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Archive Confirm Modal ──────────────────────────────────────────────────────

interface ArchiveConfirmModalProps {
  title: string;
  isArchiving: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

function ArchiveConfirmModal({ title, isArchiving, onClose, onConfirm }: ArchiveConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 space-y-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 border border-red-100">
          <AlertTriangle size={22} className="text-red-600" />
        </div>
        <div>
          <h3 className="font-display text-base font-bold text-stone-900">Archive this listing?</h3>
          <p className="mt-1.5 text-sm text-stone-500 leading-relaxed">
            <span className="font-semibold text-stone-700">&ldquo;{title}&rdquo;</span> will be hidden from renters.
            This action is reversible — contact support to restore it.
          </p>
        </div>
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            disabled={isArchiving}
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-colors disabled:opacity-60 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isArchiving}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-red-600 text-xs font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-60 cursor-pointer"
          >
            {isArchiving ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                Archiving…
              </>
            ) : (
              "Yes, Archive"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
