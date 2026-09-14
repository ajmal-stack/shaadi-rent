import { Sparkles, ShieldCheck, Clock, RefreshCw } from "lucide-react";

export function TrustRibbon() {
  const perks = [
    {
      icon: ShieldCheck,
      title: "Hospital-Grade Sanitized",
      desc: "8-point physical inspection & UV dry-cleaning before dispatch",
    },
    {
      icon: Sparkles,
      title: "Free Backup Size",
      desc: "Complimentary backup fit or custom alterations included",
    },
    {
      icon: Clock,
      title: "Delivered 2 Days Early",
      desc: "Guaranteed arrival 48 hours prior for complete peace of mind",
    },
    {
      icon: RefreshCw,
      title: "Hassle-Free Returns",
      desc: "We pick up from your doorstep. Zero dry-cleaning required",
    },
  ];

  return (
    <div className="relative z-10 border-y border-rose-100/80 bg-stone-50/70 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {perks.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-100/70 text-rose-800">
                <Icon size={22} />
              </div>
              <div>
                <h4 className="font-semibold text-stone-900 text-sm">{title}</h4>
                <p className="text-xs text-stone-500 mt-1 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
