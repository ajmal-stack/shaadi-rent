"use client";

import { useState, useMemo } from "react";
import {
  HelpCircle,
  FileCheck,
  AlertTriangle,
  ClipboardCheck,
  CreditCard,
  PhoneCall,
  Search,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

interface GuideItem {
  id: string;
  category: "kyc" | "disputes" | "inspections" | "payouts";
  categoryLabel: string;
  title: string;
  summary: string;
  steps: string[];
  tips?: string[];
  alert?: string;
}

const SOP_GUIDES: GuideItem[] = [
  {
    id: "kyc-review",
    category: "kyc",
    categoryLabel: "KYC & Verification",
    title: "Owner Application & Identity Verification Protocol",
    summary: "Standard operating checklist for reviewing boutique owner applications before granting listing privileges.",
    steps: [
      "Open Admin > Verification and select an application marked 'Under Review'.",
      "Cross-check applicant's Full Name against the submitted Government ID (Aadhaar, PAN, Passport, DL, or Voter ID).",
      "Inspect front & back photo clarity: verify that edges are visible, text is crisp, and no signs of tampering/digital alteration exist.",
      "Ensure the OTP mobile verification check passed during user application submission.",
      "Check the address details match the boutique pickup/operating address.",
      "If compliant, click 'Approve' to instantly promote user role to 'Verified Owner' and unlock outfit listing.",
      "If documentation is blurred or invalid, click 'Reject' with clear actionable guidance notes.",
    ],
    tips: [
      "For Aadhaar cards, ensure only the last 4 digits are visible if masked, or standard unique 12-digit format.",
      "PAN card formats must match 5 letters, 4 digits, 1 letter (e.g. ABCDE1234F).",
    ],
    alert: "Never approve applications without both front and back document uploads.",
  },
  {
    id: "dispute-arbitration",
    category: "disputes",
    categoryLabel: "Dispute Arbitration",
    title: "Garment Damage & Return Dispute Resolution",
    summary: "Mediation workflow when an owner reports garment tears, stains, late returns, or missing accessories.",
    steps: [
      "Review the dispute reason, claimed deduction amount, and renter's response.",
      "Inspect pre-rental dispatch photos vs post-return inspection logs submitted by both parties.",
      "Determine severity: minor fabric pull vs permanent stain vs irreversible tear.",
      "Calculate fair deduction based on garment rental value and repair estimate.",
      "Click 'Mark Under Review' to lock escrow payout while communicating with parties.",
      "To resolve, enter the approved deduction amount and settlement notes, then click 'Resolve Dispute'.",
    ],
    tips: [
      "Dry cleaning charges up to ₹500 should be covered under standard wear unless excessive staining occurred.",
      "Major structural tears warrant full security deposit forfeiture.",
    ],
    alert: "All disputes must be acknowledged within 24 hours of filing to maintain high trust ratings.",
  },
  {
    id: "inspection-grading",
    category: "inspections",
    categoryLabel: "Inspections & Damage",
    title: "Pre-Rental & Post-Return Condition Quality Grading",
    summary: "Standardized grading criteria for outfits entering or returning from rental bookings.",
    steps: [
      "Pre-Rental Dispatch: Boutique owner takes 4 timestamped photos (front, back, embroidery/zari, hemline).",
      "Condition Grade 'Good': Garment is clean, steam-pressed, no loose threads, zippers and hooks intact.",
      "Condition Grade 'Minor Damage': Minor loose beadwork or non-visible hem thread pull.",
      "Condition Grade 'Major Damage': Prominent fabric burn, tear, oil/grease stain, or broken structural boning.",
      "Log inspection report with exact deduction amount if condition is downgraded.",
    ],
    tips: [
      "High-value bridal lehengas (>₹15,000 rent) require mandatory pre-dispatch video verification.",
    ],
  },
  {
    id: "escrow-payout",
    category: "payouts",
    categoryLabel: "Escrow & Payouts",
    title: "Security Deposit Escrow & Owner Payout Schedule",
    summary: "How funds flow from renter payment into escrow holds and subsequent owner bank disbursement.",
    steps: [
      "At booking confirmation, 100% of rental amount + security deposit is collected and held in platform escrow.",
      "Once return inspection is completed and marked 'Good', a 48-hour buffer begins.",
      "If no dispute is lodged within 48 hours, security deposit is automatically refunded to renter's original payment method.",
      "Rental amount minus platform commission (15%) is queued for owner payout.",
      "Payouts execute daily at 18:00 IST via direct IMPS / NEFT bank transfer.",
    ],
    tips: [
      "Refunds to UPI typically reflect within 2-4 hours; card refunds take 3-5 business days.",
    ],
    alert: "Do not manually bypass escrow hold without supervisor confirmation.",
  },
];

type CategoryFilter = "all" | "kyc" | "disputes" | "inspections" | "payouts";

export function HelpClient() {
  const [filter, setFilter] = useState<CategoryFilter>("all");
  const [search, setSearch] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(["kyc-review", "dispute-arbitration"]));

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filtered = useMemo(() => {
    return SOP_GUIDES.filter((g) => {
      if (filter !== "all" && g.category !== filter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          g.title.toLowerCase().includes(q) ||
          g.summary.toLowerCase().includes(q) ||
          g.categoryLabel.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [filter, search]);

  return (
    <div className="space-y-6">
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3.5 top-3 text-stone-400" />
          <input
            type="text"
            placeholder="Search standard operating procedures..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-200 bg-white text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 shadow-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "all", label: "All SOPs" },
            { id: "kyc", label: "KYC Review" },
            { id: "disputes", label: "Disputes" },
            { id: "inspections", label: "Inspections" },
            { id: "payouts", label: "Escrow & Payouts" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilter(cat.id as CategoryFilter)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                filter === cat.id
                  ? "bg-stone-900 text-white shadow-xs"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Emergency Hotline Banner */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-amber-100 text-amber-900 shrink-0">
            <PhoneCall size={18} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-amber-950">Urgent Owner Escalation Desk</h4>
            <p className="text-xs text-amber-800 mt-0.5">
              For emergency wedding-day rental issues, logistics delays, or security breaches.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-mono font-semibold bg-white border border-amber-200 px-3 py-1.5 rounded-lg text-amber-950">
            +91 98765 43210
          </span>
          <span className="text-[11px] text-amber-700 font-medium">(24/7 Priority)</span>
        </div>
      </div>

      {/* SOP Accordion Cards */}
      <div className="space-y-4">
        {filtered.map((item) => {
          const isExpanded = expandedIds.has(item.id);
          return (
            <div
              key={item.id}
              className="rounded-2xl border border-stone-200 bg-white shadow-xs overflow-hidden transition-all"
            >
              <button
                onClick={() => toggleExpand(item.id)}
                className="w-full text-left p-5 flex items-start justify-between gap-4 hover:bg-stone-50/60 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-md">
                      {item.categoryLabel}
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-stone-900">{item.title}</h3>
                  <p className="text-xs text-stone-500 leading-relaxed">{item.summary}</p>
                </div>
                <div className="p-1 text-stone-400 shrink-0 mt-1">
                  {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
              </button>

              {isExpanded && (
                <div className="px-5 pb-5 pt-2 border-t border-stone-100 space-y-4 text-xs">
                  <div>
                    <h5 className="font-semibold text-stone-800 mb-2 uppercase tracking-wide text-[11px]">
                      Step-by-Step Procedure
                    </h5>
                    <ol className="space-y-2 list-decimal list-inside text-stone-600 leading-relaxed">
                      {item.steps.map((step, idx) => (
                        <li key={idx} className="pl-1">
                          <span className="font-medium text-stone-700">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  {item.tips && item.tips.length > 0 && (
                    <div className="rounded-xl bg-stone-50 border border-stone-200/80 p-3.5 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-stone-800 font-semibold">
                        <Sparkles size={13} className="text-amber-500" />
                        <span>Best Practices & Tips</span>
                      </div>
                      <ul className="space-y-1 list-disc list-inside text-stone-600 pl-1">
                        {item.tips.map((tip, idx) => (
                          <li key={idx}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {item.alert && (
                    <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 flex items-start gap-2 text-rose-800 font-medium">
                      <AlertTriangle size={14} className="shrink-0 mt-0.5 text-rose-600" />
                      <span>{item.alert}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="p-12 text-center bg-white rounded-2xl border border-stone-200 text-stone-400">
            <HelpCircle size={36} className="mx-auto mb-2 text-stone-300" />
            <p className="text-sm font-semibold text-stone-700">No matching SOP found</p>
            <p className="text-xs text-stone-400 mt-1">Try another search query or category filter</p>
          </div>
        )}
      </div>
    </div>
  );
}
