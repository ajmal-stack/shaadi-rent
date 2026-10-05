"use client";

/**
 * CashfreeCheckout
 *
 * Client-side component that:
 * 1. Injects the Cashfree JS SDK v3 via CDN <script> tag
 * 2. Receives a `paymentSessionId` from the server
 * 3. Calls `Cashfree({mode}).checkout()` to initiate payment
 *
 * CDN v3 API: Cashfree() is a plain function call — NOT a constructor.
 * Sandbox uses redirectTarget:"_self" (tab redirect — works on localhost).
 * Production uses redirectTarget:"_modal" (in-page popup — needs domain whitelisted).
 *
 * Cashfree JS SDK docs:
 *   https://docs.cashfree.com/docs/web-integration
 */

import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";

// v3 SDK — single URL for both sandbox and production (mode is passed at runtime)
const CF_SDK_URL = "https://sdk.cashfree.com/js/v3/cashfree.js";

interface CashfreeCheckoutProps {
  paymentSessionId: string;
  /** Called when the payment modal closes (success, fail, or user closed) */
  onComplete?: () => void;
}

// Extend window type for Cashfree v3 SDK (function call, NOT constructor)
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Cashfree?: (config: { mode: string }) => {
      checkout: (opts: Record<string, unknown>) => Promise<{ error?: { message: string } }>;
    };
  }
}

export function CashfreeCheckout({
  paymentSessionId,
  onComplete,
}: CashfreeCheckoutProps) {
  const hasLaunched = useRef(false);

  useEffect(() => {
    if (hasLaunched.current) return;

    const launch = () => {
      if (!window.Cashfree) {
        console.error("[Cashfree] SDK not available on window after script load");
        return;
      }
      hasLaunched.current = true;

      // v3 API: plain function call (no `new`)
      const cashfree = window.Cashfree({
        mode:
          process.env.NEXT_PUBLIC_CASHFREE_ENV === "production"
            ? "production"
            : "sandbox",
      });

      cashfree
        .checkout({
          paymentSessionId,
          // "_self" = full-tab redirect → works on localhost without domain whitelisting
          // "_modal" = in-page popup → requires domain whitelisted in Cashfree dashboard
          redirectTarget:
            process.env.NEXT_PUBLIC_CASHFREE_ENV === "production"
              ? "_modal"
              : "_self",
        })
        .then((result) => {
          if (result?.error) {
            console.warn("[Cashfree] Checkout closed with error:", result.error.message);
          }
          onComplete?.();
        })
        .catch((err) => {
          console.error("[Cashfree] Checkout error:", err);
          onComplete?.();
        });
    };

    // SDK already loaded from a prior navigation — launch immediately
    if (window.Cashfree) {
      launch();
      return;
    }

    // Inject the script tag once
    const existing = document.getElementById("cashfree-sdk-v3");
    if (existing) {
      existing.addEventListener("load", launch);
      return () => existing.removeEventListener("load", launch);
    }

    const script = document.createElement("script");
    script.id = "cashfree-sdk-v3";
    script.src = CF_SDK_URL;
    script.async = true;
    script.onload = launch;
    script.onerror = () => {
      console.error("[Cashfree] Failed to load SDK script from CDN:", CF_SDK_URL);
    };
    document.head.appendChild(script);

    return () => {
      // Keep script cached; don't remove on unmount
    };
  }, [paymentSessionId, onComplete]);

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8">
      <Loader2 size={28} className="animate-spin text-rose-700" />
      <p className="text-sm font-semibold text-stone-700">
        Redirecting to Payment Gateway…
      </p>
      <p className="text-xs text-stone-400">
        Powered by Cashfree Payments. 100% Secure.
      </p>
    </div>
  );
}

