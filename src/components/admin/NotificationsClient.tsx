"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Megaphone,
  Users,
  MessageSquare,
  Mail,
  Bell,
  Sparkles,
  Send,
  Tag,
  Percent,
  Link as LinkIcon,
  CheckCircle2,
  Clock,
  Loader2,
  ExternalLink,
  Gift,
  Crown,
  Truck,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import {
  dispatchAdminBroadcastAction,
  type BroadcastStats,
  type BroadcastCampaignItem,
  type DispatchBroadcastParams,
} from "@/app/(admin)/admin/notifications/actions";

interface NotificationsClientProps {
  initialStats: BroadcastStats;
  initialCampaigns: BroadcastCampaignItem[];
}

const PRESET_TEMPLATES = [
  {
    id: "diwali",
    name: "Diwali Bridal Sale",
    icon: Gift,
    title: "Diwali Festive Sale: 20% Off Bridal Lehengas!",
    message: "Celebrate this wedding season in style! Rent premium designer lehengas, sherwanis, and sarees with flat 20% off. Book now before festival dates are reserved.",
    offerCode: "DIWALI20",
    discountPercent: 20,
    actionUrl: "/browse?category=bridal-lehengas",
    audience: "promotions_opted" as const,
  },
  {
    id: "sabyasachi",
    name: "Sabyasachi Royal Drop",
    icon: Crown,
    title: "New Arrival: Exclusive Sabyasachi & Manish Malhotra Couture",
    message: "Hand-picked bridal couture has just landed in our boutique collection. Verified authentic, professionally dry-cleaned, and tailored to perfection for your big day.",
    offerCode: "ROYAL15",
    discountPercent: 15,
    actionUrl: "/browse?sort=newest",
    audience: "all" as const,
  },
  {
    id: "flat1000",
    name: "Flat ₹1,000 Off",
    icon: Tag,
    title: "Weekend Special: Flat ₹1,000 Off Any Outfit Rental",
    message: "Planning for an upcoming sangeet, reception, or wedding function? Enjoy flat ₹1,000 off rentals above ₹4,000 with zero security deposit hassle.",
    offerCode: "SHAADI1000",
    discountPercent: 10,
    actionUrl: "/browse",
    audience: "customers" as const,
  },
  {
    id: "delivery",
    name: "Free Express Delivery",
    icon: Truck,
    title: "Free Express Courier & Doorstep Fitting This Weekend",
    message: "Book any luxury outfit this weekend and get free insured express courier delivery and custom fitting assistance right to your doorstep.",
    offerCode: "FREESHIP",
    discountPercent: 5,
    actionUrl: "/browse",
    audience: "promotions_opted" as const,
  },
];

