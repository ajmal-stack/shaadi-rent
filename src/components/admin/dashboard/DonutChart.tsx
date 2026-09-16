"use client";

import { useEffect, useState } from "react";

interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  segments: DonutSegment[];
  size?: number;
  thickness?: number;
  showLegend?: boolean;
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

export function DonutChart({
  segments,
  size = 160,
  thickness = 28,
  showLegend = true,
}: DonutChartProps) {
  const [animated, setAnimated] = useState(false);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const cx = size / 2;
  const cy = size / 2;
  const r = (size - thickness) / 2 - 4;
  const circumference = 2 * Math.PI * r;

  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 150);
    return () => clearTimeout(t);
  }, []);

  // Build arcs
  let currentAngle = 0;
  const arcs = segments.map((seg, i) => {
    const pct = seg.value / total;
    const sweep = pct * 360;
    const start = currentAngle;
    const end = currentAngle + sweep;
    currentAngle = end;
    return { ...seg, start, end, pct, idx: i };
  });

  const hoveredArc = hoveredIdx !== null ? arcs[hoveredIdx] : null;

  return (
    <div className="flex items-center gap-6 flex-wrap">
      <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Background ring */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="#f5f5f4"
            strokeWidth={thickness}
          />

          {/* Segments */}
          {arcs.map((arc) => {
            const isHovered = hoveredIdx === arc.idx;
            const path = describeArc(cx, cy, r, arc.start, arc.end > arc.start ? arc.end : arc.start + 0.01);
            return (
              <path
                key={arc.idx}
                d={path}
                fill="none"
                stroke={arc.color}
                strokeWidth={isHovered ? thickness + 4 : thickness}
                strokeLinecap="round"
                style={{
                  opacity: animated ? 1 : 0,
                  transition: `opacity 0.5s ease ${arc.idx * 0.08}s, stroke-width 0.15s ease`,
                  cursor: "pointer",
                  filter: isHovered ? "brightness(1.1)" : "none",
                }}
                onMouseEnter={() => setHoveredIdx(arc.idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              />
            );
          })}

          {/* Center text */}
          <text
            x={cx}
            y={cy - 8}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={hoveredArc ? hoveredArc.color : "#1c1917"}
            fontSize={hoveredArc ? 14 : 22}
            fontWeight={700}
          >
            {hoveredArc ? `${Math.round(hoveredArc.pct * 100)}%` : total}
          </text>
          <text
            x={cx}
            y={cy + 14}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#a8a29e"
            fontSize={10}
            fontWeight={500}
          >
            {hoveredArc ? hoveredArc.label : "bookings"}
          </text>
        </svg>
      </div>

      {showLegend && (
        <div className="flex flex-col gap-2 min-w-0">
          {segments.map((seg, i) => (
            <div
              key={i}
              className="flex items-center gap-2 cursor-pointer group"
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0 transition-transform group-hover:scale-125"
                style={{ background: seg.color }}
              />
              <span className="text-xs text-stone-500 truncate group-hover:text-stone-700 transition-colors">
                {seg.label}
              </span>
              <span className="ml-auto text-xs font-bold text-stone-700 pl-2">{seg.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
