"use client";

import React from "react";
import { Sparkles } from "lucide-react";

interface LottieLoaderProps {
  /** Size in pixels for the circle spinner container (default 96) */
  size?: number;
  /** Optional badge title (defaults to "ShaadiRent") */
  title?: string;
  /** Subtitle / status message displayed below spinner */
  subtitle?: string;
  /** If true, covers entire viewport with backdrop blur */
  fullscreen?: boolean;
  /** Additional container classes */
  className?: string;
  /** Kept for backwards compatibility */
  animationUrl?: string;
}

export function LottieLoader({
  size = 96,
  title = "ShaadiRent",
  subtitle = "Preparing your wedding couture…",
  fullscreen = false,
  className = "",
}: LottieLoaderProps) {
  const content = (
    <div
      className={`flex flex-col items-center justify-center text-center p-6 select-none ${className}`}
      role="status"
      aria-label={subtitle || title}
    >
      {/* Circle & Wedding Ring Icon Container */}
      <div className="relative flex items-center justify-center">
        {/* Soft Ambient Gold/Rose Glow behind the rings */}
        <div
          aria-hidden="true"
          className="absolute -inset-4 rounded-full bg-gradient-to-tr from-rose-500/15 via-amber-400/20 to-rose-300/10 blur-xl animate-pulse"
        />

        {/* Dual Concentric Circular Spinners */}
        <div
          className="relative flex items-center justify-center"
          style={{ width: `${size}px`, height: `${size}px` }}
        >
          {/* Outer Rotating Arc */}
          <svg
            className="absolute inset-0 w-full h-full animate-spin"
            style={{ animationDuration: "1.6s" }}
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#e11d48" />
                <stop offset="50%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#fb7185" stopOpacity="0.2" />
              </linearGradient>
            </defs>
            {/* Background Track */}
            <circle
              cx="50"
              cy="50"
              r="44"
              stroke="#fef2f2"
              strokeWidth="4"
            />
            <circle
              cx="50"
              cy="50"
              r="44"
              stroke="#fef3c7"
              strokeWidth="3.5"
              strokeOpacity="0.4"
            />
            {/* Active Spinner Track */}
            <circle
              cx="50"
              cy="50"
              r="44"
              stroke="url(#ringGrad)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="180 100"
            />
          </svg>

          {/* Inner Counter-Rotating Delicate Dashed Circle */}
          <svg
            className="absolute inset-2 w-[calc(100%-16px)] h-[calc(100%-16px)] animate-spin"
            style={{
              animationDuration: "3.2s",
              animationDirection: "reverse",
            }}
            viewBox="0 0 100 100"
            fill="none"
          >
            <circle
              cx="50"
              cy="50"
              r="44"
              stroke="#d97706"
              strokeWidth="1.5"
              strokeDasharray="6 8"
              strokeOpacity="0.35"
            />
          </svg>

          {/* Center Wedding Ring Icon & Shimmer Disc */}
          <div className="relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-b from-amber-50/90 via-white to-rose-50/80 shadow-xs border border-amber-200/60 ring-2 ring-white">
            {/* Wedding Ring Emoji */}
            <span
              className="text-2xl select-none transform transition-transform duration-700 hover:scale-110 animate-bounce"
              style={{ animationDuration: "2s" }}
              aria-label="Wedding Ring"
            >
              💍
            </span>

            {/* Micro Sparkle Accent on the diamond */}
            <span className="absolute -top-1 -right-1 text-amber-500 animate-pulse">
              <Sparkles size={13} className="fill-amber-400 text-amber-500" />
            </span>
          </div>
        </div>
      </div>

      {/* Brand Title & Subtitle */}
      <div className="mt-5 space-y-1.5 max-w-xs">
        {title && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200/70 text-[11px] font-bold uppercase tracking-widest text-rose-900 shadow-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping" />
            <span>{title}</span>
          </div>
        )}

        {subtitle && (
          <p className="font-display text-base sm:text-lg font-semibold text-stone-800 tracking-tight">
            {subtitle}
          </p>
        )}

        <p className="text-xs text-stone-400 font-sans tracking-wide">
          Rent · Wear · Return
        </p>
      </div>
    </div>
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/95 backdrop-blur-xs">
        {content}
      </div>
    );
  }

  return (
    <div className="w-full flex-1 flex items-center justify-center min-h-[45vh]">
      {content}
    </div>
  );
}

export const WeddingRingLoader = LottieLoader;
export default LottieLoader;