export function NotificationsClient({
  initialStats,
  initialCampaigns,
}: NotificationsClientProps) {
  const [stats, setStats] = useState<BroadcastStats>(initialStats);
  const [campaigns, setCampaigns] = useState<BroadcastCampaignItem[]>(initialCampaigns);

  // Form State
  const [title, setTitle] = useState("Diwali Festive Sale: 20% Off Bridal Lehengas!");
  const [message, setMessage] = useState(
    "Celebrate this wedding season in style! Rent premium designer lehengas, sherwanis, and sarees with flat 20% off. Book now before festival dates are reserved."
  );
  const [offerCode, setOfferCode] = useState("DIWALI20");
  const [discountPercent, setDiscountPercent] = useState<number | undefined>(20);
  const [actionUrl, setActionUrl] = useState("/browse?category=bridal-lehengas");
  const [targetAudience, setTargetAudience] = useState<
    "all" | "promotions_opted" | "customers" | "owners"
  >("promotions_opted");

  const [channels, setChannels] = useState<{
    in_app: boolean;
    whatsapp: boolean;
    email: boolean;
  }>({
    in_app: true,
    whatsapp: true,
    email: true,
  });

  const [isPending, startTransition] = useTransition();
  const [lastBlastUrl, setLastBlastUrl] = useState<string | null>(null);

  // Toggle delivery channel
  const toggleChannel = (key: "in_app" | "whatsapp" | "email") => {
    setChannels((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      // Keep at least one selected
      if (!next.in_app && !next.whatsapp && !next.email) {
        return prev;
      }
      return next;
    });
  };

  // Apply a preset template
  const applyPreset = (preset: (typeof PRESET_TEMPLATES)[0]) => {
    setTitle(preset.title);
    setMessage(preset.message);
    setOfferCode(preset.offerCode);
    setDiscountPercent(preset.discountPercent);
    setActionUrl(preset.actionUrl);
    setTargetAudience(preset.audience);
    toast.info(`Loaded preset: "${preset.name}"`);
  };

  // Reset to empty custom draft
  const resetForm = () => {
    setTitle("");
    setMessage("");
    setOfferCode("");
    setDiscountPercent(undefined);
    setActionUrl("/browse");
    setTargetAudience("all");
    setLastBlastUrl(null);
  };

  // Dispatch campaign
  const handleDispatch = () => {
    if (!title.trim() || title.trim().length < 3) {
      toast.error("Please enter a title of at least 3 characters.");
      return;
    }
    if (!message.trim() || message.trim().length < 10) {
      toast.error("Please enter a message of at least 10 characters.");
      return;
    }

    const selectedChannels: Array<"in_app" | "whatsapp" | "email"> = [];
    if (channels.in_app) selectedChannels.push("in_app");
    if (channels.whatsapp) selectedChannels.push("whatsapp");
    if (channels.email) selectedChannels.push("email");

    startTransition(async () => {
      try {
        const payload: DispatchBroadcastParams = {
          title: title.trim(),
          message: message.trim(),
          offerCode: offerCode.trim() || undefined,
          discountPercent: discountPercent || undefined,
          targetAudience,
          channels: selectedChannels,
          actionUrl: actionUrl.trim() || "/browse",
        };

        const result = await dispatchAdminBroadcastAction(payload);

        if (result.success) {
          toast.success(result.message);
          if (result.sampleWhatsAppUrl) {
            setLastBlastUrl(result.sampleWhatsAppUrl);
          }

          // Add to local campaigns list
          const newCamp: BroadcastCampaignItem = {
            id: `camp_${Date.now()}`,
            title: title.trim(),
            message: message.trim(),
            offer_code: offerCode.trim() || null,
            discount_percent: discountPercent || null,
            target_audience: targetAudience,
            channels: selectedChannels,
            action_url: actionUrl.trim() || "/browse",
            recipients_count: result.recipientsCount || 0,
            created_at: new Date().toISOString(),
          };

          setCampaigns((prev) => [newCamp, ...prev]);
          setStats((prev) => ({
            ...prev,
            totalCampaigns: prev.totalCampaigns + 1,
          }));
        } else {
          toast.error(result.message);
        }
      } catch {
        toast.error("Failed to send broadcast campaign.");
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* ── Top Header ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-rose-700 via-rose-800 to-rose-950 text-white shadow-xs">
              <Megaphone size={18} />
            </span>
            <h1 className="font-display text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
              Broadcasts &amp; Offers
            </h1>
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-2xl leading-relaxed">
            Create promotional announcements, seasonal discounts, and bridal sale drops. Dispatched across{" "}
            <strong className="text-stone-700 dark:text-stone-300">Free WhatsApp (1-click)</strong>,{" "}
            <strong className="text-stone-700 dark:text-stone-300">Resend Email</strong>, and the customer{" "}
            <strong className="text-stone-700 dark:text-stone-300">In-App Notification Center</strong> at ₹0 cost.
          </p>
        </div>

        {lastBlastUrl && (
          <a
            href={lastBlastUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition-all shrink-0 cursor-pointer"
          >
            <MessageSquare size={14} />
            <span>Open WhatsApp Broadcast</span>
            <ExternalLink size={12} />
          </a>
        )}
      </div>

      {/* ── Stats Metric Cards ────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-medium uppercase tracking-wider">Registered Users</span>
            <Users size={16} className="text-rose-800" />
          </div>
          <p className="text-2xl font-bold text-stone-900 dark:text-stone-100 mt-2 font-display">
            {stats.totalUsers}
          </p>
          <span className="text-[11px] text-stone-400 mt-0.5 block">Potential audience</span>
        </div>

        <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-medium uppercase tracking-wider">Promo Opt-Ins</span>
            <Sparkles size={16} className="text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-amber-700 dark:text-amber-400 mt-2 font-display">
            {stats.promotionsOpted}
          </p>
          <span className="text-[11px] text-stone-400 mt-0.5 block">Subscribed for offers</span>
        </div>

        <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-medium uppercase tracking-wider">WhatsApp Ready</span>
            <MessageSquare size={16} className="text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-2 font-display">
            {stats.whatsappReady}
          </p>
          <span className="text-[11px] text-stone-400 mt-0.5 block">Valid Indian mobile</span>
        </div>

        <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-medium uppercase tracking-wider">Total Broadcasts</span>
            <Megaphone size={16} className="text-rose-600" />
          </div>
          <p className="text-2xl font-bold text-rose-800 dark:text-rose-400 mt-2 font-display">
            {stats.totalCampaigns}
          </p>
          <span className="text-[11px] text-stone-400 mt-0.5 block">Dispatched campaigns</span>
        </div>
      </div>

      {/* ── Main Composer & Live Preview Grid ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form & Presets (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Quick Presets */}
          <div className="rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
                <Sparkles size={14} className="text-rose-800" />
                <span>Quick Offer Presets</span>
              </h3>
              <button
                type="button"
                onClick={resetForm}
                className="text-xs font-semibold text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw size={12} />
                <span>Clear Draft</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {PRESET_TEMPLATES.map((preset) => {
                const IconComponent = preset.icon;
                const isSelected = offerCode === preset.offerCode;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className={`rounded-2xl border p-3 text-left transition-all flex flex-col justify-between gap-2 cursor-pointer ${
                      isSelected
                        ? "border-rose-700 bg-rose-50/70 dark:bg-rose-950/40 dark:border-rose-600 shadow-2xs"
                        : "border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/40 hover:border-rose-300"
                    }`}
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white dark:bg-stone-800 text-rose-800 dark:text-rose-400 shadow-2xs">
                      <IconComponent size={14} />
                    </span>
                    <div>
                      <p className="text-xs font-bold text-stone-900 dark:text-stone-100 leading-tight">
                        {preset.name}
                      </p>
                      <span className="text-[10px] text-stone-500 dark:text-stone-400 font-mono mt-0.5 block">
                        {preset.offerCode}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Broadcast Composer Form */}
          <div className="rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 sm:p-7 shadow-xs space-y-5">
            <h3 className="font-display text-lg font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Megaphone size={18} className="text-rose-800" />
              <span>Compose Campaign</span>
            </h3>

            {/* Target Audience */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-2">
                Target Audience
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: "promotions_opted" as const, label: "Opted-In", desc: "Recommended" },
                  { id: "all" as const, label: "All Users", desc: "Entire database" },
                  { id: "customers" as const, label: "Renters Only", desc: "Customer role" },
                  { id: "owners" as const, label: "Owners Only", desc: "Wardrobe boutiques" },
                ].map((aud) => (
                  <button
                    key={aud.id}
                    type="button"
                    onClick={() => setTargetAudience(aud.id)}
                    className={`rounded-xl border p-2.5 text-center transition-all cursor-pointer ${
                      targetAudience === aud.id
                        ? "border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 font-bold"
                        : "border-stone-200 dark:border-stone-800 bg-stone-50/40 dark:bg-stone-900 text-stone-600 dark:text-stone-400"
                    }`}
                  >
                    <p className="text-xs">{aud.label}</p>
                    <span className="text-[10px] opacity-75 block mt-0.5">{aud.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Delivery Channels */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-2">
                Delivery Channels (₹0 Cost)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => toggleChannel("in_app")}
                  className={`flex items-center gap-2.5 rounded-xl border p-3 transition-all cursor-pointer ${
                    channels.in_app
                      ? "border-rose-700 bg-rose-50 dark:bg-rose-950/40 text-rose-950 dark:text-rose-100"
                      : "border-stone-200 dark:border-stone-800 bg-stone-50/30 opacity-60"
                  }`}
                >
                  <Bell size={16} className={channels.in_app ? "text-rose-800" : "text-stone-400"} />
                  <div className="text-left">
                    <p className="text-xs font-bold">In-App Feed</p>
                    <span className="text-[10px] text-stone-500">Navbar Bell &amp; Inbox</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => toggleChannel("whatsapp")}
                  className={`flex items-center gap-2.5 rounded-xl border p-3 transition-all cursor-pointer ${
                    channels.whatsapp
                      ? "border-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100"
                      : "border-stone-200 dark:border-stone-800 bg-stone-50/30 opacity-60"
                  }`}
                >
                  <MessageSquare size={16} className={channels.whatsapp ? "text-emerald-800" : "text-stone-400"} />
                  <div className="text-left">
                    <p className="text-xs font-bold">Free WhatsApp</p>
                    <span className="text-[10px] text-stone-500">1-Click / Meta Cloud</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => toggleChannel("email")}
                  className={`flex items-center gap-2.5 rounded-xl border p-3 transition-all cursor-pointer ${
                    channels.email
                      ? "border-blue-700 bg-blue-50 dark:bg-blue-950/40 text-blue-950 dark:text-blue-100"
                      : "border-stone-200 dark:border-stone-800 bg-stone-50/30 opacity-60"
                  }`}
                >
                  <Mail size={16} className={channels.email ? "text-blue-800" : "text-stone-400"} />
                  <div className="text-left">
                    <p className="text-xs font-bold">Resend Email</p>
                    <span className="text-[10px] text-stone-500">Luxury HTML format</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Title / Subject */}
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                Offer Title / Headline *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Diwali Bridal Sale: 20% Off Sabyasachi Lehengas!"
                className="w-full rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950 px-3.5 py-2.5 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-rose-800"
              />
            </div>

            {/* Message Body */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                  Message Copy *
                </label>
                <span className="text-[11px] text-stone-400">{message.length} chars</span>
              </div>
              <textarea
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your promotional announcement or discount message..."
                className="w-full rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950 p-3.5 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-rose-800 leading-relaxed"
              />
            </div>

            {/* Promo Code & Discount Percent & Action URL */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1 flex items-center gap-1">
                  <Tag size={12} className="text-rose-800" />
                  <span>Promo Code</span>
                </label>
                <input
                  type="text"
                  value={offerCode}
                  onChange={(e) => setOfferCode(e.target.value.toUpperCase())}
                  placeholder="e.g. DIWALI20"
                  className="w-full rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950 px-3 py-2 text-xs font-mono font-bold text-stone-900 dark:text-stone-100 uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1 flex items-center gap-1">
                  <Percent size={12} className="text-rose-800" />
                  <span>Discount %</span>
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={discountPercent || ""}
                  onChange={(e) => setDiscountPercent(e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="e.g. 20"
                  className="w-full rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950 px-3 py-2 text-xs text-stone-900 dark:text-stone-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1 flex items-center gap-1">
                  <LinkIcon size={12} className="text-rose-800" />
                  <span>Action URL</span>
                </label>
                <input
                  type="text"
                  value={actionUrl}
                  onChange={(e) => setActionUrl(e.target.value)}
                  placeholder="/browse"
                  className="w-full rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950 px-3 py-2 text-xs text-stone-900 dark:text-stone-100"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-between gap-3 border-t border-stone-100 dark:border-stone-800">
              <span className="text-[11px] text-stone-500">
                Will target approx. <strong className="text-rose-800">{targetAudience === "promotions_opted" ? stats.promotionsOpted : stats.totalUsers}</strong> registered users.
              </span>

              <button
                type="button"
                disabled={isPending}
                onClick={handleDispatch}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-800 to-rose-950 hover:from-rose-900 hover:to-stone-950 px-6 py-2.5 text-xs font-bold text-white shadow-md transition-all disabled:opacity-50 cursor-pointer"
              >
                {isPending ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Send size={14} />
                )}
                <span>{isPending ? "Broadcasting..." : "Dispatch Broadcast Now"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Live Previews (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* WhatsApp Preview Card */}
          <div className="rounded-3xl border border-stone-200 dark:border-stone-800 bg-stone-100 dark:bg-stone-950 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5">
                <MessageSquare size={14} />
                <span>WhatsApp Live Preview</span>
              </span>
              <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-semibold px-2 py-0.5 rounded-full">
                ₹0 WhatsApp Link
              </span>
            </div>

            {/* WhatsApp Phone Mockup Bubble */}
            <div className="rounded-2xl bg-[#EFEAE2] p-4 text-stone-900 shadow-inner space-y-3">
              <div className="rounded-2xl rounded-tl-xs bg-white p-3.5 shadow-xs max-w-sm space-y-2 border border-black/5">
                <p className="text-[11px] font-bold text-emerald-950 flex items-center gap-1">
                  <span>✨</span>
                  <span>ShaadiRent Special Announcement</span>
                  <span>✨</span>
                </p>

                <p className="text-xs font-bold text-stone-950 leading-snug">
                  {title || "Offer Headline..."}
                </p>

                <p className="text-[11px] text-stone-800 leading-relaxed whitespace-pre-wrap">
                  {message || "Offer details will appear here..."}
                </p>

                {offerCode && (
                  <div className="rounded-lg bg-rose-50 border border-rose-200 p-2 text-center">
                    <p className="text-[10px] text-rose-800 font-semibold uppercase">
                      🎁 Use Code: <span className="font-mono font-bold text-rose-950">{offerCode}</span>
                      {discountPercent ? ` for ${discountPercent}% OFF!` : ""}
                    </p>
                  </div>
                )}

                <p className="text-[10px] text-stone-500 pt-1 border-t border-stone-100">
                  Explore luxury bridal outfits: <span className="text-blue-700 underline">{actionUrl}</span>
                </p>

                <div className="flex items-center justify-end gap-1 text-[9px] text-stone-400 pt-0.5">
                  <span>{new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
                  <span className="text-blue-600 font-bold">✓✓</span>
                </div>
              </div>
            </div>
          </div>

          {/* In-App Customer Inbox Preview Card */}
          <div className="rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                <Bell size={14} className="text-rose-800" />
                <span>Customer In-App Feed Preview</span>
              </span>
              <span className="text-[10px] bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 font-semibold px-2 py-0.5 rounded-full">
                Navbar &amp; /account
              </span>
            </div>

            <div className="rounded-2xl border border-rose-200 bg-rose-50/40 p-4 space-y-2">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-800 text-sm font-bold">
                  🎁
                </div>
                <div className="space-y-0.5 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-stone-950">{title || "Offer Headline"}</h4>
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-600 shrink-0" />
                  </div>
                  <p className="text-[11px] text-stone-600 line-clamp-2">
                    {message || "Message copy preview..."}
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    {offerCode && (
                      <span className="inline-block text-[9px] font-mono font-bold bg-rose-100 text-rose-900 px-1.5 py-0.5 rounded">
                        {offerCode}
                      </span>
                    )}
                    <span className="text-[10px] text-stone-400">Just now</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Broadcast Campaigns Audit History ─────────────────── */}
      <div className="rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Clock size={17} className="text-rose-800" />
            <span>Campaigns History &amp; Audit Trail</span>
          </h3>
          <span className="text-xs text-stone-400">
            {campaigns.length} total dispatched
          </span>
        </div>

        {campaigns.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-200 dark:border-stone-800 p-8 text-center space-y-2">
            <Megaphone size={24} className="text-stone-400 mx-auto" />
            <p className="text-xs font-bold text-stone-700 dark:text-stone-300">No Broadcasts Dispatched Yet</p>
            <p className="text-[11px] text-stone-400 max-w-sm mx-auto">
              Use the composer above to send your first Diwali, wedding season, or bridal flash sale offer!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-stone-200 dark:border-stone-800 text-[11px] uppercase tracking-wider text-stone-400">
                <tr>
                  <th className="pb-3 font-semibold">Offer / Campaign</th>
                  <th className="pb-3 font-semibold">Target Audience</th>
                  <th className="pb-3 font-semibold">Promo Code</th>
                  <th className="pb-3 font-semibold">Channels</th>
                  <th className="pb-3 font-semibold">Recipients</th>
                  <th className="pb-3 font-semibold">Dispatched At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800/60">
                {campaigns.map((camp) => (
                  <tr key={camp.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/30 transition-colors">
                    <td className="py-3.5 pr-4">
                      <p className="font-bold text-stone-900 dark:text-stone-100 line-clamp-1">
                        {camp.title}
                      </p>
                      <p className="text-[11px] text-stone-500 line-clamp-1 mt-0.5">
                        {camp.message}
                      </p>
                    </td>
                    <td className="py-3.5 pr-4 whitespace-nowrap">
                      <span className="rounded-md bg-stone-100 dark:bg-stone-800 px-2 py-0.5 text-[10px] font-semibold text-stone-700 dark:text-stone-300 capitalize">
                        {camp.target_audience.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3.5 pr-4 whitespace-nowrap">
                      {camp.offer_code ? (
                        <span className="rounded-md bg-rose-50 dark:bg-rose-950 text-rose-900 dark:text-rose-300 px-2 py-0.5 text-[10px] font-mono font-bold">
                          {camp.offer_code}
                          {camp.discount_percent ? ` (${camp.discount_percent}%)` : ""}
                        </span>
                      ) : (
                        <span className="text-stone-400 text-[11px]">—</span>
                      )}
                    </td>
                    <td className="py-3.5 pr-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        {camp.channels.map((ch) => (
                          <span
                            key={ch}
                            className="rounded px-1.5 py-0.5 text-[9px] font-semibold bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 capitalize"
                          >
                            {ch.replace("_", " ")}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 pr-4 whitespace-nowrap font-semibold text-stone-800 dark:text-stone-200">
                      {camp.recipients_count} users
                    </td>
                    <td className="py-3.5 whitespace-nowrap text-stone-400 text-[11px]">
                      {new Date(camp.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
