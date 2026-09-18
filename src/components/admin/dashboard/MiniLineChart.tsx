"use client";

import { useEffect, useRef, useState } from "react";

interface MiniLineChartProps {
  data: number[];
  color?: string;
  fillColor?: string;
  height?: number;
  width?: number;
  labels?: string[];
  showTooltip?: boolean;
}

export function MiniLineChart({
  data,
  color = "#be123c",
  fillColor,
  height = 80,
  width = 300,
  labels = [],
  showTooltip = true,
}: MiniLineChartProps) {
  const pathRef = useRef<SVGPathElement>(null);
  const fillRef = useRef<SVGPathElement>(null);
  const [animated, setAnimated] = useState(false);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; value: number; label: string } | null>(null);

  const padding = { top: 8, right: 4, bottom: 4, left: 4 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((v, i) => ({
    x: padding.left + (i / (data.length - 1)) * chartWidth,
    y: padding.top + chartHeight - ((v - min) / range) * chartHeight,
    value: v,
    label: labels[i] ?? `Day ${i + 1}`,
  }));

  // Build smooth bezier path
  const buildPath = (pts: typeof points): string => {
    if (pts.length < 2) return "";
    let d = `M ${pts[0].x},${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1];
      const curr = pts[i];
      const cpX = (prev.x + curr.x) / 2;
      d += ` C ${cpX},${prev.y} ${cpX},${curr.y} ${curr.x},${curr.y}`;
    }
    return d;
  };

  const linePath = buildPath(points);
  const last = points[points.length - 1];
  const first = points[0];
  const fillPath = linePath
    ? `${linePath} L ${last.x},${padding.top + chartHeight} L ${first.x},${padding.top + chartHeight} Z`
    : "";

  // Animate stroke on mount
  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;
    const length = path.getTotalLength();
    path.style.strokeDasharray = `${length}`;
    path.style.strokeDashoffset = animated ? "0" : `${length}`;
  }, [animated, data]);

  const resolvedFill = fillColor ?? `${color}15`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={height}
      className="overflow-visible"
      onMouseLeave={() => setTooltip(null)}
    >
      {/* Fill area */}
      <path
        ref={fillRef}
        d={fillPath}
        fill={resolvedFill}
        style={{ transition: "opacity 0.4s ease" }}
        opacity={animated ? 1 : 0}
      />

      {/* Line */}
      <path
        ref={pathRef}
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)" }}
      />

      {/* Interactive dots */}
      {showTooltip &&
        points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={4}
            stroke={color}
            strokeWidth={1.5}
            className="cursor-pointer opacity-0 hover:opacity-100 fill-white dark:fill-stone-900"
            style={{ transition: "opacity 0.15s" }}
            onMouseEnter={() => setTooltip(p)}
          />
        ))}

      {/* Tooltip */}
      {tooltip && (
        <g>
          <rect
            x={Math.min(tooltip.x - 28, width - 60)}
            y={tooltip.y - 32}
            width={56}
            height={22}
            rx={4}
            className="fill-stone-900 dark:fill-stone-800"
            opacity={0.95}
          />
          <text
            x={Math.min(tooltip.x, width - 32)}
            y={tooltip.y - 17}
            textAnchor="middle"
            fill="white"
            fontSize={10}
            fontWeight={600}
          >
            {tooltip.value}
          </text>
        </g>
      )}

    </svg>
  );
}
