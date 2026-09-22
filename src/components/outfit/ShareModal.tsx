"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { X, Copy, Check, Share2, Send, Mail } from "lucide-react";
import { toast } from "sonner";

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  outfit: {
    title: string;
    slug?: string;
    brand?: string | null;
    rental_price: number;
    imageUrl?: string;
    city?: string | null;
    state?: string | null;
  };
}

export function ShareModal({ isOpen, onClose, outfit }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const url = outfit.slug
        ? `${window.location.origin}/outfits/${outfit.slug}`
        : window.location.href;
      setShareUrl(url);
      setCanNativeShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
    }
  }, [outfit.slug]);

  // Handle ESC key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const shareText = `Check out this stunning designer wedding outfit on ShaadiRent: "${outfit.title}" for ${formatCurrency(outfit.rental_price)}/4-days!`;

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && shareUrl) {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        toast.success("Link copied to clipboard!");
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      toast.error("Failed to copy link.");
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share && shareUrl) {
      try {
        await navigator.share({
          title: outfit.title,
          text: shareText,
          url: shareUrl,
        });
      } catch {
        // User dismissed sheet
      }
    }
  };

  // WhatsApp share URL
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
    `${shareText}\n${shareUrl}`
  )}`;

  // Twitter/X share URL
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    shareText
  )}&url=${encodeURIComponent(shareUrl)}`;

  // Telegram share URL
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(
    shareUrl
  )}&text=${encodeURIComponent(shareText)}`;

  // Mailto URL
  const emailUrl = `mailto:?subject=${encodeURIComponent(
    `Wedding Outfit Rental: ${outfit.title}`
  )}&body=${encodeURIComponent(
    `Hi,\n\nI found this gorgeous wedding outfit on ShaadiRent and wanted to share it with you:\n\n${outfit.title} by ${
      outfit.brand || "Designer"
    }\nRental Price: ${formatCurrency(outfit.rental_price)}/4-days\n\nLink: ${shareUrl}\n`
  )}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-stone-950/50 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-stone-900 p-6 shadow-2xl border border-stone-200/90 dark:border-stone-800 z-10 animate-in fade-in zoom-in-95 duration-200 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3.5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300">
              <Share2 size={16} />
            </div>
            <div>
              <h3 id="share-modal-title" className="font-display text-base font-bold text-stone-950 dark:text-stone-50">
                Share this Outfit
              </h3>
              <p className="text-[11px] text-stone-500">
                Share with friends, family, or your wedding stylist
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-full p-1.5 text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-700 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Outfit Preview Card */}
        <div className="flex items-center gap-3 rounded-2xl border border-stone-200/80 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-800/40 p-3">
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-stone-200">
            {outfit.imageUrl ? (
              <Image
                src={outfit.imageUrl}
                alt={outfit.title}
                fill
                sizes="56px"
                className="object-cover"
              />
            ) : (
              <div className="h-full w-full bg-rose-100 flex items-center justify-center text-rose-700 font-bold text-xs">
                SR
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 dark:text-rose-400 truncate block">
              {outfit.brand || "ShaadiRent Couture"}
            </span>
            <p className="text-xs font-semibold text-stone-900 dark:text-stone-100 truncate">
              {outfit.title}
            </p>
            <p className="text-xs font-mono font-bold text-rose-950 dark:text-rose-300">
              {formatCurrency(outfit.rental_price)}
              <span className="text-[10px] font-normal text-stone-500">/4 days</span>
            </p>
          </div>
        </div>

        {/* Quick Social Buttons */}
        <div className="space-y-2">
          {/* WhatsApp Button (Primary for Indian Wedding Shoppers) */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-white py-2.5 px-4 text-xs font-bold shadow-xs transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
          >
            {/* Authentic WhatsApp Icon */}
            <svg
              className="h-4 w-4 fill-current"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
            </svg>
            <span>Share via WhatsApp</span>
          </a>

          {/* Native Share Sheet (if supported, e.g. mobile Safari/Chrome) */}
          {canNativeShare && (
            <button
              type="button"
              onClick={handleNativeShare}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700 py-2.5 px-4 text-xs font-semibold text-stone-800 dark:text-stone-200 shadow-2xs transition-colors cursor-pointer"
            >
              <Share2 size={14} className="text-rose-700 dark:text-rose-400" />
              <span>Share via Device Sheet</span>
            </button>
          )}

          {/* Other Channels Row */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            <a
              href={twitterUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 rounded-xl border border-stone-200 dark:border-stone-800 py-2 px-3 text-[11px] font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
            >
              <span className="font-bold">𝕏</span>
              <span>Post</span>
            </a>

            <a
              href={telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 rounded-xl border border-stone-200 dark:border-stone-800 py-2 px-3 text-[11px] font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
            >
              <Send size={12} className="text-sky-500" />
              <span>Telegram</span>
            </a>

            <a
              href={emailUrl}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-stone-200 dark:border-stone-800 py-2 px-3 text-[11px] font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
            >
              <Mail size={12} className="text-amber-600" />
              <span>Email</span>
            </a>
          </div>
        </div>

        {/* Copy Link Section */}
        <div className="space-y-1.5 pt-2 border-t border-stone-100 dark:border-stone-800">
          <label className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
            Or Copy Link
          </label>
          <div className="flex items-center gap-2 rounded-2xl border border-stone-200/90 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/60 p-1.5 pl-3">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="w-full bg-transparent text-xs text-stone-700 dark:text-stone-300 outline-none truncate font-mono select-all"
              onFocus={(e) => e.target.select()}
            />
            <button
              type="button"
              onClick={handleCopy}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all duration-200 cursor-pointer shrink-0 ${
                copied
                  ? "bg-emerald-600 text-white"
                  : "bg-rose-900 hover:bg-rose-950 text-white"
              }`}
            >
              {copied ? (
                <>
                  <Check size={13} />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={13} />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
