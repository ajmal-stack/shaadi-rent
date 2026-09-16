"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { MiniLineChart } from "./MiniLineChart";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  borderColor: string;
  sparklineData?: number[];
  sparklineColor?: string;
  trend?: number | null; // percentage change
  trendLabel?: string;
  footer?: ReactNode;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  iconColor,
  iconBg,
  borderColor,
  sparklineData,
  sparklineColor = "#be123c",
  trend,
  trendLabel,
  footer,
}: StatCardProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const numericValue = typeof value === "number" ? value : parseInt(String(value).replace(/[^0-9]/g, ""), 10) || 0;

  // Count-up animation
  useEffect(() => {
    let start = 0;
    const duration = 800;
    const step = 16;
    const increment = numericValue / (duration / step);
    const timer = setInterval(() => {
      start += increment;
      if (start >= numericValue) {
        setDisplayValue(numericValue);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(start));
      }
    }, step);
    return () => clearInterval(timer);
  }, [numericValue]);

  const isMonetary = typeof value === "string" && value.startsWith("₹");
  const formattedDisplay = isMonetary
    ? `₹${displayValue.toLocaleString("en-IN")}`
    : displayValue.toLocaleString("en-IN");

  const trendPositive = trend !== null && trend !== undefined && trend >= 0;

  return (
    <div
      className="rounded-2xl border bg-white p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between gap-3"
      style={{ borderColor }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">{title}</p>
          <p className="font-display text-3xl font-bold text-stone-900 mt-1 tabular-nums">
            {formattedDisplay}
          </p>
        </div>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: iconBg }}
        >
          <Icon size={18} style={{ color: iconColor }} />
        </div>
      </div>

      {/* Sparkline */}
      {sparklineData && sparklineData.length > 1 && (
        <div className="-mx-1">
          <MiniLineChart
            data={sparklineData}
            color={sparklineColor}
            height={48}
            showTooltip={false}
          />
        </div>
      )}

      {/* Trend / Footer */}
      <div className="flex items-center justify-between">
        {trend !== null && trend !== undefined ? (
          <span
            className={`text-[11px] font-semibold flex items-center gap-0.5 ${
              trendPositive ? "text-emerald-700" : "text-rose-700"
            }`}
          >
            {trendPositive ? "↑" : "↓"} {Math.abs(trend)}%{" "}
            <span className="text-stone-400 font-normal ml-1">{trendLabel ?? "vs last month"}</span>
          </span>
        ) : (
          <span className="text-[11px] text-stone-400">{trendLabel}</span>
        )}
        {footer}
      </div>
    </div>
  );
}
