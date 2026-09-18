"use client";

import { useEffect, useState } from "react";

interface BarChartProps {
  data: { label: string; value: number }[];
  color?: string;
  height?: number;
  formatValue?: (v: number) => string;
}

export function BarChart({
  data,
  color = "#be123c",
  height = 120,
  formatValue = (v) => String(v),
}: BarChartProps) {
  const [animated, setAnimated] = useState(false);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(t);
  }, []);

  const max = Math.max(...data.map((d) => d.value), 1);
  const barWidth = 100 / data.length;
  const gap = 0.6; // gap ratio inside each slot

  return (
    <div className="w-full" style={{ height }}>
      <div className="flex items-end gap-1 h-full w-full" style={{ height: height - 20 }}>
        {data.map((item, i) => {
          const pct = item.value / max;
          const isHovered = hoveredIdx === i;
          return (
            <div
              key={i}
              className="flex-1 flex flex-col items-center justify-end gap-1 group"
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {/* Tooltip */}
              {isHovered && (
                <div
                  className="absolute z-10 bg-stone-900 dark:bg-stone-800 text-white text-[10px] font-bold px-2 py-1 rounded-lg pointer-events-none whitespace-nowrap shadow-lg border border-stone-800 dark:border-stone-700"
                  style={{ transform: "translateY(-4px)" }}
                >
                  {formatValue(item.value)}
                </div>
              )}

              {/* Bar */}
              <div
                className="w-full rounded-t-md relative"
                style={{
                  height: animated ? `${Math.max(pct * 100, 2)}%` : "2%",
                  background: isHovered
                    ? color
                    : `${color}99`,
                  transition: `height 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 0.04}s, background 0.15s`,
                  minHeight: "3px",
                }}
              />
            </div>
          );
        })}
      </div>

      {/* X-axis labels */}
      <div className="flex mt-1">
        {data.map((item, i) => (
          <div
            key={i}
            className="flex-1 text-center text-[9px] text-stone-400 dark:text-stone-500 truncate"
          >
            {item.label}
          </div>
        ))}
      </div>

    </div>
  );
}
